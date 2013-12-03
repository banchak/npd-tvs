(function() {

  'use strict'

  angular.module('controllers.legacy-image-list', ['controllers.legacy-list', 'modules.gdrive'])

    .controller('imageViewerCtrl',[
      '$scope','$modalInstance','GDrive','$rootScope','data', 
      function($scope,$modalInstance,GDrive,$rootScope,data) {

      $scope.imageViewer = {
        images: data.meta.images,
        folders: data.meta.folders,
        title: data._name,
        description: data.info && data.info.detail
      }

      $scope.imageViewer.waiting = 0
      angular.forEach(data.meta.folders, function(folder) {

        if (!folder.id || folder.links !== undefined)
          return

        folder.links = []

        $scope.imageViewer.waiting += 1

        GDrive.folders({ parents: folder.id }).then(function(resp) {

          $scope.imageViewer.waiting -= 1
          if (!resp || !resp.items)
            return


          $rootScope.authorize().then(function() {

            if ($rootScope.authorizeData && $rootScope.authorizeData.user) {
              var user = $rootScope.authorizeData.user

              angular.forEach(resp.items, function(meta) {

                if (meta && meta.alternateLink && user.hasRole(meta.title)) {

                  folder.links.push({
                    link: meta.alternateLink,
                    title: meta.title
                  })
                }
              })
            }
          })
        })
      })          
      
    }])

    .controller('legacyImageListCtrl', [
      '$scope', 'legacyListDI', 'listctrl', '$controller','$modal', 'GDrive',
      function($scope, legacyListDI, listctrl, $controller,$modal, GDrive) {


        var success = function() {

          var utils = legacyListDI.utils

           $scope.viewImage = function(data) {

            $modal.open({
              templateUrl: 'image-viewer-modal.html',
              controller: 'imageViewerCtrl',
              resolve: {
                data: function () {
                  return data;
                }
              }
            })
          }

          $scope.images = function(data) {
            var images, img

            if (!data.meta || !data.meta.images)
              return

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
