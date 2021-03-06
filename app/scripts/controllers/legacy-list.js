'use strict'

angular.module('controllers.legacy-list',['modules.utils'])

  .factory('legacyListDI',['$routeParams', '$q', 'utils'
  , function($routeParams, $q, utils)
    {

      return {
            $routeParams  : $routeParams
          , $q            : $q
          , utils         : utils
          }
    }
  ])

  .controller('errorsViewerCtrl',['$scope','$modalInstance','data', 
  function($scope,$modalInstance,data) {

    $scope.errorsViewer = {
      data   : data
    , title  : data._name
    }

  }])

  .controller('legacyListCtrl', ['$scope', 'legacyListDI', 'listctrl', 'APP_CONFIG'
  , function($scope, legacyListDI, listctrl, APP_CONFIG)
    {
      var utils       = legacyListDI.utils
        , $q          = legacyListDI.$q
        , filters, scopeQuery
        , sort
        , gone

      $scope.$on('$locationChangeStart', function(scope, next, current){
        gone = true
      })

      $scope.db       = listctrl.db
      $scope.adminView = listctrl.adminView
      $scope.utils    = utils

      $scope.basepath = utils.basepath()
      $scope.searchWithin = legacyListDI.$routeParams.within
      $scope.promiseBusy = 0

      $scope.sort = {}
      sort    = legacyListDI.$routeParams.sort
      if (sort) {
        $scope.sort.dir   = sort.indexOf('-')>=0 ? -1 : 1
        $scope.sort.name  = sort.replace(/[-+]/g,'')
      }

      if (!$scope.sort.name) {
        if ($scope.db.orders && $scope.db.orders.length) {
          $scope.sort.name = $scope.db.orders[0].name
        }
      } 

      // default query from routeParams.q
      $scope.query  = angular.fromJson(legacyListDI.$routeParams.q) || {}
      $scope.qvalues = []
      for (var k in $scope.query) 
      {
        $scope.qvalues.push($scope.query[k])
      }

      sort = { }
      sort[$scope.sort.name || '_id'] = $scope.sort.dir || -1

      $scope.queryOptions = angular.extend({ limit : 50, sort : sort }, APP_CONFIG.queryOptions || {})

      // default scopes from routeParams.scopes
      $scope.scopes = angular.fromJson(legacyListDI.$routeParams.scopes) || []
      $scope.dataScope  = ''

      // default scope from routeParams.find
      if (legacyListDI.$routeParams.bound) {
        // http://stackoverflow.com/questions/16630912/angular-js-route-doesnt-match-component-with-2f-encoded
        $scope.bound = decodeURIComponent(legacyListDI.$routeParams.bound)
      }

      filters = $scope.scopes

      if ($scope.bound) {
        filters = [$scope.bound].concat(filters)
      }

      scopeQuery = $scope.db.scopeQuery(filters)

      // initialize dataList
      $scope.dataList   = []
      $scope.dataCount  = 0

      // initialize categories
      $scope.categories = angular.copy(listctrl.categories || listctrl.db.categories || {})

      if ($scope.sort.name && !$scope.sort.name.match(/_name|_id/)) {

        $scope.showSortField = $scope.sort.name
        angular.forEach($scope.categories, function (cat) {
          if (cat.name == $scope.sort.name) {
            $scope.showSortField = null
          }
        })
      }

      $scope.$watch('sort',function (x, y) {
          if (!angular.equals(x,y)) {
            $scope.goOrder()
          }
        }, true)

      $scope.inspectMode = function () {
        if ($scope._inspect == undefined) {

          if ($scope.dataList && $scope.dataList.length == 1) {
            $scope._inspect =  !($scope.scopes && $scope.scopes.length) && !($scope.qvalues && $scope.qvalues.length)
          }
          
        }
        return $scope._inspect
      }

      $scope.loadDataList = function( qry, options) {

        var promise

        options = angular.extend({}, $scope.queryOptions, options || {})

        // query dataAccess into dataList
        $scope.promiseBusy++

        promise = $q.when(scopeQuery).then(function (_qry) {

          if (!qry)
          {
            qry = _qry

            if (!qry) {
              qry   = $scope.query
            }
            else {
              qry   = angular.extend({}, qry, $scope.query)
            }
          }
        })

        promise = promise.then(function(){ 
            return $scope.db.dataAccess.query(qry, options) 
        })

        promise = promise.then(function(data) { 

          if (!$scope.dataCount) {
            $scope.dataCount = (data && data.length) || 0

            if (!options.limit || options.limit <= $scope.dataCount) {

              $scope.db.dataAccess.count(qry, function (count) { 
                  $scope.dataCount = count 
                })
            }
          }
          $scope.dataList.push.apply($scope.dataList,data)
          return data
        })

        promise.then (function(){ $scope.promiseBusy-- })

        promise.then (function () {
          var state = utils.temp('postState')
            , poster = utils.temp('poster')

          if (gone)
            return
          
          if (listctrl.success)
            listctrl.success ($scope)

          if (gone)
            return

          angular.forEach($scope.dataList, function (data) {

              state.set(data,utils.lookup(data,'_sys.post_state'))
              if (state.get(data)) {

                poster.set(data,utils.lookup(data,'_sys.poster'))
              } else {

                poster.set(data,utils.lookup(data,'info.approved'))
                if (poster.get(data))
                  state.set(data,'approved')
              }


              $scope.db.describe(data)
          })

          if ($scope.dataList && $scope.dataList.length==1) {
            $scope.singleShowFields($scope.dataList[0])
          }

          if (gone)
            return

        })

        return promise
      }

      $scope.readMore = function () {
        if (!$scope.promiseBusy) {
          $scope.loadDataList(null, { skip : $scope.dataList.length })
        }
      }


      $scope.urlBound = function(bound) {
        var url = utils.$location.url()
          , newpath = '/' + $scope.db.name

        if (bound) {
          newpath += '/view/' + bound
        }
        url = url.replace(encodeURI(utils.$location.path()),encodeURI(newpath))
        return '#'+ url
      }

      $scope.goOrder = function(sort) {
        var sortkey

        sort = sort || $scope.sort

        sortkey = sort.name

        if (sort.dir<0) {
          sortkey += '-'
        }

        utils.$location.search('sort',sortkey) 
      }

      $scope.goSearch = function(qry) {

        if ($scope.inspectMode()) {
          for (var k in qry) {
            utils.$location.search({search : '\''+qry[k]}) 
            utils.$location.path('/')       
            return
          }
        }

        utils.$location.search ('q', qry? JSON.stringify(qry) : null)
      }

      $scope.urlSearch = function(qry) {
        if ($scope.inspectMode()) {
          for (var k in qry) {
            return '#/?'+utils.serialize({search : '\''+qry[k]})
          }
        }

        var params = angular.extend({},utils.$location.search())

        if (qry) {

          params['q'] = JSON.stringify(qry)
        }
        else {
          delete params['q']
        }

        //utils.deepStrip(params)
        return '#' + encodeURI(utils.$location.path()) + '?'+utils.serialize(params)
      }

      $scope.goScope = function(val, scopes) {

        if ($scope.inspectMode()) {

          utils.$location.search({search : val}) 
          utils.$location.path('/')       
          return
        }

        var params  = utils.$location.search()
          , sc      = []

        scopes = scopes || $scope.scopes

        if (val) {

          if (scopes.indexOf(val)==-1) {

            scopes.push(val)
          }
        }

        //angular.forEach(scopes,function(v) { sc.push(v) })
        if (scopes.length) {

          params['scopes'] =  JSON.stringify(scopes)
        }
        else {

          delete params['scopes']
        }

        //utils.deepStrip(params)
        utils.$location.search(params)
      }

      $scope.removeScope = function(idx) {

        $scope.scopes.splice(idx,1)
        $scope.goScope()
      }


      $scope.ifSingleShow  = function(_yes, _no) {

        return $scope.dataList.length == 1 ? _yes : _no
      }

      $scope.singleShowFields = function(data) {
        var temp = utils.temp('singleShowFields')

        if (listctrl.db.singleShowFields) {
          return listctrl.db.singleShowFields(data)
        }

        if (!temp.get(data)) {
          temp.set(data, [ { label : 'raw data', value: JSON.stringify(data,undefined,2) } ])
        }

        return temp.get(data)
      }

      if (listctrl.singleShowFields || listctrl.db.singleShowFields)  {

        $scope.singleShowFields = listctrl.singleShowFields || listctrl.db.singleShowFields
      }

      $scope.viewErrors = function(data, errors) {
        var temp = utils.temp('errors')

        temp.set(data,errors)

        $modal.open({
          templateUrl: 'errors-viewer-modal.html',
          controller: 'errorsViewerCtrl',
          resolve: {
            data: function () {
              return data;
            }
          }
        })

      }

      function loadBoundList () {

        if ($scope.db.boundList) {
          var boundlist = $scope.db.boundList

          if (angular.isFunction($scope.db.boundList)) {
            boundlist = $scope.db.boundList()
          }

          return $q.when(boundlist).then(function (list) {

            if (list) {

              if (!$scope.bound) {

                $scope.boundList = list
              }
              else {

                for (var i=0; i < list.length; i++) {

                  if (list[i].name == $scope.bound) {

                    $scope.boundList = list
                    break
                  }
                }
              }

              utils.safe$apply($scope)
            }
          })
        }
      }

      function loadCatList(categories, qry) {

        qry = qry || scopeQuery

        // prepare each categories
        angular.forEach(categories, function(cat) {

          cat.dataList = []

          $q.when(qry).then (function(_qry){

            $scope.db.dataAccess.distinct(cat.name, _qry).then(function(data) {

              angular.forEach(data, function(v) {

                var q = {}
                  , p

                q[cat.name] = v

                cat.dataList.push({ name : v, qry : q })

                if (utils.notEmpty(cat.catgories)) {

                  loadCatList(cat.catgories, q)
                }
                  
              })
            })
          })
        })
      }

      // load data & describe
      if (!gone) {


        $scope.success = $scope.loadDataList().then (function () {

          if (!gone) {

            angular.forEach($scope.dataList, function(data) {
              var state = utils.temp('state')
                , approved = utils.temp('approved')

              if (utils.lookup(data,'info.selling')) {
                state.set(data,'sold')
              }
              else if (utils.lookup(data,'info.taking.person')) {
                state.set(data, 'taken')
              }

              approved.set(data,utils.lookup(data,'info.approved'))

            })

            $q.when(loadBoundList()).then(function(){

              if (!gone) {

                loadCatList($scope.categories)
              }
            })
          }
          return $scope
        })
      }

    }
  ])
