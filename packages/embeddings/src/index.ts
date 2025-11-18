import axios from 'axios';
import { env, logger } from '@discord-agent/commons';

const localLlmApi = axios.create({
  baseURL: env.LOCAL_LLM_API_URL,
});

/**
 * Generates an embedding for a given text.
 * @param text The text to embed.
 * @param size The desired embedding dimension (optional).
 * @returns A promise that resolves to the embedding vector.
 */
export async function generateEmbedding(text: string, size?: number): Promise<number[]> {
  try {
    const response = await localLlmApi.post('/embed', { text, size });
    return response.data.embedding;
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate embedding via local LLM service.');
    throw new Error('Embedding generation failed.');
  }
}
