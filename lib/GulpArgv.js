/*
global require, module
*/

// Global Methods
var jsonfile = require('jsonfile');
var joinPath = require('path').join;
var safeAccess = require('safe-access');

// Global Classes
var Url = require('url');
var NodePackageService = require('./NodePackageService');
var PlexApi = require('plex-api');
var PlexApiCredentials = require('plex-api-credentials');

// Global Constants
var TASK = require('./GulpConst').TASK;
var DIR = require('./GulpConst').DIR;

// Global Variables
var nodePackageService = NodePackageService.getInstance();
var $1 = null;
switch(nodePackageService.getArgs()._[0]) {// bash $1
  case TASK.GRAB_TORRENT:
    $1 = TASK.GRAB_TORRENT;
    break;
  case TASK.REFRESH_PLEX_LIBRARY:
    $1 = TASK.REFRESH_PLEX_LIBRARY;
    break;
  default:
    $1 = TASK.GRAB_TORRENT;
}

var DIR_CWD = nodePackageService.getArgs().workingDirectory || DIR.CWD;

var AUTH = jsonfile.readFileSync( joinPath(DIR_CWD, 'auth.json') );
var AUTH_URL = Url.parse( safeAccess(AUTH, 'url') );

var PLEX = jsonfile.readFileSync( joinPath(DIR_CWD, 'plex.json') );
var PLEX_URL = Url.parse( safeAccess(PLEX, 'url') );
var PLEX_SECTION = safeAccess(PLEX, 'section');

var PLEX_API = new PlexApi({// this library produces a singleton
  hostname: PLEX_URL.hostname,
  port: PLEX_URL.port,
  authenticator: new PlexApiCredentials( safeAccess(PLEX, 'credentials') )
});

module.exports = {
  $1: $1,
  DIR_CWD: DIR_CWD,
  AUTH: AUTH,
  AUTH_URL: AUTH_URL,
  PLEX_API: PLEX_API,
  PLEX_SECTION: PLEX_SECTION,
  PLEX_SECTION_ID: null,
  DIR_SUBSCRIPTION: joinPath(DIR_CWD, DIR.SUBSCRIPTION),
  DIR_DOWNLOAD: joinPath(DIR_CWD, DIR.DOWNLOAD)
};
