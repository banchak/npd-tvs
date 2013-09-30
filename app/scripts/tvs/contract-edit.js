(function() {

  'use strict'

  angular.module('tvs.contract-edit', ['controllers.legacy-edit', 'tvs.database'])
    .controller('contractEditCtrl', ['$scope', 'legacyEditDI', '$controller', 'Database',
      function($scope, legacyEditDI, $controller, Database) {
        var db = new Database.legacy('Contract'),
          utils = legacyEditDI.utils,
          $q = legacyEditDI.$q,
          renderAllow = false

          $scope.BUILT_IN = Database.BUILT_IN
          $scope.utils = utils

          function _isLegalPerson(ttype, name) {

            return (ttype && ttype != Database.BUILT_IN.personTypes[0].name) || ((name || '').search(
              /บริษัท|ห้างหุ้นส่วน/) >= 0)
          }

          function _displayTenantName(tn) {
            var name, pf, data

            if (!tn)
              return

            data = $scope.isSynced(tn, 'name') && utils.temp('data', tn)
            name = tn.name

            if (data) {

              name = utils.lookup(data, 'info.detail')

              if (!name) {

                name = data._name

                pf = utils.lookup(data, 'info.prefix')

                if (pf) {

                  pf = utils.trim(pf).split(/\:(.*)/, 2)

                  if (pf[0])
                    name = pf[0] + name


                  if (pf[1])
                    name = name + pf[1]

                }
              }
            }
            return name
          }

          function _renderTenants(ttype, tenants, signers) {
            var phases = [],
              newline = '\n\n'

            angular.forEach(tenants, function(tn) {
              var tns = [],
                register_id = utils.trim(tn.register_id),
                address = utils.trim(tn.address),
                name = _displayTenantName(tn)

                tns.push(name)

                if (_isLegalPerson(ttype, name)) {
                  if (signers.length) {
                    tns.push('โดย ' + signers.join(' และ ') + ' กรรมการผู้มีอำนาจกระทำแทน');
                    signers = []
                  }

                  if (register_id.length)
                    tns.push('ทะเบียนนิติบุคคลเลขที่ ' + register_id)

                  if (address.length)
                    tns.push('สำนักงานใหญ่ตั้งอยู่ที่ ' + address)

                } else {

                  if (register_id.length)
                    tns.push('บัตรประชาชนเลขที่ ' + register_id)

                  if (address.length)
                    tns.push('อยู่ที่ ' + address)
                }

              phases.push(tns.join(' '))
            })

            phases = [phases.join(newline + 'และ ')]

            if (signers.length) {
              phases.push('โดย ' + signers.join(' และ ') + ' ผู้มีอำนาจกระทำแทน')
              signers = []
            }

            return phases.join(newline);
          }



          function _renderZoneFloorBuilding(area) {
            var phases = []

            if (utils.trim(area.zone))
              phases.push('โซน ' + utils.trim(area.zone))

            if (utils.trim(area.floor))
              phases.push('ชั้น ' + utils.trim(area.floor))

            if (utils.trim(area.building))
              phases.push('อาคาร ' + utils.trim(area.building))

            return phases.join(' ');
          }


          function _renderRooms(rooms) {
            var text = ''

            angular.forEach(rooms, function(rm, zfb) {

              if (text) {
                text += ' และ '
              }

              text += 'ห้องเลขที่ '

              for (var r = 0; r < rm.length; r++) {

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

            return text
          }


          function _rentRateMessage(y, rmsg, ymsg) {
            var phases = []

            rmsg = rmsg || 'อัตราค่าเช่าเดือนละ'
            ymsg = ymsg || 'ปีที่'

            if (y) {
              phases.push(ymsg)
              phases.push('' + y)
            }
            phases.push(rmsg);

            return phases.join(' ');
          }



          function _serviceRateMessage(y, rmsg, ymsg) {

            rmsg = rmsg = rmsg || 'อัตราค่าบริการเดือนละ'

            return _rentRateMessage(y, rmsg, ymsg);
          }


        var success = function() {
          var entry = $scope.resource$entry,
            services = {

              getTerm: function() {
                if ($scope.resource._type) {

                  var y = $scope.resource._type.match(/(\d+)\s*ปี/)
                  if (y) {
                    if (3 <= y[1]) {
                      return 'short'
                    }
                    return 'long'
                  }
                }
              }

              ,
              loc2Address: function(loc) {

                return [loc.address, loc.city, loc.province, loc.zipcode].join(' ')
              }

              ,
              tenantLegalName: function() {

                if (utils.lookup($scope, 'resource.info.tenant_type') == 'นิติบุคคล') {
                  return _displayTenantName(utils.lookup($scope, 'tenants()[0]'))
                }
              }

              ,
              tenantSync: function(item, force) {
                var promise

                promise = $scope.xdataSync(item, 'name', 'Tenant', force)

                return promise.then(function(data) {

                  if (data) {

                    var locs = []

                    if (force != -1)
                      item.register_id = data.info.person_id

                    angular.forEach(utils.lookup(data, 'meta.locations'), function(l) {

                      locs.push($scope.loc2Address(l))
                    })

                    if (locs.length && force != -1) {

                      if (!item.address || locs.indexOf(item.address) == -1) {
                        item.address = locs[0]
                      }
                    }
                  }
                  if (force != -1)
                    $scope.meta_tenant_render()

                  return data
                })

              }

              ,
              meta_tenant_render: function() {
                var text, tenants

                if (!renderAllow)
                  return

                text = ''
                tenants = []

                // collect tenants
                angular.forEach($scope.tenants(), function(tn) {

                  if (utils.trim(_displayTenantName(tn)))
                    tenants.push(tn)
                })

                // render tenants & signers
                if (tenants.length) {
                  var signers = []

                  // collect signers
                  angular.forEach($scope.tenant_signers(), function(sgn) {
                    var name = utils.trim(_displayTenantName(sgn))

                    if (utils.trim(_displayTenantName(sgn)))
                      signers.push(name)
                  })

                  text = _renderTenants(entry.info().tenant_type, tenants, signers)

                }

                entry.display().tenant = text

              }

              ,
              sumAreaSize: function() {
                var size = 0

                angular.forEach($scope.areas(), function(ar) {
                  if (ar) {
                    var sz = parseFloat('' + ar.size)

                    if (sz) {
                      size += sz
                    }
                  }
                })

                return size
              }

              ,
              meta_area_render: function() {
                var text = '',
                  rooms = {}

                if (!renderAllow)
                  return

                angular.forEach($scope.areas(), function(ar) {
                  var zfb


                  if (ar && utils.trim(ar.room)) {

                    zfb = _renderZoneFloorBuilding(ar)
                    if (rooms[zfb] == undefined)
                      rooms[zfb] = [];

                    rooms[zfb].push(utils.trim(ar.room))
                  }
                })

                text = _renderRooms(rooms)

                entry.display().area = text

              }

              ,
              meta_room_to_floor_building: function(area, force) {
                var promise

                promise = $scope.xdataSync(area, 'room', 'Area', force)

                if (renderAllow) {
                  promise.then(function(data) {

                    if (data && data.info) {

                      area.building = data.info.building
                      area.floor = data.info.floor
                      area.zone = data.info.zone || ''
                      area.size = data.info.size || 0
                    } else {

                      area.building = area.room[0];
                      area.floor = area.room[1];

                    }
                    $scope.meta_area_render();
                  })
                }
                return promise
              }

              ,
              tenant_addable: function() {

                return (!_isLegalPerson(entry.info().tenant_type, '')) || ($scope.tenants().length <
                  1)
              }

              ,
              inc_rent_rates: function() {

                var rates = $scope.rent_rates()

                if (rates.length == 1)
                  rates[0].description = _rentRateMessage(1);

                entry.add(rates, {
                  description: _rentRateMessage(rates.length && (rates.length + 1)),
                  value: 0
                })
              }

              ,
              dec_rent_rates: function() {
                var rates = $scope.rent_rates()

                entry.remove(rates)

                if (rates.length == 1)
                  rates[0].description = _rentRateMessage()
              }

              ,
              inc_service_rates: function() {
                var rates = $scope.service_rates()

                if (rates.length == 1)
                  rates[0].description = _serviceRateMessage(1);

                entry.add(rates, {
                  description: _serviceRateMessage(rates.length && (rates.length + 1)),
                  value: 0
                })
              }

              ,
              dec_service_rates: function() {
                var rates = $scope.service_rates()

                entry.remove(rates)

                if (rates.length == 1)
                  rates[0].description = _serviceRateMessage()
              }

              ,
              inc_utility_rates: function() {
                var rates = $scope.utility_rates()

                if (rates.length == 1)
                  rates[0].description = _serviceRateMessage(1);

                entry.add(rates, {
                  description: _serviceRateMessage(rates.length && (rates.length + 1)),
                  value: 0
                })
              }

              ,
              dec_utility_rates: function() {
                var rates = $scope.utility_rates()

                entry.remove(rates)

                if (rates.length == 1)
                  rates[0].description = _serviceRateMessage()
              }

              ,
              sumSigner2: function() {
                var signers = []

                angular.forEach($scope.tenant_signers(), function(sgn) {
                  var name

                  name = _displayTenantName(sgn)

                  if (name)
                    signers.push(name)

                })

                if (!signers.length) {

                  angular.forEach($scope.tenants(), function(sgn) {
                    var name

                    name = _displayTenantName(sgn)

                    if (name)
                      signers.push(name)

                  })
                }

                if (signers.length) {
                  return signers.join(' และ ')
                }
              }

              ,
              rent_date_isSynced: function() {

                if (!$scope.resource.info.duration || !$scope.resource.info.rent_date)
                  return true

                return $scope.rent_date_synced == $scope.resource.info.duration + $scope.resource
                  .info.rent_date
              }

              ,
              sync_rent_date: function(force) {
                var rent_date = Date.parse($scope.resource.info.rent_date),
                  duration, before_rent, end_rent

                if (!force && $scope.rent_date_isSynced())
                  return


                $scope.rent_date_synced = $scope.resource.info.duration + $scope.resource.info.rent_date

                if (rent_date && $scope.resource.info.duration) {

                  duration = $scope.resource.info.duration.match(
                    /(?:(\d+)\s*ปี)?\s*(?:(\d+)\s*เดือน)?\s*(?:(\d+)\s*วัน)?/)

                  if (duration) {

                    before_rent = moment(rent_date).subtract('days', 1)

                    end_rent = before_rent.clone().add({
                      years: duration[1] | 0,
                      months: duration[2] | 0,
                      days: duration[3] | 0
                    })

                    $scope.resource.info.rent_until = end_rent.format('YYYY-MM-DD')
                    $scope.resource.info.decorate_until = before_rent.format('YYYY-MM-DD')
                    $scope.resource.info.pay_date = $scope.resource.info.rent_date
                    $scope.resource.info.pay_until = $scope.resource.info.rent_until
                    $scope.resource.info.operate_date = $scope.resource.info.rent_date
                  }
                }

              }

              ,
              makeHtml: function(tof) {

                tof = tof || 'views/tvs/contract-print/tof.html'

                return function(scope, element, attrs) {
                  var hr = element.find('hr').addClass("no-print")

                  if ($scope.custom().title_section) {
                    hr.after(angular.element('<div ng-include="\'' + tof + '\'"></div>'))
                  }
                }
              }

              ,
              beforeSave: function(savedata) {
                if (savedata._name.match(/\*$/)) {
                  var pattern, xx, yy, sep, digit


                  if (savedata._type == 'บันทึก') {
                    xx = savedata.info.reference
                    yy = ''
                    sep = '.'
                    digit = 2
                  } else {
                    xx = ''
                    yy = moment(utils.lookup(savedata, 'info.issue_date')).format('BBBB')
                    sep = '/'
                    digit = 4
                  }

                  pattern = utils.runningPattern(savedata._name, xx, yy, sep, digit)

                  if (pattern) {

                    return $scope.db.getHighest('_name', pattern.join('')).then(function(data) {

                      if (data && data.length) {

                        savedata._name = utils.runningNext(data[0]._name)
                      } else {
                        var runno

                        if (pattern[0] == utils.escapeRegex(xx)) {
                          savedata._name = xx + pattern[1] + sep + '*'
                        }

                        savedata._name = savedata._name.replace(/\*$/, '0000000001'.substr(10 -
                          digit))
                      }

                      return savedata
                    })
                  }

                  savedata._name = savedata._name.replace(/\*$/, '0000000001'.substr(10 - digit))
                }
                return savedata
              }
            }

            // entry for view
          angular.forEach([
            'tenants',
            'tenant_signers',
            'areas', 'goods',
            'rent_rates',
            'service_rates',
            'utility_rates',
            'pm_rates',
            'pm_utilities',
            'witnesses'
          ], function(n) {

            $scope[n] = function() {
              return entry.meta(n)
            }
          })

          angular.forEach(['pm', 'billboard', 'atm', 'custom'], function(n) {

            $scope[n] = function() {
              return entry.info(n, {})
            }
            //$scope[n]()
          })


          angular.extend($scope, services)

          if (!$scope.resource._id) {

            // default add at least 1 entry
            if ($scope.tenants().length == 0)
              $scope.resource$entry.add($scope.tenants())


            if ($scope.areas().length == 0)
              $scope.resource$entry.add($scope.areas())


            if ($scope.rent_rates().length == 0) {
              //$scope.inc_rent_rates()
            }

            if ($scope.service_rates().length == 0) {
              //$scope.inc_service_rates
            }

            if ($scope.utility_rates().length == 0) {
              //$scope.inc_utility_rates
            }

            while ($scope.witnesses().length < 2) {
              $scope.resource$entry.add($scope.witnesses())
            }

            $scope.$watch('tenants()', $scope.meta_tenant_render, true)
            $scope.$watch('tenant_signers()', $scope.meta_tenant_render, true)
            $scope.$watch('areas()', $scope.meta_area_render, true)
            renderAllow = true

          } else {
            var promises = []

            if ($scope.resource._type == entry.info().duration)
              $scope.resource._type = $scope.BUILT_IN.contractTypes[0].name

            if (!entry.info().tenant_type) {

              entry.info().tenant_type = entry.meta().tenant_type
              entry.meta().tenant_type = null
            }

            angular.forEach($scope.tenants(), function(t) {

              promises.push($scope.tenantSync(t, -1))
            })

            angular.forEach($scope.tenant_signers(), function(t) {

              promises.push($scope.tenantSync(t, -1))
            })

            angular.forEach($scope.areas(), function(a) {

              promises.push($scope.meta_room_to_floor_building(a))
            })

            $q.all(promises).then(function() {

              $scope.$watch('tenants()', $scope.meta_tenant_render, true)
              $scope.$watch('tenant_signers()', $scope.meta_tenant_render, true)
              $scope.$watch('areas()', $scope.meta_area_render, true)
              window.setTimeout(function() {
                renderAllow = true
              }, 50)
            })
          }

          //$scope.meta_tenant_render(false)
          //$scope.meta_area_render(false)

          if (!$scope.resource._name) {

            $scope.resource._name = '*'
          }

          //if (!$scope.resource.info.issue_date) {
          //  $scope.resource.info.issue_date = moment().format('YYYY-MM-DD')
          //}
        }

        // init by base controller

        $controller(
          'legacyEditCtrl', {
            $scope: $scope,

            legacyEditDI: legacyEditDI,
            editctrl: {
              db: db,
              success: success
            }
          })

      }
    ])
}).call(this);
