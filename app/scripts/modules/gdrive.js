'use strict';

angular.module('modules.gdrive', ['modules.google-api', 'modules.utils'])
.service('GDrive', ['$q', 'utils', 'googleApi', 'GAPI_CONFIG', function( $q, utils, googleApi, GAPI_CONFIG){

  var mimeFolder = 'application/vnd.google-apps.folder'

  this.promiseCache = {}

  this.useCache = function (key, func) {
    var hash = utils.hash(key)

    if (this.promiseCache[hash]) {

      if (func === false) {
        delete this.promiseCache[hash]
        return
      }
      
      console.log ('cache hit', key)
      return this.promiseCache[hash]
    }
    return this.promiseCache[hash] = func()
  }

  this.fileMeta = function (fileId) {
    return this.useCache(fileId, function () {

      return googleApi.client.execute({
            path    : 'drive.files.get'
          , params  : {fileId : fileId }
          })
    })
  }

  this.makeQuery = function (query) {

      var q = ['trashed = false', 'hidden = false']

      if (angular.isString(query)) {
        return query
      }

      if (angular.isArray(query)) {
        return q.concat(query).join(' and ')

      }

      angular.forEach(query, function (v, k) {

        if (angular.isString(v)) {
          if (v.match(/^(contains|\=|\!\=|\<|\<\=|\>|\>\=)\s/)) {
            q.push(k + v)
            return
          }

          if (v.match(/\sin$/)) {
            q.push(v + k)
            return
          }

          v = v.replace(/\'/g,'\\\'')
        }


        if (['parents','owners','writers','readers'].indexOf(k)>=0) {
          if (v) {
            q.push ('\'' + v + '\' in '+ k)
          }
          return
        }

        if (['trashed','starred','hidden'].indexOf(k)>=0) {
          q.push (k + ' = ' + !!(v))
          return
        }

        if (v) {

          if (k=='sharedWithMe') {
            q.push(k)
          }
          else {
            q.push (k + ' = \'' + v + '\'')
          }
        }
      })

      return q.join(' and ')
  }

  this.fileList = function (query, token, max) {
    var params = {}

    if (max) {
      params.maxResults = max
    }

    if (token) {
      params.pageToken = token
    }

    if (query) {
        params.q = this.makeQuery(query)
    }

    return googleApi.client.execute({
        path    : 'drive.files.list'
      , params  : params
      })
  }

  this.folders = function (query, token ) {
    if (angular.isString(query)) {
      query = { title : query }
    }

    query = angular.extend({mimeType: mimeFolder}, query || {})

    return this.fileList(query, token)
  }

  this.shareCabinets = function (cabname, shareIds) {

    var self = this
      , promises = []
      , cabs = []

    shareIds = shareIds || GAPI_CONFIG.shareCabinets

    if (!shareIds) {
      return $q.when(null)
    }

    angular.forEach (shareIds, function (id) {

      promises.push (self.folders({ title : cabname, parents : id}).then(function (resp) {

        if (resp && resp.items) {
          return self.fileMeta(id).then(function(app) {
              cabs.push({app: app, items : resp.items})
            })
        }        
      }))
    })

    if (promises.length) {
      return $q.all(promises).then(function () {return (cabs)})
    }
  }

  this.cabinets = function (cabname, appname) {
    var self = this

    // default cabinet name from GAPI_CONFIG
    appname = appname || GAPI_CONFIG.cabinetRoot || 'cabinets'

    if (appname == '@shared') {
      return self.shareCabinets(cabname)
    }

    if (!appname.then) {
      // creat a promise
      appname = this.useCache(appname, function (){ return self.folders( appname ) })
    }

    return appname.then(function (resp) {
      var promises = []
        , cabs = []

      if (resp && resp.items) {
        angular.forEach(resp.items, function (item) {
          var pm

          pm = self.folders({ title : cabname, parents: item.id })

          pm.then(function (resp) {
            if (resp && resp.items) {
              cabs.push ( { app : item, items : resp.items })
            }
          }) 
          promises.push(pm)
        })

        if (promises.length) {
          return $q.all(promises).then(function () {return (cabs)})
        }
      }
      // otherwise, promise will return null
    })
  }


  this.drawers = function (cabinetId, name, autocreate) {

    return this.folders ( { title : name, parents : cabinetId } )
      .then(function (resp) {

        if (resp && !resp.error) {

          if (!resp.items && autocreate) {
            var pm

            pm = googleApi.client.execute({
              path : 'drive.files.insert'
            , params : { resource : { title : name, parents : [{ id : cabinetId}], mimeType : mimeFolder } }
            })

            return pm.then(function (resp){ 
              if (resp && !resp.error) {
                console.log ('insert', cabinetId, resp.parents, resp)
                return [resp] // simulate return array of drawers
              }
            })
          }

          // return array of drawers
          return resp.items
        }

      })
  }

  this.cabinetList = function (cabname, appname) {
    var self = this

    return this.useCache({cabinetList : [cabname, appname]},function (){
      var promise

      promise = self.cabinets(cabname, appname)

      return promise.then(function (cabs) {
          var cablist = []
   
          if (cabs) {

            angular.forEach(cabs, function(cab){
              angular.forEach(cab.items, function (item){

                cablist.push({ owner : cab.app.ownerNames[0], iconLink : cab.app.iconLink, id : item.id })
              })
            })
          }

          return cablist
        })
    })
  }

  this.drawerList = function (name, cabname, appname) {
    var self = this

    return this.cabinetList(cabname, appname).then(function (cabs) {
        var promises = []
          , drawers

        if (cabs) {
          drawers = angular.copy(cabs)
          angular.forEach(drawers, function (cab){
            promises.push (self.drawers(cab.id, name).then(function(items) {

              if (items){
                cab.items = items
              }
            }))
          })
          return $q.all(promises).then(function(){ return drawers })
        }
      })
  }

}])