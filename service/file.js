'use strict';

const { access } = require('fs/promises');
const { defer, of, Observable } = require('rxjs');
const { map, catchError } = require('rxjs/operators');

/**
 * check if a file or directory exists
 * @param {string} filePath path to check
 * @returns {Observable<boolean>} Observable emitting true if the path is accessible
 */
const fileExists = (filePath) =>
  /** @type {Observable<boolean>} */ (
    defer(() => access(filePath)).pipe(
      map(() => true),
      catchError(() => of(false))
    )
  );

module.exports = {
  fileExists,
};
