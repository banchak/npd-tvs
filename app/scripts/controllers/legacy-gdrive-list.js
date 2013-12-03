(function() {

  'use strict'

  angular.module('controllers.legacy-gdrive-list', ['controllers.legacy-list', 'modules.gdrive'])

    .controller('gdriveViewerCtrl',[
    '$scope','$modalInstance', 'GDrive','data', 
    function($scope,$modalInstance,GDrive,data) {
      $scope.gdriveViewer = {
        data: data,
        title: data._name,
        description: data.info && data.info.detail,
        newDrawer: function(cab) {
          GDrive.drawers(cab.id, $scope.gdriveViewer.data._name, true).then(function(items) {
            if (items && items.length) {
              cab.items = items
            }
          })
        }
      }
    }])

    .controller('legacyGDriveListCtrl', ['$scope', 'legacyListDI', 'listctrl', '$controller', 'GDrive','$modal',
      function($scope, legacyListDI, listctrl, $controller, GDrive, $modal) {
        var utils = legacyListDI.utils

        var success = function() {

          $scope.viewGDrive = function(data) {

            var temp = utils.temp('cabinets')
              , shtemp = utils.temp('shareCabinets')

            if (!temp.get(data)) {
              GDrive.drawerList(data._name, listctrl.db.name).then(function(cabs) {
                temp.set(data, cabs || [])
              })
            }

            if (!shtemp.get(data)) {
              GDrive.drawerList(data._name, listctrl.db.name, '@shared').then(function(cabs) {
                shtemp.set(data, cabs || [])
              })
            }

            $modal.open({
              templateUrl: 'gdrive-viewer-modal.html',
              controller: 'gdriveViewerCtrl',
              resolve: {
                data: function () {
                  return data;
                }
              }
            })
          }

          // check gdrive
          GDrive.cabinetList(listctrl.db.name, '@shared').then(function(cabs) {
            if (!cabs || !cabs.length) {
              return GDrive.cabinetList(listctrl.db.name)
            }
            return cabs
          }).then(function(cabs) {
            var temp = utils.temp('gdrive')
            if (cabs && cabs.length) {
              angular.forEach($scope.dataList, function(data) {
                temp.set(data, true)
              })
            }
          })

        }

        var org_success = listctrl.success

        listctrl.success = function(scope) {
          if (org_success) {
            org_success(scope)
          }

          success(scope)
        }

        // init by base controller
        $controller(listctrl.gdriveCtrlBase || 'legacyListCtrl', {

          $scope: $scope,
          legacyListDI: legacyListDI,
          listctrl: listctrl
        })

      }
    ])


}).call(this);
