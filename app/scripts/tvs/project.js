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
      , version       : '0.6.1.0 2013-9-8 jsat66@gmail.com'
      , menus: [
          'Contract','Tenant','Area','Equipment'
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
            var actions = [
                  { name : 'edit', label : 'แก้ไข'}
                , { name : 'print', label : 'พิมพ์'}
              ]
            listctrl.adminView = {
              actions : function(data) {
                return actions
              }
            }
          }
        }
      }

      this.secure = {
          path : function (path, roles) {
            if (!roles.has('OFFICER', 'MANAGER', 'ADMIN', 'STAFF.IT', 'DEVELOPER')) {

              console.log('secure',path,roles)
              if (path.match(/^\/manage$/)) {
                return
              }

              return false
            }
          }
        }


  }])

  

}).call(this);
