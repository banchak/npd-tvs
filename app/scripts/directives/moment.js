(function() {

'use strict'

// require momentjs
angular.module('directives.moment', [])

  .filter('moment', function () {
    return function (input, format, lang) {
      var mdate = moment(input)

      if (format && format.toLowerCase()=='thaitext') {
        format = "D MMMM BBBB"
        lang   = 'th'
      }
      if (mdate) {
        if (lang) {
          mdate.lang(lang)
        }

        return mdate.format(format || 'YYYY-MM-DD')
      }
    }
  })

  .directive('moment', function ( ) { // http://jsfiddle.net/pkozlowski_opensource/Te3Mr/19/
      return {
            require   : 'ngModel'
          , restrict  : 'A'
          , link
            : function (scope, elm, attrs, ctrl) 
              {
                elm.bind(
                  'blur'
                , function() 
                  {
                      if (elm.childActive)
                        return;

                      var viewValue = ctrl.$modelValue

                      for (var i in ctrl.$formatters) 
                      {
                          viewValue = ctrl.$formatters[i](viewValue)
                      }

                      ctrl.$viewValue = viewValue


                      ctrl.$render()
                  })


                var 
                  config // default config
                  = {
                      storeFormat : 'YYYY-MM-DD' // toDate, valueOf, toISOString or format code
                    , viewFormat  : 'YYYY-MM-DD'
                    , inputFormat : 'YYYY-MM-DD'
                    , lang        : undefined

                    }
                , attr

                // override by global config
                if (typeof MOMENT_CONFIG != 'undefined')
                  angular.extend(config, MOMENT_CONFIG)

                if (attrs.moment)
                {
                  attr = scope.$eval(attrs.moment)
                  // override by element config
                  if (angular.isString(attr))
                    config.viewFormat = config.inputFormat = attr
                  else if (angular.isArray(attr)){
                    config.inputFormat = attr
                    config.viewFormat  = attr[attr.length-1]
                  }
                  else if (angular.isObject(attr))
                    angular.extend(config, attr)
                }

                for (var k in config)
                {
                  attr = attrs['moment.'+k]
                  if (attr)
                    config[k] = scope.$eval(attr)
                }

                ctrl.$parsers.unshift(
                  function (viewValue) 
                  {
                    var 
                      mdate = moment(viewValue, config.inputFormat, config.lang)

                    if (mdate && mdate.isValid()) 
                    {
                      //mdate = moment(mdate.format(storeFormat))

                        var fn = mdate[config.storeFormat]

                        ctrl.$setValidity('moment', true)

                        if (angular.isFunction(fn))
                          return fn()

                        return mdate.format(config.storeFormat)

                    }

                    // in all other cases it is invalid, return undefined (no model update)
                    ctrl.$setValidity('moment', false)
                    return viewValue
                  })

                ctrl.$formatters.unshift(
                  function (modelValue) 
                  {
                    if (modelValue)
                    {
                      if (modelValue.match(/\d+[-\/]\d+[-\/]\d+/)) {
                        var mdate = moment(modelValue)

                        if (mdate.isValid())
                        {
                          if (config.lang)
                            mdate.lang(config.lang)

                          return mdate.format(config.viewFormat)
                        }
                      }
                      //return undefined //modelValue
                    }

                })

              }
          }
    })

}).call(this);
