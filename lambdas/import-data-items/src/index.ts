import { checkObjectExists } from '../lib/buckets';
import { enqueue, getQueueUrl, createQueueHandler } from '../lib/queues';
import { AssembleChunksRequest, ImportChunk } from '../interfaces/messages';
import { saveChunk, getCachedChunksSum } from '../database/chunk-db';
import {
  getConnectionPool,
  initConnectionPool,
  releaseConnectionPool,
} from '../database/postgres';
import log from '../lib/log';

const chunkAssemblerUrl = getQueueUrl('chunk-assembler');

export const handler = createQueueHandler<ImportChunk>(
  getQueueUrl('import-chunks'),
  async ({ header, size }) => {
    const pool = getConnectionPool('write');
    log.info(`[import-chunks] importing chunk`, {
      root: header.data_root,
      size: size,
    });
    await saveChunk(pool, {
      ...header,
      chunk_size: size,
    });

    const allChunksSum = await getCachedChunksSum({
      data_root: header.data_root,
      connection: pool,
    });

    const hasAllChunks = header.data_size === allChunksSum;

    if (hasAllChunks) {
      log.info(
        `[import-chunks] all chunks have been imported, enqueueing message to chunk-assembler`,
        {
          root: header.data_root,
          allChunksSum,
          size,
          dataSize: header.data_size,
        },
      );

      await enqueue<AssembleChunksRequest>(
        chunkAssemblerUrl,
        {
          data_root: header.data_root,
          size: header.data_size,
        },
        {
          messagegroup: header.data_root,
          deduplicationId: header.data_root,
        },
      );
    } else {
      // DEBUG deleteme
      log.info(
        `[import-chunks] some chunks are still missing to account for the whole data_root`,
        {
          root: header.data_root,
          allChunksSum,
          size,
        },
      );
    }
  },
  {
    before: async () => {
      log.info(`[import-chunks] handler:before database connection init`);
      await initConnectionPool('write');
      await wait(500);
    },
    after: async () => {
      log.info(`[import-chunks] handler:after database connection cleanup`);
      await releaseConnectionPool('write');
      await wait(500);
    },
  },
);

export default handler;
