(function() {

'use strict'

angular.module('modules.utils', [])
  .factory('utils',['$location', '$route', '$parse', '$rootScope'
  , function($location, $route, $parse, $rootScope) 
    {
      var 
        utils = {
            AND       : AND
          , OR        : OR
          , notEmpty  : notEmpty
          , deepStrip : deepStrip
          , trim      : trim
          , lookup    : lookup
          , $location : $location
          , $route    : $route
          , $rootScope: $rootScope
          }

      utils.stringify = function (key) {
        return (angular.isObject(key) && JSON.stringify(key)) || key.toString()
      }

      utils.hash = function (key) {
          var skey, hash = 0

          skey = utils.stringify(key)

          for (var i = 0; i < skey.length; i++) {
            hash = ((hash << 5) - hash ) + skey.charCodeAt(i)
            hash |= 0  // Convert to 32bit integer
          }
          return hash
        }

      utils.safe$apply = function (scope) {

          scope = scope || $rootScope

          if (scope.$root.$$phase !='$apply' && scope.$root.$$phase !='$digest') {

            scope.$apply()
          }
        }


      utils.printPage = function () {

          window.print()
        }

      utils.sum = function (items, name) {
          var value = 0
            , getter = (name && $parse(name)) || function (item) { return item}
            , val

          angular.forEach(items, function(item) {
            val = getter(item)

            if (angular.isNumber(val)) {
              value += val
            }

          })
          return value
        }

      utils.formatValue = function (v) {

          // default formatter for some datatype
          if (angular.isNumber(v)) {
            return numeral(v).format('0,0[.]00')
          }

          if (angular.isString(v) && v.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return moment(v).format('DD/MM/YYYY')
          }
          else if (angular.isObject(v)) {
            return JSON.stringify(v,undefined,2)
          }

          return v
        }

      utils.basepath = function( ){
          return $location.path().split('/').slice(0,2).join('/')
        }

      utils.redirect = function(path){
          $location.path(path)
        }

      utils.reload = function(path){
          $route.reload()
        }

      utils.serialize = function(obj) {
          var str = [];
          for(var p in obj)
             str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          return str.join("&");
        }
        
      utils.Entry = function(scope){ 
          this.scope = scope
        }

      angular.extend( utils.Entry.prototype, {
          get
          : function(entry,name,defval) 
            {
              if (!entry)
                return this.scope

              var scope = this.scope

              if (scope[entry]==undefined)
                 scope[entry] = {}
                
              entry = scope[entry]
              
              if (name) 
              {
                if (entry[name]==undefined && defval!=undefined)
                  entry[name] = defval

                return entry[name]
              }
              
              return entry
            }

        , add
          : function(container,obj)
            {
              container.push(obj || {});
            }

        , remove
          : function(container,idx)
            {
              if (container.length) {
                if (idx==undefined)  
                  idx  = container.length -1;
                  
                if (container.length > idx)  
                  container.splice(idx,1);
              }
            }
        })

      return utils
    }
  ])


var trim = function (s) {

  return ('' + (s || '')).trim();
}


var AND = function () {
  var x
  for (var i=0; i< arguments.length; i++)
  {
    x = arguments[i]
    if (!x) break
  }
  return x

}

var OR  = function () {
    var x
    for (var i=0; i< arguments.length; i++)
    {
      x = arguments[i]
      if (x) break
    }
    return x
}

var notEmpty = function (obj, debug) {
  if (angular.isObject(obj)) 
  {
    for (var k in obj) {
      if (!obj.hasOwnProperty(k))
        continue
      if (notEmpty(obj[k], debug)) {  
        if (debug) {
          console.log ('notempty',k, obj[k])
        }
        return true
      }
    }
    return false
  }
  return obj
}

var deepStrip = function (obj, resourceOnly) {
  
    if (resourceOnly && angular.isFunction(obj)) {
      return false
    }

    if (angular.isArray(obj) || angular.isObject(obj)) {
      var e = []

      for (var k in obj) {
        //console.log(k,typeof obj[k])
        if (!deepStrip(obj[k], resourceOnly)) {
          e.push(k)
        }
      }
      if (e.length) {
        while (e.length)
        {
          delete obj[e.pop()]
        }
      }
    }
    return notEmpty(obj)
}

var lookup = function (data, attr) {
  var 
    obj   = data
  , elems = (attr || '').split('.')
  , rcnt  = elems.length
  
  angular.forEach(elems, function (p) {

      rcnt--

      if (angular.isArray(obj)) {

        var lst = []
        
        angular.forEach(obj, function (o) {
          var v = lookup(o,p)

          if (notEmpty(v) && lst.indexOf(v)==-1) 
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
