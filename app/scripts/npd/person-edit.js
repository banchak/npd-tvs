(function() {

  'use strict'

  angular.module('npd.person-edit', ['controllers.legacy-edit', 'npd.database'])
    .controller('personEditCtrl', ['$scope', 'legacyEditDI', '$controller', 'Database', 'GDrive',
      function($scope, legacyEditDI, $controller, Database, GDrive) {
        var db = new Database.legacy('Person'),
          utils = legacyEditDI.utils


        var success = function() {
          var services = {


          }


          angular.extend($scope, services)

          var entry = $scope.resource$entry
          // entry for view
          angular.forEach(['econtacts', 'phones', 'locations', 'deposits'], function(n) {
            $scope[n] = function() {
              return entry.meta(n)
            }
          })

          angular.forEach(['broker'], function(n) {
            $scope[n] = function() {
              return entry.info(n, {})
            }
            $scope[n]()
          })

            function calc() {
              var self = this

              this.calc_deposit = function() {
                self.deposit = utils.sum($scope.deposits(), 'amount')
              }
              // init 
              this.calc_deposit()

              $scope.$watch('deposits()', this.calc_deposit, true)

            }
          $scope.calc = new calc()

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
