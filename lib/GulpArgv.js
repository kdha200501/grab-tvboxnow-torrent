/*
global require, module
*/

// Global Methods
var jsonfile = require('jsonfile');
var joinPath = require('path').join;

// Global Classes
var Url = require( "url" );
var NodePackageService = require('./NodePackageService');

// Global Constants
var TASK = require('./GulpConst').TASK;
var DIR = require('./GulpConst').DIR;

// Global Variables
var nodePackageService = NodePackageService.getInstance();
var $1 = nodePackageService.getArgs()._[0];// bash $1

var AUTH = jsonfile.readFileSync( joinPath(DIR.CWD, 'auth.json') );
var AUTH_URL = Url.parse(AUTH ? AUTH.url : null);

module.exports = {
  $1: $1 === undefined ? TASK.GRAB_TORRENT : $1,// default gulp to the GRAB_TORRENT task
  AUTH: AUTH,
  AUTH_URL: AUTH_URL
};
