
(function(){

'use strict';


angular.module('angularApp')
  .controller('mainCtrl', function ($scope, $route) {

    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];


  })
  .controller('mainSearchCtrl', function ($scope, $controller, legacySearchDI, Database) {

    var utils = legacySearchDI.utils


    $scope.goPathScope = function (name, rs) {
      utils.$location.path ('/' + name)
      utils.$location.search( { scopes : angular.toJson([rs.keyword])})
    }

    $scope.goPathItem = function (name, item) {
      utils.$location.path ('/' + name )
      utils.$location.search( { q : angular.toJson({ _name : item._name })} )
    }

    $scope.goSearch = function (keyword) {
      utils.$location.search( { search : keyword })

    }

    $controller (
      'legacySearchCtrl'
    , {
        $scope          : $scope
      , legacySearchDI  : legacySearchDI
      , Database        : Database
      })

    if ($scope.search) {
      $scope.doSearch($scope.search)
    }

  })

}).call(this);