'use strict';

const { readFile } = require('fs/promises');
const { join } = require('path');
const { load } = require('cheerio');
const { of, defer } = require('rxjs');
const { switchMap, mergeMap, map, catchError } = require('rxjs/operators');

const { log } = require('../service/log');
const {
  httpGet,
  httpGetRedirect,
  httpGetSave,
  httpPost,
  extractUrlPath,
} = require('../service/http');

const { signInPath } = require('../const');

/**
 * Sign in to tvboxnow using credentials from a file
 * @param {string} credentialsFilePath Path to the JSON credentials file
 * @param {string} hostname Hostname of the tvboxnow server
 * @param {boolean} [quiet] Suppress log output when true
 * @returns {Observable<string[]>} Observable emitting session cookies
 */
const signIn = (credentialsFilePath, hostname, quiet) =>
  defer(() => readFile(credentialsFilePath, 'utf8').then(JSON.parse)).pipe(
    switchMap((accountCredentials) => {
      const { username, password } =
        /** @type {AccountCredentials} */ accountCredentials;
      log(`👤 Sign in as ${username}`, quiet);

      return httpPost(
        /** @type {ClientRequestArgs} */ {
          hostname,
          path: signInPath,
        },
        { username, password },
        true
      );
    })
  );

/**
 * Fetch the HTML content of a thread page
 * @param {string} hostname Hostname of the tvboxnow server
 * @param {string} urlPath Relative URL path to the thread
 * @param {string[]} [cookies] Session cookies for authentication
 * @returns {Observable<string>} Observable emitting the HTML response body
 */
const fetchThread = (hostname, urlPath, cookies) => {
  /** @type {ClientRequestArgs} */
  const options = {
    hostname,
    path: `/${urlPath}`,
    headers: {
      Cookie: cookies?.join('; ') || '',
    },
  };

  return httpGet(options);
};

/**
 * Extract torrent attachments from thread HTML, handling both type 1 and type 2 attachment markup
 * @param {string} html HTML source of a thread page
 * @returns {Attachment[]} Deduplicated array of attachments found in the page
 */
const extractAttachments = (html) => {
  /**
   * @desc Type 1 attachment sample:
   * <a href="attachment.php?aid=foobar" id="foobar">
   *   HelloWorld.torrent
   * </a>
   */
  const $doc = load(html);
  const type1Attachments = Array.from($doc('a[href^="attachment"]')).map(
    ($) => ({
      id: $.attribs.id,
      text: $doc($).text(),
      urlPath: extractUrlPath($.attribs.href),
    })
  );

  /**
   * @desc Type 2 attachment sample:
   * <span id="attach_3523801">
   *   <a href="attachment.php?aid=foobar">
   *     HelloWorld.torrent
   *   </a>
   * </span>
   */
  const type2Attachments = Array.from($doc('span a[href^="attachment"]')).map(
    ($) => ({
      id: $.parent.attribs.id,
      text: $doc($).text(),
      urlPath: extractUrlPath($.attribs.href),
    })
  );

  const attachmentMap = new Map(
    [...type1Attachments, ...type2Attachments]
      .filter(({ id }) => Boolean(id))
      .map((attachment) => [attachment.id, attachment])
  );

  return [...attachmentMap.values()];
};

/**
 * extract attachments from redirect page
 * @param {string} htmlSource The HTML source of a redirect page
 * @return {Attachment[]} attachments
 */
const extractAttachmentsFromRedirectPage = (htmlSource) => {
  const $doc = load(htmlSource);
  const attachments = Array.from($doc('a[href^="attachment"]')).map(($) => ({
    id: $.attribs.id,
    text: $doc($).text(),
    urlPath: extractUrlPath($.attribs.href),
  }));

  return attachments.filter(Boolean);
};

/**
 * Download a single torrent file by following its redirect and saving to disk
 * @param {string} hostname Hostname of the tvboxnow server
 * @param {string} downloadDirPath Directory to save the torrent file
 * @param {Attachment} attachment Attachment metadata to download
 * @param {string[]} [cookies] Session cookies for authentication
 * @param {boolean} [quiet] Suppress log output when true
 * @returns {Observable<boolean>} Observable emitting true on success, false on failure
 */
const downloadTorrent = (
  hostname,
  downloadDirPath,
  attachment,
  cookies,
  quiet
) => {
  const { id, text, urlPath } = /** @type {Attachment} */ attachment;
  const torrentFilePath = `${join(downloadDirPath, id)}.torrent`;
  const torrentUrlPath = extractUrlPath(urlPath);

  log(`📎 ${text}`, quiet);

  const options = {
    hostname,
    path: torrentUrlPath,
    headers: {
      Cookie: cookies?.join('; ') || '',
    },
  };

  return httpGetRedirect(options).pipe(
    map((html) => {
      const [first] = extractAttachmentsFromRedirectPage(html);
      return first.urlPath;
    }),
    mergeMap((path) => httpGetSave({ ...options, path }, torrentFilePath)),
    map(() => true),
    catchError((error) => {
      log(`❌ Failed to download "${text}". Error: ${error}`, quiet);
      return of(false);
    })
  );
};

/**
 * Find the first thread in a topic page whose title matches the given regexp
 * @param {string} html HTML source of a topic page
 * @param {string} subjectMatchRegexp Pattern to match against thread titles
 * @return {string|undefined} URL path to the matching thread, or undefined
 */
const extractMatchingThreadUrlPath = (html, subjectMatchRegexp) => {
  const regexp = new RegExp(subjectMatchRegexp, 'i');
  const $doc = load(html);
  const matchedThread = Array.from($doc('.subject span[id] a')).find(($) =>
    regexp.test($doc($).text())
  );

  return matchedThread && extractUrlPath(matchedThread.attribs.href);
};

module.exports = {
  signIn,
  fetchThread,
  fetchTopic: fetchThread,
  extractAttachments,
  extractMatchingThreadUrlPath,
  downloadTorrent,
};
