(function () {

'use strict'

angular.module('npd.voucher-edit',['controllers.legacy-edit','npd.database'])
  .controller('voucherEditCtrl', ['$scope', 'legacyEditDI', '$controller','Database', 'GDrive', '$filter'
  , function ($scope, legacyEditDI, $controller, Database, GDrive, $filter)
    {
      var db    = new Database.legacy('Voucher')
        , utils = legacyEditDI.utils
        , productDb = new Database.legacy('Product')

      function syncState (data) {

        if (data && data.info) {
          if (data.info.selling) {
            data.state = "sold"
          }
          else if (data.info.taking && data.info.taking.person) {
            data.state = "taken"
          }
        }
      }

      function syncImage (data) {

        if (data && data.meta && data.meta.images) {

          angular.forEach(data.meta.images, function (img) {

            if (img.id && img.thumbnailLink===undefined) {

              img.thumbnailLink = null

              GDrive.fileMeta(img.id).then( function (meta) {

                  if (meta.thumbnailLink && !meta.trashed) {

                      img.thumbnailLink = meta.thumbnailLink
                      img.src = meta.webContentLink //'https://docs.google.com/uc?id=' + img.id
                  }
              })
            }

          })
        }
      }

      function keepItemPrice(item) {
        if (!item.$temp) {
          item.$temp = function () {}
        }
        item.$temp.name = item.name
        if (item.price) {
          item.$temp.price = item.price
        }
      }

      function syncTakenItems() {
        var promise, query

        $scope.resource.meta.takenItems = []
        if (!$scope.resource.info.person.name 
          || !$scope.resource.info.person.$temp || !$scope.resource.info.person.$temp.synced) {
          return
        }

        query = productDb.rawScopeQuery(['@taken','@info.taking.person=\''+$scope.resource.info.person.name])
        promise = productDb.dataAccess.query(query)

        promise.then(function (dataList) {
          angular.forEach(dataList, function (data) {
            var item = {name : data._name, price : utils.lookup(data,'info.taking.price') || 0 }

            item.$temp = function () {}
            item.$temp.data  = data
            syncImage(data)
            keepItemPrice(item)
            $scope.resource.meta.takenItems.push(item)
          })
        })

      }

      function oldPriceStr (item) {

        if (item.$temp.price) {
          return moment().format('DD/MM/BBBB') + ' = ' + numeral(item.$temp.price).format('0,0[.]00')
        }
      }

      var success = function ( ) {
          var services = {
              formType : function () {
                if ($scope.resource._type) {
                  return 'taking'
                }
              }

            , itemIndexes : function (page, rows, items) {
                items = items || $scope.items()
                rows = rows || 10

                var list= []
                  , max = items.length
                  , idx

                idx = (page -1) * rows
                for (var i=0; i<rows; i++) {
                  if (idx + i >= max) {
                    break
                  }
                  list.push(items[idx+i])
                }
                return list
              }
            , selectedItems : function () {
                var items = []
                angular.forEach($scope.takenItems(),function (_itm) {
                  if (_itm.selected) {
                    items.push(_itm)
                  }
                })
                return items
              } 
            , unselectedItems : function () {
                var items = []

                angular.forEach($scope.takenItems(),function (_itm) {
                  if (!_itm.selected) {
                    items.push(_itm)
                  }
                })
                return items
              } 
            , isLastPage : function (page, rows, items) {
                items = items || $scope.items()
                rows = rows || 10
                return (page * rows) >= (items.length)
              }
            , itemPages : function (rows, items) {
                items = items || $scope.items()
                rows = rows || 10

                var count = 0
                  , max   = items.length
                  , pg    = 1
                  , pages = []

                while (count < max) {
                  pages.push(pg)
                  pg += 1
                  count += rows                  
                }
                return pages
              }
            , loc2Address : function (loc) {
                return [loc.address,loc.city,loc.province,loc.zipcode].join(' ')
              }

            , personSync : function (item, force) {
                var promise

                promise = $scope.xdataSync (item, 'name', 'Person', force)

                promise.then(function (data) {
                  var address = ''

                  if (data) {
                    if (data.info && data.info.prefix) {
                      var pf = data.info.prefix

                      if (pf.indexOf(':')>=0) {
                        pf = pf.split(':')
                        item.name = pf[0] + item.name + pf[1]
                      }
                      else {
                        item.name = pf + item.name
                      }

                    }

                    if (data.meta && data.meta.locations) {

                      angular.forEach(data.meta.locations, function (loc) {
                        var a

                        a = $scope.loc2Address(loc)
                        if (!address || item.address == a) {
                          address = a
                        }
                      })
                    }

                    item.address = address
                    item.$temp.synced = item.name

                  }
                  syncTakenItems()
                })
              }

            , itemSync : function (item, force) {
                var promise

                promise = $scope.xdataSync(item, 'name', 'Product', force)

                promise.then(function (data) {

                  syncState(data)
                  syncImage(data)
                })
              }

            , savePriceStr : function (item) {
                var ps = oldPriceStr(item)

                if (ps && (!item.remark || item.remark.indexOf(ps)==-1)) {
                  item.remark = ps +'\n' + (item.remark || '')
                }
              }

            , priceUnsaved : function (item) {
                if (item.$temp.price && item.price != item.$temp.price) {

                  return !item.remark || (item.remark.indexOf(oldPriceStr(item))==-1)
                }
              }

            , takenSelect : function(clear) {
                var select = $scope.canSelect()

                if (select) {
                  select.selected = true
                  if (clear && select.name == $scope.selectName) {
                    $scope.selectName = ''
                  }
                }
              }

            , canSelect : function () {
                if ($scope.selectName) {
                  var select = $filter('filter')($scope.takenItems(),$scope.selectName)

                  return select.length==1 && !select[0].selected && select[0]
                }
              }
            }

          angular.extend($scope, services)

          var entry = $scope.resource$entry
          // entry for view
          angular.forEach(['items', 'takenItems'], function (n) {
              $scope[n] = function () { return entry.meta(n) }
              $scope[n]()
            })

          angular.forEach(['person'], function (n) {
              $scope[n] = function () { return entry.info(n,{}) }
              $scope[n]()
            })

          if ($scope.items().length==0 && !$scope.resource._id) {
            $scope.resource$entry.add($scope.items())
          }
          else {
            angular.forEach($scope.items(), function(item) {
              $scope.itemSync(item, true)
              keepItemPrice(item)
            })
          }

          if ($scope.takenItems().length) {
            angular.forEach($scope.takenItems(), function(item) {
              $scope.itemSync(item, true)
              keepItemPrice(item)
            })

          }
          $scope.hideEditButton = {}
          $scope.$watch('resource.info.approved', function() { $scope.hideEditButton.delete = $scope.resource.info.approved })
        }
      
      // init by base controller
      $controller (
        'legacyEditCtrl'
      , {
          $scope        : $scope
        , legacyEditDI  : legacyEditDI
        , editctrl      : { db : db, success : success }
        })

    }
  ])


}).call(this);