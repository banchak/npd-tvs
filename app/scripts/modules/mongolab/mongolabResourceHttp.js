angular.module('mongolabResourceHttp', []).factory('$mongolabResourceHttp', ['MONGOLAB_CONFIG', '$http', function (MONGOLAB_CONFIG, $http) {

  function MmongolabResourceFactory(collectionName) {

    var config = angular.extend({
      BASE_URL : 'https://api.mongolab.com/api/1/databases/'
    }, MONGOLAB_CONFIG);

    var dbUrl = config.BASE_URL + config.DB_NAME;
    var collectionUrl = dbUrl + '/collections/' + collectionName;
    var defaultParams = (config.API_KEY && {apiKey:config.API_KEY}) || {} ;

    var resourceRespTransform = function(data) {
       return new Resource(data);
    };

    var resourcesArrayRespTransform = function(data) {
      var result = [];
      for (var i = 0; i < data.length; i++) {
        result.push(new Resource(data[i]));
      }
      return result;
    };

    var promiseThen = function (httpPromise, successcb, errorcb, transformFn) {
      return httpPromise.then(function (response) {
        var result = transformFn(response.data);
        (successcb || angular.noop)(result, response.status, response.headers, response.config);
        return result;
      }, function (response) {
        ;(errorcb || angular.noop)(response.data, response.status, response.headers, response.config);
        return undefined;
      });
    };

    var preparyQueryParam = function(queryJson) {
      return angular.isObject(queryJson)? {q:JSON.stringify(queryJson)} : {};
      //return angular.isObject(queryJson)&&!angular.equals(queryJson,{}) ? {q:JSON.stringify(queryJson)} : {};
    };

    var Resource = function (data) {
      angular.extend(this, data);
    };

    Resource.bulkInsert = function (dataArray, successcb, errorcb) {

      var httpPromise = $http.post(
                collectionUrl
              , JSON.stringify(dataArray)
              , { params:requestParams }
              );
      return promiseThen(httpPromise, successcb, errorcb, function(data){ return data;});
    }

    // https://support.mongolab.com/entries/20433053-Is-there-a-REST-API-for-MongoDB-
    Resource.bulkUpdate = function (queryJson, data, options, successcb, errorcb) {

      var prepareOptions = function(options) {

        var optionsMapping = {multi: 'm', upsert: 'u'};
        var optionsTranslated = {};

        if (options && !angular.equals(options, {})) {
          angular.forEach(optionsMapping, function (targetOption, sourceOption) {
            if (angular.isDefined(options[sourceOption])) {
              if (angular.isObject(options[sourceOption])) {
                optionsTranslated[targetOption] = JSON.stringify(options[sourceOption]);
              } else {
                optionsTranslated[targetOption] = options[sourceOption];
              }
            }
          });
        }
        return optionsTranslated;
      };

      if(angular.isFunction(options)) { errorcb = successcb; successcb = options; options = {}; }

      var requestParams = angular.extend({}, defaultParams, preparyQueryParam(queryJson), prepareOptions(options));

      var httpPromise = $http.put(
                collectionUrl
              , JSON.stringify(data)
              , { params:requestParams }
              );
      return promiseThen(httpPromise, successcb, errorcb, function(data){ return data;});
    }

    Resource.query = function (queryJson, options, successcb, errorcb) {

      var prepareOptions = function(options) {

        var optionsMapping = {sort: 's', limit: 'l', fields: 'f', skip: 'sk'};
        var optionsTranslated = {};

        if (options && !angular.equals(options, {})) {
          angular.forEach(optionsMapping, function (targetOption, sourceOption) {
            if (angular.isDefined(options[sourceOption])) {
              if (angular.isObject(options[sourceOption])) {
                optionsTranslated[targetOption] = JSON.stringify(options[sourceOption]);
              } else {
                optionsTranslated[targetOption] = options[sourceOption];
              }
            }
          });
        }
        return optionsTranslated;
      };

      if(angular.isFunction(options)) { errorcb = successcb; successcb = options; options = {}; }

      var requestParams = angular.extend({}, defaultParams, preparyQueryParam(queryJson), prepareOptions(options));
      var httpPromise = $http.get(collectionUrl, {params:requestParams});
      return promiseThen(httpPromise, successcb, errorcb, resourcesArrayRespTransform);
    };

    Resource.all = function (options, successcb, errorcb) {
      if(angular.isFunction(options)) { errorcb = successcb; successcb = options; options = {}; }
      return Resource.query({}, options, successcb, errorcb);
    };

    Resource.count = function (queryJson, successcb, errorcb) {
      var httpPromise = $http.get(collectionUrl, {
        params: angular.extend({}, defaultParams, preparyQueryParam(queryJson), {c: true})
      });
      return promiseThen(httpPromise, successcb, errorcb, function(data){
        return data;
      });
    };

    Resource.runCommand = function (commandJson,successcb, errorcb) {
      var httpPromise = $http.post(
                dbUrl + '/runCommand'
              , JSON.stringify(commandJson)
              , { params:defaultParams }
              );
      return promiseThen(httpPromise, successcb, errorcb, function(data){ return data.values;});
    };
    
    
    Resource.distinct = function (field, queryJson, successcb, errorcb) {
      return Resource.runCommand (
                {  distinct: collectionName
                ,  key      : field
                ,  query    :  queryJson || {}
                }
              , successcb
              ,  errorcb 
              );
    };
    

    Resource.getById = function (id, successcb, errorcb) {
      var httpPromise = $http.get(collectionUrl + '/' + id, {params:defaultParams});
      return promiseThen(httpPromise, successcb, errorcb, resourceRespTransform);
    };

    Resource.getByObjectIds = function (ids, successcb, errorcb) {
      var qin = [];
      angular.forEach(ids, function (id) {
        qin.push({$oid:id});
      });
      return Resource.query({_id:{$in:qin}}, successcb, errorcb);
    };

    //instance methods

    Resource.prototype.$id = function () {
      if (this._id && this._id.$oid) {
        return this._id.$oid;
      } else if (this._id) {
        return this._id;
      }
    };

    Resource.prototype.$save = function (successcb, errorcb) {
      var httpPromise = $http.post(collectionUrl, this, {params:defaultParams});
      return promiseThen(httpPromise, successcb, errorcb, resourceRespTransform);
    };

    Resource.prototype.$update = function (successcb, errorcb) {
      var httpPromise = $http.put(collectionUrl + "/" + this.$id(), angular.extend({}, this, {_id:undefined}), {params:defaultParams});
      return promiseThen(httpPromise, successcb, errorcb, resourceRespTransform);
    };

    Resource.prototype.$remove = function (successcb, errorcb) {
      var httpPromise = $http['delete'](collectionUrl + "/" + this.$id(), {params:defaultParams});
      return promiseThen(httpPromise, successcb, errorcb, resourceRespTransform);
    };

    Resource.prototype.$saveOrUpdate = function (savecb, updatecb, errorSavecb, errorUpdatecb) {
      if (this.$id()) {
        return this.$update(updatecb, errorUpdatecb);
      } else {
        return this.$save(savecb, errorSavecb);
      }
    };

    return Resource;
  }
  return MmongolabResourceFactory;
}]);
