'use strict';

angular.module('controllers.app-menu', [])
  .controller('appMenuCtrl', ['$scope', '$rootScope', '$location', 'APP_CONFIG', 'COLLECTIONS', '$q',
    function($scope, $rootScope, $location, APP_CONFIG, COLLECTIONS, $q) {

      var menu = APP_CONFIG.appMenu

      $scope.menu = APP_CONFIG.appMenu

        function urlBound(db, bound) {
          var url = $location.url(),
            newpath = '/' + db.name

          if (bound) {
            newpath += '/view/' + encodeURIComponent(bound)
          }
          return '#' + encodeURI(newpath)
          //url = url.replace(encodeURI($location.path()),encodeURI(newpath))
          //return '#'+ url
        }

        //$scope.appTitle = menu.title
        //$scope.appVersion = menu.version
      $scope.appMenus = []

      angular.forEach($scope.menu.menus, function(n) {
        var mnu, subs,
          db = COLLECTIONS[n]

        if (db) {
          mnu = {
            title: db.title,
            module: db.name
          }
          if (db.boundList) {
            subs = angular.isFunction(db.boundList) ? db.boundList() : db.boundList
            $q.when(subs).then(function(subs) {
              if (subs) {
                mnu.subMenus = []
                angular.forEach(subs, function(bound) {
                  mnu.subMenus.push({
                    label: bound.label || bound.name,
                    url: urlBound(db, bound.name)
                  })
                })
              }
            })
          }
          $scope.appMenus.push(mnu)
        }
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


    }
  ])
