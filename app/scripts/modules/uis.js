'use strict'

angular.module('modules.uis', ['ui.bootstrap'])

  .run(["$templateCache", function (e) {
    e.put("template/dialog/message.html", '<div class="modal-header" ng-class="extclass">   <h1>{{ title }}</h1></div><div class="modal-body" ng-class="extclass">  <p>{{ message }}</p></div><div class="modal-footer">    <button ng-repeat="btn in buttons" ng-click="$close(btn.result)" class=btn ng-class="btn.cssClass">{{ btn.label }}</button></div>')
  }])

  .factory('uis', ['$modal', '$rootScope',
    function($modal, $rootScope) {

      var messageBox = function(title, message, buttons, extclass) {
        var dialog

        if (!buttons) {
            buttons = [
                {result:'ok', label: 'OK', cssClass: 'btn-primary'},
            ]
        }

        var ModalCtrl = function($scope, $modalInstance) {
            $scope.title    = title
            $scope.message  = message
            $scope.buttons  = buttons
            $scope.extclass = extclass
        }

        return {
          open : function () {
              dialog = $modal.open({
                  templateUrl: 'template/dialog/message.html',
                  controller: ModalCtrl
              })
              return dialog.result
            }
          , close : function (result) {
              if (dialog)
                dialog.close(result)
            }
        }

    }


      var errorBox = function(error, btn, title) {
        btn = btn || [{
          result: 'close',
          label: 'Close'
        }]
        if (angular.isNumber(error)) {
          error = 'status code = ' + error
        }
        return messageBox(title || 'Error', error, btn, 'text-error')
      }

      $rootScope.typeaheadWait = 10

      return {
        messageBox: messageBox,
        errorBox: errorBox
      }

    }
  ])
