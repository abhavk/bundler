import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import { v4 as uuid } from 'uuid';
import log from './logger.js';
import { enqueueExportBundles } from './sqs.js';

const fsPromises = fs.promises;

const jobsFolder = '/mnt/data-items/jobs';
const unbundledFolder = '/mnt/data-items/unbundled';

export async function handler() {
  if (!fs.existsSync(jobsFolder)) {
    await fsPromises.mkdir(jobsFolder);
  }
  log.info('Hello cool!!');
  log.info(
    'data-items ready for export',
    await fsPromises.readdir('/mnt/data-items/unbundled'),
  );

  const unbundledFiles = await fsPromises.readdir(unbundledFolder);

  if (unbundledFiles.length > 0) {
    log.info(`Found ${unbundledFiles.length} unbundled data-items`);
    const jobId = uuid();
    const newJobsFolder = path.join(jobsFolder, jobId);

    // rm -rf for paranoia
    await new Promise((resolve) => rimraf(newJobsFolder, resolve));

    await fsPromises.mkdir(newJobsFolder);

    for (const unbundledFile of unbundledFiles) {
      fs.renameSync(
        path.join(unbundledFolder, unbundledFile),
        path.join(newJobsFolder, unbundledFile),
      );
    }

    await enqueueExportBundles({ jobId });
  } else {
    log.info(`No unbundled files to process`);
  }
}
