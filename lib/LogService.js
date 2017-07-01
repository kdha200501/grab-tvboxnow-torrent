/*
global require, module, console
*/

// Global Methods
var timestamp = require('time-stamp');
var chalk = require('chalk');

var paintTimestamp = function() {
  "use strict";
  var now = timestamp('HH:mm:ss.ms');
  return ['[', chalk.grey(now), ']'].join('');
};

var paintNamespace = function(namespace) {
  "use strict";
  var paint = this;
  return ['[', paint(namespace), ']'].join('');
};

var info = function () {
  "use strict";
  var namespace = this;
  var paint = chalk.cyan;
  console.log.apply(
    null,
    [paintTimestamp(), paintNamespace.call(paint, namespace)].concat( Array.prototype.slice.call(arguments) )
  );
};

var warn = function () {
  "use strict";
  var namespace = this;
  var paint = chalk.yellow;
  console.log.apply(
    null,
    [paintTimestamp(), paintNamespace.call(paint, namespace)].concat( Array.prototype.slice.call(arguments) )
  );
};

var error = function () {
  "use strict";
  var namespace = this;
  var paint = chalk.red;
  console.log.apply(
    null,
    [paintTimestamp(), paintNamespace.call(paint, namespace)].concat( Array.prototype.slice.call(arguments) )
  );
};

module.exports = {
  info: info,
  warn: warn,
  error: error
};
