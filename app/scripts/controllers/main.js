(function() {
  "use strict";
  angular.module("angularApp").controller("mainCtrl", function($scope, $route) {
    return $scope.awesomeThings = ["HTML5 Boilerplate", "AngularJS", "Karma"];
  });

}).call(this);
