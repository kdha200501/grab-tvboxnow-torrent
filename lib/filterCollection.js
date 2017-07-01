/*
global require, module
*/

// Global Constants
var AUTH_URL = require('./GulpArgv').AUTH_URL;

var domain = [AUTH_URL.protocol, AUTH_URL.hostname].join('//');

var filter1 = function() {// closure
  "use strict";

  // HTML sample:
  // <a href="attachment.php?aid=foobar" id="foobar">
  //   HelloWorld.torrent
  // </a>

  // private variables
  var query = 'a[href^="attachment"]';

  // private methods
  var extract = function(element) {
    var id = element.attribs.id;
    return (!!id || id === 0) ? {
      id: id,
      url: [domain, element.attribs.href].join('/')
    } : null;
  };

  // public method
  return {
    query: query,
    extract: extract
  };

}();// endClosure

var filter2 = function() {// closure
  "use strict";

  // HTML sample:
  // <span id="attach_3523801">
  //   <a href="attachment.php?aid=foobar">
  //     HelloWorld.torrent
  //   </a>
  // </span>

  // private variables
  var query = 'span a[href^="attachment"]';

  // private methods
  var extract = function(element) {
    var id = element.parent.attribs.id;
    return (!!id || id === 0) ? {
      id: id,
      url: [domain, element.attribs.href].join('/')
    } : null;
  };

  // public method
  return {
    query: query,
    extract: extract
  };

}();// endClosure

var nonFilter1 = function() {// closure
  "use strict";

  // HTML sample:
  // <a href="attachment.php?aid=foobar">
  //   點擊此處馬上下載
  // </a>

  // private variables
  var query = 'a[href^="attachment"]';

  // private methods
  var extract = function(element, id) {
    return {
      id: id,
      url: [domain, element.attribs.href].join('/')
    };
  };

  // public method
  return {
    query: query,
    extract: extract
  };

}();// endClosure

module.exports = {
  filterList: [filter1,  filter2],
  nonFilterList: [nonFilter1]
};
