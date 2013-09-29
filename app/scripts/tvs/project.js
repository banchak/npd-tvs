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

  .service('APP_CONFIG', ['$rootScope', 'utils', function ($rootScope, utils) {
    
      this.appMenu  = {
        title         : 'Thanya'
      , version       : '0.7.0.0 2013-9-29 jsat66@gmail.com'
      , menus: [
          'Contract','Tenant','Area','Equipment'
        ]
      }

      function _action (ctrlname) {

        return function (cmd, lbl, opr, params) {
          var u

          u = '#/'+ctrlname
          if (cmd) {
            u += '/'+cmd
          }

          if (opr) {
            params = angular.extend({},params,{opr : opr})
          }

          if (params) {
            u += '?' + utils.serialize(params,!!opr)
          }

          return { url : u, label : lbl, title : opr }
        }
      }

      this.view = {
        provider : function (provider, ctrl) {
          provider.controller = 'legacyGDriveListCtrl'
        }
      , listctrl : function (listctrl, ctrl) {
          var _act = _action(ctrl.name)

          listctrl.gdriveCtrlBase = 'legacyGCalendarListCtrl'
          listctrl.adminView = true


          if (ctrl.name=='contracts') {
            var actions = [
                  _act('edit/$id', 'แก้ไข')
                , _act('edit/$id', 'เพิ่ม(ตามนี้)','ditto')
                , _act('print/$id', 'พิมพ์')
              ]
            listctrl.adminView = {
              actions : function(data) {
                return actions
              }
            }
          }

          if (ctrl.name=='tenants' || ctrl.name=='areas') {
            listctrl.adminView = {
              actions : function (data) {
                var temp = utils.temp('actions')
                  , actions = temp.get(data)

                if (actions) {
                  return actions
                }
                actions = []
                actions.push(_act('edit/$id', 'แก้ไข'))
                actions.push(_act('edit/$id', 'เพิ่ม(ตามนี้)','ditto'))
                actions.push({})
                actions.push(_action('contracts')(null, 'สัญญา ที่เกี่ยวข้อง',null, {scopes : JSON.stringify(['\''+data._name])}))
                temp.set(data,actions)
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
