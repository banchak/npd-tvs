(function () {

'use strict'

angular.module('controllers.legacy-image-list',['controllers.legacy-list', 'modules.google-api'])
  .controller('legacyImageListCtrl', ['$scope', 'legacyListDI', 'listctrl', '$controller', '$timeout', 'googleApi'
  , function ($scope, legacyListDI, listctrl, $controller, $timeout, googleApi)
    {

      var success = function ( ){

          $scope.imageViewer = {
              opened  : false
            , close   : function () { 
                $scope.imageViewer.show = false 

                $timeout(function () {

                  $scope.imageViewer.opened = false 
                  }, 50)
              }
            , options : {
                //backdropFade  : true
                //dialogFade    : true
                backdrop      : false
              }
            }

          $scope.viewImage = function(data) {

            var img  

            function _showFolder () {

              angular.forEach(data.meta.folders, function (folder) {

                if (!folder.id || folder.links !== undefined) {
                  $scope.imageViewer.show = true
                  $scope.$apply()
                  return
                }

                folder.links = []

                googleApi.client.execute({
                    path    : 'drive.children.list'
                  , params  : {folderId : folder.id, q : 'trashed = false'}
                  }, function (resp) {

                    if (!resp.items) {

                      $scope.imageViewer.show = true
                      $scope.$apply()
                    }
                    else {
                      var count = 0

                      angular.forEach(resp.items, function (item) {

                        googleApi.client.execute({
                            path    : 'drive.files.get'
                          , params  : { fileId : item.id }
                          }, function (meta) {

                            if (meta && meta.alternateLink && meta.mimeType.match(/folder/)) {

                              if (googleApi.userHasRole(meta.title)) {

                                folder.links.push({ link : meta.alternateLink, title : meta.title})
                                $scope.imageViewer.show = true
                                $scope.$apply()
                              }
                            }
                            count += 1

                            if (count == resp.items.length) {

                              $scope.imageViewer.show = true
                              $scope.$apply()
                            }

                          })
                      }) 
                    }
                })
              })
            }

            angular.extend ($scope.imageViewer, {
                        images : data.meta.images
                      , folders: data.meta.folders
                      , opened : true
                      , show   : !data.meta.folders
                      , title  : data._name
                      , description : data.info.detail
                      })

            $timeout(_showFolder, 2000)
          }

          $scope.images = function(data) {
            var images, img, count = 0

            if (!data.meta || !data.meta.images) {

              return
            }

            images = data.meta.images

            angular.forEach(images, function (img) {

              if (img.id && img.thumbnailLink===undefined) {

                img.thumbnailLink = null

                googleApi.client.execute( {
                    path    : 'drive.files.get'
                  , params  : {fileId : img.id}
                  }, function (meta) {

                    if (meta.thumbnailLink && !meta.trashed) {

                        img.thumbnailLink = meta.thumbnailLink
                        img.src = meta.webContentLink //'https://docs.google.com/uc?id=' + img.id
                        
                    }
                })
              }

            })
          }

          // load thumbnailLink
          angular.forEach($scope.dataList, $scope.images)

      }
    
    var org_success = listctrl.success

    listctrl.success = function (scope) {
      if (org_success) {
        org_success(scope)
      }
      
      success (scope)
    }

    // init by base controller
    $controller (listctrl.imageCtrlBase || 'legacyListCtrl', {

        $scope        : $scope
      , legacyListDI  : legacyListDI
      , listctrl      : listctrl
    })

  }])


}).call(this);