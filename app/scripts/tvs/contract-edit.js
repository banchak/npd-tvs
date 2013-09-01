(function () {

'use strict'

angular.module('tvs.contract-edit',['controllers.legacy-edit','tvs.database'])
  .controller('contractEditCtrl', ['$scope', 'legacyEditDI', '$controller','Database'
  , function ($scope, legacyEditDI, $controller, Database)
    {
      var db    = new Database.legacy('Contract')
        , utils = legacyEditDI.utils

      $scope.BUILT_IN  = Database.BUILT_IN
      $scope.LINK_TYPES     = [
          { name : '', label : ''}
        , { name : 'contracts', label : 'สัญญา'}
        , { name : 'area', label : 'พื้นที่เช่า'}
        , { name : 'client', label : 'ผู้เช่า'}
        , { name : 'installment', label : 'อุปกรณ์'}
        ]
      $scope.utils = utils
      $scope.switching      = {
          tenant        : true
        , tenant_synced : -1
        , meta_tenant   : true

        , area          : true
        , area_synced   : -1
        , meta_area     : true

        , area_xsize    : true
        }

      var
        _isLegalPerson
        = function (ttype, name)
          {

            return (ttype && ttype != Database.BUILT_IN.personTypes[0].name) || ((name || '').search(/บริษัท|ห้างหุ้นส่วน/)>=0)
          }

      var
        _renderTenants
        = function (ttype, tenants, signers) 
          {
            var  
              phases = []
            , newline = '\n\n'

            angular.forEach(
              tenants
            , function (tn)
              {
                var
                  tns         = [ ]
                , name        = utils.trim(tn.name)
                , register_id = utils.trim(tn.register_id)
                , address     = utils.trim(tn.address)
                
                tns.push(name)
                
                if (_isLegalPerson(ttype, name))
                {
                  if (signers.length) 
                  {
                    tns.push('โดย ' + signers.join(' และ ') + ' กรรมการผู้มีอำนาจกระทำแทน') ;
                    signers = []
                  }
                  
                  if (register_id.length)
                    tns.push('ทะเบียนนิติบุคคลเลขที่ ' + register_id)
                    
                  if (address.length)
                    tns.push('สำนักงานใหญ่ตั้งอยู่ที่ ' + address)
                    
                }
                else 
                {
                  
                  if (register_id.length)
                    tns.push('บัตรประชาชนเลขที่ ' + register_id)
                    
                  if (address.length)
                    tns.push('อยู่ที่ ' + address)
                }
                
                phases.push (tns.join(' '))
              })
            
            phases = [phases.join(newline + 'และ ')]
            
            if (signers.length) 
            {
                phases.push('โดย ' + signers.join(' และ ') + ' ผู้มีอำนาจกระทำแทน')
                signers = []
            }

            return phases.join(newline);
          }

      var
        _renderZoneFloorBuilding
        = function (area) 
          {
            var phases = []

            if (utils.trim(area.zone))
              phases.push('โซน ' + utils.trim(area.zone))

            if (utils.trim(area.floor))
              phases.push('ชั้น ' + utils.trim(area.floor))

            if (utils.trim(area.building))
              phases.push('อาคาร ' + utils.trim(area.building))

            return phases.join(' ');
          }

      var
        _renderRooms
        = function (rooms)
          {
            var text = ''

            angular.forEach(
              rooms
            , function (rm, zfb)
              {
                if (text) {
                  text  += ' และ '
                }

                text += 'ห้องเลขที่ '

                for (var r=0; r < rm.length; r++) {

                  if (r && r == rm.length - 1) {
                    text += ' และ ' + rm[r]
                    continue
                  }
                  if (r) {
                    text += ', '
                  }
                  text += rm[r]
                }
                text += ' ' + zfb
              })

            return text;
          }


      var
        _rentRateMessage
        = function (y, rmsg, ymsg)
          {
              var phases = []

              rmsg = rmsg || 'อัตราค่าเช่าเดือนละ'
              ymsg = ymsg || 'ปีที่'

              if (y) 
              {
                phases.push(ymsg)
                phases.push(''+y)
              }
              phases.push(rmsg);
              
              return phases.join(' ');
          }

      var
        _serviceRateMessage
        = function (y, rmsg, ymsg)
          {
            rmsg = rmsg = rmsg || 'อัตราค่าบริการเดือนละ'

            return _rentRateMessage(y, rmsg, ymsg);
          }


      var success = function ( ){
          var 
            entry = $scope.resource$entry
          , services 
            = {
                getTerm : function () {
                  if ($scope.resource._type) {

                    var y = $scope.resource._type.match(/(\d+)\s*ปี/)
                    if (y){
                      if (3 <= y[1]) {
                        return 'short'
                      }
                      return 'long'
                    }
                  }
                }
              , loc2Address : function (loc) {
                  return [loc.address,loc.city,loc.province,loc.zipcode].join(' ')
                }

              , tenantSync : function (item, force) {
                  var promise

                  promise = $scope.xdataSync(item, 'name', 'Tenant', force)

                  promise.then(function (data) {
                    if (data) {
                      if (data.info.prefix) {
                        var pf = data.info.prefix

                        if (pf.indexOf(':')>=0) {
                          pf = pf.split(':')
                          item.name = pf[0] + item.name + pf[1]
                        }
                        else {
                          item.name = pf + item.name
                        }

                        item.$temp.synced = item.name
                      }
                      item.register_id = data.info.person_id
                      if (data.meta.locations && data.meta.locations.length) {

                        var loc = data.meta.locations[0]

                        item.address = $scope.loc2Address(data.meta.locations[0])
                      }
                    }
                  })
                }              
                // sync == undefined, determine whether require sync from switching.tenant_synced
                // sync == false, update synced state to switching.tenant_synced
                // sync == true, update model "display.tenant"
              , meta_tenant_render : function (sync) {

                  if (sync == undefined) 
                  {
                    // if not force resync, check swithcing status
                    if (!$scope.switching.tenant_synced) 
                      return;

                    // insynced, continue
                    sync = true
                  }
                
                  var 
                    text    = ''
                  , tenants = []
                  ;

                  // collect tenants
                  angular.forEach(
                    $scope.tenants()
                  , function (tn)
                    {
                      if (sync===false) {
                        $scope.isSynced(tn)
                      }

                      if (utils.trim(tn.name)) 
                        tenants.push(tn)
                    })
                
                  // render tenants & signers
                  if (tenants.length) 
                  {
                    var
                      signers = []
                    ;

                    // collect signers
                    angular.forEach(
                      $scope.tenant_signers()
                    , function (sgn)
                      {
                        var name = utils.trim(sgn.name)

                        if (name.length) 
                          signers.push(name)
                      })

                    text = _renderTenants(entry.meta().tenant_type, tenants, signers)
                    
                  }
                  
                  if (text) 
                  {
                    if (sync)
                      entry.display().tenant = text

                    $scope.switching.tenant_synced = (text==entry.display().tenant)
                  }
                  else 
                  {
                    $scope.switching.tenant_synced = -1
                  }
                }

              , sumAreaSize : function () {
                  var size = 0

                  angular.forEach($scope.areas(), function (ar) {

                    var sz = parseFloat('' + ar.size)
                    if (sz) {
                      size += sz
                    }
                  })

                  return size

                }
              , meta_area_render :function (sync) {
                  if (sync == undefined) 
                  {
                    // if not force resync, check swithcing status
                    if (!$scope.switching.tenant_synced) 
                      return;

                    // insynced, continue
                    sync = true
                  }
                
                  var 
                    text    = ''
                  , rooms   = {}

                  angular.forEach(
                    $scope.areas()
                  , function (ar)
                    {
                      var zfb ;

                      if (sync===false) {
                        $scope.isSynced(ar,'room')
                      }

                      if (utils.trim(ar.room)) 
                      {
                        zfb = _renderZoneFloorBuilding(ar)
                        if (rooms[zfb] == undefined)
                          rooms[zfb]  = [];

                        rooms[zfb].push(utils.trim(ar.room))
                      }
                    })

                  text = _renderRooms(rooms)

                  if (text) 
                  {
                    if (sync)
                      entry.display().area = text

                    $scope.switching.area_synced = (text==entry.display().area)
                  }
                  else 
                  {
                    $scope.switching.area_synced = -1
                  }
                }

              , meta_room_to_floor_building : function (area, force) {
                  var promise

                  promise = $scope.xdataSync(area, 'room', 'Area', force)

                  promise.then(function (data) {
                    if (data && data.info) {
                      area.building = data.info.building
                      area.floor    = data.info.floor
                      area.zone     = data.info.zone
                      area.size     = data.info.size
                    }
                    else {
                      area.building = area.room[0];

                      area.floor    = area.room[1];

                      area.zone     = ''

                    }
                    $scope.meta_area_render();
                  })

                }

              , contract_type_change : function ( ){
                  var  
                    duration  = $scope.resource._type

                  for (var ct in $scope.CONTRACT_TYPES)
                  {
                    ct = $scope.CONTRACT_TYPES[ct]
                    if (ct.name == $scope.resource._type)
                    {
                      duration = (ct.duration || duration)
                      break
                    }
                  }
                  
                  $scope.resource.info.duration = duration
                }

              , tenant_addable : function ( ){

                  return (!_isLegalPerson(entry.meta().tenant_type,'')) || ($scope.tenants().length <1)
                }

              , inc_rent_rates : function ( ){

                  var rent_rates  = $scope.rent_rates()
                  
                  if (rent_rates.length==1)
                      rent_rates[0].description = _rentRateMessage(1);

                  entry.add(rent_rates, { 
                      description  : _rentRateMessage(rent_rates.length && (rent_rates.length + 1))
                    , value        : 0 
                   })
                }

              , dec_rent_rates : function ( ){
                  var rent_rates = $scope.rent_rates()
                  
                  entry.remove(rent_rates)
                  
                  if (rent_rates.length==1) 
                    rent_rates[0].description = _rentRateMessage()
                }

              , inc_service_rates :function ( ){
                  var  service_rates = $scope.service_rates()
                  
                  if (service_rates.length==1)
                    service_rates[0].description = _serviceRateMessage(1);
                
                  entry.add(
                    service_rates
                  , { 
                      description  : _serviceRateMessage(service_rates.length && (service_rates.length + 1))
                    , value        : 0 
                    })
                }

              , dec_service_rates : function ( ) {
                  var  
                    service_rates = $scope.service_rates()
                  
                  entry.remove(service_rates)
                  
                  if (service_rates.length==1)
                    service_rates[0].description = _serviceRateMessage()
                }

              , sumSigner2 : function ( ) {
                  var 
                    signers = []

                  angular.forEach ($scope.tenant_signers(), function (sgn) {
                    if (sgn.name) {
                      signers.push (sgn.name)
                    }
                  })

                  if (!signers.length) {
                    angular.forEach ($scope.tenants(), function (sgn) {
                      if (sgn.name) {
                        signers.push (sgn.name)
                      }
                    })
                  }

                  if (signers.length) {
                    return signers.join(' และ ')
                  }
                }

              , rent_date_isSynced : function () {
                  if (!$scope.resource.info.duration || !$scope.resource.info.rent_date) {
                    return true
                  }

                  return $scope.rent_date_synced == $scope.resource.info.duration + $scope.resource.info.rent_date
              }

              , sync_rent_date : function (force ) {
                  var rent_date = Date.parse($scope.resource.info.rent_date)
                    ,duration, before_rent, end_rent

                  if (!force && $scope.rent_date_isSynced()) {
                    return
                  }

                  $scope.rent_date_synced = $scope.resource.info.duration + $scope.resource.info.rent_date

                  if (rent_date && $scope.resource.info.duration) {
                    duration = $scope.resource.info.duration.match(/(?:(\d+)\s*ปี)?\s*(?:(\d+)\s*เดือน)?\s*(?:(\d+)\s*วัน)?/)
                    if (duration) {
                      before_rent = moment(rent_date).subtract('days',1)
                      end_rent =  before_rent.clone().add({years : duration[1]||0, months : duration[2]||0, days : duration[3]||0})

                      $scope.resource.info.rent_until = end_rent.format('YYYY-MM-DD')
                      $scope.resource.info.decorate_until = before_rent.format('YYYY-MM-DD')
                      $scope.resource.info.pay_date = $scope.resource.info.rent_date
                      $scope.resource.info.pay_until = $scope.resource.info.rent_until
                      $scope.resource.info.operate_date = $scope.resource.info.rent_date
                    }
                  }

                }
              , makeHtml : function (tof) {
                  tof = tof || 'views/tvs/contract-print-tof.html'
                  return function (scope, element, attrs) {

                    var hr = element.find('hr').addClass("no-print")

                    if ($scope.record().title_section)
                    {
                      hr.after(angular.element('<div ng-include="\'' + tof + '\'"></div>'))
                    }
                  }
                }

              }

          // entry for view
          angular.forEach(
            ['tenants', 'tenant_signers', 'areas', 'rent_rates', 'service_rates', 'witnesses']
          , function (n) {

              $scope[n] = function () { return entry.meta(n) }
            })

          angular.forEach(['record'], function (n) {
              $scope[n] = function () { return entry.info(n,{}) }
              $scope[n]()
            })


          angular.extend($scope, services)

          // default add at least 1 entry
          if ($scope.tenants().length==0) {
            $scope.resource$entry.add($scope.tenants())
          }

          if ($scope.areas().length==0) {
            $scope.resource$entry.add($scope.areas())
          }

          if ($scope.rent_rates().length==0) {
            $scope.inc_rent_rates()
          }

          if ($scope.service_rates().length==0) {
            $scope.inc_service_rates()
          }

          while($scope.witnesses().length < 2) {

              $scope.resource$entry.add($scope.witnesses())
          }

          $scope.meta_tenant_render(false)
          $scope.meta_area_render(false)

          $scope.$watch('tenants()',$scope.meta_tenant_render,true)
          $scope.$watch('tenant_signers()',$scope.meta_tenant_render,true)
          $scope.$watch('areas()',$scope.meta_area_render,true)
          $scope.$watch('resource.display.tenant',function(){$scope.meta_tenant_render(false)})
          $scope.$watch('resource.display.area',function(){$scope.meta_area_render(false)})

        }
      
      // init by base controller
      $controller (
        'legacyEditCtrl'
      , {
          $scope        : $scope
        , legacyEditDI  : legacyEditDI
        , editctrl      : { db : db, success : success }
        })

    }
  ])


}).call(this);