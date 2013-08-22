'use strict'

angular.module('modules.uis', ['ui.bootstrap'])
  .factory('uis',['$dialog', function($dialog){

      var messageBox = function (title, msg, btn){

              return $dialog.messageBox(title, msg, btn)
            }

      var errorBox = function (errorno, btn){

            return messageBox('error : '+errorno,btn)
          }

      return {
          $dialog     : $dialog
        , messageBox  : messageBox
        , errorBox    : errorBox
        }

  }])
