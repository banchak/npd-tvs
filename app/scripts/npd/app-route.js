(function() {

  'use strict'

  var app = angular.module('angularApp')

  app.run(['$route',
    function($route) {
      app._routeProvider

      .when('/', {
        templateUrl: 'views/npd/main.html',
        controller: 'mainCtrl'
      })

      .when('/products/edit/:id', {
        templateUrl: 'views/npd/product-edit.html',
        controller: 'productEditCtrl'
        /*  , resolve     : 
        {
          editctrl 
          : function(Database)
            {
              return { db  : new Database.legacy('Product') }
            }
        } */
      })

      .when('/persons/edit/:id', {
        templateUrl: 'views/npd/person-edit.html',
        controller: 'personEditCtrl'
        /*, controller  : 'legacyEditCtrl'
      , resolve     : 
        {
          editctrl 
          : function(Database)
            {
              return { db  : new Database.legacy('Person') }
            }
        }*/
      })


      .when('/vouchers/print/:id', {
        templateUrl: 'views/npd/voucher-print.html',
        controller: 'voucherEditCtrl'
        /*, controller  : 'legacyEditCtrl'
      , resolve     : 
        {
          editctrl 
          : function(Database)
            {
              return { db  : new Database.legacy('Voucher') }
            }
        }*/
      })

      .when('/vouchers/edit/:id', {
        templateUrl: 'views/npd/voucher-edit.html',
        controller: 'voucherEditCtrl'
        /*, controller  : 'legacyEditCtrl'
      , resolve     : 
        {
          editctrl 
          : function(Database)
            {
              return { db  : new Database.legacy('Voucher') }
            }
        }*/
      })



      .when('/manage', {
        templateUrl: 'views/npd/manage.html',
        //controller: ''
      })

      .when('/manage/image-sync', {
        templateUrl: 'views/npd/image-sync.html',
        //controller: ''
      })

      .when('/manage/folder-sync', {
        templateUrl: 'views/npd/folder-sync.html',
        //controller: ''
      })

      $route.reload()
    }
  ])
}).call(this);
