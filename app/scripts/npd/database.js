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
        {name    : 'นาฬิกา' }
      , {name    : 'จิวเวลรี่'}
      , {name    : 'อื่นๆ'}
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
      Product : 
      {
        name    : 'products'
      , title   : 'สินค้า'
      , schema  : 'legacy'
      , required : [
          { name : '_type',               label : 'ชนิด'}
        , { name : '_name',               label : 'รหัส'}
        , { name : 'info.detail',         label : 'รายละเอียด'}
       ]
      , categories : 
        [
          { name : '_type',               label : 'ชนิด'}
        , { name : 'info.condition',      label : 'สภาพ'}
        , { name : 'info.keeping.person', label : 'ที่เก็บ'}
        , { name : 'info.taking.person',  label : 'ผู้ยืม'}
        , { name : 'info.selling.person', label : 'ขายให้'}
        , { name : 'info.buying.person',  label : 'ซื้อจาก'}
        ] 
      , descriptions : [
          { name : 'info.detail' }
        , { name : 'info.serial',         label : 'serial' }
        , { name : 'info.target_price',   label : 'ราคา'   ,viewClass : 'text-large text-info'}
        ]
      , orders :
        [
          { name : '_id',                 label : 'ลำดับข้อมูล'}
        , { name : '_name',               label : 'รหัส'}
        , { name : 'info.keeping.date',   label : 'วันที่เก็บ'}
        , { name : 'info.taking.date',    label : 'วันที่ยืม'}
        , { name : 'info.selling.date',   label : 'วันที่ขาย'}
        , { name : 'info.buying.date',    label : 'วันที่ซื้อ'}
        ]
      , queries :
        [
          { name : '@sellable', label : '@พร้อมขาย', value : '!@info.selling && !@info.taking.person && !@info.keeping.person=ซ่อม', 
                              notValue : '@info.selling || @info.taking.person || @info.keeping.person=ซ่อม'}
        , { name : '@taken', label : '@ค้างยืม',    value : '!@info.selling && @info.taking.person', 
                              notValue : '@info.selling || !@info.taking.person'}
        , { name : '@stk',  label : '@บัญชีสต็อก',    value : '!@info.selling', 
                              notValue : '@info.selling'}
        , { name : '@sold', label : '@ขายแล้ว',    value : '@info.selling', 
                              notValue : '!@info.selling' }
        , { name : '@kept', label : '@ครอบครอง',    value : '!@info.selling && !@info.taking.person', 
                              notValue : '@info.selling || @info.taking.person'}
        , { name : '@repair', label : '@ซ่อม',  value : '!@info.selling && !@info.taking.person && @info.keeping.person=ซ่อม',
                              notValue : '@info.selling || @info.taking.person || !@info.keeping.person=ซ่อม'}
        , { name : '@img',  label : '@มีรูปภาพ',    value : '@meta.images', 
                              notValue : '!@meta.images' }
        ]
      , searchable : function() {
          return $rootScope.authorize().then(function () {

            if ($rootScope.authorizeData && $rootScope.authorizeData.user) {
              var roles = $rootScope.authorizeData.user.roles

              if (roles.has('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER')) {
                return ['_name', 'info.detail', 'info.serial', 'info.taking.person', 'info.selling.person', 'info.keeping.person']
              }
            }

            return ['_name', 'info.detail']
          })
        }
      , boundList : function () {
          return $rootScope.authorize().then(function () {

            if ($rootScope.authorizeData && $rootScope.authorizeData.user) {
              var roles = $rootScope.authorizeData.user.roles

              if (roles.has('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER')) {
                return [ 
                        { name : '@sellable', label : 'พร้อมขาย'}
                      , { name : '@taken',    label : 'ค้างยืม'}
                      , { name : '@sold',     label : 'ขายแล้ว'}
                      , { name : '@repair',   label : 'ซ่อม'}
                      , { label : 'ทั้งหมด'}
                      ]
              }
            }
          })
        }

      , limitScope : function (keyword) {

          return $rootScope.authorize().then(function () {
            if ($rootScope.authorizeData && $rootScope.authorizeData.user) {
              var roles = $rootScope.authorizeData.user.roles

              if (roles.has('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER')) {
                return keyword
              }
            }
            return ['@sellable', keyword]
          })
        }
      }

    , Person : 
      {
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
                return [ 
                       { name : '@broker', label : 'ตัวแทนขาย'}
                      ,{ name : '@customer', label : 'ลูกค้า'}
                      ,{ name : '@supplier', label : 'แหล่งซื้อ'}
                      ,{ label : 'ทั้งหมด'}
                      ]
        }
      , searchable : function() {
          return $rootScope.authorize().then(function () {
            if ($rootScope.authorizeData && $rootScope.authorizeData.user) {
              var roles = $rootScope.authorizeData.user.roles

              if (roles.has('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER')) {
                return ['_name', 'info.person_id', 'info.detail', 'meta.phones.id', 'meta.econtacts.id']
              }
            }
          })
        }
      }
    , Voucher : 
      {
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
        ] 
      , descriptions : [
          { name : 'info.issue_date' }
        , { name : 'info.person.name', label : 'ผู้เกี่ยวข้อง'}
        , { name : 'meta.items', label : 'จำนวนเงิน', 
            formatter : function(v) {return utils.formatValue(utils.sum(v, 'price')) },viewClass : 'text-large text-info'  }
        , { name : 'meta.takenItems', label : 'ตัดยืม', 
            formatter : function(v) {return utils.formatValue(utils.sum(v, 'selected && price')) },viewClass : 'text-large text-info' }
        , { name : 'meta.takenItems', label : 'ค้างยืม', 
            formatter : function(v) {return utils.formatValue(utils.sum(v, '!selected && price')) },viewClass : 'text-large text-info' }
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
            if ($rootScope.authorizeData && $rootScope.authorizeData.user) {
              var roles = $rootScope.authorizeData.user.roles

              if (roles.has('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER')) {
                return ['_name', 'info.person.name', 'meta.items.name', 'meta.takenItems.name', 'info.approved']
              }
            }
          })
        }
      , queries :
        [
          { name : '@draft', label : '@รออนุมัติ', value : '!@info.approved', notValue : '@info.approved'}
        , { name : '@approved', label : '@อนุมัติแล้ว', value : '@info.approved', notValue : '!@info.approved'}
        , { name : '@take', label : '@ยืม', value : '@_type=ยืม', notValue : '!@_type=ยืม'}
        , { name : '@sell', label : '@ขาย', value : '@_type=ขาย', notValue : '!@_type=ขาย'}
        , { name : '@return', label : '@คืน', value : '@_type=คืน', notValue : '!@_type=คืน'}
        ]
      , boundList : function () {
          return $rootScope.authorize().then(function (){

            if ($rootScope.authorizeData && $rootScope.authorizeData.user) {
              var roles = $rootScope.authorizeData.user.roles

              if (roles.has('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER')) {
                return [ 
                        { name : '@draft',  label : 'รออนุมัติ'}
                      , { name : '@approved',  label : 'อนุมัติแล้ว'}
                      , { name : '@take',  label : 'ยืม'}
                      , { name : '@sell',  label : 'ขาย'}
                      , { name : '@return',  label : 'คืน'}
                      , { label : 'ทั้งหมด'}
                      ]
              }
            }
          })
        }
      }
    }
  }])

}).call(this);

