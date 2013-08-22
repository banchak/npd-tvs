(function () {

'use strict'

angular.module('npd.image-sync',['modules.gdrive', 'modules.utils','npd.database'])
  .controller('imageSyncCtrl', ['$scope', '$q', 'Database', 'GDrive', 'utils'
  , function ($scope, $q, Database, GDrive, utils)
    {
      var db    = new Database.legacy('Product')

      $scope.utils = utils

      function syncImages (parentId, token) {

        var promise

        promise = GDrive.folders({parents : parentId, mimeType : 'image/jpeg' }, token)

        promise = promise.then (function (resp) {
          var promises = []

          if (resp && resp.items) {
            
            angular.forEach(resp.items, function (meta) {
              var name

              if (!meta.title.match(/[A-Z]+\d{1,2}\-\d{3,4}[A-Z]*\.jpg/)) {

                return
              }

              name = meta.title

              db.dataAccess.query({_name : name}, {}, function (resp) {


                angular.forEach(resp,function (resource) {

                  var pm


                  if (!resource.meta) {
                    resource.meta = {}
                  }

                  if (!resource.meta.images) {
                    resource.meta.images = []
                  }

                  resource.meta.images[0] = { id : meta.id }

                  pm = resource.$update().then(function () {

                      $scope.files.push({ id : meta.id, name : name})

                    })
                  
                  promises.push(pm)

                })
              })
            })
          }

          return $q.all(promises).then(function () { return resp})
        })

        promise = promise.then (function (resp) {

          utils.safe$apply()
          if (resp.nextPageToken) {
            // not finish
            return syncFolders(parentId, resp.nextPageToken)
          }

          return resp
        })

        return promise

      }


      function syncFolders (parentId, token) {

        var promise

        promise = GDrive.folders({parents : parentId }, token)

        promise = promise.then (function (resp) {
          var promises = []

          if (resp && resp.items) {
            
            angular.forEach(resp.items, function (meta) {
              var name

              if (!meta.title.match(/[A-Z]+\d{1,2}\-\d{3,4}[A-Z]*/)) {

                return
              }

              name = meta.title

              db.dataAccess.query({_name : name}, {}, function (resp) {


                angular.forEach(resp,function (resource) {

                  var pm


                  if (!resource.meta) {
                    resource.meta = {}
                  }

                  if (!resource.meta.folders) {
                    resource.meta.folders = []
                  }

                  resource.meta.folders[0] = { id : meta.id }

                  pm = resource.$update().then(function () {

                      $scope.files.push({ id : meta.id, name : name})

                    })
                  
                  promises.push(pm)

                })
              })
            })
          }

          return $q.all(promises).then(function () { return resp})
        })

        promise = promise.then (function (resp) {

          utils.safe$apply()
          if (resp.nextPageToken) {
            // not finish
            return syncFolders(parentId, resp.nextPageToken)
          }

          return resp
        })

        return promise

      }


      function getFolders (parent, token) {

        var promise, path

        $scope.folders = $scope.folders || []

        path = parent? parent.title : ' '

        promise = GDrive.folders({ parents : parent? parent.id : 'root', sharedWithMe : parent && !parent.id }, token)

        promise = promise.then(function (resp) {
          var promises = []

          if (resp && !resp.errror) {

            angular.forEach(resp.items, function (meta) {
              var data

              if (meta.title.match(/[A-Z]+\d{2}\-\d{3,4}[A-Z]*/)) {
                return
              }

              data = { title : path + '/' + meta.title, id : meta.id }
              $scope.folders.push (data)

              promises.push (getFolders (data))
            })
          }

          return $q.all(promises).then(function() { return resp})
        })

        promise = promise.then (function (resp) {

          utils.safe$apply()
          if (resp.nextPageToken) {
            return getFolders(parent, resp.nextPageToken)
          }

          return resp
        })

        return promise
      }

      function finish() { 

        $scope.syncBusy = false
        utils.safe$apply()
      }

      function doSync (action) {

        if ($scope.imageFolder) {
          var promise

          $scope.files = []
          $scope.syncBusy = true
          promise = action ($scope.imageFolder)

          promise.then (finish, finish)
          return promise
        }
      }

      $scope.doFileSync = function () {

        doSync (syncFile)
      } 

      $scope.doFolderSync = function () {

        doSync (syncFolders)
      }

      // get folder on initialize
      $scope.syncBusy = true
      getFolders()
        .then (function () {
          return getFolders({title : '+'})
        })
        .then(finish, finish)

    }
  ])


}).call(this);