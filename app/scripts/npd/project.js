(function() {

'use strict'

angular.module('npd.project', [
    'npd.database'
  , 'controllers.app-auth'
  , 'controllers.legacy-image-list'
  , 'controllers.legacy-gdrive-list'
  , 'npd.image-sync'
  , 'npd.product-edit'
  , 'npd.person-edit'
  , 'npd.voucher-edit'
  ])

  .service('APP_CONFIG', ['$rootScope'
  , function ($rootScope) {

      this.appMenu  = {
          title         : 'Npd3'
        , version       : '0.4.1.0 2013-08-21 jsat66@gmail.com'
        , menus         : [
            'Product', 'Person', 'Voucher'
          ]
        }

      this.view = {

          provider : function (provider, ctrl) {
            provider.controller = 'legacyGDriveListCtrl'
          }

        , listctrl : function (listctrl, ctrl) {
            if (ctrl.name == 'products') {
              listctrl.gdriveCtrlBase = 'legacyImageListCtrl' 
            }

            //listctrl.adminView = true
            if (ctrl.name == 'vouchers' || ctrl.name == 'persons') {
              listctrl.success = function (scope) {

                  $rootScope.authorize().then(function () {
                      if ($rootScope.authorizeData && $rootScope.authorizeData.user) {

                        var roles = $rootScope.authorizeData.user.roles
                        scope.adminView = roles.has('STAFF.IT', 'OFFICER', 'ADMIN', 'DEVELOPER')

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
                    if ($rootScope.authorizeData && $rootScope.authorizeData.user) {

                      var roles = $rootScope.authorizeData.user.roles
                      scope.adminView = roles.has('OFFICER', 'STAFF.IT', 'ADMIN', 'DEVELOPER')
                    }
                })


                angular.forEach(scope.dataList, function(data) {

                  if (!data.$temp) {
                    data.$temp = function () {}
                  }

                  if (data.info.selling) {
                    data.$temp.state = 'sold'
                  }
                  else if (data.info.taking && data.info.taking.person) {
                    data.$temp.state = 'taken'
                  }
                  else if (data.info.keeping) {
                    data.$temp.state = 'kept'
                  }
                })
              }

              listctrl.singleShowFields = function (data) {

                var item

                if (!data.$temp) {
                  data.$temp = function () {}
                }

                if (!data.$temp.singleShowFields) {

                  data.$temp.singleShowFields = []

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
                    data.$temp.singleShowFields.push(item)
                  }

                  if (data.info.condition) {
                    data.$temp.singleShowFields.push({ label : 'สภาพ', value : data.info.condition } )
                  }

                  if (data.info.weight) {
                    data.$temp.singleShowFields.push({ label : 'น้ำหนัก', value : data.info.weight } )
                  }
 
                  if (data.info.gold_weight) {
                    data.$temp.singleShowFields.push({ label : 'นน.ทอง', value : data.info.gold_weight } )
                  }


                  $rootScope.authorize().then(function () {
                    if ($rootScope.authorizeData && $rootScope.authorizeData.user) {

                      var roles = $rootScope.authorizeData.user.roles


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
                          data.$temp.singleShowFields.push(item)
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

                          data.$temp.singleShowFields.push(item)
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
                          data.$temp.singleShowFields.push(item)
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
                          data.$temp.singleShowFields.push(item)
                        }
                      }

                      if (roles && roles.has('STAFF.IT', 'DEVELOPER')) {
                        item = { label : 'developer'}
                        item.subfields = [{ label : 'raw data', value : data }]
                        data.$temp.singleShowFields.push(item)
                      }
                    }
                  })
                }

                return data.$temp.singleShowFields
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