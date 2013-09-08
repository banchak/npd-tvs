// jsat66@gmail.com 2013-8-22
// for all Thai people with love, use as your risks.

(function () {

' use strict'

// number to string, pluginized from http://stackoverflow.com/questions/5529934/javascript-numbers-to-words
  var translates = {
    en : {
        zero    : 'zero'
      , ones    : ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ']
      , tens    : ['','','twenty ','thirty ','forty ','fifty ','sixty ','seventy ','eighty ','ninety ']
      , teens   : ['ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen ']
      , million : 'million '
      , thousand : 'thousand '
      , hundred : 'hundred '
      , bahtText : {
          baht : 'BAHT '
        , stg  : 'SATANG'
        , only : 'ONLY'
        , and  : ''
      }
    }
  , th : {
        zero    : 'ศูนย์'
      , ones    : ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
      , tens    : ['','','ยี่สิบ','สามสิบ','สี่สิบ','ห้าสิบ','หกสิบ','เจ็ดสิบ','แปดสิบ','เก้าสิบ']
      , teens   : ['สิบ','สิบเอ็ด','สิบสอง','สิบสาม','สิบสี่','สิบห้า','สิบหก','สิบเจ็ด','สิบแปด','สิบเก้า']
      , hundred : 'ร้อย'
      , thousand : 'พัน'
      , million : 'ล้าน'
      , alt : {
          ones    : ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
        , tens    : ['','หนึ่งหมื่น','สองหมื่น','สามหมื่น','สี่หมื่น','ห้าหมื่น','หกหมื่น','เจ็ดหมื่น','แปดหมื่น','เก้าหมื่น']
        , teens   : ['หนึ่งหมื่น','หนึ่งหมื่นหนึ่ง','หนึ่งหมื่นสอง','หนึ่งหมื่นสาม','หนึ่งหมื่นสี่','หนึ่งหมื่นห้า','หนึ่งหมื่นหก','หนึ่งหมื่นเจ็ด','หนึ่งหมื่น','หนึ่งหมื่น']
        , hundred : 'แสน'
      }
      , bahtText : {
          baht : 'บาท'
        , stg  : 'สตางค์'
        , only : 'ถ้วน'
        , and  : ''
      }
      , finalize : function (txt) {
        txt = txt.replace(/หมื่นพัน/g,'หมื่น')
        txt = txt.replace(/แสนพัน/g,'แสน')
        txt = txt.replace(/สิบหนึ่ง/g,'สิบเอ็ด')
        return txt
      }
    }
  }


  function num2str (lang) {
    if (typeof lang == 'Object') {
      this.translate = lang
    }
    else {
      this.translate = translates[lang || 'en'] || translates['en'] 
    }


  }

  num2str.prototype.convert_millions = function(num) {
    if (num >= 1000000) {
      return this.convert_millions(Math.floor(num / 1000000), true) + this.translate.million + this.convert_thousands(num % 1000000);
    }
    return this.convert_thousands(num);
  }

  num2str.prototype.convert_thousands = function(num) {
    if (num >= 1000) {
      return this.convert_hundreds(Math.floor(num / 1000), true) + this.translate.thousand + this.convert_hundreds(num % 1000);
    }
    return this.convert_hundreds(num);
  }

  num2str.prototype.convert_hundreds = function(num, alt) {
    var translate = this.translate
    if (alt && translate.alt) {
      translate = translate.alt
    }

    if (num > 99) {
      return translate.ones[Math.floor(num / 100)] + translate.hundred + this.convert_tens(num % 100, alt);
    }
    return this.convert_tens(num, alt);
  }

  num2str.prototype.convert_tens = function(num, alt) {
    var translate = this.translate
    if (alt && translate.alt) {
      translate = translate.alt
    }

    if (num < 10) {
      return translate.ones[num]
    }
    else if (num >= 10 && num < 20) {
      return translate.teens[num - 10];
    }
    return translate.tens[Math.floor(num / 10)] + translate.ones[num % 10];
  }

  num2str.prototype.convert = function(num) {
    var result

    if (num == 0) {
      result = this.translate.zero
    }
    else {
      result = this.convert_millions(num)
    }
    if (this.translate.finalize) {
      result = this.translate.finalize(result)
    }
    return result
  }

  num2str.format = function (num, lang) {
    return (new num2str(lang)).convert(num)
  }

  num2str.bahtText = function (num, lang) {
    var converter = new num2str(lang)
      , baht = Math.floor(num)
      , stg  = Math.round((num-baht)*100)
      , result

    result = ''
    if (baht) {
      result += converter.convert(baht) + converter.translate.bahtText.baht
    } 

    if (stg) {
      if (result) {
        result += converter.translate.bahtText.and
      }

      result += converter.convert(stg) + converter.translate.bahtText.stg
    }
    else if (result) {
      result += converter.translate.bahtText.only
    }

    return result
  }


  /************************************
      Exposing
  ************************************/
  // CommonJS module is defined
  if (typeof module !== 'undefined' && module.exports) {
      module.exports = num2str
  }
  /*global ender:false */
  if (typeof ender === 'undefined') {
      // here, `this` means `window` in the browser, or `global` on the server
      // add `num2str` as a global object via a string identifier,
      // for Closure Compiler "advanced" mode
      this['num2str'] = num2str
  }
  /*global define:false */
  if (typeof define === "function" && define.amd) {
      define("num2str", [], function () {
          return num2str
      })
  }
}).call(this);