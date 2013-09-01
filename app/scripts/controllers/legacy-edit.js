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
            qry[srcname] = { $regex : $scope.db.database.escapeRegex(item[name]), $options : 'i' }
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
            , result
            , mixlist
            , db = $scope.db

          if (name.indexOf('/')>=0) {
            name = name.split('/')
            db = new db.database.legacy(name[0])
            name = name[1]
          }

          if (utils.notEmpty(value))
          {
            qry[name] = { $regex : value }
            
            if (value.match(/[a-z]/) && !value.match(/[A-Z]/) ) {
              qry[name]['$options'] = 'i'
            }

          }

          if (db.database.BUILT_IN.selfLists) {
            for (var data in db.database.BUILT_IN.selfLists) {
              data = db.database.BUILT_IN.selfLists[data]

              if (data.name == name) {
                mixlist = data.list
                break
              }
            }
          }

          if (xquery) {
            qry = angular.extend(xquery)
          }
          result = db.dataAccess.distinct(name, qry)

          result = result.then (function (data) {
              data = data || []
              if (mixlist) {
                angular.forEach(mixlist, function(v) {
                  if (data.indexOf(v)==-1) {
                    data.push(v)
                  }
                })
              }
              data = $filter('filter')(data, value)
              data.sort()
              return data

            }, function () {

              if (mixlist) {
                mixlist = $filter('filter')(mixlist, value)
                mixlist.sort()
                return mixlist 
              }
            })

          return result
        }


      $scope.editOpr
      = {
          exit
          : function(_id)
            {
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

        , remove
          : function() 
            {
                  
              if (!$scope.resource.$id())
                return ;
                
              var
                btn 
                = [
                    { result : 'ok', label : 'OK', cssClass : 'btn-primary'}
                  , { result : 'cancel', label : 'Cancel'}
                  ]

              uis.messageBox($scope.db.title, 'ลบข้อมูล?', btn).open()
                .then (
                  function (result) 
                  {
                    if (result=='ok') 
                    {
                      $scope.resource.$remove()
                        .then(
                          function(data) 
                          {
                            // success
                            $scope.editOpr.exit(false);
                          }
                        , function(data,errorno) 
                          {
                            // error
                            uis.errorBox(errorno).open()
                          })
                      
                    }
                  })
            }

        , save
          : function(cb)
            {
              //var promise = $scope.resource.$id()? $scope.resource.$save() : $scope.resource.$update() ;
              var
                msgbox = uis.messageBox($scope.db.title, 'saving data..')
              , savedata = angular.copy(angular.extend({},$scope.resource))
              // isolate savedata from model data prevent view binding effect
              
              //console.log ('before strip',savedata)
              utils.deepStrip(savedata, true)
              //console.log ('after strip',savedata)
              if (!utils.notEmpty(savedata, true)) {
                if (cb) {
                  cb ()
                }
                return
              }

              msgbox.open()

              savedata = $scope.db.resource(savedata)

              // remove empty field before save
              savedata
                .$saveOrUpdate().then(
                  function(data) 
                  {
                    // success
                    msgbox.close()
                    if (cb) {
                      cb(data.$id())
                    } else {

                      if (id == 'new'){

                        utils.$location.path(
                          utils.$location.path().replace('/new','/'+data.$id())
                          )
                      }
                      //utils.reload()
                    }
                  }
                , function(data,errorno) 
                  {
                    // error
                    msgbox.close() ;
                    uis.errorBox(errorno).open()
                  })
            }
        }

        
      if (id && id!='new')
      {
        $scope.db.dataAccess.getById(id)
          .then(
            function (data) 
            {
              if (!data)
              {
                uis.errorBox('invalid id [ '+id+' ].').open()
                  .then( 
                    function()
                    { 
                      $scope.editOpr.exit() 
                    })

                return
              }

              angular.extend($scope.resource,data) 
              if (editctrl.success)
                editctrl.success()              
            }
          , function (resp,errno) 
            {
              uis.errorBox(errno).open()
                .then( 
                  function()
                  { 
                    $scope.editOpr.exit(id) 
                  })
            })  
      }
      else
      {
        if (editctrl.success)
          editctrl.success()              
      }

    }
  ])