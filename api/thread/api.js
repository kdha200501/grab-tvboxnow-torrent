const { Observable } = require('rxjs');

const {
  defaultProtocol,
  defaultHostname,
  defaultPort,
} = require('../../const');
const { httpGet } = require('../../utils');

/**
 * request a thread page's HTML source
 * @param {string} hostnameOverride Override hostname
 * @param {string} path URL path to the thread page
 * @param {string[]} cookies Cookies
 * @return {Observable<string>} HTML source for the requested thread page
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
