(function() {

'use strict'

// require momentjs
angular.module('directives.markdown', [])
  .directive('markdownBind',['$compile', function($compile) {
      var converter = new Showdown.converter();
      return {
          restrict: 'A',
          link : function(scope, element, attrs) {

                scope.$watch( function (scope) {

                  return scope.$eval(attrs.markdownBind)
                }, function (newVal) {

                  var html = (newVal && converter.makeHtml(newVal) ) || ''
                    , makeHtml = html && scope.$eval(attrs.onMakeHtml)
                    , inline = html && scope.$eval(attrs.markdownInline)

                  element.html(html)
                  if (inline) {
                    element.children().css('display','inline')
                  }
                  if (angular.isFunction(makeHtml)) {
                    makeHtml(scope,element,attrs)
                  }
                  console.log(element.html())
                  $compile(element.contents())(scope)

                })
              }
            }
      
  }])
  .directive('includeMarkdown',['$compile', '$http', function($compile, $http) {
      var converter = new Showdown.converter();
      return {
          restrict: 'A',
          link : function(scope, element, attrs) {

              scope.$watch( function (scope) {

                return scope.$eval(attrs.includeMarkdown)
              }, function (url) {

                $http.get(url, {cache: true}).then(function(data) {
                  element.html(converter.makeHtml(data.data))
                  $compile(element.contents())(scope)
                })
              })
            }
          }
  }])

}).call(this);
