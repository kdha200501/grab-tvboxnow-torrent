/*
global require, module
*/

// Classes
var TASK = require('./GulpConst').TASK;
var NodePackageService = require('./NodePackageService');

// Global variables
var nodePackageService = NodePackageService.getInstance();
var $1 = nodePackageService.getArgs()._[0];// bash $1

module.exports = {
  $1: $1 === undefined ? TASK.GRAB_TORRENT : $1// default gulp to the GRAB_TORRENT task
};
