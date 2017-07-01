/*
global require, module, Buffer, JSON
*/

// Global Methods
var parseTorrent = require('./parseTorrent');
var downloadTorrent = require('./downloadTorrent');
var noop = require('node-noop').noop;
var exit = require('gulp-exit');

// Global Classes
var NodePackageService = require('./NodePackageService');
var LogService = require('./LogService');
var Http = require('http');
var Url = require( "url" );
var Cheerio = require('cheerio');
var Queue = require('queue');

// Global Variables
var AUTH_URL = require('./GulpArgv').AUTH_URL;
var cookieStore = require('./cookieStore');

var VinylService = function() {// closure
  'use strict';

  // private static variables
  var nodePackageService = NodePackageService.getInstance();

  var vinylMethodList = [{

    name: 'getCookie',
    method: function(vinyl, next){
      if( vinyl.extname.toLowerCase() !== '.json' ) {
        LogService.error.call('getCookie', 'not a json file:', vinyl.path);
        exit();
        return;
      }
      // endIf file is not a json file

      var auth = null;
      try {
        auth = JSON.parse(vinyl.contents);
        LogService.info.call('getCookie', vinyl.path);
      }
      catch(e) {
        LogService.error.call('getCookie', 'corrupted json file:', vinyl.path);
        exit();
        return;
      }

      cookieStore.fetchCookie(next);
    }

  }, {

    name: 'listTorrent',
    method: function(vinyl, next){
      if( vinyl.extname.toLowerCase() !== '.json' ) {
        LogService.error.call('listTorrent', 'not a json file:', vinyl.path);
        next();
        return;
      }
      // endIf file is not a json file

      var subscription = null;
      try {
        subscription = JSON.parse(vinyl.contents);
        LogService.info.call('listTorrent', vinyl.path);
      }
      catch(e) {
        LogService.error.call('listTorrent', 'corrupted json file:', vinyl.path);
        next();
        return;
      }

      var domain = [AUTH_URL.protocol, AUTH_URL.hostname].join('//');
      var url = Url.parse( [domain, subscription.urlPath].join('/') );
      var reqConfig = {
        hostname: url.hostname,
        port: ( url.port || 80 ), // 80 by default
        method: 'GET',
        path: url.path,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieStore.getCookie()
        }
      };
      var req = Http.request(reqConfig, function(res) {

          var body = [];
          res.setEncoding('utf8');
          res.on('data', function(chunk) {
            body.push(chunk);
          });
          res.on('error', function(e) {
            LogService.error.call('listTorrent', 'server error for subscription:', vinyl.path);
            next();
            return;
          });
          res.on('end', function() {
            parseTorrent( body.join(''), subscription.excludeRegexp).forEach(function(torrent) {
              //LogService.info.call('listTorrent', torrent)
              if(subscription[torrent.id] === true) {
                subscription[torrent.id] = torrent;
                subscription[torrent.id].downloaded = true;
              }
              // endIf torrent already downloaded by a previous version of this software TODO: remove this clause when done transitioning
              else if(subscription[torrent.id] && subscription[torrent.id].downloaded === true) {
                noop();
              }
              // endIf torrent already downloaded
              else if(subscription[torrent.id] && subscription[torrent.id].downloaded === false) {
                noop();
              }
              // endIf torrent sighted but not downloaded
              else {
                subscription[torrent.id] = torrent;
                subscription[torrent.id].downloaded = false;
              }
              // endIf new torrent
            });

            vinyl.contents = new Buffer( JSON.stringify(subscription, null, '\t') );
            next(null, vinyl);
          });

        }// endRequest page
      );
      req.end();
    }

  }, {

    name: 'downloadTorrent',
    method: function(vinyl, next){
      var torrentList = [];
      var subscription = JSON.parse(vinyl.contents);
      for(var key in subscription) {
        if( subscription.hasOwnProperty(key) ) {
          var download = subscription[key].downloaded === true ?
            nodePackageService.getArgs().force === true : subscription[key].downloaded === false;
          if(download) {
            torrentList.push(subscription[key]);
          }
        }
        // endIf torrent not downloaded
      }
      if(!torrentList[0]) {
        LogService.info.call('downloadTorrent', 'all downloads are up to date');
        next();
        return;
      }
      // endIf nothing to download

      var queue = new Queue();
      queue.concurrency = 1;

      torrentList.forEach(function(torrent) {
        queue.push(function(_next) {
          downloadTorrent(torrent, function() {
            subscription[torrent.id].downloaded = true;
            _next();
          }, _next);
        });
      });
      // endEach torrent

      queue.start(function() {
        vinyl.contents = new Buffer( JSON.stringify(subscription, null, '\t') );
        next(null, vinyl);
      });
    }

  }];

  // private static class
  var VinylService_ = function(config) {
    return function(vinylMethodList) {// closure

      // private variables and methods
      var buildService = function(service, vinylMethod) {
        service[vinylMethod.name] = vinylMethod.method;
        return service;
      };

      // public methods
      return vinylMethodList.reduce(buildService, {});

    }(config.vinylMethodList || []);// endClosure
  };

  // public singleton
  var singleton = null;
  return {
    getInstance: function() {
      if(singleton === null) {
        singleton = new VinylService_({vinylMethodList: vinylMethodList});
      }
      return singleton;
    }
  };
}();// endClosure

module.exports = VinylService;
