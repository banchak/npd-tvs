(function() {

'use strict'

angular.module('npd.project', [
    'npd.database'
  , 'controllers.app-auth'
  , 'controllers.legacy-image-list'
  , 'controllers.legacy-gdrive-list'
  , 'controllers.legacy-gcalendar-list'
  , 'npd.image-sync'
  , 'npd.product-edit'
  , 'npd.person-edit'
  , 'npd.voucher-edit'
  , 'modules.utils'
  ])

  .service('APP_CONFIG', ['$rootScope', 'utils'
  , function ($rootScope, utils) {

      this.appMenu  = {
          title         : 'Npd3'
        , version       : '0.7.0.0 2013-9-29 jsat66@gmail.com'
        , menus         : [
            'Product', 'Person', 'Voucher'
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

            if (ctrl.name == 'products') {

              listctrl.gcalendarCtrlBase = 'legacyImageListCtrl'
            }


            //listctrl.adminView = true
            if (ctrl.name == 'vouchers' || ctrl.name == 'persons') {
              listctrl.success = function (scope) {

                  $rootScope.authorize().then(function () {
                      var roles = utils.lookup($rootScope,'authorizeData.user.roles')

                      if (roles) {
                        scope.adminView = roles.has('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER')

                        if (scope.adminView && ctrl.name=='persons') {
                          scope.adminView = {
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
                              actions.push(_action('products')(null, 'สินค้า ที่เกี่ยวข้อง',null, {scopes : JSON.stringify(['\''+data._name])}))
                              actions.push(_action('vouchers')(null, 'เอกสาร ที่เกี่ยวข้อง',null, {scopes : JSON.stringify(['\''+data._name])}))
                              temp.set(data,actions)
                              return actions
                            }
                          }                          
                        }

                        if (scope.adminView && ctrl.name=='vouchers') {
                          scope.adminView = {
                            actions : function (data) {
                              var temp = utils.temp('actions')
                                , postState = utils.lookup(data,'_sys.post_state')
                                , approved = utils.lookup(data,'info.approved')
                                , actions = temp.get(data)

                              if (actions) {
                                return actions
                              }

                              actions = []

                              if (postState) {
                                actions.push(_act('edit/$id', 'เพิ่ม(ตามนี้)','ditto'))
                                actions.push(_act('edit/$id','คืนรายการ','unpost'))
                                if (postState=='pending')
                                  actions.push(_act('edit/$id', 'ผ่านรายการ(ต่อ)', 'post'))
                              }
                              else {
                                actions.push(_act('edit/$id', 'แก้ไข'))
                                actions.push(_act('edit/$id', 'เพิ่ม(ตามนี้)','ditto'))
                                if (approved) {
                                  actions.push(_act('edit/$id', 'ผ่านรายการ', 'post'))
                                }
                                else {
                                  actions.push(_act('edit/$id', 'ยกเลิก', 'cancel'))
                                }
                              }                              
                              if (postState != 'cancelled') {
                                actions.push({})
                                actions.push(_act('print/$id', 'พิมพ์'))
                                if (postState == 'posted') {
                                  actions.push(_action('products')(
                                    null, 
                                    'สินค้า ที่เกี่ยวข้อง',
                                    null, 
                                    {scopes : JSON.stringify(['\''+data._name])}))
                                }

                              }
                              temp.set(data,actions)
                              return actions
                            }
                          }
                        }
                      }
                    
                  })
                }
            }            
            if (ctrl.name == 'products') {

              //$rootScope.authorize().then(function () {
              listctrl.success = function (scope) {

                $rootScope.authorize().then(function () {
                    var roles = utils.lookup($rootScope,'authorizeData.user.roles')

                    if (roles) {
                      scope.adminView = roles.has('OFFICER', 'STAFF.IT', 'MANAGER', 'ADMIN', 'DEVELOPER')

                      if (scope.adminView) {
                        scope.adminView = {
                          actions : function (data) {
                            var temp = utils.temp('actions')
                              , actions = temp.get(data)

                            if (actions) {
                              return actions
                            }
                            actions = []
                            actions.push(_act('edit/$id', 'แก้ไข'))
                            actions.push(_act('edit/$id', 'เพิ่ม(ตามนี้)','ditto'))
                            if (!utils.lookup(data,'info.selling') && utils.lookup(data,'info.taking')) {

                              if (roles.has('MANAGER', 'ADMIN'))
                                actions.push(_act('edit/$id', 'ปรับราคายืม','taking-edit'))
                              
                              actions.push(_act('edit/$id', 'รับคืนของยืม','getting'))
                            } 
                            if (utils.lookup(data,'info.selling')) {
                              actions.push(_act('edit/$id', 'รับซื้อคืน','buying-back'))
                            }
                            actions.push({})
                            actions.push(_action('vouchers')(
                              null, 
                              'เอกสาร ที่เกี่ยวข้อง',
                              null, 
                              {scopes : JSON.stringify(['\''+data._name])}))
                            temp.set(data,actions)
                            return actions
                          }
                        }                          
                      }
                    }
                })


                angular.forEach(scope.dataList, function(data) {
                  var state = utils.temp('state')

                  if (utils.lookup(data,'info.selling')) {
                    state.set(data,'sold')
                  }
                  else if (utils.lookup(data,'info.taking.person')) {
                    state.set(data, 'taken')
                  }

                })
                  
              }

            }
          }

        }

      this.secure = {
          path : function (path, roles) {
            if (!roles.has('OFFICER', 'MANAGER', 'ADMIN', 'STAFF.IT', 'DEVELOPER')) {

              if (path.match(/^\/products\/view\/\'[A-Z]+\d{1,2}\-\d{3,4}[A-Z]*$/)) {
                // allow only /products/view/'XXdd-dddd'
                return
              }

              if (path.match(/^\/manage$/)) {
                return
              }

              return false
            }

          }
        }
  }])

}).call(this);
