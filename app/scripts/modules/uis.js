'use strict'

angular.module('modules.uis', ['ui.bootstrap'])
  .factory('uis',['$dialog', '$rootScope', function($dialog, $rootScope){

      var messageBox = function (title, msg, btn){

              return $dialog.messageBox(title, msg, btn)
            }

      var errorBox = function (errorno, btn){

            return messageBox('error : '+errorno,btn)
          }
      $rootScope.typeaheadWait = 10

      return {
          $dialog     : $dialog
        , messageBox  : messageBox
        , errorBox    : errorBox
        }

  }])
