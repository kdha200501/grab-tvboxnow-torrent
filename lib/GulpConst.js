/*
global require, process, module
*/

// Global methods
var joinPath = require('path').join;

// Global Classes
var NodePackageService = require('./NodePackageService');

var DIR = {
  CWD: process.cwd(),
  SUBSCRIPTION: 'subscription',
  DOWNLOAD: 'download'
};

var TASK = {
  DEFAULT: 'default',
  GRAB_TORRENT: 'grab-torrent',
  REFRESH_PLEX_LIBRARY: 'refresh-plex-library'
};

module.exports = {
  DIR: DIR,
  TASK: TASK
};
