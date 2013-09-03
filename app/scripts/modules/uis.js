'use strict'

angular.module('modules.uis', ['ui.bootstrap'])
  .factory('uis',['$dialog', '$rootScope', function($dialog, $rootScope){

      var messageBox = function (title, msg, btn, extclass){

            return $dialog.dialog({
              templateUrl: 'template/dialog/message.html'
            , controller: 'MessageBoxController'
            , dialogClass: 'modal ' + (extclass || 'text-error')
            , resolve:{
                model: function() {
                  return {
                    title: title
                  , message: msg
                  , buttons: btn
                  }
                }
              }})          
          }

      var errorBox = function (error, btn, title){
            btn = btn || [{ result : 'close', label : 'Close'}]
            if (angular.isNumber(error)) {
              error = 'status code = ' + error
            }
            return messageBox(title || 'Error', error, btn, 'text-error')
          }
          
      $rootScope.typeaheadWait = 10

      return {
          $dialog     : $dialog
        , messageBox  : messageBox
        , errorBox    : errorBox
        }

  }])
