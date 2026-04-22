/**
 * @typedef {Object} MainArgs
 * @property {string} C
 * @property {boolean} q
 * @property {string} H
 */

/**
 * @typedef {Object} InitArgs
 * @property {string} C
 * @property {boolean} q
 */

/**
 * @typedef {{startedAt: string, pid: number}} LockFileContent
 */

/**
 * @typedef {Object} Attachment
 * @property {string} id
 * @property {string} text
 * @property {string} urlPath
 */

/**
 * @typedef {{urlPath: string, excludeRegexp: string, [subjectUrlPath]: string, [subjectMatchRegexp]: string} | Object.<string, Attachment>} SubscriptionFileContent
 */

/**
 *  @typedef {{username: string, password: string}} CredentialsFileContent
 */

/**
 * @typedef {{password: string, username: string}} AccountCredentials
 */
