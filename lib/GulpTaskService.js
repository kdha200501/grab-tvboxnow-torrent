/*
global require, module
*/

// Global Methods
var registerTask = require('gulp').task;
var chainTask = require('gulp').series;
var convergeTask = require('gulp').parallel;
var gulp = require('gulp');
var safeAccess = require('safe-access');
var noop = require('node-noop').noop;
var exit = require('gulp-exit');
var directoryExists = require('fs').existsSync;
var ls = require('fs').readdirSync;
var joinPath = require('path').join;
var map = require('map-stream');
var isString = require('lodash.isstring');

// Global Classes
var Http = require('http');
var Querystring = require('querystring');
var NodePackageService = require('./NodePackageService');
var LogService = require('./LogService');
var VinylService = require('./VinylService');
var Queue = require('queue');

// Global Constants
var TASK = require('./GulpConst').TASK;

// Global Variables
var cookieStore = require('./cookieStore');
var AUTH = require('./GulpArgv').AUTH;
var AUTH_URL = require('./GulpArgv').AUTH_URL;
var PLEX_API = require('./GulpArgv').PLEX_API;
var PLEX_SECTION = require('./GulpArgv').PLEX_SECTION;
var PLEX_SECTION_ID = require('./GulpArgv').PLEX_SECTION_ID;
var DIR_SUBSCRIPTION = require('./GulpArgv').DIR_SUBSCRIPTION;
var DIR_DOWNLOAD = require('./GulpArgv').DIR_DOWNLOAD;
var DIR_CWD = require('./GulpArgv').DIR_CWD;

/*
    note:
        gulp.src() works with paths relative to process.cwd()
        require() works with paths relative to this file's __dirname
*/

var GulpTaskService = function() {// closure
  'use strict';

  // private static variables
  var nodePackageService = NodePackageService.getInstance();
  var vinylService = VinylService.getInstance();

  var gulpTaskList = [{

    name: 'subscriptionMkdirP',
    method: function(next, logInfo, logError) {
      if( directoryExists(DIR_SUBSCRIPTION) ) {
        next();
      }
      else {
        return nodePackageService.mkdirP(DIR_SUBSCRIPTION, function(err) {
          if(err === null) {
            logError('add subscriptions in directory:', DIR_SUBSCRIPTION);
          }
          else {
            logError(err);
          }
          exit();
        });
      }
    }

  }, {

    name: 'downloadMkdirP',
    method: function(next, logInfo, logError) {
      if( directoryExists(DIR_DOWNLOAD) ) {
        next();
      }
      else {
        return nodePackageService.mkdirP(DIR_DOWNLOAD, function(err) {
          if(err === null) {
            next();
          }
          else {
            logError(err);
            exit();
          }
        });
      }
    }

  }, {

    name: 'getCookie',
    method: function() {
      var src = gulp.src( joinPath(DIR_CWD, 'auth.json') );
      return src.pipe( map(vinylService.getCookie) );
    }

  }, {

    name: 'downloadSubscription',
    method: function(next, logInfo, logError) {

      var queue = new Queue();
      queue.concurrency = 1;

      ls(DIR_SUBSCRIPTION).forEach(function(fileName) {
        queue.push(function(_next) {
          var src = gulp.src( joinPath(DIR_SUBSCRIPTION, fileName) );
          var dst = gulp.dest(DIR_SUBSCRIPTION);
          return src
            .pipe( map(vinylService.listTorrent) )
            .pipe( map(vinylService.downloadTorrent) )
            .pipe(dst)
            .on('end', _next);
        });
      });
      // endEach subscription file

      queue.start(function() {
        next();
      });
    }

  }, {

    name: 'getPlexSectionId',
    method: function(next, logInfo, logError) {
      var query = ['', 'library', 'sections'].join('/');
      PLEX_API.query(query).then(function(result) {

        // ON SUCCESS
        var sectionList = safeAccess(result, 'MediaContainer.Directory') || [];
        var sectionTitleMatched = false;
        for(var i = 0; i < sectionList.length; i++) {
          var section = sectionList[i];
          if(section.title === PLEX_SECTION) {
            PLEX_SECTION_ID = section.key;
            sectionTitleMatched = true;
            break;
          }
          // endIf section's title matches section specified by the user
        }
        // endEach section

        if(sectionTitleMatched) {
          next();
        }
        // endIf section found on plex server
        else {
          exit();
        }
        // endIf section not found on plex server

      }, function(err) {

        // ON ERROR
        logError('Could not connect to plex server', err);
        exit();

      });
    }

  }, {

    name: 'refreshPlexSection',
    method: function(next, logInfo, logError) {
      var query = ['', 'library', 'sections', PLEX_SECTION_ID, 'refresh'].join('/');
      PLEX_API.query(query).then(function(result) {

        // ON SUCCESS
        next();

      }, function(err) {

        // ON ERROR
        logError('Could not connect to plex server', err);
        exit();

      });
    }

  }];

  // private static class
  var singleton = null;
  var GulpTaskService_ = function(config) {
    return function(gulpTaskList) {// closure

      // private variables and methods
      var buildService = function(service, gulpTask) {
        var logInfo = function() {// prepended info log with task name
          LogService.info.apply(gulpTask.name, arguments);
        };
        var logError = function() {// prepended error log with task name
          LogService.error.apply(gulpTask.name, arguments);
        };
        var method = function(next) {
          if(gulpTask.name !== 'noop') {
            logInfo('Started');
          }
          return gulpTask.method(next, logInfo, logError);
        };
        registerTask(gulpTask.name, method);
        service[gulpTask.name] = method;
        return service;
      };

      // public methods
      return gulpTaskList.reduce(buildService, {});

    }(config.gulpTaskList || []);// endClosure
  };

  // public singleton
  return {
    getInstance: function() {
      if(singleton === null) {
        singleton = new GulpTaskService_({gulpTaskList: gulpTaskList});
      }
      return singleton;
    }
  };
}();// endClosure

module.exports = GulpTaskService;
