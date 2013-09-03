'use strict'

angular.module('controllers.legacy-edit',['modules.uis', 'modules.utils'])

  .factory('legacyEditDI',['$routeParams', '$filter', '$q', 'uis', 'utils'
  , function($routeParams, $filter, $q, uis, utils)
    {

      return {
            $routeParams  : $routeParams
          , $filter       : $filter
          , $q            : $q
          , utils         : utils
          , uis           : uis
          }
    }
  ])

  .controller('legacyEditCtrl', ['$scope', 'legacyEditDI', 'editctrl'
  , function($scope, legacyEditDI, editctrl)
    {
      var uis     = legacyEditDI.uis
        , utils   = legacyEditDI.utils
        , id      = legacyEditDI.$routeParams.id
        , $filter = legacyEditDI.$filter
        , $q      = legacyEditDI.$q

      $scope.db       = editctrl.db
      $scope.basepath = utils.basepath()
      $scope.utils    = utils
      $scope.uis      = uis

      $scope.resource = $scope.db.resource()

      if (id=='new') {
        $scope.unlockEdit = true
      }

      var entry   = new utils.Entry($scope.resource)

      angular.extend(
        entry
      , {
          meta  
          : function(name,defval) 
            {
              if (defval==undefined)
                defval  = []

              return entry.get('meta',name,defval)
            }
        , info
          : function(name,defval) 
            {

              return entry.get('info',name,defval)
            }
        , display
          : function(name,defval) 
            {

              return entry.get('display',name,defval)
            }
        })
      
      $scope.resource$entry = entry

      $scope.isSynced
      = function (item, name) {
          var temp = utils.temp('synced')

          if (!item) {
            return
          }

          name = name || 'name'
          if (angular.isUndefined(temp.get(item))) {
            temp.set(item, item[name] || '')
            return true
          }
          return (temp.get(item) || null) == (item[name] || null)
        }
            
    , $scope.xdataSync 
      = function (item, name, srcname, force, xquery) {
          var qry, promise, srcdb
            , tempsynced  = utils.temp('synced')
            , tempdata    = utils.temp('data')

          name = name || 'name'

          if (!item[name]) {
            tempsynced.set(item, item[name])

            tempdata.set(item, null)
            return $q.when(null)
          }

          if (!force && $scope.isSynced(item,name)) {
            return $q.when(null)
          }

          tempsynced.set(item, item[name])
          tempdata.set(item, null)

          if (srcname.indexOf('/')>=0) {
            srcname = srcname.split('/')
            srcdb = new $scope.db.database.legacy(srcname[0])
            srcname = srcname[1]
          }
          else {
            srcdb = new $scope.db.database.legacy(srcname)
            srcname = '_name'
          }


          qry = {}
          if (item[name].match(/[a-z]/) && !item[name].match(/[A-Z]/)){
            qry[srcname] = { $regex : utils.escapeRegex(item[name]), $options : 'i' }
          }
          else{
            qry[srcname] = item[name]
          }

          if (xquery) {
            qry = angular.extend(qry, xquery)
          }


          promise = srcdb.dataAccess.query(qry, { limit : 2 })

          promise = promise.then(function (datalist) {
            var data

            if (!datalist.length) {
              return
            }

            if (datalist.length>1) {
              tempdata.set(item, { error : "found more than 1 result." })
              return
            }

            data = angular.extend({},datalist[0])
            tempdata.set(item, data)
            tempsynced.set(item, item[name] = data[srcname])
            return data
          })

          return promise
        }

      $scope.selfList
      = function (name, value, xquery) 
        {
          var qry = {}
            , names
            , promise
            , mixlist
            , db = $scope.db

          if (name.indexOf('/')>=0) {
            name = name.split('/')
            db = new db.database.legacy(name[0])
            name = name[1]
          }

          names = name.split(/\s*[,;]\s*/g)
          name = names.shift()

          if (utils.notEmpty(value))
          {
            qry[name] = { $regex : value }
            
            if (value.match(/[a-z]/) && !value.match(/[A-Z]/) ) {
              qry[name]['$options'] = 'i'
            }
            if (names.length) {
              var qrs = [qry]

              angular.forEach(names, function(n) {
                var q = {}

                q[n] = qry[name]
                qrs.push(q)
              })
              qry = {$or : qrs}
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
            qry = angular.extend(xquery)
          }
          promise = db.dataAccess.distinct(name, qry).then (function (data) {
            
              data = data || []
              if (mixlist) {
                angular.forEach(mixlist, function(v) {
                  if (data.indexOf(v)==-1) {
                    data.push(v)
                  }
                })
              }
              data.sort()
              return data

            }, function () {

              if (mixlist) {
                mixlist.sort()
                return mixlist 
              }
            })

          return promise
        }


      $scope.editOpr = {
        exit : function(_id) {
          var  vpath = ''
          
          if (_id === undefined) {
            _id = $scope.resource.$id()
          }

          if (_id) {
            vpath = '/view/' + _id
          }

          utils.$location.path($scope.basepath + vpath )
          //utils.redirect(utils.basepath())
        }

      , remove : function() {
                  
        var btn = [
              { result : 'ok', label : 'OK', cssClass : 'btn-primary'}
            , { result : 'cancel', label : 'Cancel'}
            ]
          , promise

        if (!$scope.resource.$id()) {
          return $q.when()
        }

        promise = uis.messageBox($scope.db.title, 'ลบข้อมูล?', btn).open()


        return promise.then (function (result) {
          var pm

          function showErrorCB(r,status,header) { 
              uis.errorBox('ไม่สามารถลบ, ' + (r.message || status)).open() 
          }

          if (result=='ok') {
              pm = $scope.resource.$remove(null, null, showErrorCB, showErrorCB)

              pm.then(function(data){
                if (data) { // success

                    $scope.editOpr.exit(false);
                }
              })
              return pm
            }
          })
        }
      , save : function(cb) { // return promise
          var msgbox = uis.messageBox($scope.db.title, 'กำลังบันทึกข้อมูล..')
            , savedata, promise

          // isolate savedata from model data prevent view binding effect
          savedata = angular.copy(angular.extend({},$scope.resource))
          utils.deepStrip(savedata, true)

          //console.log ('after strip',savedata)
          if ($scope.beforeSave) {
            promise = $q.when($scope.beforeSave(savedata))
          }
          else {
            promise = $q.when(savedata)
          }

          promise = promise.then(function(savedata){

            if (!savedata || !utils.notEmpty(savedata)) {

              uis.errorBox('ไม่มีข้อมูล ไม่จำเป็นต้องบันทึก').open().then(function(){

                if (cb) { cb () }
              })

              return $q.reject()
            }

            if ($scope.db.required) {
              var errflds = []

              angular.forEach($scope.db.required, function (fld) {
                if (!utils.notEmpty(utils.lookup(savedata,fld.name) )) {
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

          return promise.then(function(savedata) {
            var pm

            function showErrorCB(r,status,header) { 
              uis.errorBox('ไม่สามารถบันทึก, ' + (r.message || status)).open() 
            }

            msgbox.open()

            pm = $scope.db.resource(savedata)
                .$saveOrUpdate(null,null,showErrorCB, showErrorCB)

            // remove empty field before save
            pm.then(function(data) {

              msgbox.close()

              if (data) { // success

                if (cb) { cb(data.$id()) } 
                else {

                  if (id == 'new') {

                    utils.$location.path( utils.$location.path().replace('/new','/'+data.$id()))
                  }
                }
              }
              return data
            })

            return pm
          })
        }
      }

        
      if (id && id!='new')
      {
        $scope.db.dataAccess.getById(id).then(function (data) {
          if (!data)
          {
            uis.errorBox('invalid id [ '+id+' ].').open()
              .then( function() { 
                  $scope.editOpr.exit() 
              })

            return
          }

          angular.extend($scope.resource,data) 

          if (editctrl.success) { editctrl.success() }
        })  
      }
      else {

        if (editctrl.success) { editctrl.success() }
      }

    }
  ])