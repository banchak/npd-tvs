(function() {

  'use strict';

  /* App Module */
  var app = angular.module('angularApp', ['modules', 'project'])

  app.config(['$routeProvider',function($routeProvider) {
    app._routeProvider = $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'mainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }])

}).call(this);
