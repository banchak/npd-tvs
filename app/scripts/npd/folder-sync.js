(function() {

  'use strict'

  angular.module('npd.folder-sync', ['modules.google-api', 'modules.utils', 'npd.database'])
    .controller('folderSyncCtrl', ['$scope', 'Database', 'googleApi', 'utils',
      function($scope, Database, googleApi, utils) {
        var db = new Database.legacy('Product')

        $scope.utils = utils

          function syncFolder(fileId) {

            var api = gapi.client.drive,
              name

              $scope.syncChecking = true

              api.files.get({
                fileId: fileId
              })
                .execute(function(meta) {

                  if (meta && !meta.error) {
                    if (meta.mimeType == 'application/vnd.google-apps.folder' && meta.title.match(
                      /[A-Z]+\d{1,2}\-\d{3,4}[A-Z]*/)) {

                      //console.log ($scope.syncCount, meta.title, meta)
                      name = meta.title

                      db.dataAccess.query({
                        _name: name
                      }, {}, function(resp) {

                        angular.forEach(resp, function(resource) {

                          $scope.syncWriting = true

                          if (!resource.meta) {
                            resource.meta = {}
                          }

                          if (!resource.meta.folders) {
                            resource.meta.folders = []
                          }

                          if (resource.meta.images && resource.meta.images[0]) {
                            delete resource.meta.images[0].thumbnail
                          }


                          resource.meta.folders[0] = {
                            id: meta.id
                          }

                          resource.$update(function() {
                            console.log('saved', name, resource.meta.images[0])
                            $scope.files.push({
                              id: meta.id,
                              name: name
                            })
                            $scope.syncWriting = false
                            googleApi.safe$apply($scope)
                          }, function() {
                            $scope.syncWriting = false
                            googleApi.safe$apply($scope)
                          })
                        })
                        $scope.syncChecking = false
                        googleApi.safe$apply($scope)

                      })
                      return
                    }
                  }
                  $scope.syncChecking = false
                  googleApi.safe$apply($scope)
                })
          }

          function syncChildren(query) {

            var api = gapi.client.drive

              function chkSyncing() {
                if ($scope.syncWriting || $scope.syncChecking) {
                  window.setTimeout(chkSyncing, 10000)
                  return
                }
                $scope.syncing = false
                googleApi.safe$apply($scope)
              }

            $scope.syncing = true
            api.children.list(query)
              .execute(function(resp) {

                if (resp && !resp.error) {
                  for (var i in resp.items) {

                    if ($scope.abort)
                      return
                    syncFolder(resp.items[i].id)
                  }

                  if (resp.nextPageToken) {
                    window.setTimeout(function() {
                      syncChildren(angular.extend(query, {
                        pageToken: resp.nextPageToken
                      }))
                    }, 10)
                  } else {
                    chkSyncing()
                  }

                }

              })
          }

          function getFolders(query) {

            var api = gapi.client.drive

            $scope.folders = $scope.folders || []

            if (!query)
              query = {
                q: 'mimeType = "application/vnd.google-apps.folder" and trashed = false and hidden = false'
              }

            googleApi.execute(api.files.list(query), function(resp) {

              if (resp && !resp.errror) {

                angular.forEach(resp.items, function(meta) {

                  if (!meta.title.match(/[A-Z]+\d{2}\-\d{3,4}[A-Z]*/)) {

                    var title = meta.title,
                      data = {
                        title: title,
                        id: meta.id,
                        modifiedDate: meta.modifiedDate
                      }

                    console.log('folder', meta.title)

                    if (!meta.parents || meta.parents[0].isRoot) {

                      data.title = '/' + title
                      $scope.folders.push(data)
                      googleApi.safe$apply($scope)
                    } else {

                      api.files.get({
                        fileId: meta.parents[0].id
                      })
                        .execute(function(fmeta) {

                          if (fmeta && !fmeta.error) {
                            data.title = fmeta.title + '/' + title
                          }

                          $scope.folders.push(data)
                          googleApi.safe$apply($scope)
                        })

                    }
                  } else {
                    console.log('skip', meta.title)
                  }
                })

                if (resp.nextPageToken) {
                  window.setTimeout(function() {
                    getFolders(angular.extend(query, {
                      pageToken: resp.nextPageToken
                    }))
                  }, 10)
                }

              }

            })
          } // getFolders

        $scope.doSync = function() {
          if ($scope.imageFolder) {
            $scope.files = []
            $scope.syncCount = 0
            $scope.syncFinish = 0
            syncChildren({
              folderId: $scope.imageFolder,
              q: 'trashed = false'
            })
          }
        }

        // inital loading folder 
        googleApi.userReady(function(auth) {
          if (!auth.limitAccess)
            getFolders()
        })

      }
    ])


}).call(this);
