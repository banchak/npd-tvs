(function() {

  'use strict'

  angular.module('npd.voucher-edit', ['controllers.legacy-edit', 'npd.database'])
    .controller('voucherEditCtrl', ['$scope', 'legacyEditDI', '$controller', 'Database', 'GDrive',
      '$filter', '$routeParams',
      function($scope, legacyEditDI, $controller, Database, GDrive, $filter, $routeParams) {
        var db = new Database.legacy('Voucher'),
          utils = legacyEditDI.utils,
          uis = legacyEditDI.uis,
          $q = legacyEditDI.$q,
          productDb = new Database.legacy('Product'),
          promiseSync

          function syncState(data) {

            if (data && data.info) {
              if (data.info.selling) {
                data.state = "sold"
              } else if (data.info.taking && data.info.taking.person) {
                data.state = "taken"
              }
            }
          }

          function syncImage(data) {

            if (data && data.meta && data.meta.images) {

              angular.forEach(data.meta.images, function(img) {

                if (img.id && img.thumbnailLink === undefined) {

                  img.thumbnailLink = null

                  GDrive.fileMeta(img.id).then(function(meta) {

                    if (meta.thumbnailLink && !meta.trashed) {

                      img.thumbnailLink = meta.thumbnailLink
                      img.src = meta.webContentLink //'https://docs.google.com/uc?id=' + img.id
                    }
                  })
                }

              })
            }
          }

          function syncTakenItems() {
            var promise, query

            if ($scope.takenItems().length) {
              $scope.takenItems().splice(0, $scope.takenItems().length)
            }

            if (!utils.lookup($scope.resource, 'info.person.$temp.synced')) {
              return
            }

            query = productDb.rawScopeQuery(['@taken', '@info.taking.person=\'' + $scope.resource
              .info.person.name
            ])
            promise = productDb.dataAccess.query(query)

            return promise.then(function(dataList) {
              angular.forEach(dataList, function(data) {
                var item = {
                  name: data._name,
                  price: utils.lookup(data, 'info.taking.price') || 0
                }

                utils.temp('data').set(item, data)

                syncState(data)
                syncImage(data)
                $scope.takenItems().push(item)
              })
              item2Selected()
            })
          }

          function oldPriceStr(item) {

            if (item.$temp.price) {
              return moment().format('DD/MM/BBBB') + ' = ' + numeral(item.$temp.price).format(
                '0,0[.]00')
            }
          }

          function matchArray(mval, array, attr, callback) {
            var ma = utils.$parse(attr)

            angular.forEach(array, function(itm) {
              callback(angular.equals(ma(itm), mval), itm)
            })
          }

          function item2Selected() {
            var mval = utils.$parse('name'),
              items = $scope.items()

              angular.forEach($scope.takenItems(), function(taken) {

                taken.selected = false
                matchArray(mval(taken), items, 'name', function(m, itm) {
                  if (m) {
                    taken.selected = m
                  }
                })
              })
          }

          function selected2Item() {
            var mval = utils.$parse('name'),
              items = $scope.items(),
              adds = [],
              dels = [],
              match

              angular.forEach($scope.takenItems(), function(taken) {

                match = false
                matchArray(mval(taken), items, 'name', function(m, itm) {

                  if (m) {
                    match = m
                  }
                })

                if (taken.selected && !match) {
                  // append new items
                  adds.push(taken)
                }

                if (!taken.selected && match) {
                  // remove itm
                  dels.push(taken.name)
                }

              })

              if (dels.length) {
                for (var i = items.length - 1; i >= 0; i--) {
                  if (dels.indexOf(items[i].name) >= 0) {
                    items.splice(i, 1)
                  }
                }
              }
            if (adds.length) {

              for (var i = items.length - 1; i >= 0; i--) {
                if (items[i].name) {
                  break
                }
                items.splice(i, 1)
              }

              // insert selected taken
              angular.forEach(adds, function(taken) {
                items.push({
                  name: taken.name,
                  price: taken.price,
                  $temp: taken.$temp
                })
              })
            }
          }

          function _verifyItemTaking(state, field) {
            var tempdata = utils.temp('data'),
              person = $scope.person().name,
              date = $scope.resource.info.issue_date,
              voucher = $scope.resource._name

            state = state || 'taken'
            field = field || 'info.taking'

            return function(item) {
              var taking, data = tempdata.get(item)

                if (!data || !$scope.isSynced(item, 'name'))
                  return 'product lost'

              if (data.state == state) {

                taking = utils.lookup(data, field)

                if (taking.person != person || taking.date != date || taking.price != item.price ||
                  taking.voucher != voucher)
                  return 'someone already "' + state + '" this'
                return
              }

              if (state=='sold' && data.state=='taken') {

                // allow selling from 'taken' item with same person
                taking = utils.lookup(data, 'info.taking')
                if (taking.person == person)
                  return
              }

              if (data.state)
                return 'not allow for state "' + data.state + '"'
            }
          }

          function _verifyItemGetting() {
            var tempdata = utils.temp('data'),
              person = $scope.person().name,
              date = $scope.resource.info.issue_date

            return function(item) {
              var took, data = tempdata.get(item)

                if (!data || !$scope.isSynced(item, 'name'))
                  return 'product lost'

              if (data.state == 'taken') {
                took = utils.lookup(data, 'info.taking')

                if (took.person != person) {
                  return 'someone already "taken" this'
                }
                return
              }

              if (!data.state) {

                took = utils.lookup(data, 'meta.tooks')
                if (!took)
                  return 'not a "taken" item'

                took = took[took.length - 1]
                if (took.person != person || took.until != date)
                  return 'already got this back'
                return
              }

              if (data.state)
                return 'not allow for state "' + data.state + '"'
            }
          }

          function _postVerify(unpost, verifyItem) {
            var promise, savedata, deferred = $q.defer(),
              errors = []

              // voucher verify
            if ($scope.postState == 'cancelled' || (!unpost && $scope.postState == 'posted')) {

              errors.push({
                error: 'already ' + $scope.postState,
                name: $scope.resource._name
              })
            }

            if (!errors.length) {
              // note: "pending" must check modified timestamp, someone may be posting.
              if ($scope.postState == 'pending') {
                var now = utils.timestamp(),
                  posted = utils.lookup($scope.resource, '_sys.posted')

                  if (posted && (now - posted) < 30) {

                    errors.push({
                      error: 'other is posting',
                      name: $scope.resource._name
                    })
                  }
              }
            }

            // items verify
            if (!errors.length) {
              angular.forEach($scope.items(), function(item) {
                var err

                err = verifyItem(item)
                if (err)
                  errors.push({
                    error: err,
                    name: item.name
                  })
              })
            }

            if (errors.length) {

              deferred.reject(errors)
            } else {

              deferred.resolve()
            }
            return deferred.promise
          }

          function _postTaking(state, field) {
            var promises = [],
              errors = [],
              tempdata = utils.temp('data'),
              modified = utils.lookup($scope.resource, '_sys.modified'),
              modifier = utils.lookup($scope.resource, '_sys.modifier'),
              _taking = {
                date: utils.lookup($scope.resource, 'info.issue_date'),
                person: $scope.person().name,
                voucher: $scope.resource._name,
                site: utils.lookup($scope.resource, 'info.site')
              }

            utils.deepStrip(_taking)

            state = state || null
            
            angular.forEach($scope.items(), function(item) {
              var pm, _sys, taking, qry, changes, data = tempdata.get(item)

                if ((data.state || null) != state) {
                  _sys = angular.extend({}, data._sys)
                  _sys.modifier = modifier
                  _sys.modified = modified

                  changes = {
                    $set: {
                      _sys: _sys
                    }
                  }

                  if (state) { // post

                    taking = angular.extend({
                      price: item.price
                    }, _taking)
                    changes.$set[field] = taking
                  } else { // unpost

                    changes.$unset = {}
                    changes.$unset[field] = ''
                  }

                  qry = {
                    _id: data._id
                  }
                  qry[field] = utils.lookup(data, field)

                  pm = productDb.dataAccess.bulkUpdate(qry, changes).then(function(resp) {
                    if (!resp) {

                      errors.push({
                        error: 'database not response',
                        name: item.name
                      })
                    } else if (resp.error) {

                      errors.push({
                        error: resp.error,
                        name: item.name
                      })
                    } else if (!resp.n) {

                      errors.push({
                        error: 'data conflict',
                        name: item.name
                      })
                    }
                    return resp
                  })
                  promises.push(pm)
                }
            })

            return $q.all(promises).then(function() {

              if (errors.length)
                return $q.reject(errors)
            })
          }

          function postTaking(unpost, state, field) {
            var promise

            promise = _postVerify(unpost, _verifyItemTaking(state, field))

            promise = promise.then(function() {

              return $scope.editOpr.postState('pending').then(function(data) {
                if (!data || data.error)
                  return $q.reject()
              })
            })

            promise = promise.then(function() {

              _postTaking(!unpost && state, field)
            })

            promise = promise.then(function() {

              return $scope.editOpr.postState(!unpost && 'posted', (!unpost && 'ผ่านรายการ') ||
                'คืนรายการ').then(function(data) {
                if (data.error)
                  return $q.reject()
              })
            })

            promise.then(function() {

              $scope.editOpr.exit()
            }, function(errors) {


              if (errors) {

                console.log('posting error', errors)
                $scope.editOpr.postError(errors).then(function() {

                  uis.errorBox('posting error').open().then(function() {
                    $scope.editOpr.exit()
                  })
                })
              } else {

                $scope.editOpr.exit()
              }
            })
          }

          function _postGetting(unpost) {
            var promises = [],
              errors = [],
              modified = utils.lookup($scope.resource, '_sys.modified'),
              modifier = utils.lookup($scope.resource, '_sys.modifier'),
              tempdata = utils.temp('data'),
              keeping = {
                date: utils.lookup($scope.resource, 'info.issue_date'),
                person: '*รับคืน*',
                voucher: $scope.resource._name
              }, state, field

              state = (!unpost && 'taken') || null
              field = 'info.taking'

            angular.forEach($scope.items(), function(item) {
              var pm, _sys, meta, taking, kept, qry, changes, data = tempdata.get(item)

                if ((data.state || null) == state) {
                  _sys = angular.extend({}, data._sys)
                  _sys.modifier = modifier
                  _sys.modified = modified

                  meta = angular.extend({}, data.meta)

                  if (state) {

                    kept = utils.lookup(data, 'info.keeping')
                    if (kept) {

                      if (!meta.kepts)
                        meta.kepts = []

                      meta.kepts.push(kept)
                    }

                    taking = angular.extend({
                        until: $scope.resource.info.issue_date
                      },
                      utils.lookup(data, field)
                    )

                    if (!meta.tooks)
                      meta.tooks = []

                    meta.tooks.push(taking)

                    changes = {
                      $unset: {},
                      $set: {
                        _sys: _sys,
                        meta: meta,
                        'info.keeping': keeping
                      }
                    }
                    changes.$unset[field] = ''
                  } else {

                    if (meta.kepts) {
                      kept = meta.kepts.pop()

                      if (!meta.kepts.length)
                        delete meta.kepts
                    }

                    taking = angular.extend({}, meta.tooks.pop())

                    if (!meta.tooks.length)
                      delete meta.tooks

                    changes = {
                      $set: {
                        _sys: _sys,
                        meta: meta
                      }
                    }
                    changes.$set[field] = taking

                    if (kept)
                      changes.$set['info.keeping'] = kept
                    else
                      changes.$unset = {
                        'info.keeping': ''
                      }

                  }

                  qry = {
                    _id: data._id
                  }
                  if (state)
                    qry[field] = utils.lookup(data, field)

                  pm = productDb.dataAccess.bulkUpdate(qry, changes).then(function(resp) {
                    if (!resp) {

                      errors.push({
                        error: 'database not response',
                        name: item.name
                      })
                    } else if (resp.error) {

                      errors.push({
                        error: resp.error,
                        name: item.name
                      })
                    } else if (!resp.n) {

                      errors.push({
                        error: 'data conflict',
                        name: item.name
                      })
                    }
                    return resp
                  })
                  promises.push(pm)
                }
            })

            return $q.all(promises).then(function() {

              if (errors.length)
                return $q.reject(errors)
            })
          }

          function postGetting(unpost) {
            var promise

            promise = _postVerify(unpost, _verifyItemGetting())

            promise = promise.then(function() {

              return $scope.editOpr.postState('pending').then(function(data) {
                if (!data || data.error)
                  return $q.reject()
              })
            })

            promise = promise.then(function() {

              _postGetting(unpost)
            })

            promise = promise.then(function() {

              return $scope.editOpr.postState(!unpost && 'posted', (!unpost && 'ผ่านรายการ') ||
                'คืนรายการ').then(function(data) {
                if (data.error)
                  return $q.reject()
              })
            })

            promise.then(function() {

              $scope.editOpr.exit()
            }, function(errors) {


              if (errors) {

                console.log('posting error', errors)
                $scope.editOpr.postError(errors).then(function() {

                  uis.errorBox('posting error').open().then(function() {
                    $scope.editOpr.exit()
                  })
                })
              } else {

                $scope.editOpr.exit()
              }
            })
          }

        var success = function() {

          var services = {

            formType: function() {

              if ($scope.resource._type)
                return 'taking' // use by print
            }

            ,
            rememberSite: function(val) {

              return utils.remember('npd$site', val)
            }

            ,
            itemIndexes: function(page, rows, items) {

              items = items || $scope.items()
              rows = rows || 10

              var list = [],
                max = items.length,
                idx

                idx = (page - 1) * rows
              for (var i = 0; i < rows; i++) {
                if (idx + i >= max) {
                  break
                }
                list.push(items[idx + i])
              }
              return list
            }

            ,
            selectedItems: function() {
              var items = []

              angular.forEach($scope.takenItems(), function(_itm) {

                if (_itm.selected)
                  items.push(_itm)
              })
              return items
            }

            ,
            unselectedItems: function() {
              var items = []

              angular.forEach($scope.takenItems(), function(_itm) {

                if (!_itm.selected)
                  items.push(_itm)
              })
              return items
            }

            ,
            isLastPage: function(page, rows, items) {

              items = items || $scope.items()
              rows = rows || 10
              return (page * rows) >= (items.length)
            }

            ,
            itemPages: function(rows, items) {

              items = items || $scope.items()
              rows = rows || 10

              var count = 0,
                max = items.length,
                pg = 1,
                pages = []

              while (count < max) {
                pages.push(pg)
                pg += 1
                count += rows
              }
              return pages
            }

            ,
            loc2Address: function(loc) {

              return [loc.address, loc.city, loc.province, loc.zipcode].join(' ')
            }

            ,
            personSync: function(item, force) {
              var promise

              promise = $scope.xdataSync(item, 'name', 'Person', force)

              return promise.then(function(data) {
                var address = '',
                  locations = utils.lookup(data, 'meta.locations')

                  angular.forEach(locations, function(loc) {
                    var a

                    a = $scope.loc2Address(loc)
                    if (!address || item.address == a) {
                      address = a
                    }
                  })

                  if (force != -1) {
                    var pf,
                      name = utils.lookup(data, 'info.detail')

                      if (!name) {

                        name = data._name

                        pf = utils.lookup(data, 'info.prefix')

                        if (pf) {

                          pf = utils.trim(pf).split(/\:(.*)/, 2)

                          if (pf[0])
                            name = pf[0] + name


                          if (pf[1])
                            name = name + pf[1]

                        }
                      }

                    item.display_name = name
                    item.address = address
                  }

                return syncTakenItems()
              })
            }

            ,
            itemSync: function(item, force) {
              var promise

              promise = $scope.xdataSync(item, 'name', 'Product', force)

              return promise.then(function(data) {

                syncState(data)
                syncImage(data)
              })
            }

            ,
            takenSelect: function(clear) {
              var select = $scope.canSelect()

              if (select) {

                select.selected = true

                if (clear && (select.name == $scope.selectName))
                  $scope.selectName = ''
              }
            }

            ,
            canSelect: function() {

              if ($scope.selectName) {
                var select = $filter('filter')($scope.takenItems(), $scope.selectName)

                return select.length == 1 && !select[0].selected && select[0]
              }
            }

            ,
            beforeSave: function(savedata) {

              if (savedata._name.match(/\*$/)) {
                var pattern, xsegs, xx = ({
                    'ยืม': 'VT',
                    'คืน': 'VG',
                    'ขาย': 'VS'
                  })[savedata._type] || '**',
                  yy = moment().format('YYMM'),
                  sep = '-',
                  digit = 4


                  pattern = utils.runningPattern(savedata._name, xx, yy, sep, digit)

                  if (pattern) {

                    return $scope.db.getHighest('_name', pattern.join('')).then(function(data) {

                      if (data && data.length) {

                        savedata._name = utils.runningNext(data[0]._name)
                      } else {
                        var runno

                        if (pattern[0] == utils.escapeRegex(xx)) {
                          savedata._name = xx + pattern[1] + sep + '*'
                        }

                        savedata._name = savedata._name.replace(/\*$/, '0000000001'.substr(10 -
                          digit))
                      }

                      return savedata
                    })
                  }

                savedata._name = savedata._name.replace(/\*$/, '0000000001'.substr(10 - digit))
              }
              return savedata
            }

            ,
            prohibitPrice: function(item, clear) {
              var flag, price = utils.lookup(item, '$temp.data.info.lowest_price')

                if (price && item.price) {

                  flag = item.price < price

                  if (flag && clear)
                    item.price = 0

                  return flag
                }
            }

          }

          angular.extend($scope, services)

          // resource$entry for view
          $scope.resource$entry.init('meta', ['items'])
          $scope.resource$entry.init('info', ['person'])

          // temp$entry for view
          $scope.temp$entry.init('meta', ['takenItems'])

          if ($scope.items().length == 0 && !$scope.resource._id) {

            $scope.resource$entry.add($scope.items())
            $scope.resource.info.site = $scope.rememberSite()
          } else {
            var ps = []

            angular.forEach($scope.items(), function(item) {

              ps.push($scope.itemSync(item, -1))
            })

            promiseSync = $q.all(ps)
          }

          if ($routeParams.opr == 'cancel') {

            if (!$scope.postState) {

              $scope.oprImplemented = true
              return $scope.editOpr.postState('cancelled', '**ยกเลิก** ').then(function() {

                return $scope.editOpr.exit()
              })
            }
          }

          if ($routeParams.opr == 'post') {

            if (!$scope.postState || $scope.postState == 'pending') {

              if ($scope.resource._type == 'ยืม') {

                $scope.oprImplemented = true
                return $q.when(promiseSync).then(function() {

                  return postTaking(false, 'taken', 'info.taking')
                })
              }

              if ($scope.resource._type == 'ขาย') {

                $scope.oprImplemented = true
                return $q.when(promiseSync).then(function() {

                  return postTaking(false, 'sold', 'info.selling')
                })
              }

              if ($scope.resource._type == 'คืน') {

                $scope.oprImplemented = true
                return $q.when(promiseSync).then(function() {

                  return postGetting(false)
                })
              }
            }
          }

          if ($routeParams.opr == 'unpost') {

            if (!$scope.postState || $scope.postState == 'cancelled') {

              $scope.oprImplemented = true
              return $scope.editOpr.postState('', '**คืนรายการ** ').then(function() {

                return $scope.editOpr.exit()
              })
            }

            if ($scope.resource._type == 'ยืม') {

              $scope.oprImplemented = true
              return $q.when(promiseSync).then(function() {
                return postTaking(true, 'taken', 'info.taking')
              })
            }

            if ($scope.resource._type == 'ขาย') {

              $scope.oprImplemented = true
              return $q.when(promiseSync).then(function() {
                return postTaking(true, 'sold', 'info.selling')
              })
            }

            if ($scope.resource._type == 'คืน') {

              $scope.oprImplemented = true
              return $q.when(promiseSync).then(function() {

                return postGetting(true)
              })
            }

          }

          if ($scope.person().name) {
            $scope.personSync($scope.person(), -1)
          }

          if (!$scope.resource._name) {
            $scope.resource._name = '*'
          }

          if (!$scope.resource.info.issue_date) {
            $scope.resource.info.issue_date = moment().format('YYYY-MM-DD')
          }

          $scope.$watch('items()', item2Selected, true)
          $scope.$watch('takenItems()', selected2Item, true)


        } // success

        // init by base controller
        $controller(
          'legacyEditCtrl', {
            $scope: $scope,
            legacyEditDI: legacyEditDI,
            editctrl: {
              db: db,
              success: success
            }
          })

      }
    ])


}).call(this);
