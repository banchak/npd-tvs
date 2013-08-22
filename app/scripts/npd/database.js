'use strict';

angular.module('npd.database', ['modules.legacy-database'])

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

  .value('COLLECTIONS'
  , {
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
          { name : '_name',               label : 'รหัส'}
        , { name : 'info.keeping.date',   label : 'วันที่เก็บ'}
        , { name : 'info.taking.date',    label : 'วันที่ยืม'}
        , { name : 'info.selling.date',   label : 'วันที่ขาย'}
        , { name : 'info.buying.date',    label : 'วันที่ซื้อ'}
        ]
      , queries :
        [
          { name : '@stk',      value : '!@info.selling', 
                              notValue : '@info.selling'}
        , { name : '@sold',     value : '@info.selling', 
                              notValue : '!@info.selling' }
        , { name : '@taken',    value : '!@info.selling && @info.taking.person', 
                              notValue : '@info.selling || !@info.taking.person'}
        , { name : '@kept',     value : '!@info.selling && !@info.taking.person', 
                              notValue : '@info.selling || @info.taking.person'}
        , { name : '@sellable', value : '!@info.selling && !@info.taking.person && !@info.keeping.person=ซ่อม', 
                              notValue : '@info.selling || @info.taking.person || @info.keeping.person=ซ่อม'}
        , { name : '@repair',   value : '!@info.selling && !@info.taking.person && @info.keeping.person=ซ่อม',
                              notValue : '@info.selling || @info.taking.person || !@info.keeping.person=ซ่อม'}
        , { name : '@img',      value : '@meta.images', 
                              notValue : '!@meta.images' }
        ]
      , searchable : [ '_name', 'info.detail', 'info.serial']
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
        , { name : 'info.person.name' }
        , { name : 'meta.items.name' }
        ]
      , searchable : false
      }

    })



