/*
global require, module, console
*/

// Global methods
var registerTask = require('gulp').task;
var chainTask = require('gulp').series;
var convergeTask = require('gulp').parallel;
var gulp = require('gulp');
var safeAccess = require('safe-access');

// Global Classes
var NodePackageService = require('./NodePackageService');
var LogService = require('./LogService');

// Global variables
var DIR = require('./GulpConst').DIR;
var TASK = require('./GulpConst').TASK;

/*
    note:
        gulp.src() works with paths relative to process.cwd()
        require() works with paths relative to this file's __dirname
*/

var GulpTaskService = function() {// closure
  'use strict';

  // private static variables
  var nodePackageService = NodePackageService.getInstance();

  var gulpTaskList = [{

    name: 'foobar',
    method: function(next) {
      console.log('foobar');
      next();
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
