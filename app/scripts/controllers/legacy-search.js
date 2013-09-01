'use strict'

angular.module('controllers.legacy-search',['modules.utils'])

  .factory('legacySearchDI',['$routeParams', '$q', 'utils'
  , function($routeParams, $q, utils)
    {

      return {
            $routeParams  : $routeParams
          , $q            : $q
          , utils         : utils
          }
    }
  ])

  .controller('legacySearchCtrl', ['$scope', 'legacySearchDI', 'Database'
  , function($scope, legacySearchDI, Database)
    {
      var utils   = legacySearchDI.utils
        , $q = legacySearchDI.$q

      $scope.utils        = utils
      $scope.promiseBusy  = 0
      $scope.search       = legacySearchDI.$routeParams.search

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
        var result    = $scope[target || 'searchResult'] = {}

        if (!keyword)
          return


        angular.forEach(databases || Database.COLLECTIONS, function(db) {

          var qry, promise, scopefields, searchable

          if (!db.searchable) {
            return
          }

          searchable = db.searchable

          if (angular.isFunction(searchable)) {
            searchable = searchable(db)
          }
          promise = $q.when(searchable).then(function(searchable) {

            var pm, fields

            if (!searchable) {
              return
            }

            if (angular.isArray(searchable)) {
              scopefields = searchable
            }


            db = new Database.legacy(db)

            qry = db.scopeQuery(keyword, scopefields)

            fields = {_name : 1, _type : 1}

            angular.forEach(db.descriptions, function(d) {
              fields[d.name] = 1
            })


            $scope.promiseBusy++

            pm = $q.when(qry).then(function (_qry) { 

              return db.dataAccess.query(_qry, angular.extend({ fields : fields}, options))
            })

            pm.then(function(items) { 
              if (items && items.length) {
                angular.forEach(items,function (data) { db.describe(data) } )
                result[db.name]  = { title : db.title, keyword : keyword, items : items }
              }
            }).then (promiseReady,promiseReady)

            return pm
          })

          promises.push(promise)
        })

        return $q.all(promises).then(function () { utils.safe$apply($scope); return result})
      }

    } 

  ])

  .controller('legacySearchResultCtrl', ['$scope', 'legacySearchDI', 'Database', '$controller'
  , function($scope, legacySearchDI, Database, $controller)
    {

      $scope.toggles = {}
      $controller('legacySearchCtrl', {
          $scope          : $scope
        , legacySearchDI  : legacySearchDI
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
