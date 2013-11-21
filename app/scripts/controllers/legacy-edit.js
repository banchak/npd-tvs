'use strict'

angular.module('controllers.legacy-edit', ['modules.uis', 'modules.utils'])

.factory('legacyEditDI', ['$routeParams', '$filter', '$q', 'uis', 'utils',
  function($routeParams, $filter, $q, uis, utils) {

    return {
      $routeParams: $routeParams,
      $filter: $filter,
      $q: $q,
      utils: utils,
      uis: uis
    }
  }
])

.controller('legacyEditCtrl', ['$scope', 'legacyEditDI', 'editctrl',
  function($scope, legacyEditDI, editctrl) {
    var uis = legacyEditDI.uis,
      utils = legacyEditDI.utils,
      id = legacyEditDI.$routeParams.id,
      opr = legacyEditDI.$routeParams.opr,
      orgUrl = legacyEditDI.$routeParams.url,
      $filter = legacyEditDI.$filter,
      $q = legacyEditDI.$q,
      dataPromise

      $scope.db = editctrl.db
      $scope.basepath = utils.basepath()
      $scope.utils = utils
      $scope.uis = uis

      $scope.resource = $scope.db.resource()
      $scope.tempResource = {}

    $scope.legacyEntry = function(resource) {

      var entry = new utils.Entry(resource)

        function _initEnt(ent, definit) {

          if (!entry[ent]) {

            entry[ent] = function(name, defval) {

              if (defval == undefined && definit) {
                defval = definit()
              }
              return entry.get(ent, name, defval)
            }
          }
        }

        // predefined entry
      _initEnt('meta', function() {
        return []
      })
      _initEnt('info', function() {
        return {}
      })
      _initEnt('display')
      _initEnt('_sys')

      entry.init = function(ent, props, definit) {

        _initEnt(ent, definit)

        angular.forEach(props, function(n) {

          $scope[n] = function() {

            return entry[ent](n)
          }
          $scope[n].parent = entry[ent]

          $scope[n]()
        })
      }

      return entry
    }


    $scope.resource$entry = $scope.legacyEntry($scope.resource)
    $scope.temp$entry = $scope.legacyEntry($scope.tempResource)

    $scope.isSynced = function(item, name) {
      var temp = utils.temp('synced')

      if (!item) {
        return
      }

      name = name || 'name'
      /*if (angular.isUndefined(temp.get(item))) {
          temp.set(item, item[name] || '')
          return true
        }*/
      return (temp.get(item) || null) == (item[name] || null)
    }


    $scope.xdataSync = function(item, name, srcname, force, xquery) {
      var qry, promise, srcdb, tempsynced = utils.temp('synced'),
        tempdata = utils.temp('data')

        name = name || 'name'

      if (!item) {
        
        return $q.when(null)
      }
      if (!item[name]) {

        tempsynced.set(item, item[name])

        return $q.when(null)
      }

      if (!force && $scope.isSynced(item, name)) {

        return $q.when(null)
      }

      tempsynced.set(item, item[name])
      tempdata.set(item, null)

      if (srcname.indexOf('/') >= 0) {
        srcname = srcname.split('/')
        srcdb = new $scope.db.database.legacy(srcname[0])
        srcname = srcname[1]
      } else {
        srcdb = new $scope.db.database.legacy(srcname)
        srcname = '_name'
      }


      qry = {}
      if (item[name].match(/[a-z]/) && !item[name].match(/[A-Z]/)) {
        qry[srcname] = {
          $regex: utils.escapeRegex(item[name]),
          $options: 'i'
        }
      } else {
        qry[srcname] = item[name]
      }

      if (xquery) {
        qry = angular.extend(qry, xquery)
      }


      promise = srcdb.dataAccess.query(qry, {
        limit: 2
      })

      promise = promise.then(function(datalist) {
        var data

        if (!datalist.length) {
          tempdata.set(item, null)
          return
        }

        if (datalist.length > 1) {
          tempdata.set(item, {
            error: "found more than 1 result."
          })
          return
        }

        data = angular.extend({}, datalist[0])
        tempdata.set(item, data)
        tempsynced.set(item, item[name] = data[srcname])
        return data
      })

      return promise
    }

    $scope.selfList = function(name, value, xquery) {
      var qry = {}, names, promise, mixlist, db = $scope.db

      if (name.indexOf('/') >= 0) {
        name = name.split('/')
        db = new db.database.legacy(name[0])
        name = name[1]
      }

      names = name.split(/\s*[,;]\s*/g)
      name = names.shift()

      if (utils.notEmpty(value)) {
        qry[name] = {
          $regex: value
        }

        if (value.match(/[a-z]/) && !value.match(/[A-Z]/)) {
          qry[name]['$options'] = 'i'
        }
        if (names.length) {
          var qrs = [qry]

          angular.forEach(names, function(n) {
            var q = {}

            q[n] = qry[name]
            qrs.push(q)
          })
          qry = {
            $or: qrs
          }
        }
      }

      if (db.database.BUILT_IN.selfLists) {

        for (var data in db.database.BUILT_IN.selfLists) {
          data = db.database.BUILT_IN.selfLists[data]

          if (data.name == name) {
            mixlist = $filter('filter')(data.list, value)
            break
          }
        }
      }

      if (xquery) {
        qry = angular.extend(qry, xquery)
      }
      promise = db.dataAccess.distinct(name, qry).then(function(data) {

        data = data || []

        if (data.length && !names.length && value) {
          data = $filter('filter')(data, value)
        }
        
        if (mixlist) {
          angular.forEach(mixlist, function(v) {
            if (data.indexOf(v) == -1) {
              data.push(v)
            }
          })
        }
        data.sort()
        return data

      }, function() {

        if (mixlist) {
          mixlist.sort()
          return mixlist
        }
      })

      return promise
    }

    $scope.initDitto = function(data) {

      if (data) {

        id = ''
        delete data._id
        if (utils.lookup(data, 'info.approved'))
          delete data.info.approved
        if (data._sys)
          delete data._sys
      }
    }

    $scope.showPostErrors = function(field) {
      var errors, msg

        field = '_sys.' + (field || 'post_errors')
        errors = utils.lookup($scope.resource, field)
        if (errors) {
          msg = JSON.stringify(errors, undefined, 2)
          return uis.errorBox(msg).open()
        }
    }

    $scope.dbError = function(msg) {

      return function(r, status, header) {
        r = r || {}
        return uis.errorBox(msg + '\n' + (r.message || status)).open()
      }
    }

    $scope.regetData = function() {
      var id = $scope.resource.$id()

      if (id && id != 'new') {

        return $scope.db.dataAccess.getById(id)
      }
      return $q.when()
    }

    $scope.isConflict = function(storeData, newData) {
      var modified = utils.$parse('_sys.modified')

      return modified(storeData) != modified(newData || $scope.resource)
    }

    $scope.stampModified = function(savedata, create) {
      var timestamp = utils.timestamp(),
        email = utils.lookup(utils.$rootScope, 'authorizeData.user.email'),
        _sys

        savedata = savedata || $scope.resource
      if (!savedata._sys) {
        savedata._sys = {}
      }

      _sys = savedata._sys

      if (create) {
        _sys.created = timestamp
        _sys.owner = email
      }

      _sys.modified = timestamp
      _sys.modifier = email
      utils.deepStrip(_sys)
    }

    $scope.editOpr = {

      exit: function(_id) {
        var vpath = ''

        if (_id === undefined) {

          if (orgUrl) {

            utils.$location.url(orgUrl)
            return
          }

          _id = $scope.resource.$id()
        }

        if (_id) {
          vpath = '/view/' + _id
        }

        utils.$location.url($scope.basepath + vpath)
        //utils.redirect(utils.basepath())
        return $q.reject()
      }

      ,
      remove: function(cb) {

        var btn = [{
          result: 'ok',
          label: 'OK',
          cssClass: 'btn-primary'
        }, {
          result: 'cancel',
          label: 'Cancel'
        }],
          promise


        if (!$scope.resource.$id()) {
          return uis.errorBox('ไม่มีข้อมูล สำหรับลบ').open().then(function() {
            $scope.editOpr.exit(false);
          })
        }

        promise = uis.messageBox($scope.db.title, 'ลบข้อมูล?', btn).open()

        promise = promise.then(function(result) {

          if (result == 'ok') {

            return $scope.regetData().then(function(data) {

              if (!data.$id()) {
                return uis.errorBox('ไม่มีข้อมูล สำหรับลบ').open().then(function() {
                  $scope.editOpr.exit(false);
                })
                return $q.reject()
              }

              if ($scope.isConflict(data, $scope.resource)) {
                var error = uis.errorBox('ข้อมูลนี้ถูกเปลี่ยนแปลง โดยผู้อื่นไปแล้ว', null, 'conflict error')

                error.open().then(function() {

                  $scope.editOpr.exit()
                })

                return $q.reject()
              }
            })
          }
          return result
        })

        return promise.then(function(result) {
          var pm, showErrorCB = $scope.dbError('ไม่สามารถลบข้อมูล')

            pm = $scope.resource.$remove(null, showErrorCB)

            pm.then(function(data) {
              if (data) { // success

                $scope.editOpr.exit(false);
              }
            })
            return pm
        })
      }

      ,
      postError: function(errors, field) {
        var qry, data, changes

          field = '_sys.' + (field || 'post_errors')

          qry = {
            _id: $scope.resource._id
          }

        data = {}
        data[field] = errors || ''

        if (utils.notEmpty(errors)) {

          changes = {
            $set: data
          }
        } else {

          changes = {
            $unset: data
          }
        }

        changes.$unset = {
          '_syspost_errors': ''
        }

        return $scope.db.dataAccess.bulkUpdate(qry, changes)

      },
      postState: function(newstate, message) {
        var qry, promise, changes, msgbox = uis.messageBox($scope.db.title, (message || newstate || '') + ' กำลังบันทึกสถานะ..'),
          lastmod = utils.lookup($scope.resource, '_sys.modified') || null,
          showErrorCB = $scope.dbError('ไม่สามารถบันทึกสถานะ')

          newstate = newstate || null

        if ((utils.lookup($scope.resource, '_sys.post_state') || null) == newstate) {

          console.log('post_state not change, skip update silently.')
          return $q.when({})
        }

        msgbox.open()

        $scope.stampModified($scope.resource)
        angular.extend($scope.resource._sys, {
          post_errors: null,
          post_state: newstate,
          poster: $scope.resource._sys.modifier,
          posted: $scope.resource._sys.modified
        })

        utils.deepStrip($scope.resource._sys)

        qry = {
          _id: $scope.resource._id
        }
        qry['_sys.modified'] = lastmod

        changes = {
          $set: {
            _sys: $scope.resource._sys
          }
        }
        promise = $scope.db.dataAccess.bulkUpdate(qry, changes, angular.noop, showErrorCB)

        promise.then(function() {
          msgbox.close()
        })

        return promise.then(function(data) {

          if (data && !data.n) {
            uis.errorBox('ข้อมูลนี้ถูกเปลี่ยนแปลง โดยผู้อื่นไปแล้ว', null, 'conflict error').open()
          }
          return data
        })
      }

      ,
      save: function(cb, message) { // return promise
        var msgbox = uis.messageBox($scope.db.title, (message || '') + ' กำลังบันทึกข้อมูล..'),
          savedata, promise

          // isolate savedata from model data prevent view binding effect
          savedata = angular.copy(angular.extend({}, $scope.resource))
          utils.deepStrip(savedata, true)


          if ($scope.beforeSave) {
            promise = $q.when($scope.beforeSave(savedata))
          } else {
            promise = $q.when(savedata)
          }

        promise = promise.then(function(savedata) {

          if (!savedata || !utils.notEmpty(savedata)) {

            uis.errorBox('ไม่มีข้อมูล ไม่จำเป็นต้องบันทึก').open().then(function() {

              if (cb) {
                cb()
              }
            })

            return $q.reject()
          }

          if ($scope.db.required) {
            var errflds = []

            angular.forEach($scope.db.required, function(fld) {
              if (!utils.notEmpty(utils.lookup(savedata, fld.name))) {
                errflds.push(fld.label)
              }
            })
            if (errflds.length) {
              uis.errorBox('ตรวจพบข้อมูลไม่สมบูรณ์ : ' + errflds.join(', ')).open()
              return $q.reject()
            }
          }
          return savedata
        })

        promise = promise.then(function(savedata) {
          var modified = utils.$parse('_sys.modified')

          if (id && id != 'new') {

            return $scope.regetData().then(function(data) {

              data = angular.extend({}, data)

              if (angular.equals(savedata, data)) {

                console.log('Data not change, skip saving process silently.')

                if (cb) {
                  cb()
                }

                return $q.reject()
              }

              if ($scope.isConflict(data, savedata)) {
                var error = uis.errorBox('ข้อมูลนี้ถูกเปลี่ยนแปลง โดยผู้อื่นไปแล้ว', null, 'conflict error')

                error.open().then(function() {

                  $scope.editOpr.exit()
                })

                return $q.reject()
              }

              return savedata
            })
          }

          return savedata
        })

        return promise.then(function(savedata) {
          var pm, showErrorCB = $scope.dbError('ไม่สามารถบันทึกข้อมูล')

            $scope.stampModified(savedata, !id || id == 'new')

            msgbox.open()

            pm = $scope.db.resource(savedata)
              .$saveOrUpdate(null, null, showErrorCB, showErrorCB)

            pm.then(function(data) {

              if (data) { // success

                if (cb) {

                  cb((!id || id == 'new') ? data.$id() : undefined)
                } else {

                  if (!id || id == 'new') {

                    utils.$location.path(utils.$location.path().replace(/\/edit\/.*/, '/edit/' + data.$id()))
                  } else {

                    utils.$route.reload()
                  }

                }
              }
              return data
            })
              .then(function() {
                msgbox.close()
              })

            return pm
        })
      }
    }


    if (id && id != 'new') {
      dataPromise = $scope.db.dataAccess.getById(id)
    } else {
      dataPromise = $q.when(angular.fromJson(legacyEditDI.$routeParams.preset) || {})
    }

    dataPromise.then(function(data) {

      if (!data) {
        uis.errorBox('invalid id [ ' + id + ' ].').open()
          .then(function() {
            $scope.editOpr.exit()
          })

        return
      }

      if (opr == 'ditto') {

        $scope.oprImplemented = opr
        $scope.initDitto(data)
      }
      angular.extend($scope.resource, data)

      $scope.postState = utils.lookup($scope.resource, '_sys.post_state')

      if ($scope.postState && !opr && utils.$location.path().match(/\/edit\//)) {

        uis.errorBox('not allow editing.', null, $scope.postState).open()
          .then(function() {
            $scope.editOpr.exit()
          })

        return
      }

      if (editctrl.success) {

        return editctrl.success()
      }

    })
      .then(function() {

        if (!id || id == 'new')
          $scope.unlockEdit = true

        if (opr == 'delete') {
          $scope.oprImplemented = opr
          $scope.editOpr.remove()
          return
        }

        if (opr && !$scope.oprImplemented) {
          return uis.errorBox('Sorry,"' + opr + '" is not implemented yet!').open().then(function() {

            $scope.editOpr.exit()
            return $q.reject()
          })
        }

        $scope.dataReady = true
      })

  }
])
