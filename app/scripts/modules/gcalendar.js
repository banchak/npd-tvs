'use strict';

angular.module('modules.gcalendar', ['modules.google-api', 'modules.utils'])
  .service('GCalendar', ['$q', 'utils', 'googleApi', 'GAPI_CONFIG',
    function($q, utils, googleApi, GAPI_CONFIG) {

      var mimeFolder = 'application/vnd.google-apps.folder'

      this.promiseCache = {}

      this.useCache = function(key, func) {
        var hash = utils.hash(key)

        if (this.promiseCache[hash]) {

          if (func === false) {
            delete this.promiseCache[hash]
            return
          }

          console.log('cache hit', key)
          return this.promiseCache[hash]
        }
        return this.promiseCache[hash] = func()
      }

      this.calendars = function() {
        return this.useCache('calendars', function() {

          return googleApi.client.execute({
            path: 'calendar.calendarList.list',
            params: {}
          })
        })
      }

      this.newCalendar = function(resource) {
        var self = this

        return this.useCache(fileId, function() {
          var pm

          if (angular.isString(resource)) {
            resource = {
              summary: resource
            }
          }

          pm = googleApi.client.execute({
            path: 'calendar.calendars.insert',
            params: {
              resource: resource
            }
          })

          pm.then(function() {
            self.useCache('calendars', false)
          })

          return pm
        })
      }

      this.eventList = function(calendarId, query, token, max) {
        var params = {}, self = this

        if (calendarId) {
          params.calendarId = calendarId.id || calendarId
        }

        if (query) {
          if (angular.isString(query)) {
            params.q = query
          } else {
            params = angular.extend(params, query)
          }
        }

        if (max) {
          params.maxResults = max
        }

        if (token) {
          params.pageToken = token
        }

        if (!params.calendarId) {
          return $q.when(null)
        }

        return googleApi.client.execute({
          path: 'calendar.events.list',
          params: params
        })
      }

      this.events = function(query, max) {
        var self = this,
          items = []

        if (max == undefined) {
          max = 500
        }

        function _events(cal, token) {

          return self.eventList(cal, query, token).then(function(resp) {
            if (resp && (!max || items.length < max)) {
              if (resp.items) {
                angular.forEach(resp.items, function(item) {
                  item.startDateTime = item.start.date || item.start.dateTime
                })
                items.push.apply(items, resp.items)
              }
              if (resp.pageToken) {
                return _events(cal, query, resp.pageToken)
              }
            }
            return resp
          })
        }

        return this.calendars().then(function(resp) {
          var promises = []

          if (resp) {
            angular.forEach(resp.items, function(cal) {
              if (cal.selected) {
                promises.push(_events(cal))
              }
            })
          }
          if (promises.length) {
            return $q.all(promises).then(function() {
              return items
            })
          }
        })

      }

    }
  ])
