'use strict';

const { readdir, readFile, mkdir, writeFile, unlink } = require('fs/promises');
const { join } = require('path');
const process = require('process');
const {
  Observable,
  of,
  from,
  defer,
  forkJoin,
  throwError,
  EMPTY,
} = require('rxjs');
const {
  switchMap,
  mergeMap,
  concatMap,
  map,
  catchError,
  last,
  mergeScan,
} = require('rxjs/operators');

const { log } = require('./service/log');
const { isPreviousInstanceRunning } = require('./service/process');
const { fileExists } = require('./service/file');

const {
  signIn,
  fetchThread,
  fetchTopic,
  extractAttachments,
  extractMatchingThreadUrlPath,
  downloadTorrent,
} = require('./api/tvboxnow');

/**
 * Initialize the working directory structure
 * @param {string} cwd working directory path
 * @param {string} downloadDirPath path to download directory
 * @param {string} subscriptionDirPath path to subscription directory
 * @param {string} subscriptionSampleFilePath path to subscription sample file
 * @param {string} credentialsSampleFilePath path to credentials sample file
 * @param {string} lockFilePath path to lock file
 * @returns {Observable<void>} Observable that completes when initialization is done
 */
const initializeWorkingDirectory = (
  cwd,
  downloadDirPath,
  subscriptionDirPath,
  subscriptionSampleFilePath,
  credentialsSampleFilePath,
  lockFilePath
) =>
  /** @type {Observable<void>} */ (
    forkJoin([
      fileExists(cwd),
      fileExists(downloadDirPath),
      fileExists(subscriptionDirPath),
      fileExists(subscriptionSampleFilePath),
      fileExists(credentialsSampleFilePath),
      fileExists(lockFilePath),
    ]).pipe(
      switchMap(
        ([
          cwdExists,
          downloadDirExists,
          subscriptionDirExists,
          subscriptionSampleFileExists,
          credentialsSampleFileExists,
          lockFileExists,
        ]) => {
          if (!cwdExists) {
            return throwError(new Error(`Directory "${cwd}" does not exist.`));
          }

          // if there is no lock file in the working directory
          if (!lockFileExists) {
            // then do not check if a previous instance is still running
            return of([
              undefined,
              lockFileExists,
              downloadDirExists,
              subscriptionDirExists,
              subscriptionSampleFileExists,
              credentialsSampleFileExists,
            ]);
          }

          // if there is lock file in the working directory, and
          // then check if a previous instance is till running
          return isPreviousInstanceRunning(lockFilePath).then((isLocked) => [
            isLocked,
            lockFileExists,
            downloadDirExists,
            subscriptionDirExists,
            subscriptionSampleFileExists,
            credentialsSampleFileExists,
          ]);
        }
      ),
      switchMap(
        ([
          isLocked,
          lockFileExists,
          downloadDirExists,
          subscriptionDirExists,
          subscriptionSampleFileExists,
          credentialsSampleFileExists,
        ]) => {
          if (isLocked) {
            return throwError(
              new Error(
                `Another instance is already running at directory "${cwd}".`
              )
            );
          }

          /** @type {LockFileContent} */
          const lockFileContent = {
            pid: process.pid,
            startedAt: new Date().toISOString(),
          };
          const lockFileInit$ = defer(() =>
            (lockFileExists ? unlink(lockFilePath) : Promise.resolve()).then(
              () =>
                writeFile(
                  lockFilePath,
                  JSON.stringify(lockFileContent, null, 2)
                )
            )
          );

          const downloadDirInit$ = defer(() =>
            downloadDirExists
              ? Promise.resolve()
              : mkdir(downloadDirPath, { recursive: true })
          );

          /** @type {SubscriptionFileContent} */
          const subscriptionFileContent = {
            urlPath: 'thread-<id>-1-1.html',
            excludeRegexp:
              '(h265)|(h.265)|(h_265)|(h 265)|(x265)|(x.265)|(x_265)|(x 265)',
          };

          /** @type {CredentialsFileContent} */
          const credentialsFileContent = {
            username: '<username>',
            password: '<password>',
          };

          const subscriptionDirInit$ = defer(() =>
            (subscriptionDirExists
              ? Promise.resolve()
              : mkdir(subscriptionDirPath, { recursive: true })
            ).then(() =>
              Promise.all([
                (subscriptionSampleFileExists
                  ? unlink(subscriptionSampleFilePath)
                  : Promise.resolve()
                ).then(() =>
                  writeFile(
                    subscriptionSampleFilePath,
                    JSON.stringify(subscriptionFileContent, null, 2)
                  )
                ),
                credentialsSampleFileExists
                  ? Promise.resolve()
                  : writeFile(
                      credentialsSampleFilePath,
                      JSON.stringify(credentialsFileContent, null, 2)
                    ),
              ])
            )
          );

          return forkJoin([
            lockFileInit$,
            downloadDirInit$,
            subscriptionDirInit$,
          ]);
        }
      )
    )
  );

/**
 * Filter out attachments that have already been downloaded or match the exclude pattern
 * @param {SubscriptionFileContent} subscriptionFileContent Parsed subscription file
 * @param {Attachment[]} attachments Attachments freshly extracted from thread
 * @return {Attachment[]} Attachments not yet downloaded
 */
const reconcileAttachments = (subscriptionFileContent, attachments) => {
  const excludeRegexp =
    subscriptionFileContent.excludeRegexp &&
    new RegExp(subscriptionFileContent.excludeRegexp, 'i');

  return attachments.filter(({ id, text }) => {
    if (excludeRegexp?.test(text)) {
      return false;
    }

    if (subscriptionFileContent[id]) {
      return false;
    }

    return true;
  });
};

/**
 * Mark a single downloaded attachment in the subscription file so it is not re-downloaded.
 * Re-reads the file before writing to preserve any concurrent edits.
 * @param {string} subscriptionFilePath Path to subscription file
 * @param {Attachment} attachment Successfully downloaded attachment
 * @return {Observable<void>} Completes when the file is written
 */
const markDownloadedAttachment = (subscriptionFilePath, attachment) =>
  defer(() =>
    readFile(subscriptionFilePath, 'utf8')
      .then(JSON.parse)
      .then((fileContent) => {
        const { id, text } = attachment;
        fileContent[id] = { id, text };
        return writeFile(
          subscriptionFilePath,
          JSON.stringify(fileContent, null, 2)
        );
      })
  );

/**
 * Download multiple torrents sequentially and mark each as downloaded on success
 * @param {string} hostname Hostname of the tvboxnow server
 * @param {string} subscriptionFilePath Path to the subscription JSON file
 * @param {string} downloadDirPath Directory to save downloaded torrent files
 * @param {Attachment[]} attachments Attachments to download
 * @param {string[]} [cookies] Session cookies for authentication
 * @param {boolean} [quiet] Suppress log output when true
 * @returns {Observable<void>} Observable that completes when all downloads finish
 */
const downloadTorrents = (
  hostname,
  subscriptionFilePath,
  downloadDirPath,
  attachments,
  cookies,
  quiet
) =>
  of(...attachments).pipe(
    concatMap((attachment) =>
      forkJoin([
        of(attachment),
        downloadTorrent(hostname, downloadDirPath, attachment, cookies, quiet),
      ])
    ),
    switchMap(([attachment, successful]) =>
      successful
        ? markDownloadedAttachment(subscriptionFilePath, attachment)
        : EMPTY
    ),
    last()
  );

/**
 * Process a single subscription: read its config, fetch the thread (or resolve via topic),
 * reconcile attachments, and download any new torrents
 * @param {string} hostname Hostname of the tvboxnow server
 * @param {string} subscriptionFilePath Path to the subscription JSON file
 * @param {string} downloadDirPath Directory to save downloaded torrent files
 * @param {string[]} [cookies] Session cookies for authentication
 * @param {boolean} [quiet] Suppress log output when true
 * @returns {Observable<void>} Observable that completes when the subscription is processed
 */
const processSubscription = (
  hostname,
  subscriptionFilePath,
  downloadDirPath,
  cookies,
  quiet
) =>
  /** @type {Observable<void>} */ (
    forkJoin([
      readFile(subscriptionFilePath, 'utf8'),
      fileExists(downloadDirPath),
    ]).pipe(
      switchMap(([subscriptionFile, downloadDirExists]) => {
        log(`\x1b[1mSubscription ${subscriptionFilePath}\x1b[0m`, quiet);

        /** @type {SubscriptionFileContent} */
        let subscriptionFileContent;
        try {
          subscriptionFileContent = JSON.parse(subscriptionFile);
        } catch (error) {
          return throwError(
            `Invalid subscription file: ${subscriptionFilePath}. Error: ${error}`
          );
        }

        const { urlPath, subjectUrlPath, subjectMatchRegexp } =
          /** @type {SubscriptionFileContent} */ subscriptionFileContent;
        const isTopic = subjectUrlPath && subjectMatchRegexp;

        if (!urlPath && !isTopic) {
          return throwError(
            `Invalid URL path found in subscription file: ${subscriptionFilePath}`
          );
        }

        const downloadDirInit$ = defer(() =>
          downloadDirExists
            ? Promise.resolve()
            : mkdir(downloadDirPath, { recursive: true })
        );

        return forkJoin([
          of(subscriptionFileContent),
          isTopic ? fetchTopic(hostname, subjectUrlPath, cookies) : of(null),
          downloadDirInit$,
        ]);
      }),
      switchMap(([subscriptionFileContent, topicHtml]) => {
        const { subjectMatchRegexp } =
          /** @type {SubscriptionFileContent} */ subscriptionFileContent;

        if (!topicHtml) {
          return forkJoin([
            of(subscriptionFileContent),
            fetchThread(hostname, subscriptionFileContent.urlPath, cookies),
          ]);
        }

        const urlPath = extractMatchingThreadUrlPath(
          topicHtml,
          subjectMatchRegexp
        );

        if (!urlPath) {
          return throwError(
            `No matching topic found in subscription file: ${subscriptionFilePath}`
          );
        }

        return forkJoin([
          of(subscriptionFileContent),
          fetchThread(hostname, urlPath, cookies),
        ]);
      }),
      switchMap(([subscriptionFileContent, html]) => {
        const attachments = reconcileAttachments(
          subscriptionFileContent,
          extractAttachments(html)
        );

        if (!attachments.length) {
          log('🏆 attachments are up to date', quiet);
          return of(null);
        }

        return downloadTorrents(
          hostname,
          subscriptionFilePath,
          downloadDirPath,
          attachments,
          cookies,
          quiet
        );
      }),
      catchError((error) => {
        if (!quiet) {
          console.error(
            `❌ Unable to process subscription "${subscriptionFilePath}". Error: ${error}`
          );
        }
        return of(null);
      })
    )
  );

/**
 * list subscription files, emit sequentially
 * @param {string} readPath directory containing subscription files
 * @return {Observable<Dirent>} Observable of subscription files
 */
const listSubscriptionFiles = (readPath) =>
  /** @type {Observable<Dirent>} */ (
    defer(() => readdir(readPath, { withFileTypes: true })).pipe(
      map((fileDirents) =>
        fileDirents.filter(({ name }) => /.*\.json$/i.test(name))
      ),
      concatMap(from)
    )
  );

/**
 * Main download pipeline: validate directories, acquire lock, sign in if needed,
 * then process all subscriptions sequentially
 * @param {string} cwd Working directory path
 * @param {string} downloadDirPath Path to the download directory
 * @param {string} subscriptionDirPath Path to the subscription directory
 * @param {string} credentialsFilePath Path to the credentials JSON file
 * @param {string} lockFilePath Path to the lock file
 * @param {string} hostname Hostname of the tvboxnow server
 * @param {boolean} [quiet] Suppress log output when true
 * @returns {Observable<void>} Observable that completes when all subscriptions are processed
 */
const downloadFromThreads = (
  cwd,
  downloadDirPath,
  subscriptionDirPath,
  credentialsFilePath,
  lockFilePath,
  hostname,
  quiet
) =>
  /** @type {Observable<void>} */ (
    forkJoin([
      fileExists(cwd),
      fileExists(lockFilePath),
      fileExists(downloadDirPath),
      fileExists(subscriptionDirPath),
    ]).pipe(
      switchMap(
        ([
          cwdExists,
          lockFileExists,
          downloadDirExists,
          subscriptionDirExists,
        ]) => {
          if (!cwdExists) {
            return throwError(new Error(`Directory "${cwd}" does not exist.`));
          }

          if (!downloadDirExists) {
            return throwError(
              new Error(
                `Directory "${downloadDirPath}" does not exist. Run with --init first.`
              )
            );
          }

          if (!subscriptionDirExists) {
            return throwError(
              new Error(
                `Directory "${subscriptionDirPath}" does not exist. Run with --init first.`
              )
            );
          }

          if (!lockFileExists) {
            return of([lockFileExists, undefined]);
          }

          return isPreviousInstanceRunning(lockFilePath).then((isLocked) => [
            lockFileExists,
            isLocked,
          ]);
        }
      ),
      switchMap(([lockFileExists, isLocked]) => {
        if (isLocked) {
          return throwError(
            new Error(
              `Another instance is already running at directory "${cwd}".`
            )
          );
        }

        /** @type {LockFileContent} */
        const lockFileContent = {
          pid: process.pid,
          startedAt: new Date().toISOString(),
        };
        const lockFileInit$ = defer(() =>
          (lockFileExists ? unlink(lockFilePath) : Promise.resolve()).then(() =>
            writeFile(lockFilePath, JSON.stringify(lockFileContent, null, 2))
          )
        );

        return lockFileInit$;
      }),
      switchMap(() => listSubscriptionFiles(subscriptionDirPath)),
      mergeMap((subscriptionDirent) =>
        forkJoin([of(subscriptionDirent), fileExists(credentialsFilePath)])
      ),
      mergeScan(
        (cookies, [subscriptionDirent, credentialsFileExists]) =>
          defer(() => {
            // if cookies have been fetched
            if (cookies?.length) {
              // then do not sign in
              return of(cookies);
            }

            // if cookies have not been fetched, and
            // if cookies are not required
            if (!credentialsFileExists) {
              // then do not sign in
              return of(null);
            }

            // if cookies have not been fetched, and
            // if cookies are required,
            // then sign in
            return signIn(credentialsFilePath, hostname);
          }).pipe(
            concatMap((resolvedCookies) =>
              forkJoin([
                of(resolvedCookies),
                processSubscription(
                  hostname,
                  join(subscriptionDirPath, subscriptionDirent.name),
                  downloadDirPath,
                  resolvedCookies,
                  quiet
                ),
              ])
            ),
            map(([resolvedCookies]) => resolvedCookies)
          ),
        null,
        // process emissions sequentially
        1
      )
    )
  );

module.exports = {
  initializeWorkingDirectory,
  downloadFromThreads,
};
