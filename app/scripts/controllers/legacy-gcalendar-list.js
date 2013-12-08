(function() {

  'use strict'

  angular.module('controllers.legacy-gcalendar-list', ['controllers.legacy-list', 'modules.gcalendar'])

    .controller('gcalendarViewerCtrl',[
    '$scope', 'legacyListDI','$modalInstance','GCalendar','data', 
    function($scope,legacyListDI,$modalInstance,GCalendar,data) {
      var utils = legacyListDI.utils

      $scope.gcalendarViewer = {
        data: data,
        title: data._name,
        description: data.info && data.info.detail
      }

      $scope.eventComposeUrl = function(text, src) {
        var params = {
          action: 'TEMPLATE'
        }

        if (text) {

          if (text[0] != '@')
            text = '@' + text

          params.text = text + ' - '
          params.details = text + ' - '
        }

        if (src)
          params.src = src

        return 'http://www.google.com/calendar/event?' + utils.serialize(params)
      }


    }])

    .controller('legacyGCalendarListCtrl', ['$scope', 'legacyListDI', 'listctrl', '$controller', 'GCalendar', '$modal',
      function($scope, legacyListDI, listctrl, $controller, GCalendar, $modal) {
        var utils = legacyListDI.utils

        var success = function() {

          $scope.viewGCalendar = function(data) {
            var temp = utils.temp('events')

            temp.set(data, null)
            GCalendar.events(data._name).then(function(resp) {
              temp.set(data, resp || [])
            })

            $modal.open({
              templateUrl: 'gcalendar-viewer-modal.html',
              controller: 'gcalendarViewerCtrl',
              resolve: {
                data: function () {
                  return data;
                }
              }
            })
          }

          // check gcalendar
          GCalendar.calendars().then(function(resp) {
            var temp = utils.temp('gcalendar'),
              cals = []

            if (resp && resp.items) {

              angular.forEach(resp.items, function(cal) {
                if (cal.accessRole.match(/owner|writer/) && cal.selected) {
                  cals.push({
                    email: cal.id,
                    name: cal.summary
                  })
                }
              })
              if (cals.length) {

                cals.unshift({
                  name: '*all*'
                })
                $scope.filterCalendars = cals
              }

              angular.forEach($scope.dataList, function(data) {
                temp.set(data, true)
              })
            }
          })

        }

        var org_success = listctrl.success

        listctrl.success = function(scope) {

          if (org_success)
            org_success(scope)


          success(scope)
        }

        // init by base controller
        $controller(listctrl.gcalendarCtrlBase || 'legacyListCtrl', {

          $scope: $scope,
          legacyListDI: legacyListDI,
          listctrl: listctrl
        })
      }
    ])

}).call(this);
