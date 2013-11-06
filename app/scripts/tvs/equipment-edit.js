(function() {

  'use strict'

  angular.module('tvs.equipment-edit', ['controllers.legacy-edit', 'tvs.database'])
    .controller('equipmentEditCtrl', ['$scope', 'legacyEditDI', '$controller', 'Database',
      function($scope, legacyEditDI, $controller, Database) {
        var db = new Database.legacy('Equipment'),
          utils = legacyEditDI.utils

        var success = function() {
          var services = {
            syncTempArea : function() {
              console.log('syncTempArea',$scope.resource.info.room)
              $scope.tempArea = {
                tenant_name : 'xxxx'
                ,shop_name : $scope.resource.info.room
              }
            }
            ,
            room_to_floor_building: function() {
              var r = utils.trim($scope.resource._name);

              if (r) {
                $scope.resource.info.building = r[0];

                $scope.resource.info.floor = r[1];

              }
            }

          }

          angular.extend($scope, services)
          console.log('eqctrl')
          var entry = $scope.resource$entry
          // entry for view
          angular.forEach([], function(n) {
            $scope[n] = function() {
              return entry.meta(n)
            }
          })


        }

        // init by base controller
        $controller(
          'legacyEditCtrl', {
            $scope: $scope,
            legacyEditDI: legacyEditDI,
            editctrl: {
              db: db,
              success: success
            }
          })

      }
    ])


}).call(this);
