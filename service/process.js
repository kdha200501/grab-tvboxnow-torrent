'use strict';

const { readFile } = require('fs/promises');
const find = require('find-process');

/**
 * check if a process with the given PID is still running
 * @param {string} lockFilePath path to the lock file
 * @returns {Promise<boolean>} true if the process is running, false otherwise
 */
const isPreviousInstanceRunning = (lockFilePath) =>
  readFile(lockFilePath, 'utf8')
    .then(JSON.parse)
    .then((/** @type {LockFileContent} */ lockFileContent) =>
      find('pid', lockFileContent.pid)
    ) /** @param {unknown[]} results */
    .then((results) => !!results[0]);

module.exports = {
  isPreviousInstanceRunning,
};
