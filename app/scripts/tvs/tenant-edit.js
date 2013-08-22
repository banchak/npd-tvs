(function () {

'use strict'

angular.module('tvs.tenant-edit',['controllers.legacy-edit','tvs.database'])
  .controller('tenantEditCtrl', ['$scope', 'legacyEditDI', '$controller','Database'
  , function ($scope, legacyEditDI, $controller, Database)
    {
      var db    = new Database.legacy('Tenant')
        , utils = legacyEditDI.utils

      var success = function ( ){
          var services = {

            }

          angular.extend($scope, services)

          var entry = $scope.resource$entry
          // entry for view
          angular.forEach(['econtacts', 'phones', 'locations'], function (n) {
              $scope[n] = function () { return entry.meta(n) }
            })


        }
      
      // init by base controller
      $controller (
        'legacyEditCtrl'
      , {
          $scope        : $scope
        , legacyEditDI  : legacyEditDI
        , editctrl      : { db : db, success : success }
        })

    }
  ])


}).call(this);