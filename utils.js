const { readFile, readdirSync, createWriteStream } = require('fs');
const { request } = require('https');
const { stringify, ParsedUrlQueryInput } = require('querystring');
const { Observable, Subscriber, of, throwError } = require('rxjs');
const { load } = require('cheerio');
const { compact } = require('lodash');

const { regExpUrlPath } = require('./const');

/**
 * read file as plain text
 * @param {string} readPath path to file
 * @return {Observable<string>} Observable of plain text
 */
function readTextFile(readPath) {
  return new Observable((subscriber$) => {
    readFile(readPath, 'utf8', (err, data) => {
      if (err) {
        subscriber$.error(err);
        subscriber$.complete();
        return;
      }
      subscriber$.next(data);
      subscriber$.complete();
    });
  });
}

/**
 * read file as JSON object
 * @param {string} readPath path to file
 * @return {Observable<string>} Observable of JSON object
 */
function readJsonFile(readPath) {
  return new Observable((subscriber$) => {
    readFile(readPath, 'utf8', (err, data) => {
      if (err) {
        subscriber$.error(err);
        subscriber$.complete();
        return;
      }
      try {
        subscriber$.next(JSON.parse(data));
      } catch (parseJsonErr) {
        subscriber$.error(parseJsonErr);
      }
      subscriber$.complete();
    });
  });
}

/**
 * list subscription files, emit sequentially
 * @param {string} readPath path to directory containing subscription files
 * @return {Observable<module:fs.Dirent>} Observable of subscription files
 */
function listSubscriptionFiles(readPath) {
  try {
    /**
     * @type {module:fs.Dirent[]}
     */
    const filePaths = readdirSync(readPath, {
      withFileTypes: true,
    });
    /**
     * @desc emit subscription files sequentially
     */
    return of(...filePaths.filter(({ name }) => /.*.json$/i.test(name)));
  } catch (err) {
    return throwError(err);
  }
}

/**
 * extract the path portion of a URL
 * @param {string} href Full or relative URL
 * @return {string} The URL path
 */
function extractUrlPath(href) {
  if (!href) {
    return undefined;
  }

  const [captureGroup1, captureGroup2] = href.match(regExpUrlPath) || [];
  const captureGroup = captureGroup2 || captureGroup1;
  if (captureGroup === '') {
    return undefined;
  }
  return captureGroup.startsWith('/') ? captureGroup : `/${captureGroup}`;
}

/**
 * make a HTTP GET request
 * @param {Subscriber} subscriber$ Subject to return results asynchronously
 * @param {ClientRequestArgs} options Http request options
 * @return {undefined}
 */
function httpGet(subscriber$, options) {
  /**
   * @type {OutgoingHttpHeaders}
   */
  const { headers } = options;

  const req = request(
    {
      ...options,
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
        subscriber$.next(data.join(''));
        subscriber$.complete();
      });
      res.on('error', (err) => {
        subscriber$.error(err);
        subscriber$.complete();
      });
    }
  );

  req.on('error', (err) => {
    subscriber$.error(err);
    subscriber$.complete();
  });

  req.end();
}

/**
 * make a HTTP GET request and save the response
 * @param {Subscriber} subscriber$ Subject to return results asynchronously
 * @param {ClientRequestArgs} options Http request options
 * @param {string} writePath The file save path
 * @param {function} [redirectHandler=0] Redirect handler
 * @return {undefined}
 */
function httpGetSave(subscriber$, options, writePath, redirectHandler) {
  /**
   * @type {OutgoingHttpHeaders}
   */
  const { headers } = options;

  const req = request(
    {
      ...options,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers,
      },
    },
    (res) => {
      /**
       * @desc if the response is 3XX redirect
       */
      if (
        res.statusCode > 300 &&
        res.statusCode < 400 &&
        res.headers.location &&
        redirectHandler
      ) {
        redirectHandler(subscriber$, res.headers.location);
      }

      const writeStream = createWriteStream(writePath);

      res.on('data', (chunk) => writeStream.write(chunk));
      res.on('end', () => {
        writeStream.end();
        subscriber$.next();
        subscriber$.complete();
      });
      res.on('error', (err) => {
        writeStream.end();
        subscriber$.error(err);
        subscriber$.complete();
      });
    }
  );

  req.on('error', (err) => {
    subscriber$.error(err);
    subscriber$.complete();
  });

  req.end();
}

/**
 * make a HTTP POST request
 * @param {Subscriber} subscriber$ Subject to return results asynchronously
 * @param {ClientRequestArgs} options Http request options
 * @param {ParsedUrlQueryInput} payload Payload
 * @param {boolean} [cookiesOnly=false] Emit response header cookies, only
 * @return {undefined}
 */
function httpPost(subscriber$, options, payload, cookiesOnly) {
  const queryString = stringify(payload);
  /**
   * @type {OutgoingHttpHeaders}
   */
  const { headers } = options;
  const req = request(
    {
      ...options,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers,
        'Content-Length': Buffer.byteLength(queryString),
      },
    },
    (res) => {
      res.setEncoding('utf8');

      if (cookiesOnly) {
        subscriber$.next(res.headers['set-cookie']);
        subscriber$.complete();
        return;
      }

      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        subscriber$.next(data.join(''));
        subscriber$.complete();
      });
      res.on('error', (err) => {
        subscriber$.error(err);
        subscriber$.complete();
      });
    }
  );

  req.on('error', (err) => {
    subscriber$.error(err);
    subscriber$.complete();
  });

  req.write(queryString);
  req.end();
}

function extractAttachmentsFromRedirectPage(htmlSource) {
  const attachments = Array.from(load(htmlSource)('a[href^="attachment"]')).map(
    ($) => ({
      id: $.attribs.id,
      text: load($).text(),
      urlPath: extractUrlPath($.attribs.href),
    })
  );

  return compact(attachments);
}

/**
 * extract attachments from a thread
 * @param {string} htmlSource The HTML source of a thread page
 * @return {Attachment[]} Attachments from the thread page
 */
function extractAttachments(htmlSource) {
  /**
   * @desc Type 1 attachment sample:
   * <a href="attachment.php?aid=foobar" id="foobar">
   *   HelloWorld.torrent
   * </a>
   */
  const type1Attachments = Array.from(
    load(htmlSource)('a[href^="attachment"]')
  ).map(($) => ({
    id: $.attribs.id,
    text: load($).text(),
    urlPath: extractUrlPath($.attribs.href),
  }));

  /**
   * @desc Type 2 attachment sample:
   * <span id="attach_3523801">
   *   <a href="attachment.php?aid=foobar">
   *     HelloWorld.torrent
   *   </a>
   * </span>
   */
  const type2Attachments = Array.from(
    load(htmlSource)('span a[href^="attachment"]')
  ).map(($) => ({
    id: $.parent.attribs.id,
    text: load($).text(),
    urlPath: extractUrlPath($.attribs.href),
  }));

  return [...type1Attachments, ...type2Attachments].filter(({ id }) =>
    Boolean(id)
  );
}

/**
 * compare attachments freshly pulled from thread and attachments stored on file
 * to determine which attachment is not already downloaded
 * @param {SubscriptionFileContent} fileContent File content
 * @param {Attachment[]} attachments Attachments freshly pulled from thread
 * @return {Attachment[]} attachments that are not already downloaded
 */
function reconcileAttachments(fileContent, attachments) {
  const excludeRegexp =
    fileContent.excludeRegexp && new RegExp(fileContent.excludeRegexp, 'i');

  return attachments.filter(({ id, text }) => {
    if (excludeRegexp && excludeRegexp.test(text)) {
      return false;
    }
    return !fileContent[id];
  });
}

module.exports = {
  readTextFile,
  readJsonFile,
  listSubscriptionFiles,
  httpGet,
  httpGetSave,
  httpPost,
  extractUrlPath,
  extractAttachments,
  extractAttachmentsFromRedirectPage,
  reconcileAttachments,
};
