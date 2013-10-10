'use strict'

angular.module('tvs.project')
.service('GAPI_CONFIG', ['COLLECTIONS', '$cookies', function(COLLECTIONS, $cookies) {
  return {
    client_id: '1088349293256.apps.googleusercontent.com',
    scopes: [
      'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar'
    ]
    //, immediate : true
    ,
    apiKey: 'AIzaSyAkP37SMBfu2WTW0efOo0NfGLzJkKXE_xY',
    cabinetRoot: 'tvsfiles',
    shareCabinets: ['0B4yFwOMMfo5HZk96REVZaEkwMkk'],
    clientServices: [{
      name: 'drive',
      version: 'v2'
    }, {
      name: 'calendar',
      version: 'v3'
    }],
    userSignIn: function(user) {
      var roles
        , email = user.email
        , incog = ($cookies.incognito == email)

      if (email) {

        roles = ['MEMBER']

        if (!incog) {

          if (email.match(/\@(adm\-thai\.homeip\.net)$/)) {
            // match domain
            roles = roles.concat(['STAFF', 'OFFICER'])

            // match user in domain
            //if (email.match(/^(noom|admin)\@h2heng.com$/)) {
            //  roles = roles.concat( ['MANAGER', 'ADMIN'])
            //}
          }

          if (email.match(/tvs_u\.siwarut\@adm-thai\.homeip\.net/))
            roles = roles.concat(['MANAGER'])

          if (email.match(/^(jsat66|adm\.thai|banchag|jackkrit07)\@gmail\.com$/))
            roles = roles.concat(['STAFF', 'DEVELOPER'])
          

          if (email.match(/panida66\@gmail\.com/))
            roles = ['STAFF', 'OFFICER']
        }        
      }

      user.setRoles(roles)

      return user
    }
  }
}])

