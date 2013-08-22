'use strict';

angular.module('controllers.app-auth',['modules.google-api'])
  .controller('appAuthCtrl', ['$scope', '$location', '$rootScope', 'googleApi', 'APP_CONFIG'
  , function ($scope, $location, $rootScope, googleApi, APP_CONFIG) {

    function goAway() {
      $location.search({})
      $location.path('/')
      googleApi.safe$apply()
    }

    function protectPath (path) {

      if ( path != '/') {
        // not allow path
        googleApi.authorize().then(function (auth) {

          if (!auth.user || auth.limitAccess) {
            goAway ()
            return
          }

          if (APP_CONFIG.secure && APP_CONFIG.secure.path){
            if (APP_CONFIG.secure.path(path, auth.user.roles)===false) {
              goAway ()
              return
            }
          }


        })
      }
    }

    protectPath ($location.path())

    $scope.$on('$locationChangeStart', function(scope, next, current){

      var np = next.match(/[#]([^?]*)/)

      if (np && np[1]) { 
        protectPath (np[1])
      }
    })

    $scope.$on('userSignIn', function(event, user) {
      
      user.limitAccess = ! (user.roles && user.roles.indexOf('STAFF')>=0)
    })

    $scope.reload = function () {
        window.location.reload() 
    }

    $scope.signIn = function ( callback ) {
      
      var promise

      $scope.signed = true
      promise = googleApi.authorize({immediate : false})

      promise.then (function (resp) { 

        if (resp.user) { 
          window.location.reload() 
        }
      })

      return promise
    }


    $scope.fullUrl = $location.absUrl()
    
  }])

