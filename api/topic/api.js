const { Observable } = require('rxjs');

const {
  defaultProtocol,
  defaultHostname,
  defaultPort,
} = require('../../const');
const { httpGet } = require('../../utils');

/**
 * request a topic page's HTML source
 * @param {string} hostnameOverride Override hostname
 * @param {string} path URL path to the topic page
 * @param {string[]} cookies Cookies
 * @return {Observable<string>} HTML source for the requested topic page
 */
function fetchTopic(hostnameOverride, path, cookies) {
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
  fetchTopic,
};
