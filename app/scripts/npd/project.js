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
        , version       : '0.6.0.1 2013-9-8 jsat66@gmail.com'
        , menus         : [
            'Product', 'Person', 'Voucher'
          ]
        }

      this.view = {

          provider : function (provider, ctrl) {
            provider.controller = 'legacyGDriveListCtrl'

          }

        , listctrl : function (listctrl, ctrl) {

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

                        if (scope.adminView && ctrl.name=='vouchers') {
                          scope.adminView = {
                            actions : [
                            { name : 'edit', label : 'แก้ไข'}
                          , { name : 'print', label : 'พิมพ์'}
                          ]}
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
                    }
                })


                angular.forEach(scope.dataList, function(data) {
                  var state = utils.temp('state')

                  if (data.info.selling) {
                    state.set(data,'sold')
                  }
                  else if (data.info.taking && data.info.taking.person) {
                    state.set(data, 'taken')
                  }
                  else if (data.info.keeping) {
                    state.set(data, 'kept')
                  }
                })
              }

              listctrl.singleShowFields = function (data) {

                var item
                  , showFields = utils.temp('singleShowFields')

                if (!showFields.get(data)) {

                  showFields.set(data, [])

                  item = { label : 'สถานะ' }
  
                  if (data.info.selling) {
                    item.value      = 'sold'
                    item.viewClass  = 'label label-important'
                  }
                  else if (data.info.taking && data.info.taking.person) {
                    item.value      = (data.info.taking.person)
                    item.viewClass  = 'label label-info'
                  }
                  else if (data.info.keeping) {
                    item.value      = data.info.keeping.person || ' stock '
                    item.viewClass  = 'label label-success'
                  }

                  if (item.value) {
                    showFields.get(data).push(item)
                  }

                  if (data.info.condition) {
                    showFields.get(data).push({ label : 'สภาพ', value : data.info.condition } )
                  }

                  if (data.info.weight) {
                    showFields.get(data).push({ label : 'น้ำหนัก', value : data.info.weight } )
                  }
 
                  if (data.info.gold_weight) {
                    showFields.get(data).push({ label : 'นน.ทอง', value : data.info.gold_weight } )
                  }


                  $rootScope.authorize().then(function () {

                    if (utils.lookup($rootScope,'authorizeData.user')) {

                      var roles = $rootScope.authorizeData.user.roles
                        , showFields = utils.temp('singleShowFields')

                      if (roles && roles.has('STAFF', 'MANAGER', 'ADMIN')) {

                        if (data.info.target_price || data.info.taking_price || data.info.lowest_price) {

                          item = { label : 'ราคาตั้งขาย' }

                          if (data.info.target_price) {
                            item.value = data.info.target_price
                          }

                          if (data.info.taking_price || data.info.lowest_price) {
                            item.subfields = []

                            if (data.info.taking_price) {
                              item.subfields.push({ label : 'ราคาตั้งยืม', value : data.info.taking_price } )
                            }

                            if (data.info.lowest_price) {

                              item.subfields.push({ label : 'ราคาประเมิน', value : data.info.lowest_price } )
                            }
                          }
                          showFields.get(data).push(item)
                        }
                      }

                      if (roles && roles.has('OFFICER', 'MANAGER', 'ADMIN')) {

                        if (data.info.selling) {

                          item = { label : 'ขายให้', defClass : 'sold'  }

                          if (data.info.selling.person) {
                            item.value = data.info.selling.person
                          }

                          if (data.info.selling.date || data.info.selling.price || data.info.selling.site) {
                            item.subfields = []

                            if (data.info.selling.site) {
                              item.subfields.push({ label : 'ขายโดย', value : data.info.selling.site})
                            }

                            if (data.info.selling.date) {
                              item.subfields.push({ label : 'วันที่ขาย', value : data.info.selling.date})
                            }

                            if (data.info.selling.price) {
                              item.subfields.push({ label : 'ราคาขาย', value : data.info.selling.price})
                            }
                          }

                          showFields.get(data).push(item)
                        }

                        if (data.info.taking && data.info.taking.person) {
                          item = { label : 'ยืมโดย', defClass : 'taken' }

                          if (data.info.taking.person) {
                            item.value = data.info.taking.person
                          }

                          if (data.info.taking.date || data.info.taking.price) {
                            item.subfields = []

                            if (data.info.taking.date) {
                              item.subfields.push({ label : 'วันที่ยืม', value : data.info.taking.date})
                            }

                            if (data.info.taking.price) {
                              item.subfields.push({ label : 'ราคายืม', value : data.info.taking.price})
                            }
                          }
                          showFields.get(data).push(item)
                        }
                      }

                      if (roles && roles.has('ADMIN')) {

                        if (data.info.memo || data.info.buying) {
                          item = { label : 'ประวัติ' }
                          item.subfields = []
                          if (data.info.cost) {
                            var netcost = data.info.cost
                            if (data.info.buying && data.info.buying.provider_cost) {
                              netcost += data.info.buying.provider_cost
                            }

                            item.subfields.push ({ label : 'ทุนร้านสุทธิ', value :  netcost})
                          }
                          if (data.info.buying) {
                            if (data.info.buying.cost) {
                              item.subfields.push ({ label : 'ทุนซื้อ', value :  data.info.buying.cost})
                            }
                            if (data.info.buying.provider_cost) {
                              item.subfields.push ({ label : 'คชจ.ปรับปรุง', value :  data.info.buying.provider_cost})
                            }
                            if (data.info.buying.date) {
                              item.subfields.push ({ label : 'วันที่ซื้อ', value : data.info.buying.date})
                            }
                            if (data.info.buying.cond) {
                              item.subfields.push ({ label : 'เงื่อนไขซื้อ', value : data.info.buying.cond})
                            }
                            if (data.info.buying.person) {
                              item.subfields.push ({ label : 'ซื้อจาก', value : data.info.buying.person})
                            }
                          }
                          if (data.info.memo) {
                            item.subfields.push ({ label : 'หมายเหตุ', value : data.info.memo})
                          }
                          showFields.get(data).push(item)
                        }
                      }

                      if (roles && roles.has('STAFF.IT', 'DEVELOPER')) {
                        item = { label : 'developer'}
                        item.subfields = [{ label : 'raw data', value : JSON.stringify(data,undefined,2) }]
                        showFields.get(data).push(item)
                      }
                    }
                  })
                }

                return showFields.get(data)
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
