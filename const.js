const path = {
  downloads: 'downloads',
  subscriptions: 'subscriptions',
  subscriptionSample: 'sample.json',
  credentials: 'auth.json',
};

const defaultProtocol = 'https';
const defaultHostname = 'os.tvboxnow.com';
const defaultPort = 443;
const signInPath = '/logging.php?action=login&loginsubmit=yes&inajax=1';

/**
 * @desc extract the path portion of a href
 *  - if href is absolute, e.g. 'https://abc.com/foo/bar', it matches '/foo/bar'
 *  - if href starts with root, e.g. '/foo/bar', it matches '/foo/bar'
 *  - if href is relative, e.g. 'foo/bar', it matches 'foo/bar'
 *
 *  (                                     - if href is absolute, then match starting from the first single '/'
 *    ^http.*?(                               - href starts with "http"
 *      ?<!\/|:                                 - ensure the look-behind character is neither "/" nor ":"
 *    )(
 *      \/.*                                    - non-greedy search for "/" and inner capture groups
 *    )
 *  )|(                                   - if href starts with root, or is relative, then match all
 *    ^(                                      - href starts with
 *      ?!(                                     - ensure the look-ahead character is not
 *        http(s?):\/\/                           - an absolute URL
 *      )|(                                     - or
 *        javascript:                             - a bookmarklet
 *      )
 *    ).*                                     - capture group
 *  )
 */
const regExpUrlPath = /(^http.*?(?<!\/|:)(\/.*))|(^(?!(http(s?):\/\/)|(javascript:)).*)/i;

module.exports = {
  path,
  defaultProtocol,
  defaultHostname,
  defaultPort,
  signInPath,
  regExpUrlPath,
};
