
'use strict'

angular.module('npd.project')
  .service('GAPI_CONFIG', ['COLLECTIONS', function (COLLECTIONS){
    return {
      client_id : '1088349293256.apps.googleusercontent.com'
    , scopes    : [
          'https://www.googleapis.com/auth/drive'
      ,   'https://www.googleapis.com/auth/userinfo.email'
      ,   'https://www.googleapis.com/auth/userinfo.profile'
      ,   'https://www.googleapis.com/auth/calendar'
      //,   'https://www.googleapis.com/auth/calendar.readonly'
      ]
    //, immediate : true
    , apiKey    : 'AIzaSyAkP37SMBfu2WTW0efOo0NfGLzJkKXE_xY'
    , cabinetRoot : 'npd3files'
    , shareCabinets : ['0B6k4xcbsslocdEVBZGVBdFJLU2c', '0B4yFwOMMfo5HZk96REVZaEkwMkk']
    , clientServices : [
          {name : 'drive', version : 'v2'}
        , {name : 'calendar', version : 'v3'}
      ]
    , userSignIn : function (user) {
        var email = user.email

        if (email) {

          user.roles = ['MEMBER']

          if (email.match(/\@(h2heng\.com|adm\-thai\.homeip\.net)$/)) {
            // match domain
            user.roles = user.roles.concat(['STAFF'])

            // match user in demain
            if (email.match(/^(noom|admin)\@h2heng.com$/)) {
              user.roles = user.roles.concat( ['MANAGER', 'ADMIN'])
            }
          }

          if (email.match(/\@(adm\-thai\.homeip\.net)$/)) {
            // match domain
            user.roles = user.roles.concat(['OFFICER'])

          }

          if (email.match(/^(jsat66|adm\.thai|banchag|jackkrit07)\@gmail\.com$/)) {
              user.roles = user.roles.concat( ['STAFF', 'MANAGER', 'DEVELOPER'])
            }

          if (email.match(/panida66\@gmail\.com/)){ 
            user.roles = ['STAFF']
          }

          user.roles.has = user.hasRole
        }

        if (!user.roles || !user.roles.has('OFFICER', 'OFFICER.COST', 'MANAGER', 'STAFF.IT', 'ADMIN', 'DEVELOPER')) {
            COLLECTIONS.Product.limitScope = function (keyword) {
              return ['@sellable', keyword]
            }
        }
        return user
      }
    }
  }])
