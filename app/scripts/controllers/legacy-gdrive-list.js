(function () {

'use strict'

angular.module('controllers.legacy-gdrive-list',['controllers.legacy-list', 'modules.gdrive'])
  .controller('legacyGDriveListCtrl', ['$scope', 'legacyListDI', 'listctrl', '$controller', '$timeout', 'GDrive'
  , function ($scope, legacyListDI, listctrl, $controller, $timeout, GDrive)
    {
      var utils = legacyListDI.utils

      var success = function ( ){

          $scope.gdriveViewer = {
              opened  : false
            , close   : function () { 
                $scope.gdriveViewer.show = false 

                $timeout(function () {

                  $scope.gdriveViewer.opened = false 
                  }, 50)
              }
            , options : {
                //backdropFade  : true
                //dialogFade    : true
                backdrop      : false
              }
            , newDrawer : function (cab) {
                GDrive.drawers(cab.id, $scope.gdriveViewer.data._name, true).then (function(items){
                  if (items && items.length) {
                    cab.items = items
                  }
                })
              }
            }

          $scope.viewGDrive = function(data) {

            if (!data.$temp) {
                data.$temp = function () {}
            }

            if (!data.$temp.cabinets) {
              GDrive.drawerList(data._name, listctrl.db.name).then(function(cabs){
                data.$temp.cabinets = cabs || []
              })
            }

            if (!data.$temp.shareCabinets) {
              GDrive.drawerList(data._name, listctrl.db.name, '@shared').then(function(cabs){
                data.$temp.shareCabinets = cabs || []
              })
            }

            angular.extend ($scope.gdriveViewer, {
                        opened : true
                      //, show   : true
                      , data   : data
                      , title  : data._name
                      , description : data.info.detail
                      })

          }

          function gdrives (data) {

            if (!data.$temp) {
              data.$temp = function () {}
            }

            data.$temp.gdrive = true
          }

          // check gdrive
          GDrive.cabinetList(listctrl.db.name,'@shared').then(function (cabs){
            if (!cabs || !cabs.length){
              return GDrive.cabinetList(listctrl.db.name)
            }
            return cabs
          }).then (function (cabs) {
              if (cabs && cabs.length) {
                angular.forEach($scope.dataList, gdrives)
              }
            })

      }
    
    var org_success = listctrl.success

    listctrl.success = function (scope) {
      if (org_success) {
        org_success(scope)
      }
      
      success (scope)
    }

    // init by base controller
    $controller (listctrl.gdriveCtrlBase || 'legacyListCtrl', {

        $scope        : $scope
      , legacyListDI  : legacyListDI
      , listctrl      : listctrl
    })

  }])


}).call(this);