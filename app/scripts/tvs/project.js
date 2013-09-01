(function() {

'use strict'

angular.module('tvs.project', [
    'tvs.database'
  , 'tvs.contract-edit'
  , 'tvs.area-edit'
  , 'tvs.tenant-edit'
  , 'controllers.app-auth'
  , 'controllers.legacy-image-list'
  , 'controllers.legacy-gdrive-list'
  , 'controllers.legacy-gcalendar-list'
  , 'directives.markdown'

  ])

  .service('APP_CONFIG', ['$rootScope'
  , function ($rootScope) {
      this.appMenu  = {
        title         : 'Thanya'
      , version       : '0.5.4.0 2013-9-2 jsat66@gmail.com'
      , menus: [
          'Contract','Tenant','Area','Equipment','DataLink'
        ]
      }

      this.view = {
        provider : function (provider, ctrl) {
          provider.controller = 'legacyGDriveListCtrl'
        }
      , listctrl : function (listctrl, ctrl) {
          listctrl.gdriveCtrlBase = 'legacyGCalendarListCtrl'
          listctrl.adminView = true
          if (ctrl.name=='contracts') {
            listctrl.adminView = {
              actions : [
              { name : 'edit', label : 'แก้ไข'}
            , { name : 'print', label : 'พิมพ์'}
            ]}
          }
        }
      }

      this.secure = {
          path : function (path, roles) {
            if (!roles.has('OFFICER', 'MANAGER', 'ADMIN', 'STAFF.IT', 'DEVELOPER')) {

              if (path.match(/^\/manage$/)) {
                return
              }

              return false
            }
          }
        }


  }])

  
var app = angular.module('angularApp');

app.run(['$route', function($route) {
    app._routeProvider

      .when('/', {
        templateUrl: 'views/tvs/main.html',
        controller: 'mainCtrl'
      })

      .when('/contracts/print/:id', 
      {
        templateUrl : 'views/tvs/contract-print.html'
      , controller  : 'contractEditCtrl'
      })

      .when('/contracts/edit/:id', 
      {
        templateUrl : 'views/tvs/contract-edit.html'
      , controller  : 'contractEditCtrl'
      })

      .when('/areas/edit/:id', 
      {
        templateUrl : 'views/tvs/area-edit.html'
      , controller  : 'areaEditCtrl'
      /*, resolve     : 
        {
          editctrl 
          : function(Database)
            {
              return { db  : new Database.legacy('Area') }
            }
        }*/
      })

      .when('/tenants/edit/:id', 
      {
        templateUrl : 'views/tvs/tenant-edit.html'
      , controller  : 'tenantEditCtrl'
      /*, resolve     : 
        {
          editctrl 
          : function(Database)
            {
              return { db  : new Database.legacy('Tenant') }
            }
        }*/
      })

    $route.reload()
}])


}).call(this);
