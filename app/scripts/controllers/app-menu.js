'use strict';

angular.module('controllers.app-menu',[])
  .controller('appMenuCtrl', ['$scope', '$rootScope', '$location', 'APP_CONFIG', 'COLLECTIONS'
  , function ($scope, $rootScope, $location, APP_CONFIG, COLLECTIONS) {

    var menu = APP_CONFIG.appMenu

    $scope.menu = APP_CONFIG.appMenu

    //$scope.appTitle = menu.title
    //$scope.appVersion = menu.version
    $scope.appMenus = []

    angular.forEach($scope.menu.menus, function (n){
        var db = COLLECTIONS[n]

        if (db) 
          $scope.appMenus.push( { title: db.title, module : db.name })
      })

    function changePageTitle() {
      var path = $location.path().split('/')

      if (!path[0]) {
        path.shift()
      }

      $rootScope.pageTitle = path.join('-')

    }

    changePageTitle()

    $scope.$on('$locationChangeSuccess', changePageTitle)

    
  }])

