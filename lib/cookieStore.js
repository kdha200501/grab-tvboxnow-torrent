/*
global require, module, Buffer
*/

// Global Methods
var exit = require('gulp-exit');
var noop = require('node-noop').noop;

// Global Constants
var AUTH = require('./GulpArgv').AUTH;
var AUTH_URL = require('./GulpArgv').AUTH_URL;

// Global Classes
var Http = require('http');
var Querystring = require('querystring');
var LogService = require('./LogService');

var cookieStore = function() {// closure
  "use strict";

  // private variables
  var cookieList = null;

  // private methods
  var getCredentials = function() {
    var data = AUTH ? AUTH.credentials : {};
    data.loginsubmit = '√¨o¬¨¬∫';
    return Querystring.stringify(data);
  };
  var getCookie = function() {
    return cookieList === null ? '' : cookieList.join('; ');
  };
  var fetchCookie = function(next) {
    var data = getCredentials();
    var reqConfig = {
      hostname: AUTH_URL.hostname,
      port: ( AUTH_URL.port || 80 ), // 80 by default
      method: 'POST',
      path: AUTH_URL.path,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    var req = Http.request(reqConfig, function(res) {
        res.setEncoding('utf8');
        res.on('data', noop);
        //res.on('data', function (chunk) {
        //  console.log('Response: ' + chunk);
        //});
        res.on('end', function() {
          cookieList = res.headers['set-cookie'];
          next();
        });
        res.on('error', function() {
          LogService.error.call('CookieStore', 'error fetching cookie');
          exit();
          return;
        });
      }
    );
    req.setTimeout(5000);
    req.write(data);
    req.end();
  };

  // public method
  return {
    getCookie: getCookie,
    fetchCookie: fetchCookie
  };

}();// endClosure

module.exports = cookieStore;
