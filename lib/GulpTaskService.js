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
var merge = require('merge-stream');
var map = require('map-stream');

// Global Classes
var Http = require('http');
var Querystring = require('querystring');
var NodePackageService = require('./NodePackageService');
var LogService = require('./LogService');
var VinylService = require('./VinylService');

// Global Constants
var DIR = require('./GulpConst').DIR;
var TASK = require('./GulpConst').TASK;

// Global Variables
var cookieStore = require('./cookieStore');
var AUTH = require('./GulpArgv').AUTH;
var AUTH_URL = require('./GulpArgv').AUTH_URL;

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
      if( directoryExists(DIR.SUBSCRIPTION) ) {
        next();
      }
      else {
        return nodePackageService.mkdirP(DIR.SUBSCRIPTION, function(err) {
          if(err === null) {
            logError('add subscriptions in directory:', DIR.SUBSCRIPTION);
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
      if( directoryExists(DIR.DOWNLOAD) ) {
        next();
      }
      else {
        return nodePackageService.mkdirP(DIR.DOWNLOAD, function(err) {
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
      var src = gulp.src('auth.json');
      return src.pipe( map(vinylService.getCookie) );
    }

  }, {

    name: 'downloadSubscription',
    method: function(next, logInfo, logError) {
      var pipeList = ls(DIR.SUBSCRIPTION).map(function(fileName) {
        var src = gulp.src( joinPath(DIR.SUBSCRIPTION, fileName) );
        var dst = gulp.dest(DIR.SUBSCRIPTION);
        return src
          .pipe( map(vinylService.listTorrent) )
          .pipe( map(vinylService.downloadTorrent) )
          .pipe(dst);
      });
      return merge.apply(null, pipeList);
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
