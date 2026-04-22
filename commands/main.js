'use strict';

const { unlinkSync, existsSync } = require('fs');
const { join } = require('path');
const process = require('process');

const { path, defaultHostname } = require('../const');
const { downloadFromThreads } = require('../utils');

const describe = 'Download torrents from subscribed threads';

/** @type {import('yargs').CommandModule<{}, MainArgs>} */
module.exports = {
  command: '$0',
  describe,
  usage: 'Usage: $0 [options]',

  builder: (yargs) =>
    yargs
      .usage('Usage: $0 [options]')
      .example('$0 -C ~/.grab-tvboxnow-torrent')
      .option('C', {
        alias: 'directory',
        description: 'Specify the working directory',
        default: process.cwd(),
        type: 'string',
      })
      .option('q', {
        alias: 'quiet',
        description: 'Do not output to stdout or stderr',
        type: 'boolean',
        default: false,
      })
      .option('H', {
        alias: 'hostname',
        description: 'Override the BoxNow hostname',
        default: defaultHostname,
        type: 'string',
      }),

  handler: (argv) => {
    const cwd = argv.C;
    const hostname = argv.H;
    const lockFilePath = join(cwd, path.lock);
    const downloadDirPath = join(cwd, path.downloads);
    const subscriptionDirPath = join(cwd, path.subscriptions);
    const credentialsFilePath = join(cwd, path.credentials);

    /**
     * log error message
     * @param {Error|string} error Error message
     * @returns {undefined}
     */
    const logError = (error) => {
      if (argv.q === true) {
        return;
      }

      console.error(error);
    };

    const cleanupLock = () => {
      try {
        if (existsSync(lockFilePath)) {
          unlinkSync(lockFilePath);
        }
      } catch (error) {
        logError(`❌ Unable to cleanup lock file. Error: ${error}`);
      }
    };
    process.on('exit', cleanupLock);
    process.on('SIGINT', () => {
      cleanupLock();
      process.exit(130);
    });
    process.on('SIGTERM', () => {
      cleanupLock();
      process.exit(143);
    });

    // Download from threads
    downloadFromThreads(
      cwd,
      downloadDirPath,
      subscriptionDirPath,
      credentialsFilePath,
      lockFilePath,
      hostname,
      argv.q
    ).subscribe({
      complete: () => {
        process.exit(0);
      },
      error: (error) => {
        logError(`❌ Failed to download from threads. Error: ${error}`);
        process.exit(1);
      },
    });
  },
};
