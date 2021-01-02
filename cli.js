#!/usr/bin/env node

'use strict';
const { mkdirSync, existsSync, writeFileSync, readFileSync } = require('fs');
const { join } = require('path');
const { of, combineLatest, Observable } = require('rxjs');
const {
  concatMap,
  switchMap,
  map,
  catchError,
  shareReplay,
  take,
} = require('rxjs/operators');
const { description } = require('./package.json');
/**
 * @type {{i: string, d: string, q: string, H: string}}
 */
const argv = require('yargs')
  .usage('Usage: $0 [options]')
  .alias('d', 'directory')
  .nargs('d', 1)
  .string('d')
  .describe('d', 'Specify the working directory, defaults to cwd')
  .alias('i', 'init')
  .nargs('i', 0)
  .boolean('i')
  .describe('i', 'Initialize the working directory')
  .alias('H', 'hostname')
  .nargs('H', 1)
  .string('H')
  .describe('H', 'Specify the TvBoxNow hostname, defaults to "os.tvboxnow.com"')
  .alias('q', 'quiet')
  .nargs('q', 0)
  .boolean('q')
  .describe('q', 'Do not output to stdout or stderr')
  .help('h')
  .alias('h', 'help').argv;

const { path } = require('./const');
const {
  listSubscriptionFiles,
  readJsonFile,
  extractUrlPath,
  extractThreadUrlPath,
  extractAttachments,
  reconcileAttachments,
} = require('./utils');
const { bufferUntilChanged } = require('./operators/buffer-until-changed');
// const { signIn } = require('./mock-api/authentication/api');
const { signIn } = require('./api/authentication/api');
// const { fetchThread } = require('./mock-api/thread/api');
const { fetchTopic } = require('./api/topic/api');
// const { fetchTopic } = require('./mock-api/topic/api');
const { fetchThread } = require('./api/thread/api');
// const { fetchAttachment } = require('./mock-api/attachment/api');
const { fetchAttachment } = require('./api/attachment/api');

const cwd = argv.d || process.cwd();

/**
 * log error message
 * @param {Error|string} err Error message
 * @return {undefined}
 */
function logError(err) {
  if (argv.q !== true) {
    console.error(err);
  }
}

/**
 * log message
 * @param {string} msg Message
 * @return {undefined}
 */
function log(msg) {
  if (argv.q !== true) {
    console.log(msg);
  }
}

/**
 * init the current working directory
 * - create downloads folder, if not already exist
 * - create subscriptions folder, if not already exist
 * - create sample subscription file
 * - create account credentials file
 * @return {Error|*} Error, if any
 */
function init() {
  // create the "downloads" folder
  let writePath = join(cwd, path.downloads);
  if (!existsSync(writePath)) {
    try {
      mkdirSync(writePath);
    } catch (err) {
      return err;
    }
  }

  // create the "subscriptions" folder
  writePath = join(cwd, path.subscriptions);
  if (!existsSync(writePath)) {
    try {
      mkdirSync(writePath);
    } catch (err) {
      return err;
    }
  }

  // create a subscription sample file
  writePath = join(cwd, path.subscriptions, path.subscriptionSample);
  const subscriptionSample = {
    urlPath: 'thread-<id>-1-1.html',
    excludeRegexp:
      '(h265)|(h.265)|(h_265)|(h 265)|(x265)|(x.265)|(x_265)|(x 265)',
  };
  try {
    writeFileSync(writePath, JSON.stringify(subscriptionSample, null, 2));
  } catch (err) {
    return err;
  }

  // create account credentials file
  writePath = join(cwd, path.credentials);
  /**
   * @type {AccountCredentials}
   */
  const auth = {
    username: '<username>',
    password: '<password>',
  };
  if (existsSync(writePath)) {
    return new Error(`Credentials already exist: "${writePath}".`);
  }
  try {
    writeFileSync(writePath, JSON.stringify(auth, null, 2));
  } catch (err) {
    return err;
  }
}

/**
 * read credentials from file and sign-in
 * @return {Observable<string[]>} Token cookies
 */
function authenticate() {
  const readPath = join(cwd, path.credentials);

  if (!existsSync(readPath)) {
    return of([]);
  }

  /**
   * @type {Observable<AccountCredentials>}
   */
  const credentials$ = readJsonFile(readPath);
  const hostnameOverride = argv.H;

  return credentials$.pipe(
    switchMap((credentials) => signIn(credentials, hostnameOverride)),
    take(1),
    catchError((err) => {
      logError(err);
      return of(null);
    }),
    shareReplay(1)
  );
}

/**
 * read the content of a subscription file. Update URL path if the subscription targets a topic
 * @param {string} hostnameOverride Override hostname
 * @param {string} readPath path to file
 * @param {string[]} cookies Cookies
 * @return {Observable<SubscriptionFileContent>} The subscription file's content
 */
function readSubscriptionFile(hostnameOverride, readPath, cookies) {
  return readJsonFile(readPath).pipe(
    switchMap((fileContent) => {
      // if subscription is not a topic
      if (!fileContent.subjectUrlPath || !fileContent.subjectMatchRegexp) {
        return of(fileContent);
      }

      // if subscription is a topic
      return fetchTopic(
        hostnameOverride,
        extractUrlPath(fileContent.subjectUrlPath),
        cookies
      ).pipe(
        switchMap((html) => {
          const urlPath = extractThreadUrlPath(html, fileContent);
          if (!urlPath) {
            log('  no matching topic found');
            return of();
          }

          return of({
            ...fileContent,
            urlPath,
          });
        })
      );
    })
  );
}

/**
 * list the latest attachments under a thread page
 * @param {string} urlPath URL path to the thread page
 * @param {string[]} cookies Cookies
 * @return {Attachment[]} Attachments from the thread page
 */
function listAttachmentsForThread(urlPath, cookies) {
  const hostnameOverride = argv.H;
  return fetchThread(hostnameOverride, urlPath, cookies).pipe(
    map(extractAttachments)
  );
}

/**
 * download attachments
 * @param {SubscriptionFileContent} fileContent Subscription File Content
 * @param {string[]} cookies Cookies
 * @return {Observable<Attachment>} Downloaded attachment
 */
function downloadAttachments(fileContent, cookies) {
  if (!fileContent.urlPath) {
    log(`  invalid URL path: "${fileContent.urlPath}"`);
    return of();
  }

  /**
   * @type {Observable<Attachment>}
   */
  const attachment$ = listAttachmentsForThread(
    extractUrlPath(fileContent.urlPath),
    cookies
  ).pipe(
    map((attachments) => reconcileAttachments(fileContent, attachments)),
    switchMap((attachments) => {
      if (attachments.length === 0) {
        log('  attachments are up to date');
      } else {
        log('  downloading attachments...');
      }

      return of(...attachments);
    })
  );
  const hostnameOverride = argv.H;

  return attachment$.pipe(
    concatMap((attachment) =>
      fetchAttachment(
        hostnameOverride,
        attachment.urlPath,
        cookies,
        join(cwd, path.downloads, `${attachment.id}.torrent`)
      ).pipe(
        map(() => {
          log(`  attachment: "${attachment.text}" downloaded`);
          return attachment;
        })
      )
    )
  );
}

// if cwd is invalid
if (!existsSync(cwd)) {
  logError(`Directory "${cwd}" does not exist.`);
  process.exit(1);
}

// if init
if (argv.i) {
  const errInit = init();
  if (errInit) {
    logError(errInit);
    process.exit(1);
  }
  process.exit(0);
}

// download latest torrent for each thread
const cookies$ = authenticate();
const thread$ = listSubscriptionFiles(join(cwd, path.subscriptions));

const subscription = thread$
  .pipe(
    // iterate through threads sequentially
    concatMap(({ name }) =>
      combineLatest(of(name), cookies$).pipe(
        switchMap(([name, cookies]) => {
          log(`thread: "${name}"`);
          const readPath = join(cwd, path.subscriptions, name);
          const hostnameOverride = argv.H;
          return readSubscriptionFile(hostnameOverride, readPath, cookies).pipe(
            switchMap((fileContent) =>
              downloadAttachments(fileContent, cookies)
            ),
            map((attachment) => [name, attachment])
          );
        })
      )
    ),
    bufferUntilChanged(([aName], [bName]) => aName === bName)
  )
  .subscribe((updates) => {
    try {
      const [[name]] = updates;
      const filePath = join(cwd, path.subscriptions, name);
      const fileContent = JSON.parse(readFileSync(filePath, 'utf8'));
      for (const [_, { id, text }] of updates) {
        fileContent[id] = {
          id,
          text,
        };
      }
      writeFileSync(filePath, JSON.stringify(fileContent, null, 2));
    } catch (err) {
      logError(err);
    }
  }, logError);

process.on('exit', () => subscription.unsubscribe());
