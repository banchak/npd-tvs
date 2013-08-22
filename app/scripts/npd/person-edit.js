(function () {

'use strict'

angular.module('npd.person-edit',['controllers.legacy-edit','npd.database'])
  .controller('personEditCtrl', ['$scope', 'legacyEditDI', '$controller','Database', 'GDrive'
  , function ($scope, legacyEditDI, $controller, Database, GDrive)
    {
      var db    = new Database.legacy('Person')
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