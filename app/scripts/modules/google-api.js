(function() {

  "use strict"

  angular.module('modules.google-api', [])

  .config(['$httpProvider',
    function($httpProvider) {
      delete $httpProvider.defaults.headers.common['X-Requested-With']
    }
  ])

  .service('googleApi', ['$timeout', '$q', '$rootScope', '$http', 'GAPI_CONFIG',
    function($timeout, $q, $rootScope, $http, GAPI_CONFIG) {

      var self = this

      // safeApply by https://coderwall.com/p/ngisma

        function _safe$apply(scope) {

          scope = scope || $rootScope

          if (scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest') {

            scope.$apply()
          }
        }

        function _gapi() {

          if (_gapi.promise) {
            // prevent re-invoke during waiting
            return _gapi.promise
          }

          var patience = 100,
            deferred = $q.defer()

            _gapi.promise = deferred.promise

            function _wait() {

              if (gapi.auth && gapi.client) {

                deferred.resolve(gapi)
                delete _gapi.promise
                _safe$apply()
                return
              }

              patience -= 1
              if (!patience) {

                deferred.reject({
                  error: {
                    code: 408,
                    message: 'gapi not instantiate.'
                  }
                })
                delete _gapi.promise
                _safe$apply()
                return
              }

              $timeout(_wait, 300)
            }

          _wait()

          return deferred.promise
        }

      this.safe$apply = _safe$apply
      this._gapi = _gapi() // cache promise
      this.auth = this._gapi.then(function(api) {
        return api.auth
      })
      this.client = this._gapi.then(function(api) {
        return api.client
      })

      this.client.load = function(apiname, version, callback) {

        var deferred, promise, reply

          function _chkReply() {

            if (!reply) {

              deferred.reject({
                error: {
                  code: 408,
                  message: 'client.' + apiname + '.' + version + ' not load.'
                }
              })

            }
          }

        if (!self.client[apiname]) {

          deferred = $q.defer()
          self.client[apiname] = deferred.promise

          self.client.then(function() {

            gapi.client.load(apiname, version, function() {

              reply = true
              deferred.resolve(gapi.client[apiname])
              _safe$apply()
            })

          })

          $timeout(_chkReply, 5 * 60 * 1000) // wait 5 minute

        }

        promise = self.client[apiname]
        if (callback) {
          promise.then(callback)
        }

        return promise
      }

      this.client.setApiKey = function(apiKey) {

        self.client.then(function() {
          gapi.client.setApiKey(apiKey)
        })

      }

      this.userAlive = function() {

        if ($rootScope.authorizeData !== undefined) {

          var token = gapi.auth.getToken()

          if (token) {

            return token.expires_at > ((new Date()).getTime() / 1000)
          }

          return null
        }
      }

      this.userHasRole = function() {

        if ($rootScope.authorizeData && $rootScope.authorizeData.user) {

          var user = $rootScope.authorizeData.user

          if (user.roles) {

            for (var role in arguments) {

              role = arguments[role]

              for (var r in user.roles) {
                r = user.roles[r]
                if (!angular.isString(r)) {
                  continue
                }
                if (r.match(role)) {
                  return r
                }
              }
            }
          }
        }
      }

      this.authorizing = function(req) {

        if (self.authorizing.promise) {
          // prevent re-invoke during resolve promise
          return self.authorizing.promise
        }

        var reply, deferred = $q.defer(),
          request = {
            client_id: GAPI_CONFIG.client_id,
            scope: GAPI_CONFIG.scopes || GAPI_CONFIG.scope,
            immediate: true
          }

        self.authorizing.promise = deferred.promise

        if (angular.isObject(req)) {

          angular.extend(request, req)
        }

        self._gapi.then(function() {

          gapi.auth.authorize(request, function(resp) {

            reply = true

            if (resp && !resp.error) {
              deferred.resolve(resp)
            } else {
              deferred.reject(resp)
            }

            delete self.authorizing.promise
            self.safe$apply()
          })
        })

        // after 1 minute mark as pending
        $timeout(function() {

          if (self.authorizing.promise) {
            console.log('authorize is pending')
            self.authorizing.promise.pending = true
          }
        }, 1 * 60 * 1000)

        return deferred.promise
      }

      this.userInfo = function() {

        if (self.userInfo.promise) {
          // prevent re-invoke during resolve promise
          return self.userInfo.promise
        }

        var deferred = $q.defer(),
          token = gapi.auth.getToken()

          self.userInfo.promise = deferred.promise

        if (token) {

          $http({
            method: 'GET',
            url: 'https://www.googleapis.com/oauth2/v1/userinfo',
            params: {
              access_token: token.access_token
            },
            cache: false
          }).then(

            function(resp) {

              deferred.resolve(resp)
              delete self.userInfo.promise
              self.safe$apply()
            }, function(error) {

              deferred.reject(error)
              delete self.userInfo.promise
              self.safe$apply()
            })

        } else {

          deferred.reject(null)
          delete self.userInfo.promise
          self.safe$apply()
        }

        return deferred.promise
      }


      this.authorize = function(req) {

        if (self.authorize.promise) {
          // prevent re-invoke during resolve  
          console.log('authorize promise already instantiate, no need to start new authorize.')
          return self.authorize.promise
        }

        var deferred = $q.defer()

        self.authorize.promise = deferred.promise

        if (req) {

          // not empty req => force re-authorize
          $rootScope.authorizeData = undefined
        }

        if ($rootScope.authorizeData) {

          deferred.resolve($rootScope.authorizeData)
          delete self.authorize.promise
          self.safe$apply()
        } else {

          $rootScope.authorizeData = null

          self.authorizing(req).then(function() {

              $rootScope.authorizeData = {}
              $rootScope.authorizeData.userHasRole = self.userHasRole

              self.userInfo().then(function(resp) {

                var user = resp.data

                $rootScope.authorizeData.user = user

                if (user) {
                  user.hasRole = $rootScope.authorizeData.userHasRole
                  user.setRoles = function(roles) {
                    user.roles = roles
                    user.limitAccess = !(user.hasRole('STAFF'))
                  }
                }

                if (GAPI_CONFIG.userSignIn) {

                  GAPI_CONFIG.userSignIn(user)
                }

                deferred.resolve($rootScope.authorizeData)
                $rootScope.$broadcast('userSignIn', user)

                delete self.authorize.promise
                self.safe$apply()
              }, function() {

                $rootScope.authorizeData.user = null
                deferred.resolve($rootScope.authorizeData)

                delete self.authorize.promise
                self.safe$apply()
              })
            }

            , function() {

              $rootScope.authorizeData = {
                user: false
              }
              deferred.resolve($rootScope.authorizeData)
              delete self.authorize.promise
              self.safe$apply()
            })

        }

        deferred.promise.then(function(auth) {
          auth.ready = true
        })

        return deferred.promise
      }

      this.client.execute = function(apiquery, callback, req) {

        var deferred = $q.defer()

          function resolve(resp) {

            if (callback) {
              callback(resp)
            }

            deferred.resolve(resp)
            self.safe$apply()
          }

        if (apiquery.path && apiquery.params) {

          var apis = apiquery.path.split(/[\/\.]/)


          self.client[apis.shift()].then(function(api) {

            angular.forEach(apis, function(a) {
              api = api[a]
            })

            self.client.execute(api(apiquery.params), resolve)
          })

        } else {
          // try to execute first
          apiquery.execute(function(resp) {

            if (resp && resp.error && resp.error.code == 401) {

              console.log("code 401 - trigger re authorize before execute again")

              self.authorize(req || {}).then(
                function() {
                  apiquery.execute(resolve)
                }, resolve)
              return
            }
            resolve(resp)
          })
        }

        return deferred.promise
      }

      // init ---
      if (GAPI_CONFIG.apiKey) {

        self.client.setApiKey(GAPI_CONFIG.apiKey)
      }

      if (GAPI_CONFIG.clientServices) {

        angular.forEach(GAPI_CONFIG.clientServices, function(service) {

          self.client.load(service.name, service.version, function(resp) {
            console.log('load', service.name, resp)
          })
        })
      }

      if (GAPI_CONFIG.client_id && GAPI_CONFIG.scopes) {

        self.authorize()
      }

      $rootScope.authorize = self.authorize

    }
  ])
}).call(this);
