'use strict'

angular.module('npd.project')
  .service('GAPI_CONFIG', ['COLLECTIONS', '$cookies',
    function(COLLECTIONS, $cookies) {
      return {
        client_id: '1088349293256.apps.googleusercontent.com',
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/calendar'
          //,   'https://www.googleapis.com/auth/calendar.readonly'
        ]
        //, immediate : true
        ,
        apiKey: 'AIzaSyAkP37SMBfu2WTW0efOo0NfGLzJkKXE_xY',
        cabinetRoot: 'npd3files',
        shareCabinets: ['0B6k4xcbssloceFZiVVZPTVJCOXc'],
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
              if (email.match(/\@(h2heng\.com|adm\-thai\.homeip\.net)$/)) {
                // match domain
                roles = roles.concat(['STAFF'])

                // match user in domain
                if (email.match(/^choo456\@h2heng.com$/))
                  roles = roles.concat(['MANAGER'])
                
                // match user in domain
                if (email.match(/^(noom|admin)\@h2heng.com$/))
                  roles = roles.concat(['MANAGER', 'ADMIN'])
              }

              if (email.match(/\@(adm\-thai\.homeip\.net)$/)) {

                // match domain
                if (!email.match(/user[1-4]/))
                  roles = roles.concat(['OFFICER'])
                

                if (email.match(/user2/))
                  roles = roles.concat(['OFFICER.COST'])
                
                if (email.match(/user3/))
                  roles = roles.concat(['MANAGER'])
                
                if (email.match(/user4/))
                  roles = roles.concat(['ADMIN'])
                
              }

              if (email.match(/^(jsat66|adm\.thai|banchag|jackkrit07)\@gmail\.com$/))
                roles = roles.concat(['STAFF', 'MANAGER', 'DEVELOPER'])

              if (email.match(/panida66\@gmail\.com/))
                roles = ['STAFF']
              
            }

          }

          user.setRoles(roles)

          if (!user.hasRole('OFFICER', 'OFFICER.COST', 'MANAGER', 'STAFF.IT',
            'ADMIN', 'DEVELOPER')) {

            COLLECTIONS.Product.limitScope = function(keyword) {
              return ['@sellable', keyword]
            }
          } else {

            COLLECTIONS.Product.limitScope = null
          }
          return user
        }
      }
    }
  ])
