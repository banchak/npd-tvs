(function() {

  'use strict'


  var app = angular.module('angularApp');

  app.run(['$route',
    function($route) {
      app._routeProvider

      .when('/', {
        templateUrl: 'views/tvs/main.html',
        controller: 'mainCtrl'
      })

      .when('/manage', {
        templateUrl: 'views/tvs/manage.html',
        //controller: ''
      })

      .when('/contracts/print/:id', {
        templateUrl: 'views/tvs/contract-print.html',
        controller: 'contractEditCtrl'
      })

      .when('/contracts/edit/:id', {
        templateUrl: 'views/tvs/contract-edit.html',
        controller: 'contractEditCtrl'
      })

      .when('/areas/edit/:id', {
        templateUrl: 'views/tvs/area-edit.html',
        controller: 'areaEditCtrl' // 'legacyEditCtrl'
        /*, resolve     : 
        {
          editctrl 
          : function(Database)
            {
              return { db  : new Database.legacy('Area') }
            }
        }*/
      })

      .when('/tenants/edit/:id', {
        templateUrl: 'views/tvs/tenant-edit.html',
        controller: 'tenantEditCtrl'
        /*, resolve     : 
        {
          editctrl 
          : function(Database)
            {
              return { db  : new Database.legacy('Tenant') }
            }
        }*/
      })

      .when('/equipments/edit/:id', {
        templateUrl: 'views/tvs/equipment-edit.html',
        controller: 'equipmentEditCtrl'
        /*, resolve     : 
        {
          editctrl 
          : function(Database)
            {
              return { db  : new Database.legacy('Equipment') }
            }
        }*/
      })
      
      $route.reload()
    }
  ])

}).call(this);
