'use strict';

angular.module('modules.legacy-database', ['mongolabResourceHttp', 'modules.utils'])

  .value('SCHEMA'
  , {
      legacy : // general purpose schema
      {
        _type   : null
      , _name   : null
      , info    : {}
      , meta    : {}
      , display : {}
      }

    })

  .factory(
    'Database',['$mongolabResourceHttp', '$q', 'SCHEMA', 'BUILT_IN', 'COLLECTIONS', 'utils'
  , function($mongolabResourceHttp, $q, SCHEMA, BUILT_IN, COLLECTIONS, utils)
    {
      var database = { BUILT_IN : BUILT_IN }

      database.COLLECTIONS = COLLECTIONS

      database.legacy = function(name) {

          var schema = (database.COLLECTIONS[name] || name)

          if (angular.isString(schema))
            this.name= schema
          else
          {
            if (angular.isObject(schema))
              angular.extend(this,schema)
          }

          this.dataAccess = new $mongolabResourceHttp(this.name)
          this.database   = database

          // resolve schema property
          var schema

          if (this.schema) 
          {
            if (this.schema == true)
              this.schema = 'legacy'

            schema = angular.isObject(this.schema)? this.schema : SCHEMA[this.schema] 

          }
          if (!angular.isObject(schema))
            schema = {}
          this.schema = schema

        }

      // create new empty resource
      database.legacy.prototype.resource 
      = function(schema) 
        {
          if (!schema) {
            schema = angular.copy(this.schema)
          }
          return new this.dataAccess(schema)
        }

      database.legacy.prototype.rawScopeQuery 
      = function(keyword, scopeFields) 
        {
          var self = this
            , kmatch, xcmd

          if (!keyword)
            return

          if (angular.isArray(keyword))
          {
            var qs = []
              , q

            angular.forEach(keyword, function(k)
            {
              q = self.rawScopeQuery(k, scopeFields)
              if (q)
                qs.push (q)              
            })
            if (qs.length)
            {
              return qs.length==1? qs[0] : {$and : qs}
            }
            return 
          }

          // && operator 
          if ((kmatch = keyword.split(/\s+\&\&\s+/))) {
            if (kmatch.length > 1) {
              return self.rawScopeQuery(kmatch, scopeFields)
            }
          }

          // || operator 
          if ((kmatch = keyword.split(/\s+\|\|\s+/))) {
            if (kmatch.length > 1) {
              var q, qs = []

              angular.forEach(kmatch, function (kw) {
                q = self.rawScopeQuery(kmatch, scopeFields)
                if (q) {
                  qs.push(q)
                }
              })
              if (q) {
                return qs.length==1? qs[0] : { $or : qs }               
              }
              return
            }
          }

          if (keyword && self.queries) {
            for (var q in self.queries) {
              q = self.queries[q]
              if (q.name == keyword && q.value) {
                return self.rawScopeQuery(q.value, scopeFields)
              }
              if ('!'+q.name == keyword && q.notValue) {
                return self.rawScopeQuery(q.notValue, scopeFields)
              }
            }
          }


          function _qdef(kw, not) {

              var qdef

              if (kw.length==24 && kw.match(/^[0-9a-f]+$/)) {
                // may be object id 'xxxxxxxxx
                var q = {}

                q[(not?'$nin':'$in')] = [ {$oid : keyword} ] 
                
                return [{ '_id' : q }]
              }


              if (kw.match(/^\'/)) {
                // single quote prefix - exactly match 
                qdef = kw.slice(1,kw.length)
              }
              else if (kw.match(/^\".*\"$/)) {
                // double quote suffix - exactly match
                qdef = kw.slice(1,kw.length-1)
              }
              else {
                // otherwise may be regex or any str
                if (!kw.match(/(^\^|\$$|\.\*)/)) {
                  // auto search with LIKE operator
                  kw = '.*' + utils.escapeRegex(kw) + '.*'
                }

                qdef = { $regex : kw }

                if (kw.match(/[a-z]/) && !kw.match(/[A-Z]/)) {
                  qdef.$options = 'i'
                }
              }

              if (not) {
                qdef = angular.isObject(qdef)? { $not : qdef } : { $ne : qdef }
              }              
              return qdef            
          }

          if (keyword == '@all') {
            return {}
          }

          xcmd = keyword.match(/^(\!)?\@([a-z._]+)$/) 
          if (xcmd)
          {
            var  q = {}

            q[xcmd[2]] = { $exists : !xcmd[1]}
            return q
          }

          xcmd = keyword.match(/^(\!)?\@([a-z._]+)\=(.+)$/) 
          if (xcmd)
          {
            var q = {}
              , qdef = _qdef(xcmd[3], xcmd[1])

            if (angular.isArray(qdef)) {
              return qdef.length==1 ? qdef[0] : { $or : qdef }
            }

            q[xcmd[2]] = qdef
            return q
          }


          if (!scopeFields) {

            if (scopeFields == undefined) {
              var fields  = ['_name']

              angular.forEach(this.categories, function(v){
                if (fields.indexOf(v.name)==-1) 
                  fields.push(v.name)
              })

              angular.forEach(this.descriptions, function(k){
                k = k.name || k

                if (fields.indexOf(k)==-1) 
                  fields.push(k)
              })

              this.scopeFields = fields
            }
            scopeFields = this.scopeFields
          }

          if (keyword) 
          {
            var qs   = []
              , qdef

            if (keyword.length==24 && keyword.match(/^[0-9a-f]+$/)) {
              // may be object id 'xxxxxxxxx
              qs.push ({ '_id' : {$in : [ {$oid : keyword} ]} })
            }
            else {
              if (scopeFields) {

                qdef = _qdef(keyword)

                angular.forEach(scopeFields, function(n)
                {
                  var q = {}

                  q [n] = qdef
                  qs.push (q)

                })
              }
            }

            if (qs.length)
            {
              qs = (qs.length==1)? qs[0] : { $or : qs }
              return qs
            }
            
          }
          
        }

      database.legacy.prototype.scopeQuery = function(keyword, scopeFields) {
        var self = this
        
        if (this.limitScope) {
          keyword = this.limitScope(keyword)
        }

        return $q.when(keyword).then(function (kw) {
          return self.rawScopeQuery(kw, scopeFields)
        })
      }

      database.legacy.prototype.describeItem  = function (k, v) {
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

            if (!itm.format) {
              return
            }
          }
          else {
            var fmt = utils.formatValue(v)

            if (fmt != v) {
              itm.format = fmt
            }
          }
          return itm
        }
      }

      database.legacy.prototype.describe = function(data) {
        var self  = this
          , flds  = this.descriptions
          , temp  = utils.temp('displayItems')

        temp.set(data, [])
        angular.forEach(flds, function(fld) {
          var item = self.describeItem(fld, utils.lookup(data,fld.name || fld))

          if (item) {
            temp.get(data).push(item)
          }
        })

      }

      database.legacy.prototype.getHighest = function(fld, pattern) {
        var options = { limit : 1 }
          , qry = {}
          , o

        o = {}
        o[fld] = -1
        options.sort = o

        o = {}
        o[fld] = 1
        options.fields = o

        qry[fld] = { $regex : pattern.source || pattern }

        // return promise
        return this.dataAccess.query(qry, options)

      }

      return database; 
    }
  ])


