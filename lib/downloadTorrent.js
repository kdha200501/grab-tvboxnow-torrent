/*
global require, module
*/

// Global Methods
var createWriteStream = require('fs').createWriteStream;
var joinPath = require('path').join;
var parseTorrent = require('./parseTorrent');

// Global Classes
var LogService = require('./LogService');
var Http = require('http');
var Url = require('url');

// Global Variables
var cookieStore = require('./cookieStore');
var AUTH_URL = require('./GulpArgv').AUTH_URL;
var DIR_DOWNLOAD = require('./GulpArgv').DIR_DOWNLOAD;

// Global Constants
var DIR = require('./GulpConst').DIR;

var domain = [AUTH_URL.protocol, AUTH_URL.hostname].join('//');

// this redirected page asks the user to click on a link to download
var redirectToDownloadPage = function(torrent, onSuccess, onError, url) {
  "use strict";

  url = Url.parse(url);

  var reqConfig = {
    hostname: url.hostname,
    port: ( url.port || 80 ), // 80 by default
    method: 'GET',
    path: url.path,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieStore.getCookie()
    }
  };
  var req = Http.request(reqConfig, function(res) {

      var body = [];
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        body.push(chunk);
      });
      res.on('error', function() {
        LogService.error.call('redirectToDownloadPage', 'fail to redirect:', torrent);
        onError();
      });
      res.on('end', function() {
        var torrentList = parseTorrent( body.join(''), null, torrent.id );
        downloadTorrent(torrentList[0], onSuccess, onError, true);
      });

    }// endRequest page
  );
  req.end();
};

var downloadTorrent = function(torrent, onSuccess, onError, isRedirect) {
  "use strict";

  LogService.info.call('downloadTorrent', torrent.id, '->', torrent.label);
  var url = Url.parse(torrent.url);

  var reqConfig = {
    hostname: url.hostname,
    port: ( url.port || 80 ), // 80 by default
    method: 'GET',
    path: url.path,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieStore.getCookie()
    }
  };
  var req = Http.request(reqConfig, function(res) {

      var body = [];
      res.on('data', function (chunk) {
        body.push(chunk);
      });
      res.on('error', function() {
        LogService.error.call('downloadTorrent', 'fail to download:', torrent);
        onError();
      });
      res.on('end', function() {
        if(res.statusCode > 300 && res.statusCode < 400 && res.headers.location && !isRedirect) {
          redirectToDownloadPage( torrent, onSuccess, onError, [domain, res.headers.location].join('/') );
        }
        // endIf download link redirects to another page
        else {
          var fileStream = createWriteStream( joinPath(DIR_DOWNLOAD, torrent.id + '.torrent') );
          body.forEach(function(chunk) {
            fileStream.write(chunk);
          });
          fileStream.end();
          onSuccess();
        }
        // endIf direct download link
      });

    }// endRequest file
  );
  req.end();
};

module.exports = downloadTorrent;
