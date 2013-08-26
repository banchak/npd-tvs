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
      , categories : 
        [
          { name : '_type',               label : 'หมวด'}
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
      , searchable : [ '_name', 'info.detail', 'info.serial']
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
        , { name : 'meta.locations.province', label : 'จังหวัด'}
        ] 
      , descriptions : [
          { name : 'meta.locations.address',  label: 'ที่อยู่'}
        , { name : 'meta.locations.province', label: 'จังหวัด' }
        , { name : 'meta.phones.id',          label: 'โทรศัพท์' }
        , { name : 'meta.faxes.id',           label: 'แฟกซ์' }
        , { name : 'meta.econtancts',         label: 'e-contact'}
        ]
      , orders :
        [
          { name : '_id',                 label : 'ลำดับข้อมูล'}
        , { name : '_name',               label : 'ชื่อ'}
        ]        
      , searchable : false
      }
    , Voucher : 
      {
        name    : 'vouchers'
      , title   : 'เอกสาร'
      , schema  : 'legacy'
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
        //, { name : 'meta.items.name' }
        ]
      , orders :
        [
          { name : '_id',                 label : 'ลำดับข้อมูล'}
        , { name : '_name',               label : 'เลขที่'}
        ]        
      , searchable : false
      , queries :
        [
          { name : '@take', label : '@ยืม', value : '@_type=ยืม', notValue : '!@_type=ยืม'}
        , { name : '@sell', label : '@ขาย', value : '@_type=ขาย', notValue : '!@_type=ขาย'}
        , { name : '@return', label : '@คืน', value : '@_type=คืน', notValue : '!@_type=คืน'}
        ]
      , boundList : function () {
          return $rootScope.authorize().then(function (){

            if ($rootScope.authorizeData && $rootScope.authorizeData.user) {
              var roles = $rootScope.authorizeData.user.roles

              if (roles.has('STAFF.IT', 'OFFICER', 'MANAGER', 'ADMIN', 'DEVELOPER')) {
                return [ 
                        { name : '@take',  label : 'ยืม'}
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



