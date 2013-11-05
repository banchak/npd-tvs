(function () {

'use strict';

angular.module('npd.database', ['modules.legacy-database', 'modules.utils'])

  .constant('MONGOLAB_CONFIG'
  , {
      API_KEY:'hlCl82ffQGLADdTWTybrGxg2wRzPPvUu'
    , DB_NAME:'npd3'
    })

  .value('BUILT_IN'
  , {
      productTypes :
      [
        {name    : 'JEWELRY' }
      , {name    : 'WATCH'}
      , {name    : 'OTHER'}
      ]
    , personTypes :
      [
        {name    : 'บุคคล' }
      , {name    : 'นิติบุคคล' }
      ]
    , voucherTypes :
      [
        {name    : 'ยืม' }
      , {name    : 'ขาย' }
      , {name    : 'คืน' }
      ]
    , selfLists : 
      [
        {name : 'info.prefix', list : [ 'นาย','นาง','นางสาว','บริษัท : จำกัด','ห้างหุ้นส่วน : จำกัด'] }
      , {name : 'meta.phones.type', list : ['ที่บ้าน','ที่ทำงาน','มือถือ','แฟกซ์'] }
      , {name : 'meta.econtacts.type', list : ['email', 'twitter', 'facebook', 'line'] }
      , {name : 'meta.locations.type', list : ['ที่บ้าน','ที่ทำงาน'] }
      , {name : 'meta.locations.province', list : ['กรุงเทพฯ'] }
      ]
      
    })

  .service('COLLECTIONS', ['$rootScope', 'utils', function ($rootScope, utils) {
    return {

      Product : {
        name    : 'products'
      , title   : 'สินค้า'
      , schema  : 'legacy'
      , required : [
          { name : '_type',               label : 'ประเภท'}
        , { name : '_name',               label : 'รหัส'}
        , { name : 'info.detail',         label : 'รายละเอียด'}
       ]
      , categories : [
          { name : '_type',               label : 'ประเภท'}
        , { name : 'info.category',       label : 'หมวด'}
        , { name : 'info.cond',      label : 'สภาพ'}
        , { name : 'info.brand',      label : 'ยี่ห้อ'}
        , { name : 'info.keeping.person', label : 'ที่เก็บ'}
        , { name : 'info.taking.person',  label : 'ผู้ยืม'}
        , { name : 'info.selling.person', label : 'ขายให้'}
        , { name : 'info.selling.site', label : 'ขายโดย'}
        , { name : 'info.buying.person',  label : 'ซื้อจาก'}
        ] 
      , descriptions : [
          { name : 'info.detail' }
        , { name : 'info.category',       label : 'หมวด'}
        , { name : 'info.serial',         label : 'serial' }
        , { name : 'info.brand',          label : 'brand' }
        , { name : 'info.watch.model',    label : 'model' }
        , { name : 'info.target_price',   label : 'ราคา'   ,viewClass : 'text-large text-info'}
        , { name : 'no_data', searchIn : ['info.selling.voucher', 'info.taking.voucher', 'info.keeping.voucher'] }
        ]
      , orders : [
          { name : '_id',                 label : 'ลำดับข้อมูล'}
        , { name : '_name',               label : 'รหัส'}
        , { name : 'info.keeping.date',   label : 'วันที่เก็บ'}
        , { name : 'info.taking.date',    label : 'วันที่ยืม'}
        , { name : 'info.selling.date',   label : 'วันที่ขาย'}
        , { name : 'info.buying.date',    label : 'วันที่ซื้อ'}
        ]
      , queries : [
          { name : '@sellable', label : '@พร้อมขาย', 
            value : '@kept && @info.keeping.person=^[^\\]\\[!"#$%&\'()*+,./:;<=>?@\\^_`{|}~-]', 
            notValue : '@kept && @info.keeping.person=^[\\]\\[!"#$%&\'()*+,./:;<=>?@\\^_`{|}~-]'}
        , { name : '@taken', label : '@ค้างยืม',    
            value : '!@info.selling && @info.taking.person', 
            notValue : '@stk && !@info.taking.person'}
        , { name : '@sold', label : '@ขายแล้ว',    
            value : '@info.selling',
            notValue : '@info.keeping && !@info.selling '}
        , { name : '@stk',  label : '@สต็อกบัญชี',    
            value : '@info.keeping && !@info.selling', 
            notValue : '@info.keeping && @info.selling'}
        , { name : '@kept', label : '@สต๊อกร้าน',    
            value : '@stk && !@info.taking.person', 
            notValue : '!@info.selling && !@info.taking.person && !@info.keeping'}
        , { name : '@repair', label : '@ซ่อม',  
            value : '@kept && @info.keeping.person=ซ่อม',
            notValue : '@kept && !@info.keeping.person=ซ่อม'}
        , { name : '@get', label : '@รับคืน',  
            value : '@kept && @info.keeping.person=รับคืน',
            notValue : '@kept && !@info.keeping.person=รับคืน'}
        , { name : '@img',  label : '@มีรูปภาพ',    
            value : '@meta.images'}
        ]

      , searchable : function() {
          return $rootScope.authorize().then(function () {
            var user = utils.lookup($rootScope,'authorizeData.user')

            if (user && user.hasRole('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER'))
              return ['_name', 'info.detail', 'meta.refs.name', 'info.serial', 'info.watch.model', 
                      'info.taking.person', 'info.selling.person', 'info.keeping.person',
                      'info.taking.voucher', 'info.selling.voucher', 'info.keeping.voucher']

            return ['_name', 'info.detail']
          })
        }

      , boundList : function () {
          return $rootScope.authorize().then(function () {
            var user = utils.lookup($rootScope,'authorizeData.user')

            if (user && user.hasRole('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER')) 
              return [ 
                      { name : '@sellable', label : 'พร้อมขาย'}
                    , { name : '@taken',    label : 'ค้างยืม'}
                    , { name : '@sold',     label : 'ขายแล้ว'}
                    , { name : '@repair',   label : 'ซ่อม'}
                    , { name : '@get',   label : 'รับคืน'}
                    , { label : 'ทั้งหมด'}
                    ]
          })
        }

      , limitScope : function (keyword) {

          return $rootScope.authorize().then(function () {
            var user = utils.lookup($rootScope,'authorizeData.user')

            if (user && user.hasRole('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER'))
              return keyword
              
            
            return ['@sellable', keyword]
          })
        }

      , singleShowFields : function (data) {
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
              var user = utils.lookup($rootScope,'authorizeData.user')
              if (user) {

                var showFields = utils.temp('singleShowFields')

                if (user.hasRole('STAFF', 'MANAGER', 'ADMIN')) {

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

                if (user.hasRole('OFFICER', 'MANAGER', 'ADMIN')) {

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

                if (user.hasRole('ADMIN')) {

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

                if (user.hasRole('STAFF.IT', 'DEVELOPER')) {
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

    , Person : {
        name    : 'persons'
      , title   : 'ผู้เกี่ยวข้อง'
      , schema  : 'legacy'
      , categories : 
        [
          { name : '_type',               label : 'ประเภท'}
        , { name : 'info.prefix',         label : 'คำขึ้นต้น' }
        , { name: 'meta.econtacts.type', label: 'e-contact'}
        , { name: 'meta.locations.zipcode', label: 'รหัสไปรษณีย์'}
        , { name: 'meta.locations.province', label: 'จังหวัด'}
        , { name: 'meta.locations.city', label: 'เขต/อำเภอ'}
        ] 
      , descriptions : [
          { name : 'info.person_id', label: 'เลขสำคัญ' }
        , { name : 'info.detail', label: 'ชื่อเต็ม' }
        , { name : 'meta.locations',  label: 'ที่อยู่', formatter : utils.mapReduce('address + " " + city + " " + province + " " + zipcode', 'type', true)}
        , { name : 'meta.phones', label: 'โทรศัพท์', formatter : utils.mapReduce('id','type',true) }
        , { name : 'meta.econtacts', label: 'e-contact', formatter : utils.mapReduce('id','type',true)}
        ]
      , orders :
        [
          { name : '_id',                 label : 'ลำดับข้อมูล'}
        , { name : '_name',               label : 'ชื่อ'}
        ]
      , queries :
        [
          { name : '@broker', label : '@ตัวแทนขาย', value : '@info.is_broker', notValue : '!@info.is_broker'}
        , { name : '@customer', label : '@ลูกค้า', value : '!@info.is_supplier && !@info.is_broker', notValue : '@info.is_supplier || @info.is_broker'}
        , { name : '@supplier', label : '@แหล่งซื้อ', value : '@info.is_supplier', notValue : '!@info.is_supplier'}
        ]
      , boundList : function () {
          return $rootScope.authorize().then(function () {
            var user = utils.lookup($rootScope,'authorizeData.user')

            if (user && user.hasRole('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER'))
                return [ 
                       { name : '@broker', label : 'ตัวแทนขาย'}
                      ,{ name : '@customer', label : 'ลูกค้า'}
                      ,{ name : '@supplier', label : 'แหล่งซื้อ'}
                      ,{ label : 'ทั้งหมด'}
                      ]
          })
        }
      , searchable : function() {
          return $rootScope.authorize().then(function () {
            var user = utils.lookup($rootScope,'authorizeData.user')

            if (user && user.hasRole('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER'))
              return ['_name', 'info.person_id', 'info.detail', 'meta.phones.id', 'meta.econtacts.id']
            
          })
        }
      }
    , Voucher : {
        name    : 'vouchers'
      , title   : 'เอกสาร'
      , schema  : 'legacy'
      , required : [
          { name : '_type',               label : 'ประเภท'}
        , { name : '_name',               label : 'เลขที่'}
        , { name : 'info.issue_date',     label : 'วันที่'}
        , { name : 'info.person.name',    label : 'ผู้เกี่ยวข้อง'}
       ]
      , categories : 
        [
          { name : '_type',               label : 'ประเภท'}
        , { name : 'info.site',           label : 'สาขา'}
        ] 
      , descriptions : [
          { name : 'info.issue_date' , searchIn : false }
        , { name : 'info.person.name', label : 'ผู้เกี่ยวข้อง'}
        , { name : 'meta.items', label : 'จำนวนเงิน', searchIn : ['meta.items.name'],
            formatter : function(v) {return utils.formatValue(utils.sum(v, 'price')) },viewClass : 'text-large text-info'  }
        , { name : 'info.approved', label : 'อนุมัติโดย'}
        //, { name : 'meta.items.name' }
        ]
      , orders :
        [
          { name : '_id',                 label : 'ลำดับข้อมูล'}
        , { name : '_name',               label : 'เลขที่'}
        ]        
      , searchable : function() {
          return $rootScope.authorize().then(function () {
            var user = utils.lookup($rootScope,'authorizeData.user')

            if (user && user.hasRole('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER'))
              return ['_name', 'info.person.name', 'meta.items.name', 'meta.takenItems.name', 'info.approved']
          })
        }
      , queries :
        [
          { name : '@draft', label : '@รออนุมัติ', 
            value : '!@info.approved'}
        , { name : '@approved', label : '@อนุมัติแล้ว', 
            value : '@info.approved && !@_sys.post_state',
            notValue : '@info.approved && @_sys.post_state'}
        , { name : '@posted', label : '@ผ่านรายการแล้ว', 
            value : '@_sys.post_state=\'posted', 
            notValue : '@_sys.post_state && !@_sys.post_state=\'posted'}
        , { name : '@pending', label : '@ผ่านไม่สำเร็จ', 
            value : '@_sys.post_stated=\'pending', 
            notValue : '@_sys.post_state && !@_sys.post_state=\'pending'}
        , { name : '@cancelled', label : '@ยกเลิก', 
            value : '@_sys.post_state=\'cancelled', 
            notValue : '@_sys.post_state && !@_sys.post_state=\'cancelled'}
        , { name : '@error', 
            value : '@_sys.post_errors'}
        , { name : '@take', label : '@ยืม', 
            value : '@_type=\'ยืม'}
        , { name : '@sell', label : '@ขาย', 
            value : '@_type=\'ขาย'}
        , { name : '@get', label : '@คืน', 
            value : '@_type=\'คืน'}
        ]
      , boundList : function () {
          return $rootScope.authorize().then(function (){
            var user = utils.lookup($rootScope,'authorizeData.user')

            if (user && user.hasRole('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER')) {
                return [ 
                        { name : '@draft',  label : 'รออนุมัติ'}
                      , { name : '@approved',  label : 'อนุมัติแล้ว'}
                      , { name : '@posted',  label : 'ผ่านรายการแล้ว'}
                      //, { name : '@cancelled',  label : 'ยกเลิก'}
                      , { name : '@pending',  label : 'ผ่านไม่สำเร็จ'}
                      , { name : '@take',  label : 'ยืม'}
                      , { name : '@sell',  label : 'ขาย'}
                      , { name : '@get',  label : 'คืน'}
                      , { label : 'ทั้งหมด'}
                      ]
            }
            
          })
        }
      }
    }
  }])

}).call(this);

