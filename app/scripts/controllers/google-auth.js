'use strict';

angular.module('controllers.google-auth',[])
  .controller('googleAuthCtrl', ['$scope', '$window', '$location','$rootScope', 'googleApi'
  , function ($scope, $window, $location, $rootScope, googleApi) {

    function goRoot () {
      if ($location.path() != '/') {

        $location.search({})
        $location.path('/')
        $scope.$apply()
        window.setTimeout(goRoot, 150)
      }
    }

    googleApi.userReady(function (auth) {

      if (!auth.user || auth.limitAccess) {
        goRoot ()
      }
    }, 100)

    $scope.$on('$locationChangeStart', function(scope, next, current){

      var np = next.match(/[#]([^?]*)/)

      if (np)
        np = np[1]
      
      if (np != '/') {
        googleApi.userReady(function (auth) {

          if (!auth.user || auth.limitAccess) {
            
            scope.preventDefault();
            googleApi.safe$apply()
          }
        })
      }
    })

    $scope.signIn = function () {
      googleApi.signIn ()
    }

    $scope.fullUrl = $location.absUrl()

    
  }])

