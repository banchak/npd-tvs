(function() {

  'use strict'

  angular.module('modules.utils', [])
    .factory('utils', ['$location', '$route', '$parse', '$rootScope', '$cookies',
      function($location, $route, $parse, $rootScope, $cookies) {
        var utils = {
          AND: AND,
          OR: OR,
          notEmpty: notEmpty,
          deepStrip: deepStrip,
          trim: trim,
          $location: $location,
          $route: $route,
          $rootScope: $rootScope,
          $parse: $parse,
          $cookies: $cookies,
          format: {
            date: 'DD/MM/BBBB',
            dateTime: 'DD/MM/BBBB hh:mm',
            number: '0,0[.]00'
          }
        }

        utils.remember = function(key, value) {

          if (!angular.isUndefined(value))
            utils.$cookies[key] = value

          return utils.$cookies[key]
        }

        utils.timestamp = function () {
          return ((new Date()).getTime() / 1000) | 0          
        }

        utils.runningNext = function(runno) {
          var rmatch = runno.match(/^(.*?)(\d*)$/),
            idx, pad

          if (rmatch) {

            idx = '' + ((rmatch[2] | 0) + 1)
            pad = rmatch[2].length - idx.length

            if (pad >= 0) {

              if (pad) {
                idx = '000000000'.substr(0, pad) + idx
              }
              return rmatch[1] + idx
            }
          }
          return runno
        }

        utils.runningRegex = function(xx, yy, sep, digit) {
          var regx

          regx = (xx ? '(.{' + xx.length + '})?' : '') + (yy ? '(\\d{' + yy.length + '})?' : '') + (sep ? '(.{' + sep.length + '})?' : '') + ('(\\d{' + (digit || 4) + '})?')

          return new RegExp('^' + regx + '$')
        }

        utils.runningPattern = function(val, xx, yy, sep, digit) {
          var regx, pmatch, xsegs,
            dim = (xx && 4) || 3

            if (val.match(/\*$/)) {

              xsegs = val.match(/^([^\d-\/\*\.]*)(\d*)([-\/\.]?)\*$/)

              // custom pattern
              if (xsegs) {

                if (xsegs[3]) {

                  sep = xsegs[3]
                  yy = xsegs[2]
                }
                else if (xsegs[2]) {
                  
                  yy = xsegs[2]
                  yy = xsegs[1]
                }
                else if (xsegs[1]) {

                  xx = xsegs[1]
                }
              }

              val = val.replace(/\*$/, '')

              regx = utils.runningRegex(xx, yy, sep, digit)

              pmatch = val.match(regx)

              if (pmatch && !pmatch[dim]) {

                return [
                  xx && utils.escapeRegex(pmatch[1] || xx || ''), utils.escapeRegex(pmatch[dim-2] || yy || ''), utils.escapeRegex(pmatch[dim-1] || sep || ''), '\\d{' + (digit || 4) + '}'
                ]
              }
              return [utils.escapeRegex(val),'','','\\d{' + (digit || 4) + '}']

            }
        }

        utils.escapeRegex = function(str) {

          return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        }

        utils.unescapeRegex = function(str) {

          return str.replace(/\\/g, "");
        }

        utils.temp = function(attr, obj) {

          if (obj) {
            return utils.temp(attr).get(obj)
          }

          return {
            get: function(data) {
              return attr ? (data.$temp && data.$temp[attr]) : data.$temp
            },
            set: function(data, val) {

              if (!data.$temp) {
                data.$temp = function() {}
              }

              data.$temp[attr] = val

            }
          }
        }

        utils.mapReduce = function(v, k, flat) {
          var mk = (k && $parse(k)),
            mv = $parse(v)

            return function(obj) {
              var result = []

              angular.forEach(obj, function(o) {
                var vval = mv(o),
                  kval = mk && mk(o),
                  kv

                if (vval) {
                  if (mk) {
                    if (flat) {
                      kv = utils.formatValue(kval) + ' : ' + utils.formatValue(vval)
                    } else {
                      kv = {}
                      kv[kval] = vval
                    }
                  } else {
                    kv = vval
                  }
                  result.push(kv)
                }
              })

              if (flat && result.length == 1) {
                return result[0]
              }

              return result
            }
        }

        utils.dateListAhead = function(q, adj) {
          var list, qmatch, mmatch, mstart, mval, mm, dmark, qregx = /^(\d*)\/?(\d*)\/?(\d*)$/

            function mmFormat(mm, alt, mark) {
              var s = mm.format((alt && 'D/M/BBBB') || utils.format.date)
              return s + ((mark && mark[s]) || '')
            }

          adj = adj || 0

          mm = mmFormat(moment(), true)
          mmatch = mm.match(qregx)

          qmatch = q.match(qregx)
          if (qmatch && (qmatch[1] || qmatch[2] || qmatch[3])) {
            list = []

            if (!qmatch[1]) {
              // list each day in month
              dmark = {}
              dmark[mm] = ' (วันนี้)'

              qmatch[2] = qmatch[2] || mmatch[2]
              qmatch[3] = qmatch[3] || mmatch[3]
              mstart = moment(mmatch[1] + '/' + qmatch[2] + '/' + qmatch[3], 'DD/MM/**BB')
              if (!mstart.isValid()) {
                mstart = moment('1/' + qmatch[2] + '/' + qmatch[3], 'DD/MM/**BB')
                mstart.endOf('month')
              }

              for (var d = 0; d <= 40; d++) {
                mval = moment(mstart)
                mval.subtract('days', d)

                if (mval.isValid()) {
                  list.push({
                    name: mmFormat(mval),
                    label: mmFormat(mval, true, dmark)
                  })
                }
              }
            } else {
              if (!qmatch[2]) {
                // list day in each month
                mm = (qmatch[1] | 0) + '/' + mmatch[2] + '/' + mmatch[3]
                dmark = {}
                dmark[mm] = ' (เดือนนี้)'

                qmatch[3] = qmatch[3] || mmatch[3]
                mstart = moment('1/' + mmatch[2] + '/' + qmatch[3], 'DD/MM/**BB')
                if (mstart.isValid()) {

                  for (var m = -6 + (adj * 2); m <= 6 + (adj * 2); m++) {

                    mval = moment(mstart)
                    mval.subtract('months', m)
                    mval.date(qmatch[1] | 0)
                    if (mval.isValid()) {
                      list.push({
                        name: mmFormat(mval),
                        label: mmFormat(mval, true, dmark)
                      })
                    }
                  }
                }
              } else {
                if (!qmatch[3]) {
                  // list day in each year
                  mm = (qmatch[1] | 0) + '/' + (qmatch[2] | 0) + '/' + mmatch[3]
                  dmark = {}
                  dmark[mm] = ' (ปีนี้)'

                  mstart = moment(qmatch[1] + '/' + qmatch[2] + '/' + mmatch[3], 'DD/MM/**BB')
                  if (mstart.isValid()) {
                    for (var y = -3 + adj; y <= 6 + adj; y++) {

                      mval = moment(mstart)
                      mval.subtract('years', y)
                      if (mval.isValid()) {
                        list.push({
                          name: mmFormat(mval),
                          label: mmFormat(mval, true, dmark)
                        })
                      }

                    }
                  }
                }
              }
            }
            return list
          }

          if (!utils.dateListAhead.cache) {

            utils.dateListAhead.cache = {}
          }

          if (!utils.dateListAhead.cache[mm]) {

            utils.dateListAhead.cache[mm] = [{
              name: mm,
              label: '@วันนี้'
            }, {
              name: mmFormat(moment().add('days', -1)),
              label: '@@เมื่อวานนี้'
            }, {
              name: mmFormat(moment().add('days', 1)),
              label: '@@#พรุ่งนี้'
            }, {
              name: mmFormat(moment().startOf('week')),
              label: '@@@ต้นสัปดาห์นี้'
            }, {
              name: mmFormat(moment().endOf('week')),
              label: '@@@##ปลายสัปดาห์นี้'
            }, {
              name: mmFormat(moment().startOf('month')),
              label: '@@@@ต้นเดือนนี้'
            }, {
              name: mmFormat(moment().endOf('month')),
              label: '@@@@###สิ้นเดือนนี้'
            }, {
              name: mmFormat(moment().startOf('year')),
              label: '@@@@@ต้นปีนี้'
            }, {
              name: mmFormat(moment().endOf('year')),
              label: '@@@@@####สิ้นปีนี้'
            }]
          }
          return utils.dateListAhead.cache[mm]
        }

        utils.textLines = function(text) {
          return (text || '').split(/\r\n|\r|\n/)
        }

        utils.lookup = function(data, attr) {
          /*if (old_lookup(data,attr) != (attr && $parse(attr)(data)))
        {
          console.log ('lookup:',attr,data,old_lookup(data,attr), attr &&  $parse(attr)(data))
        }*/
          return attr && $parse(attr)(data)
        }


        utils.stringify = function(key) {
          return (angular.isObject(key) && JSON.stringify(key)) || key.toString()
        }

        utils.hash = function(key) {
          var skey, hash = 0

            skey = utils.stringify(key)

            for (var i = 0; i < skey.length; i++) {
              hash = ((hash << 5) - hash) + skey.charCodeAt(i)
              hash |= 0 // Convert to 32bit integer
            }
          return hash
        }

        utils.safe$apply = function(scope) {

          scope = scope || $rootScope

          if (scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest') {

            scope.$apply()
          }
        }


        utils.printPage = function() {

          window.print()
        }

        utils.sum = function(items, name) {
          var value = 0,
            getter = (name && $parse(name)) || function(item) {
              return item
            }, 
            val

            angular.forEach(items, function(item) {
              val = getter(item)

              if (angular.isNumber(val)) {
                value += val
              }

            })
            return value
        }

        utils.formatValue = function(v) {

          // default formatter for some datatype
          if (angular.isNumber(v)) {
            return (v && numeral(v).format(utils.format.number)) || ''
          }

          if (angular.isDate(v) || moment.isMoment(v) || (angular.isString(v) && v.match(/^\d{4}-\d{2}-\d{2}$/))) {
            return moment(v).format(utils.format.date)
          } else if (angular.isString(v) && v.match(/^\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}\:\d{2}/)) {
            return moment(v).format(utils.format.dateTime)
          } else if (angular.isObject(v)) {
            return JSON.stringify(v, undefined, 2)
          }

          return v || ''
        }

        utils.basepath = function() {
          return $location.path().split('/').slice(0, 2).join('/')
        }

        utils.redirect = function(path) {
          $location.path(path)
        }

        utils.reload = function(path) {
          $route.reload()
        }

        utils.serialize = function(obj, withUrl) {
          var str = []

          for (var p in obj) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]))
            if (p == 'url') {
              withUrl = false
            }
          }
          if (withUrl) {
            str.push(encodeURIComponent('url') + "=" + encodeURIComponent(utils.$location.url()))
          }
          return str.join("&");
        }

        utils.Entry = function(scope) {
          this.scope = scope
        }

        angular.extend(utils.Entry.prototype, {
          lookup: function(expr) {
            return utils.lookup(this.scope, expr)
          }

          ,
          get: function(entry, name, defval) {
            if (!entry) {
              return this.scope
            }

            var scope = this.scope

            if (scope[entry] == undefined) {
              scope[entry] = {}
            }

            entry = scope[entry]

            if (name) {
              if (entry[name] == undefined && defval != undefined) {
                entry[name] = defval
              }
              return entry[name]
            }

            return entry
          }

          ,
          add: function(container, obj) {
            container.push(obj || {});
          }

          ,
          remove: function(container, idx) {
            if (container.length) {
              if (idx == undefined)
                idx = container.length - 1;

              if (container.length > idx)
                container.splice(idx, 1);
            }
          }
        })

        return utils
      }
    ])


  var trim = function(s) {

    return ('' + (s || '')).trim();
  }


  var AND = function() {
    var x
    for (var i = 0; i < arguments.length; i++) {
      x = arguments[i]
      if (!x) break
    }
    return x

  }

  var OR = function() {
    var x
    for (var i = 0; i < arguments.length; i++) {
      x = arguments[i]
      if (x) break
    }
    return x
  }

  var notEmpty = function(obj, debug) {
    if (angular.isObject(obj)) {
      for (var k in obj) {
        if (!obj.hasOwnProperty(k))
          continue
        if (notEmpty(obj[k], debug)) {
          if (debug) {
            console.log('notempty', k, obj[k])
          }
          return true
        }
      }
      return false
    }
    return obj
  }

  var deepStrip = function(obj, resourceOnly) {

    if (resourceOnly && angular.isFunction(obj)) {
      return false
    }

    if (angular.isArray(obj) || angular.isObject(obj)) {
      var e = []

      for (var k in obj) {

        if (!deepStrip(obj[k], resourceOnly)) {
          e.push(k)
        }
      }
      if (e.length) {
        while (e.length) {
          if (obj.splice) {
            obj.splice(e.pop(), 1)
          } else {
            delete obj[e.pop()]
          }
        }
      }
    }
    return notEmpty(obj)
  }

  var old_lookup = function(data, attr) {
    var
    obj = data,
      elems = (attr || '').split('.'),
      rcnt = elems.length

      angular.forEach(elems, function(p) {

        rcnt--

        if (angular.isArray(obj)) {

          var lst = []

          angular.forEach(obj, function(o) {
            var v = old_lookup(o, p)

            if (notEmpty(v) && lst.indexOf(v) == -1)
              lst.push(v)
          })

          if (lst.length == 1) {
            lst = lst[0]
          }
          //else {
          //  lst = JSON.stringify(lst,undefined,2)//angular.toJson(lst)
          //}

          obj = lst
          return
        }

        if (angular.isObject(obj)) {
          obj = obj[p]
          return
        }

        obj = null
      })

      return obj

  }


}).call(this);
