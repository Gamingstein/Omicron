import { QdrantClient } from '@qdrant/js-client-rest';
import { prisma } from '@discord-agent/db';
import { generateEmbedding } from '@discord-agent/embeddings';
import { logger } from '@discord-agent/commons';
import { v4 as uuidv4 } from 'uuid';
import { getQdrantClient } from './qdrant';

const COLLECTION_NAME = 'discord_memories';

export class MemoryManager {
  private qdrant: QdrantClient;

  constructor() {
    this.qdrant = getQdrantClient();
    this.initializeCollection();
  }

  private async initializeCollection() {
    try {
      const result = await this.qdrant.getCollections();
      const hasCollection = result.collections.some((c) => c.name === COLLECTION_NAME);
      if (!hasCollection) {
        logger.info(`Collection '${COLLECTION_NAME}' not found. Creating...`);
        await this.qdrant.createCollection(COLLECTION_NAME, {
          vectors: { size: 384, distance: 'Cosine' }, // Default size, should match embedding model
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize Qdrant collection.');
    }
  }

  async retrieve(text: string, guildId: string, topK = 5): Promise<any[]> {
    try {
      const queryVector = await generateEmbedding(text);
      const results = await this.qdrant.search(COLLECTION_NAME, {
        vector: queryVector,
        limit: topK,
        filter: {
          must: [{ key: 'guildId', match: { value: guildId } }],
        },
        with_payload: true,
      });
      
      // Fetch full metadata from Prisma
      const pointIds = results.map(r => r.id);
      const metadata = await prisma.vectorMetadata.findMany({
          where: { id: { in: pointIds as string[] } }
      });

      return results.map(r => ({
          ...r,
          metadata: metadata.find(m => m.id === r.id)
      }));

    } catch (error) {
      logger.error({ err: error }, 'Failed to retrieve memories.');
      return [];
    }
  }

  async upsert(memory: {
    text: string;
    summary: string;
    guildId: string;
    channelId: string;
    userId?: string;
    messageId?: string;
    tags?: string[];
  }) {
    try {
      const vector = await generateEmbedding(memory.text);
      const pointId = uuidv4();

      await this.qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points: [{
          id: pointId,
          vector,
          payload: { guildId: memory.guildId, channelId: memory.channelId }, // Keep payload in Qdrant minimal
        }],
      });

      await prisma.vectorMetadata.create({
        data: {
          id: pointId,
          ...memory,
        },
      });
      logger.info({ pointId }, 'Successfully upserted memory.');
    } catch (error) {
      logger.error({ err: error }, 'Failed to upsert memory.');
    }
  }

  async delete(key: string) {
    try {
        await this.qdrant.delete(COLLECTION_NAME, {
            points: [key],
        });
        await prisma.vectorMetadata.delete({ where: { id: key }});
        logger.info({ key }, 'Successfully deleted memory.');
    } catch (error) {
        logger.error({ err: error, key }, 'Failed to delete memory.');
    }
  }

  async purgeServerMemory(guildId: string) {
    try {
        const records = await prisma.vectorMetadata.findMany({
            where: { guildId },
            select: { id: true }
        });
        const pointIds = records.map(r => r.id);

        if (pointIds.length > 0) {
            await this.qdrant.delete(COLLECTION_NAME, { points: pointIds });
            await prisma.vectorMetadata.deleteMany({ where: { guildId } });
        }
        logger.info({ guildId, count: pointIds.length }, 'Successfully purged all memories for guild.');
        return { success: true, count: pointIds.length };
    } catch (error) {
        logger.error({ err: error, guildId }, 'Failed to purge memories for guild.');
        return { success: false, error: error };
    }
  }
}

export const memoryManager = new MemoryManager();
