const { Observable } = require('rxjs');
const { map } = require('rxjs/operators');

const {
  defaultProtocol,
  defaultHostname,
  defaultPort,
} = require('../../const');
const {
  httpGetSave,
  httpGet,
  extractUrlPath,
  extractAttachmentsFromRedirectPage,
} = require('../../utils');

/**
 * request attachment and save response to file
 * @param {string} hostnameOverride Override hostname
 * @param {string} path URL path
 * @param {string[]} cookies Cookies
 * @param {string} filePath File path to save at
 * @returns {Observable<undefined>} Signal of download completion
 */
function fetchAttachment(hostnameOverride, path, cookies, filePath) {
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
      Cookie: cookies?.join('; ') || '',
    },
  };

  const redirectHandler = (subscriber$, url) => {
    const path = extractUrlPath(url);
    const html$ = new Observable((_subscriber$) =>
      httpGet(_subscriber$, {
        ...options,
        path,
      })
    );
    html$
      .pipe(map((_html) => extractAttachmentsFromRedirectPage(_html)))
      .subscribe(([attachment]) => {
        httpGetSave(
          subscriber$,
          {
            ...options,
            path: attachment.urlPath,
          },
          filePath
        );
      });
  };

  return new Observable((subscriber$) => {
    httpGetSave(subscriber$, options, filePath, redirectHandler);
  });
}

module.exports = { fetchAttachment };
