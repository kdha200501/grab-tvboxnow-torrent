#!/usr/bin/env node

/*
                               '
                             /===\\
                           /======\ \
                         /=========\' \
                       /=== cli ====\'' \
                     /===============\ ' '\
                   /==================\''   \
                 /OrchestrationService \ ' '  \
               /========================\   ''  \
             /===========================\' ' ' ' \
           /====== GulpTaskService =======\' ' '  ' \
         /=================================\' '   ' ' \
       /====================================\  '   ' /
     /========= NodePackageService ==========\   ' /
   /==========================================\' /

*/

/*
global require
*/

// Global methods
var registerTask = require('gulp').task;
var chainTask = require('gulp').series;

// Global Classes
var OrchestrationService = require('../lib/OrchestrationService');

// Global variables
var TASK = require('../lib/GulpConst').TASK;

// Register the one true top-level entry point
registerTask(
  TASK.DEFAULT,
  OrchestrationService.getInstance().getTaskLauncher()
);

var defaultTaskLauncher = chainTask(TASK.DEFAULT);
defaultTaskLauncher();
