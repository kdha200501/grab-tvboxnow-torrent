'use strict';

const { createWriteStream } = require('fs');
const { request } = require('https');
const { stringify } = require('querystring');
const { Observable, EMPTY, of } = require('rxjs');
const { expand, last, map } = require('rxjs/operators');

const { defaultProtocol, defaultPort, regExpUrlPath } = require('../const');

/**
 * extract the path portion of a URL
 * @param {string} href Full or relative URL
 * @return {string|undefined} The URL path
 */
const extractUrlPath = (href) => {
  if (!href) {
    return undefined;
  }

  const [captureGroup1, captureGroup2] = href.match(regExpUrlPath) || [];
  const captureGroup = captureGroup2 || captureGroup1;
  if (captureGroup === '') {
    return undefined;
  }
  return captureGroup.startsWith('/') ? captureGroup : `/${captureGroup}`;
};

/**
 * Perform an HTTPS GET request and return the response body as a string
 * @param {ClientRequestArgs} options HTTP request options (hostname, path, headers, etc.)
 * @returns {Observable<string>} Observable emitting the full response body
 */
const httpGet = (options) =>
  new Observable((subscriber) => {
    /**
     * @type {OutgoingHttpHeaders}
     */
    const { headers } = options;

    const req = request(
      {
        ...options,
        method: 'GET',
        protocol: `${defaultProtocol}:`,
        port: defaultPort,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...headers,
        },
      },
      (res) => {
        res.setEncoding('utf8');
        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          subscriber.next(data.join(''));
          subscriber.complete();
        });
        res.on('error', (err) => {
          subscriber.error(err);
        });
      }
    );

    req.on('error', (err) => {
      subscriber.error(err);
    });

    req.end();

    return () => req.destroy();
  });

/**
 * Follow 3xx redirects, then GET and return the response body as a string
 * @param {ClientRequestArgs} options HTTP request options
 * @return {Observable<string>} Observable that emits the response body
 */
const httpGetRedirect = (options) =>
  of([options.path]).pipe(
    expand((retryState) => {
      const [path, isRedirect] =
        /** @type {[string, boolean, string]} [path, isRedirect, body] */ retryState;

      // if the redirect is complete
      if (isRedirect === null) {
        // then hit the subscriber's complete
        return EMPTY;
      }

      if (isRedirect) {
        return httpGet({ ...options, path }).pipe(
          map((_body) => [path, null, _body])
        );
      }

      return new Observable((subscriber) => {
        const req = request(
          {
            ...options,
            path,
            method: 'GET',
            protocol: `${defaultProtocol}:`,
            port: defaultPort,
          },
          (res) => {
            // if the response is redirected
            if (
              res.statusCode >= 300 &&
              res.statusCode < 400 &&
              res.headers.location
            ) {
              // then discard the response body and follow redirect
              res.resume();
              subscriber.next([extractUrlPath(res.headers.location), true, '']);
              subscriber.complete();
              return;
            }

            // if the response is not redirected,
            // then retrieve the response body
            res.setEncoding('utf8');
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => {
              subscriber.next([path, null, data.join('')]);
              subscriber.complete();
            });
            res.on('error', (err) => {
              subscriber.error(err);
            });
          }
        );

        req.on('error', (err) => subscriber.error(err));
        req.end();

        return () => req.destroy();
      });
    }),
    last(),
    map(([_, __, body]) => body)
  );

/**
 * GET request and save response to file
 * @param {ClientRequestArgs} options HTTP request options
 * @param {string} filePath File path to save the response to
 * @return {Observable<{contentType: string}>} Observable that emits response metadata
 */
const httpGetSave = (options, filePath) =>
  new Observable((subscriber) => {
    const req = request(
      {
        ...options,
        method: 'GET',
        protocol: `${defaultProtocol}:`,
        port: defaultPort,
      },
      (res) => {
        const contentType = res.headers['content-type'] || '';
        const writeStream = createWriteStream(filePath);

        res.on('error', (err) => subscriber.error(err));
        writeStream.on('error', (err) => subscriber.error(err));

        res.pipe(writeStream);

        writeStream.on('finish', () => {
          subscriber.next({ contentType });
          subscriber.complete();
        });
      }
    );

    req.on('error', (err) => subscriber.error(err));
    req.end();

    return () => req.destroy();
  });

/**
 * Perform an HTTPS POST request with a URL-encoded payload
 * @param {ClientRequestArgs} options HTTP request options (hostname, path, headers, etc.)
 * @param {Object} payload Key-value pairs to send as the request body
 * @param {boolean} [cookiesOnly] When true, emit only Set-Cookie headers instead of the response body
 * @returns {Observable<string|string[]>} Observable emitting cookies (if cookiesOnly) or the response body
 */
const httpPost = (options, payload, cookiesOnly) =>
  new Observable((subscriber) => {
    const queryString = stringify(payload);

    /**
     * @type {OutgoingHttpHeaders}
     */
    const { headers } = options;

    const req = request(
      {
        ...options,
        method: 'POST',
        protocol: `${defaultProtocol}:`,
        port: defaultPort,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...headers,
          'Content-Length': Buffer.byteLength(queryString),
        },
      },
      (res) => {
        res.setEncoding('utf8');

        if (cookiesOnly) {
          subscriber.next(res.headers['set-cookie']);
          subscriber.complete();
          return;
        }

        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          subscriber.next(data.join(''));
          subscriber.complete();
        });
        res.on('error', (err) => {
          subscriber.error(err);
        });
      }
    );

    req.on('error', (err) => {
      subscriber.error(err);
    });

    req.write(queryString);
    req.end();

    return () => req.destroy();
  });

module.exports = {
  httpGet,
  httpGetRedirect,
  httpGetSave,
  httpPost,
  extractUrlPath,
};
