
(function() {
'use strict';

angular.module('tvs.database', ['modules.legacy-database','modules.utils'])

  .constant(
    'MONGOLAB_CONFIG'
  , {
      //BASE_URL : 'http://thaismart.dyndns-ip.com/app/mongolabmountpoint/'    
      API_KEY:'hlCl82ffQGLADdTWTybrGxg2wRzPPvUu'
    , DB_NAME:'tvsdemo'
    })

  .value(
    'BUILT_IN'
  , {
      personTypes :
      [
        {name    : 'บุคคล'}
      , {name    : 'นิติบุคคล'}
      ]
    , contractTypes :
      [
        {name    : 'สัญญา' }
      , {name    : 'บันทึก'}
      ]
    , areaTypes :
      [
        {name    : 'ถาวร' }
      , {name    : 'ชั่วคราว'}
      ]

    , selfLists : 
      [
        {name : 'info.prefix', list : ['นาย','นาง','นางสาว','บริษัท : จำกัด','ห้างหุ้นส่วน : จำกัด'] }
      , {name : 'meta.phones.type', list : ['ที่บ้าน','ที่ทำงาน','มือถือ','แฟกซ์'] }
      , {name : 'meta.econtacts.type', list : ['email', 'twitter', 'facebook', 'line'] }
      , {name : 'meta.locations.type', list : ['ที่บ้าน','ที่ทำงาน'] }
      , {name : 'meta.locations.province', list : ['กรุงเทพฯ'] }
      , {name : 'info.duration',  list : ['1 ปี', '3 ปี', '15 ปี'] }
      ]

    })

  .service('COLLECTIONS',['utils', function (utils) {
    return {
      Contract : 
      {
        name    : 'contracts'
      , title   : 'สัญญา'
      , schema  : 'legacy'
      , required : [
          { name : '_type',               label : 'ชนิดสัญญา'}
        , { name : '_name',               label : 'เลขที่'}
       ]
      , categories : 
        [
          { name : '_type',               label : 'ชนิดสัญญา'}
        , { name : 'meta.areas.building', label : 'อาคาร'}
        , { name : 'meta.areas.floor',          label : 'ชั้น'}
        , { name : 'meta.areas.zone',           label : 'โซน'}
        , { name : 'info.business_type',           label : 'ประเภทกิจการ'}
        ] 
      , descriptions : [
          { name :'info.issue_date', label : 'วันที่ทำสัญญา'}
        , { name : 'display.area', label : 'พื้นที่เช่า'}
        , { name : 'display.tenant', label : 'คู่สัญญา' }
        , { name : 'info.approved', label : 'อนุมัติโดย'}
        ]
      , orders :
        [
          { name : '_id',                 label : 'ลำดับข้อมูล'}
        , { name : '_name',               label : 'เลขที่'}
        , { name : 'info.issue_date',     label : 'วันที่ทำสัญญา'}
        , { name : 'info.rent_date',      label : 'วันที่เริ่มสัญญา'}
        , { name : 'info.rent_until',     label : 'วันที่หมดอายุสัญญา'}
        ]
      , queries :
        [
          { name : '@draft', label : '@รออนุมัติ', value : '!@info.approved', notValue : '@info.approved'}
        , { name : '@approved', label : '@อนุมัติแล้ว', value : '@info.approved', notValue : '!@info.approved'}
        , { name : '@y1', label : '@1 ปี', value : '@_type=1 ปี'}
        , { name : '@y3', label : '@3 ปี', value : '@_type=3 ปี'}
        , { name : '@y15',label : '@15 ปี', value : '@_type=15 ปี'}
        , { name : '@yo', label : '@อื่นๆ', value : 'อื่นๆ'}
        ]
      , boundList : function () {
                return [ 
                        { name : '@draft',  label : 'รออนุมัติ'}
                      , { name : '@approved',  label : 'อนุมัติแล้ว'}
                      , { name : '@_type=1 ปี', label : '1 ปี'}
                      , { name : '@_type=3 ปี',    label : '3 ปี'}
                      , { name : '@_type=15 ปี',    label : '15 ปี'}
                      , { name : '@_type=อื่นๆ',    label : 'อื่นๆ'}
                      , { label : 'ทั้งหมด'}
                      ]
        }
      , searchable : ['_name', 'display.area', 'display.tenant', 'info.approved']
      }

    , Area : 
      {
        name    : 'areas'
      , title   : 'พื้นที่'
      , schema  : 'legacy'
      , categories : 
        [
          { name : '_type',               label : 'ประเภท'}
        , { name : 'info.building',       label : 'อาคาร'}
        , { name : 'info.floor',          label : 'ชั้น'}
        , { name : 'info.zone',           label : 'โซน'}
        , { name : 'info.job',            label : 'งาน'}
        ] 
      , descriptions : ['info.size', 'info.rate' ]
      , searchable : ['_name', 'info.building', 'info.floor', 'info.zone', 'info.job']
      }

    , Tenant : 
      {
        name      : 'tenants'
      , title     : 'ผู้เช่า'
      , schema    : 'legacy'
      , categories : 
        [
          { name: '_type', label: 'ประเภท'}
        , { name: 'meta.econtacts.type', label: 'e-contact'}
        , { name: 'meta.locations.zipcode', label: 'รหัสไปรษณีย์'}
        , { name: 'meta.locations.province', label: 'จังหวัด'}
        , { name: 'meta.locations.city', label: 'เขต/อำเภอ'}

        ]
      , descriptions : [
          { name :'info.person_id', label : 'เลขสำคัญ'}
        , { name : 'info.detail', label: 'ชื่อเต็ม' }
        , { name : 'meta.locations',  label: 'ที่อยู่', formatter : utils.mapReduce('address + " " + city + " " + province + " " + zipcode', 'type', true)}
        , { name : 'meta.phones', label: 'โทรศัพท์', formatter : utils.mapReduce('id','type',true) }
        , { name : 'meta.econtacts', label: 'e-contact', formatter : utils.mapReduce('id','type',true)}
        ]
      , boundList : function () {
                return [ 
                       { name : '@_type=บุคคล', label : 'บุคคล'}
                      ,{ name : '@_type=นิติบุคคล', label : 'นิติบุคคล'}
                      , { label : 'ทั้งหมด'}
                      ]
        }
      , searchable : [
          '_name'
        , 'info.person_id'
        , 'info.detail'
        , 'meta.phones.id'
        , 'meta.econtacts.id'
        ]
      }

    , Equipment : 
      {
        name      : 'equipments'
      , title     : 'อุปกรณ์'
      , schema    : 'legacy'
      , categories : 
        [
          { name : '_type',       label : 'ชนิดอุปกรณ์'}
        ]
      }
    }

  }])

}).call(this);