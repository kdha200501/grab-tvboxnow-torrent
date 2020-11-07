const { Observable } = require('rxjs');

const { httpPost } = require('../../utils');
const {
  defaultHostname,
  defaultProtocol,
  defaultPort,
  signInPath,
} = require('../../const');

/**
 * sign in
 * @param {AccountCredentials} credentials User account credentials
 * @param {string} hostnameOverride Override hostname
 * @returns {Observable<string[]>} Token cookies
 */
function signIn(credentials, hostnameOverride) {
  /**
   * @type {ClientRequestArgs} options Http request options
   */
  const options = {
    protocol: `${defaultProtocol}:`,
    hostname: hostnameOverride || defaultHostname,
    port: defaultPort,
    path: signInPath,
    method: 'POST',
  };

  /**
   * @type {ParsedUrlQueryInput}
   */
  const payload = { ...credentials };

  return new Observable((subscriber$) =>
    httpPost(subscriber$, options, payload, true)
  );
}

module.exports = {
  signIn,
};
