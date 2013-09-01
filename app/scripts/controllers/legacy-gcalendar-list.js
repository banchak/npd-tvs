(function () {

'use strict'

angular.module('controllers.legacy-gcalendar-list',['controllers.legacy-list', 'modules.gcalendar'])
  .controller('legacyGCalendarListCtrl', ['$scope', 'legacyListDI', 'listctrl', '$controller', '$timeout', 'GCalendar'
  , function ($scope, legacyListDI, listctrl, $controller, $timeout, GCalendar)
    {
      var utils = legacyListDI.utils

      var success = function (){

          $scope.gcalendarViewer = {
              opened  : false
            , close   : function () { 
                $scope.gcalendarViewer.show = false 

                $timeout(function () {

                    $scope.gcalendarViewer.opened = false 
                  }, 50)
              }
            , options : {
                //backdropFade  : true
                //dialogFade    : true
                backdrop      : false
              }

            }

          $scope.eventComposeUrl = function (text, src) {
            var params = {action : 'TEMPLATE'}

            if (text) {

              if (text[0]!='@') {
                text = '@'+text
              }
              params.text = text + ' -'
              params.details = text + ' -'
            }

            if (src) {
              params.src = src
            }

            return 'http://www.google.com/calendar/event?' + utils.serialize(params)
          }

          $scope.viewGCalendar = function(data) {
            var temp = utils.temp('events')

            temp.set(data, null)
            GCalendar.events(data._name).then(function(resp){
              temp.set(data, resp || [])
              console.log('$temp.events',data.$temp.events)
            })

            angular.extend ($scope.gcalendarViewer, {
                        opened : true
                      //, show   : true
                      , data   : data
                      , title  : data._name
                      , description : data.info && data.info.detail
                      })

          }

          // check gcalendar
          GCalendar.calendars().then(function (resp){
            var temp = utils.temp('gcalendar')
              , cals = []
            console.log('calendars',resp)
            if (resp && resp.items){
              angular.forEach(resp.items, function (cal) {
                if (cal.accessRole.match(/owner|writer/)) {
                  cals.push({email : cal.id, name : cal.summary})
                }
              })
              if (cals.length) {
                cals.unshift({name : '*all*'})
                $scope.filterCalendars = cals
              }
              angular.forEach($scope.dataList, function(data) {temp.set(data, true)})
            }
          })
      }
    
    var org_success = listctrl.success

    listctrl.success = function (scope) {

      if (org_success) {
        org_success(scope)
      }
      
      success (scope)
    }

    // init by base controller
    $controller (listctrl.gcalendarCtrlBase || 'legacyListCtrl', {

        $scope        : $scope
      , legacyListDI  : legacyListDI
      , listctrl      : listctrl
    })

  }])


}).call(this);