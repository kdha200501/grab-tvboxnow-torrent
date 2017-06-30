/*
global require, process, module
*/

// Global methods
var joinPath = require('path').join;

// Global Classes
var NodePackageService = require('./NodePackageService');

var DIR = {
  CWD: process.cwd(),
  NODE_MODULES: 'node_modules'
};

var TASK = {
  DEFAULT: 'default',
  GRAB_TORRENT: 'grab-torrent'
};

module.exports = {
  DIR: DIR,
  TASK: TASK
};
