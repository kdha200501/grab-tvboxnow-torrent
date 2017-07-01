/*
global require, module
*/

// Global Methods
var filterCollection = require('./filterCollection');

// Global Classes
var Cheerio = require('cheerio');

var parseTorrent = function(html, excludeRegexp, id) {
  "use strict";

  if(excludeRegexp) {
    excludeRegexp = new RegExp(excludeRegexp, 'i');
  }

  var torrentList = [];
  var $ = Cheerio.load(html);

  var filterList = (!!id || id === 0) ? filterCollection.nonFilterList : filterCollection.filterList;

  filterList.forEach(function(filter) {
    $(filter.query).each(function(idx, element) {

      var label = $(this).text();
      if( excludeRegexp && excludeRegexp.test(label) ) {
        return;
      }

      var torrent = filter.extract(element, id);
      if(torrent) {
        torrent.label = label;
        torrent.fileName = torrent.id + '.torrent';
        torrentList.push(torrent);
      }
      // endIf successful extraction for ID

    });// endEach query match
  });// endEach filter

  return torrentList;
};

module.exports = parseTorrent;
