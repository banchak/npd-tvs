(function() {

  'use strict'

  // require numeraljs
  angular.module('directives.numeral', [])

  .filter('numeral', function() {
    return function(input, format, lang) {
      var num

      if (!input && !format)
        return

      num = numeral(input)

      if (num) {

        if (!angular.isString(format)) // format = true (force display 0)
          format = ''

        if (format && format.toLowerCase() == 'bahttext')
          return num2str.bahtText(num.value(), lang || 'th')
        
        if (format && format.toLowerCase() == 'text') {
          var inp

          input = (input || '').toString()
          inp = input.split(/(\d+)\s*/)

          if (inp) {

            for (var i = 1; i < inp.length; i += 2) {
              inp[i] = num2str.format(inp[i] | 0, lang || 'th')
            }

            input = inp.join('')
          }
          return input
        }

        if (lang)
          num.language(lang)
        
        return num.format(format || '0,0[.]00')
      }
    }
  })

  .directive('numeral', function() {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: function(scope, elm, attrs, ctrl) {
        elm.bind(
          'blur', function() {
            if (elm.childActive)
              return;

            var viewValue = ctrl.$modelValue

            for (var i in ctrl.$formatters) {
              viewValue = ctrl.$formatters[i](viewValue)
            }

            ctrl.$viewValue = viewValue

            ctrl.$render()
          })

        elm.bind(
          'focus', function() {
            if (elm.childActive)
              return;

            var viewValue = ctrl.$modelValue

            //for (var i in ctrl.$formatters) 
            //{
            //    viewValue = ctrl.$formatters[i](viewValue)
            //}
            ctrl.$viewValue = numeral(viewValue).value() || ''

            ctrl.$render()
          })



        var
        config // default config
        = {
          storeFormat: null // toDate, valueOf, toISOString or format code
          ,
          viewFormat: '0,0[.]00',
          lang: undefined

        }, formats = {
            'money': '0,0.00',
            'money$': '0,0.00 $',
            '$money': '$ 0,0.00',
            'qty': '0,0[.]0[0]'
          }, attr

          // override by global config
        if (typeof NUMERAL_CONFIG != 'undefined')
          angular.extend(config, NUMERAL_CONFIG)

        if (typeof NUMERAL_FORMATS != 'undefined')
          angular.extend(formats, NUMERAL_FORMATS)

        if (attrs.numeral) {
          attr = scope.$eval(attrs.numeral)
          // override by element config
          if (angular.isString(attr))
            config.viewFormat = attr

          if (angular.isObject(attr))
            angular.extend(config, attr)
        }

        for (var k in config) {
          attr = attrs['numeral.' + k]
          if (attr)
            config[k] = scope.$eval(attr)
        }

        ctrl.$parsers.unshift(
          function(viewValue) {
            var
            mnum = numeral(viewValue)

            if (config.lang)
              mnum.language(config.lang)

            if (mnum) {
              //mdate = moment(mdate.format(storeFormat))

              var fn = mnum[config.storeFormat || 'value']

              ctrl.$setValidity('numeral', true)

              if (angular.isFunction(fn)) {
                return fn.call(mnum)
              }

              return mnum.format(config.storeFormat)
            }

            // in all other cases it is invalid, return undefined (no model update)
            ctrl.$setValidity('numeral', false)
            return undefined
          })

        ctrl.$formatters.unshift(
          function(modelValue) {
            if (modelValue) {
              var mnum = numeral(modelValue)

              if (mnum) {
                if (config.lang)
                  mnum.language(config.lang)
                return mnum.format(formats[config.viewFormat] || config.viewFormat)
              }
              return modelValue
            }
          })

      }
    }
  })


}).call(this);
