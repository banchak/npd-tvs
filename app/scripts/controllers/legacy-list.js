'use strict'

angular.module('controllers.legacy-list',['modules.utils'])

  .factory('legacyListDI',['$routeParams', 'utils'
  , function($routeParams, utils)
    {

      return {
            $routeParams  : $routeParams
          , utils         : utils
          }
    }
  ])

  .controller('legacyListCtrl', ['$scope', 'legacyListDI', 'listctrl', 'APP_CONFIG'
  , function($scope, legacyListDI, listctrl, APP_CONFIG)
    {
      var utils       = legacyListDI.utils
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
        $scope.bound = decodeURIComponent(legacyListDI.$routeParams.bound)
        console.log ('bound',$scope.bound)
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

      if ($scope.sort.name && $scope.sort.name != '_name') {
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

      $scope.defaultScopes = ['@sold', '@sellable', '@taken', '@repair', '@stk', '@kept', '@img']
      function promiseReady (resp) {

        $scope.promiseBusy--
        if ($scope.promiseBusy < 0) {
          $scope.promiseBusy = 0
        }
        return resp
      }

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

        if (!qry)
        {
          qry = scopeQuery

          if (!qry) {
            qry   = $scope.query
          }
          else {
            qry   = angular.extend({}, qry, $scope.query)
          }
        } 

        options = angular.extend({}, $scope.queryOptions, options || {})

        // query dataAccess into dataList
        $scope.promiseBusy++

        promise = $scope.db.dataAccess.query(qry, options)

        promise.then(function(data) { 

          if (!$scope.dataCount) {
            $scope.dataCount = (data && data.length) || 0

            if (!options.limit || options.limit <= $scope.dataCount) {

              $scope.db.dataAccess.count(qry, function (count) { 
                  $scope.dataCount = count 
                })
            }
          }
          $scope.dataList.push.apply($scope.dataList,data)

        })

        promise.then (promiseReady,promiseReady)

        promise.then (function () {

          if (gone) {
            return
          }

          if (listctrl.success) {
            listctrl.success ($scope)
          }

          angular.forEach($scope.dataList, function (data) {

            if (!gone) {
              $scope.describe(data)
            }
          })

          if (gone) {
            return
          }
          if ($scope.dataList && $scope.dataList.length==1) {
            $scope.singleShowFields($scope.dataList[0])
          }
        })

        return promise
      }

      $scope.readMore = function () {
        if (!$scope.promiseBusy) {
          $scope.loadDataList(null, { skip : $scope.dataList.length })
        }
      }

      $scope.loadCatList = function(categories, qry) {

          qry = qry || scopeQuery

          // prepare each categories
          angular.forEach(categories, function(cat) {

              cat.dataList = []

              $scope.promiseBusy++

              $scope.db.dataAccess.distinct(cat.name, qry)
                .then(function(data) {

                    angular.forEach(data, function(v) {

                      var q = {}
                        , p

                      q[cat.name] = v

                      cat.dataList.push({ name : v, qry : q })

                      if (utils.notEmpty(cat.catgories)) {

                        $scope.loadCatList(cat.catgories, q)
                      }
                        
                    })
                  })

                .then (promiseReady,promiseReady)

            })
        }

      $scope.goOrder = function(sort) {
        var sortkey

        console.log('goOrder', sort)
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

        if (!data.$temp) {
          data.$temp = function () {}
        }

        if (!data.$temp.singleShowFields) {
          data.$temp.singleShowFields = [ { label : 'dump data', value: JSON.stringify(data,undefined,2) } ]
        }

        return data.$temp.singleShowFields
      }

      if (listctrl.singleShowFields || listctrl.db.singleShowFields)  {

        $scope.singleShowFields = listctrl.singleShowFields || listctrl.db.singleShowFields
      }

      $scope.formatValue = function (v) {
        return utils.formatValue(v)
      }

      $scope.describeItem  = function (k, v) {
        var itm, d

        if (utils.notEmpty(v)) {


          if (k.name) {
            itm = angular.extend({ value : v }, k)
          }
          else {
            itm = { name : k, value : v }
          }

          if (itm.formatter) {
            itm.format = itm.formatter(v)
          }
          return itm
        }
      }

      $scope.descFields = function(data) {

        var flds  = [] 
          , xflds = ['_name'] ;
          
        // prepare exclude fields
        angular.forEach($scope.categories, function(cat) {

            xflds.push(cat.name); 
          })
        
        flds  = []

        angular.forEach(data, function (v, k) {

            if (xflds.indexOf(k)>=0 || k[0]=='$') {
              return
            }

            if (angular.isString(v)) 
            {

              flds.push(k);
              return;
            }
          })
        
        return flds
      }

      if (listctrl.describeItem || listctrl.db.describeItem)  {

        $scope.describeItem = listctrl.describeItem || listctrl.db.describeItem
      }

      if (listctrl.descriptions || listctrl.db.descriptions) {

        $scope.descFields = function () {

          return listctrl.descriptions || listctrl.db.descriptions          
        }
      }

      $scope.describe = function(data) {

        var flds  =  $scope.descFields(data)

        if (!data.$temp) {
          data.$temp = function (){}
        }

        data.$temp.displayItems = []
        angular.forEach(flds, function(fld) {

            var item = $scope.describeItem(fld, utils.lookup(data,fld.name || fld))

            if (item) {

              data.$temp.displayItems.push(item)
            }

          })

      }


      // load data & describe
      if (!gone) {

        $scope.success = $scope.loadDataList().then (function () {

          return $scope
        })
      }

      if (!gone) {

        $scope.loadCatList($scope.categories)            
      }
    }
  ])
