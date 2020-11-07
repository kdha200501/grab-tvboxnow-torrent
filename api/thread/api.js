const { Observable } = require('rxjs');

const {
  defaultProtocol,
  defaultHostname,
  defaultPort,
} = require('../../const');
const { httpGet } = require('../../utils');

/**
 * request thread HTML source
 * @param {string} hostnameOverride Override hostname
 * @param {string} path URL path
 * @param {string[]} cookies Cookies
 * @returns {Observable<string>} HTML source for the requested thread
 */
function fetchThread(hostnameOverride, path, cookies) {
  /**
   * @type {ClientRequestArgs} options Http request options
   */
  const options = {
    protocol: `${defaultProtocol}:`,
    hostname: hostnameOverride || defaultHostname,
    port: defaultPort,
    path,
    method: 'GET',
    headers: {
      Cookie: cookies ? cookies.join('; ') : '',
    },
  };

  return new Observable((subscriber$) => httpGet(subscriber$, options));
}

module.exports = {
  fetchThread,
};
