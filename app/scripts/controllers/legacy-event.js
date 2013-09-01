'use strict'

angular.module('controllers.legacy-event',['modules.utils', 'modules.gcalendar'])

  .factory('legacyEventDI',['$routeParams', '$q', 'utils', 'GCalendar'
  , function($routeParams, $q, utils, GCalendar)
    {

      return {
            $routeParams  : $routeParams
          , $q            : $q
          , utils         : utils
          , GCalendar     : GCalendar
          }
    }
  ])

  .controller('legacyEventCtrl', ['$scope', 'legacyEventDI', 'Database'
  , function($scope, legacyEventDI, Database)
    {
      var utils   = legacyEventDI.utils
        , $q = legacyEventDI.$q

      $scope.utils        = utils
      $scope.promiseBusy  = 0
      $scope.search       = legacyEventDI.$routeParams.search

      var promiseReady = function (){

        $scope.promiseBusy--
        if ($scope.promiseBusy < 0) {
          $scope.promiseBusy = 0
        }
      }

      $scope.goPathScope = function (name, rs) {
        utils.$location.path ('/' + name)
        utils.$location.search( { scopes : angular.toJson([rs.keyword])})
      }

      $scope.urlPathScope = function (name, rs) {
        return encodeURI('#/' + name)+'?' + utils.serialize({ scopes : angular.toJson([rs.keyword])})
      }

      $scope.goPathItem = function (name, item, search) {
        utils.$location.path ('/' + name + '/view/\''+ encodeURIComponent(item._name) )
        if (!search) {
          utils.$location.search({})
        }
      }

      $scope.urlPathItem = function (name, item, search) {
        var url =encodeURI('#/' + name + '/view/\'') + encodeURIComponent(item._name)

        if (search) {
          url += '?' + utils.serialize(utils.$location.search())
        }
        return url
      }


      $scope.goSearch = function (keyword) {
        utils.$location.path ('/')
        utils.$location.search( { search : keyword })

      }

      $scope.urlSearch = function (keyword) {
        return encodeURI('#/') + '?' + utils.serialize( { search : keyword })
      }
      
      var promiseReady = function (){

        $scope.promiseBusy--
        if ($scope.promiseBusy < 0) {
          $scope.promiseBusy = 0
        }
      }

      $scope.doSearch = function (keyword,databases, target, options) {

        var promises = []

        if (!keyword)
          return

        var result    = $scope[target || 'searchResult'] = {}

        angular.forEach(databases || Database.COLLECTIONS, function(db) {

          var qry, promise, scopefields

          if (db.searchable === false) {
            return
          }

          if (angular.isArray(db.searchable)) {
            scopefields = db.searchable
          }

          db = new Database.legacy(db)

          qry = db.scopeQuery(keyword, scopefields)

          if (!options) {
            var fields = {_name : 1}

            angular.forEach(db.descriptions, function(d) {
              fields[d.name] = 1
            })
            options = { fields : fields}
          }

          $scope.promiseBusy++

          promise = $q.when(qry).then(function (_qry) { return db.dataAccess.query(_qry, options) })

          promise.then(function(data) { 
            if (data && data.length) {
              result[db.name]  = { title : db.title, keyword : keyword, items : data, descriptions : db.descriptions }
            }
          }).then (promiseReady,promiseReady)

          promises.push(promise)
        })

        return $q.all(promises).then(function () { console.log('result',result); return result})
      }

    } 

  ])

  .controller('legacyEventResultCtrl', ['$scope', 'legacyEventDI', 'Database', '$controller'
  , function($scope, legacyEventDI, Database, $controller)
    {

      $scope.toggles = {}
      $controller('legacyEventCtrl', {
          $scope          : $scope
        , legacyEventDI  : legacyEventDI
        , Database        : Database
        })

      if ($scope.search) {
        $scope.searchBusy = true
        $scope.doSearch($scope.search).then (function (result) {
          var name, item, count = 0

          $scope.searchBusy = false

          // try search & go if there is only 1 result
          angular.forEach(result, function (found, dbname) {

            count += found.items.length
            if (count==1) {
              name    = dbname
              item    = found.items[0]
            }
          })

          if (count==1 && !$scope.search.match(/^\'/)) {
            $scope.goPathItem (name, item)
          }
        }, function () { 
          $scope.searchBusy = false 
        })
      }

    } 

  ])
