(function() {

'use strict'

// require momentjs, numeraljs, bootstrap-datepicker
angular.module(
  'modules', 
  [
    'modules.utils'
  , 'controllers.app-menu'
  , 'controllers.legacy-list'
  , 'controllers.legacy-edit'
  , 'controllers.legacy-search'
  , 'directives.numeral'
  , 'directives.moment'
  , 'ngCookies'
  ])

var app = angular.module('angularApp');

app.controller('redirectCtrl',['$routeParams', '$location', function ($routeParams, $location) {

  var id    = $routeParams.id
    , url  = $location.url().split('/')

  url.splice(1,0,'view')
  $location.url(url.join('/'))
}])

// add more route from database config
app.run(['$route','Database', 'APP_CONFIG', function($route, Database, APP_CONFIG) {
      // http://blog.brunoscopelliti.com/how-to-defer-route-definition-in-an-angularjs-web-app
      // auto generate route for listctrl from COLLECTIONS

      angular.forEach(Database.COLLECTIONS, function (ctrl, name) {

          var pv
            , config = APP_CONFIG['view']
            , provider = {

                templateUrl : 'views/legacy-list.html'
              , controller  : 'legacyListCtrl'
              , resolve     : 
                {
                  listctrl    : function (Database) {
                      var l = config.listctrl
                        , lst = { db  : new Database.legacy(ctrl) }

                      if (l) {

                        if (l = l(lst, ctrl)) {
                          lst = l 
                        }
                      } 
                      return lst
                    }
                }
              }

          pv = config.provider
          if (pv) {
            
            if (pv = pv(provider,ctrl)) {
              provider = pv
            }
          }

          app._routeProvider
            .when('/' + ctrl.name + '/:id', {
                templateUrl: 'views/redirect.html'
              , controller: 'redirectCtrl'
            })
            .when('/' + ctrl.name + '/view/:bound', provider)
            .when('/' + ctrl.name, provider)
        })

      $route.reload()
    }
  ])

}).call(this);

