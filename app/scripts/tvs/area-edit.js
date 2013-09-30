(function() {

  'use strict'

  angular.module('tvs.area-edit', ['controllers.legacy-edit', 'tvs.database'])
    .controller('areaEditCtrl', ['$scope', 'legacyEditDI', '$controller', 'Database',
      function($scope, legacyEditDI, $controller, Database) {
        var db = new Database.legacy('Area'),
          utils = legacyEditDI.utils

        var success = function() {
          var services = {
            room_to_floor_building: function() {
              var r = utils.trim($scope.resource._name);

              if (r) {
                $scope.resource.info.building = r[0];

                $scope.resource.info.floor = r[1];

              }
            }

          }

          angular.extend($scope, services)

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
