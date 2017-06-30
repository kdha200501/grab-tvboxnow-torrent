/*
global require, module
*/

// Global methods
var safeAccess = require('safe-access');
var chainTask = require('gulp').series;
var convergeTask = require('gulp').parallel;

// Global classes
var GulpTaskService = require('./GulpTaskService');
var NodePackageService = require('./NodePackageService');

// Global variables
var TASK = require('./GulpConst').TASK;
var ENV = require('./GulpConst').ENV;
var $1 = require('./GulpArgv').$1;

var OrchestrationService = function() {// closure
  'use strict';

  // private static variables and methods
  GulpTaskService.getInstance();// register gulp tasks if not already registered
  var nodePackageService = NodePackageService.getInstance();
  var orchestrationCollection = {};// structure: orchestrationCollection[$1]

  orchestrationCollection[TASK.GRAB_TORRENT] = chainTask(
    'foobar'
  );

  var getType = function(_key) {// check agaist white-list of types
    var type = null;
    var orchestrationCollection = this;
    for(var key in orchestrationCollection) {
      if( orchestrationCollection.hasOwnProperty(key) && key === _key ) {
        type = key;
        break;
      }
    }
    return type;
  };

  // private static class
  var singleton = null;
  var OrchestrationService_ = function(config) {
    return function(type, orchestrationCollection) {// closure

      // public methods
      return {
        getTaskLauncher: function() {
          return safeAccess(orchestrationCollection, type);
        }
      };

    }(config.type, config.orchestrationCollection);// endClosure
  };

  // public singleton
  return {
    getInstance: function() {
      if(singleton === null) {
        singleton = new OrchestrationService_({
          type: getType.call(orchestrationCollection, $1),
          orchestrationCollection: orchestrationCollection
        });
      }
      return singleton;
    }
  };
}();// endClosure

module.exports = OrchestrationService;
