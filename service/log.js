'use strict';

/**
 * Log a message to console if not in quiet mode
 * @param {string} message - The message to log
 * @param {boolean} quiet - If true, suppress output
 * @returns {void}
 */
const log = (message, quiet = false) => {
  if (quiet) {
    return;
  }

  console.log(message);
};

module.exports = {
  log,
};
