(function() {

'use strict'

// require bootstrap-datepicker
angular.module('directives.boot-datepicker', [])

  .directive('bootDatepicker' // http://jsfiddle.net/pkozlowski_opensource/Te3Mr/19/
  , function ( ) 
    {
      return {
            require   : 'ngModel'
          , restrict  : 'A'
          , link
            : function (scope, elm, attrs, ctrl) 
              {
                var 
                  $elm = $(elm)
                , options = {forceParse: false}
                , attr

                ctrl.$render 
                = function() 
                  {
                    $elm.datepicker('update', ctrl.$viewValue)
                    return ctrl.$viewValue
                  }

                if (typeof BOOTDATEPICKER_CONFIG != 'undefined')
                  angular.extend(options, BOOTDATEPICKER_CONFIG)

                attr = scope.$eval(attrs.bootDatepicker)

                if (angular.isObject(attr))
                  angular.extend(options,attr)

                if (angular.isString(attr))
                  options.format = attr

                $elm
                  .datepicker(options)
                  .on('changeDate'
                    , function(ev)
                      {
                        return scope.$apply(
                          function() 
                          {
                            return ctrl.$setViewValue($elm.val())
                          })
                      })
                  .on('show', function() { elm.childActive = true })
                  .on('hide', function() { delete elm.childActive })


              }
          }
    })

}).call(this);
