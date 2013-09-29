(function () {

'use strict'

angular.module('npd.product-edit',['controllers.legacy-edit','npd.database'])
  .controller('productEditCtrl', ['$scope', 'legacyEditDI', '$controller','Database', 'GDrive', '$routeParams'
  , function ($scope, legacyEditDI, $controller, Database, GDrive, $routeParams)
    {
      var db    = new Database.legacy('Product')
        , utils = legacyEditDI.utils
        , uis   = legacyEditDI.uis
        
      function getThumbnail (data) {

        if (data && data.meta && data.meta.images) {
          angular.forEach(data.meta.images, function (img) {

            if (img.id && $scope.thumbnailLink===undefined) {

              $scope.thumbnailLink = null

              GDrive.fileMeta(img.id).then(function (meta) {

                  if (meta.thumbnailLink && !meta.trashed) {

                      $scope.thumbnailLink = meta.thumbnailLink
                      //$scope.src = meta.webContentLink //'https://docs.google.com/uc?id=' + img.id
                  }
              })
            }

          })
        }
      }


      var success = function ( ) {

          var services = {

            sellFromTaking : function () {

              $scope.selling().person = $scope.taking().person

              if (!$scope.selling().price) {

                $scope.selling().price = $scope.taking().price
              }
            }

            , 
            takingMsg : function () {
              var memo

              if ($scope.taking().price) {

                memo = utils.formatValue($scope.taking().price)

                if ($scope.taking().remark)
                  memo += ': ' + $scope.taking().remark

                if (!$scope.taking().memo || $scope.taking().memo.indexOf(memo)==-1) {

                  return memo
                }
              }
            }

            , 
            takingMsgChanged : function (oldmsg) {
              var msg

              if (oldmsg) {

                if (!$scope.taking().memo || $scope.taking().memo.indexOf(oldmsg)) {

                  msg = $scope.takingMsg()

                  return msg && msg != oldmsg
                }
              }
            }

            ,
            storeTakingMsg : function (msg) {

              if (msg) {

                if ($scope.taking().memo && $scope.taking().memo.indexOf(msg)==0)
                  return

                if (!$scope.taking().memo && $scope.taking().date)
                  msg += " (" + utils.formatValue($scope.taking().date) + ")"
                

                $scope.taking().memo = msg + '\n' +  ($scope.taking().memo || '')

                if (!$scope.taking().remark || msg.indexOf($scope.taking().remark))
                  $scope.taking().remark = "(" + utils.formatValue(new Date()) + ")"
                
              }
            }

            ,
            getting : function (until, remark) {
              var took

              if ($scope.taking()) {

                $scope.storeTakingMsg($scope.takingMsg())

                until = moment(until).format('YYYY-MM-DD')
                remark = remark || '*รับคืน*'

                took = angular.extend({}, $scope.taking())
                took.until = until
                //took.remark = remark
                $scope.tooks().push(took)
                $scope.taking.parent().taking = {}

                $scope.keeping().person = remark
                $scope.keeping().date = until
              }
            }

            , 
            prohibitPrice : function (item, clear) {

              var price = utils.lookup($scope.resource,'info.lowest_price')
                , flag                

              if (price && item.price) {

                flag = item.price < price

                if (flag && clear) {
                  item.price = 0
                }
                return flag
              }
            }

            , 
            getState : function () {

              if (utils.notEmpty($scope.selling())) {
                return 'sold'
              }
              if (utils.notEmpty($scope.taking().person)) {
                return 'taken'
              }
            }

            ,
            beforeSave : function (savedata) {

                if (savedata._name.match(/\*$/)) {
                  var pattern, xsegs
                    , xx = ($scope.resource._type || '')[0]
                    , yy = moment().format('YY')
                    , sep = '-'
                    , digit = 4


                  pattern = utils.runningPattern(savedata._name, xx, yy, sep, digit)

                  if (pattern) {

                    return $scope.db.getHighest('_name', pattern.join('')).then(function(data) {

                      if (data && data.length) {

                        savedata._name = utils.runningNext(data[0]._name)
                      } else {

                        if (pattern[0]==utils.escapeRegex(xx)) {
                          savedata._name  = xx + pattern[1] + sep + '*'
                        }

                        savedata._name = savedata._name.replace(/\*$/,'0000000001'.substr(10-digit))
                      }

                      return savedata
                    })
                  }

                  savedata._name = savedata._name.replace(/\*$/,'0000000001'.substr(10-digit))
                }
                return savedata
              }


          }

          angular.extend($scope, services)

          $scope.resource$entry.init('meta',['gems', 'providings', 'repairings', 'tooks', 'kepts', 'refs'])
          $scope.resource$entry.init('info',['buying', 'taking', 'keeping', 'selling', 'metal', 'watch'])


          function calc() {
            var self = this

            function _percent (pc, base,round){
              round = round || 100
              return Math.round((pc/base) * round)
            }

            this.calc_providing_cost = function () {
              self.providing_cost = utils.sum($scope.providings(), 'cost')
            }

            this.calc_repair_cost = function () {
              self.repair_cost = utils.sum($scope.repairings(), 'cost')
            }

            this.calc_total_cost = function () {
              self.total_cost = self.repair_cost + $scope.resource.info.cost
            }

            this.calc_total_buying_cost = function () {
              self.total_buying_cost = +($scope.buying().cost) + self.providing_cost
            }

            this.calc_provider_cost = function () {
              // onchange: buying.cost, cost

              $scope.buying().provider_cost = +($scope.resource.info.cost) - self.total_buying_cost

              self.provider_cost_percent = 0
              if (+($scope.buying().cost) ) {
                self.provider_cost_percent = _percent(+($scope.buying().provider_cost),+($scope.buying().cost))
              }
            }

            this.calc_target_price_percent = function () {
              // onchange: price, cost
              //$scope.resource.info.cost = _percent ($scope.resource.info.cost, self.total_cost, true)

              self.price_percent = 0
              if (self.total_cost) {
                self.target_price_percent = _percent((+($scope.resource.info.target_price) - self.total_cost), self.total_cost)
              }
            }

            this.calc_lowest_price_percent = function () {
              // onchange: lowest_price, cost
              //$scope.resource.info.cost = _percent ($scope.resource.info.cost, self.total_cost, true)

              self.lowest_price_percent = 0
              if (self.total_cost) {
                self.lowest_price_percent = _percent((+($scope.resource.info.lowest_price) - self.total_cost),self.total_cost)
              }self.total_cost
            }

            // init 
            this.calc_repair_cost()
            this.calc_provider_cost()
            this.calc_total_cost()
            this.calc_target_price_percent()
            this.calc_lowest_price_percent()
            getThumbnail($scope.resource)

            $scope.$watch('providings()',this.calc_providing_cost, true)

            $scope.$watch('repairings()',this.calc_repair_cost, true)

            $scope.$watch('calc.providing_cost + buying().cost',this.calc_total_buying_cost)

            $scope.$watch('resource.info.cost - calc.total_buying_cost',this.calc_provider_cost)

            $scope.$watch('calc.repair_cost + buying().cost',this.calc_total_cost)

            $scope.$watch('resource.info.target_price - calc.total_cost',this.calc_target_price_percent)

            $scope.$watch('resource.info.lowest_price - calc.total_cost',this.calc_lowest_price_percent)
          }

          $scope.oldTakingMsg = $scope.takingMsg()

          $scope.calc = new calc ()

          $scope.__moreWatch  = utils.notEmpty($scope.watch())
          $scope.__moreGems   = utils.notEmpty($scope.gems())
          $scope.__moreMetal  = utils.notEmpty($scope.metal())

          if ($routeParams.opr=='getting') {

            $scope.oprImplemented = true
            if ($scope.getState()!='taken') {
              uis.errorBox('Sorry,"'+ $routeParams.opr + '" is not allow!').open().then(function(){
                $scope.editOpr.exit()
              })
            }

            $scope.getting()

            $scope.limitEdit = { keeping: true }

            $scope.__tabIdx = 3
            return
          }

          if ($routeParams.opr=='taking-edit') {

            $scope.oprImplemented = true
            if ($scope.getState()!='taken') {
              uis.errorBox('Sorry,"'+ $routeParams.opr + '" is not allow!').open().then(function(){
                $scope.editOpr.exit()
              })
            }
            $scope.limitEdit = { taking: true }

            $scope.__tabIdx = 3
            return
          }

          if ($routeParams.opr=='buying-back') {

            $scope.oprImplemented = true
            if ($scope.getState()!='sold') {
              uis.errorBox('Sorry,"'+ $routeParams.opr + '" is not allow!').open().then(function(){
                $scope.editOpr.exit()
              })
            }

            $scope.initDitto($scope.resource)
            $scope.resource.info.buying = {
              date : moment().format('YYYY-MM-DD'), 
              person : $scope.selling().person,
              cond : '*ซื้อคืน*',
            }
            $scope.refs().push({name : $scope.resource._name})

            $scope.resource._name = $scope.resource._name.replace(/\d+[-]\d+$/,'*')
            $scope.resource.info.keeping = {}
            $scope.resource.info.taking = {}
            $scope.resource.info.selling = {}
            $scope.resource._sys = {}
            $scope.resource.meta.tooks = []
            $scope.resource.meta.providings = []
            $scope.resource.meta.repairings = []

            $scope.__tabIdx = 1
            return
          }


        }
      
      // init by base controller
      $controller (
        'legacyEditCtrl'
      , {
          $scope        : $scope
        , legacyEditDI  : legacyEditDI
        , editctrl      : { db : db, success : success }
        })

    }
  ])


}).call(this);