/*
global require, module
*/

// Global methods
var safeAccess = require('safe-access');

// Global variables
var ENV = require('./GulpConst').ENV;

var NodePackageService = function() {// closure
  'use strict';

  // private static variables
  var nodePackageList = [{
    name: 'yargs',
    config: function(nodePackage) {
      nodePackage.boolean([// force args to bool
        // run-time flags
        'forceDownload'
      ]);
    },
    method: 'argv',
    serviceMethod: 'getArgs'
  }];

  // private static class
  var singleton = null;
  var NodePackageService_ = function(config) {
    return function(nodePackageList) {// closure

      // private variables and methods
      var buildService = function(service, nodePackage) {
        var node = require(nodePackage.name);
        // 1. config node package
        if( (typeof nodePackage.config).toLowerCase() === 'function' ) {
          nodePackage.config(node);
        }
        // 2. expose node package method
        if( (typeof nodePackage.method).toLowerCase() === 'string' ) {
          service[nodePackage.serviceMethod] = function() {
            return safeAccess( node, nodePackage.method, Array.prototype.slice.call(arguments, 0) );
          };
        }
        else {
          service[nodePackage.serviceMethod] = node;
        }
        return service;
      };

      // public methods
      return nodePackageList.reduce(buildService, {});

    }(config.nodePackageList || []);// endClosure
  };

  // public singleton
  return {
    getInstance: function() {
      if(singleton === null) {
        singleton = new NodePackageService_({nodePackageList: nodePackageList});
      }
      return singleton;
    }
  };
}();// endClosure

module.exports = NodePackageService;
