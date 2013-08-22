(function () {

'use strict'

angular.module('npd.product-edit',['controllers.legacy-edit','npd.database'])
  .controller('productEditCtrl', ['$scope', 'legacyEditDI', '$controller','Database', 'googleApi'
  , function ($scope, legacyEditDI, $controller, Database, googleApi)
    {
      var db    = new Database.legacy('Product')
        , utils = legacyEditDI.utils

      function getThumbnail (data) {

        if (data && data.meta && data.meta.images) {
          angular.forEach(data.meta.images, function (img) {

            if (img.id && $scope.thumbnailLink===undefined) {

              $scope.thumbnailLink = null

              googleApi.client.execute( {
                  path    : 'drive.files.get'
                , params  : {fileId : img.id}
                }, function (meta) {

                  if (meta.thumbnailLink && !meta.trashed) {

                      $scope.thumbnailLink = meta.thumbnailLink
                      //$scope.src = meta.webContentLink //'https://docs.google.com/uc?id=' + img.id
                  }
              })
            }

          })
        }
      }

      var success = function ( ) {

          var services = {

              sellFromTaking : function () {
                $scope.selling().person = $scope.taking().person
                if (!$scope.selling().price) {
                  $scope.selling().price = $scope.taking().price
                }
              }

            }

          angular.extend($scope, services)

          var entry = $scope.resource$entry
          // entry for view
          angular.forEach(['repairings', 'takings'], function (n) {
              $scope[n] = function () { return entry.meta(n) }
              $scope[n]()
            })

          angular.forEach(['buying', 'taking', 'keeping', 'selling'], function (n) {
              $scope[n] = function () { return entry.info(n,{}) }
              $scope[n]()
            })

          function calc() {
            var self = this

            function _percent (pc, base,round){
              round = round || 100
              return Math.round((pc/base) * round)
            }

            this.calc_repair_cost = function () {
              var cost = 0

              angular.forEach($scope.repairings(),function(repair){
                  cost += (repair.cost || 0)
              })
              self.repair_cost = cost
            }

            this.calc_total_cost = function () {
              self.total_cost = self.repair_cost + $scope.resource.info.cost
            }

            this.calc_provider_cost = function () {
              // onchange: buying.cost, cost

              $scope.buying().provider_cost = $scope.resource.info.cost - ($scope.buying().cost || 0) 

              self.provider_cost_percent = 0
              if ($scope.buying().cost ) {
                self.provider_cost_percent = _percent($scope.buying().provider_cost,$scope.buying().cost)
              }
            }

            this.calc_target_price_percent = function () {
              // onchange: price, cost
              //$scope.resource.info.cost = _percent ($scope.resource.info.cost, self.total_cost, true)

              self.price_percent = 0
              if (self.total_cost) {
                self.target_price_percent = _percent(($scope.resource.info.target_price - self.total_cost), self.total_cost)
              }
            }

            this.calc_lowest_price_percent = function () {
              // onchange: lowest_price, cost
              //$scope.resource.info.cost = _percent ($scope.resource.info.cost, self.total_cost, true)

              self.lowest_price_percent = 0
              if (self.total_cost) {
                self.lowest_price_percent = _percent(($scope.resource.info.lowest_price - self.total_cost),self.total_cost)
              }self.total_cost
            }

            // init 
            this.calc_repair_cost()
            this.calc_provider_cost()
            this.calc_total_cost()
            this.calc_target_price_percent()
            this.calc_lowest_price_percent()
            getThumbnail($scope.resource)

            $scope.$watch('repairings()',this.calc_repair_cost, true)

            $scope.$watch('resource.info.cost - buying().cost',this.calc_provider_cost)

            $scope.$watch('calc.repair_cost + buying().cost',this.calc_total_cost)

            $scope.$watch('resource.info.target_price - calc.total_cost',this.calc_target_price_percent)

            $scope.$watch('resource.info.lowest_price - calc.total_cost',this.calc_lowest_price_percent)
          }

          $scope.calc = new calc ()



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