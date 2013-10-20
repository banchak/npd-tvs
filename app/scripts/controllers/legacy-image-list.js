(function() {

  'use strict'

  angular.module('controllers.legacy-image-list', ['controllers.legacy-list', 'modules.gdrive'])
    .controller('legacyImageListCtrl', ['$scope', 'legacyListDI', 'listctrl', '$controller', '$timeout', 'GDrive', '$rootScope',
      function($scope, legacyListDI, listctrl, $controller, $timeout, GDrive, $rootScope) {

        var success = function() {
          var utils = legacyListDI.utils

          $scope.imageViewer = {
            opened: false,
            close: function() {
              $scope.imageViewer.show = false

              $timeout(function() {

                $scope.imageViewer.opened = false
              }, 50)
            },
            options: {
              //backdropFade  : true
              //dialogFade    : true
              backdrop: false
            }
          }

          $scope.viewImage = function(data) {

            var img

              function _showFolder() {
                angular.forEach(data.meta.folders, function(folder) {

                  if (!folder.id || folder.links !== undefined) {
                    $scope.imageViewer.show = true
                    $scope.$apply()
                    return
                  }

                  folder.links = []
                  GDrive.folders({
                    parents: folder.id
                  })
                    .then(function(resp) {
                      var count = 0

                      if (resp && resp.items) {

                        $rootScope.authorize().then(function() {

                          if ($rootScope.authorizeData && $rootScope.authorizeData.user) {
                            var user = $rootScope.authorizeData.user

                            angular.forEach(resp.items, function(meta) {

                              if (meta && meta.alternateLink) {


                                if (user.hasRole(meta.title)) {
                                  folder.links.push({
                                    link: meta.alternateLink,
                                    title: meta.title
                                  })
                                }
                              }
                              count += 1

                              if (count == resp.items.length) {

                                $scope.imageViewer.show = true
                              }
                            })
                          } else {
                            $scope.imageViewer.show = true
                          }
                        })
                      } else {
                        $scope.imageViewer.show = true
                      }
                    })
                })
              }

            angular.extend($scope.imageViewer, {
              images: data.meta.images,
              folders: data.meta.folders,
              opened: true,
              show: !data.meta.folders,
              title: data._name,
              description: data.info && data.info.detail
            })

            $timeout(_showFolder, 2000)
          }

          $scope.images = function(data) {
            var images, img

            if (!data.meta || !data.meta.images) {

              return
            }

            images = data.meta.images

            angular.forEach(images, function(img) {
              var thumbnail = utils.temp('thumbnailLink')

              if (img.id && thumbnail.get(img) === undefined) {

                thumbnail.set(img, null)

                GDrive.fileMeta(img.id).then(function(meta) {

                  if (meta.thumbnailLink && !meta.trashed) {

                    thumbnail.set(img, meta.thumbnailLink)
                    utils.temp('src').set(img, meta.webContentLink) //'https://docs.google.com/uc?id=' + img.id
                  }
                })
              }

            })
          }

          // load thumbnailLink
          angular.forEach($scope.dataList, $scope.images)

        }

        var org_success = listctrl.success

        listctrl.success = function(scope) {
          if (org_success) {
            org_success(scope)
          }

          success(scope)
        }

        // init by base controller
        $controller(listctrl.imageCtrlBase || 'legacyListCtrl', {

          $scope: $scope,
          legacyListDI: legacyListDI,
          listctrl: listctrl
        })

      }
    ])


}).call(this);
