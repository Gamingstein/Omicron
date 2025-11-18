import express, { Express } from 'express';
import { logger } from '@discord-agent/commons';
import { analyzeText, createEmbedding } from './llm';

export function createServer(): Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    res.status(200).send({ status: 'ok' });
  });

  app.post('/analyze', async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).send({ error: 'Text is required' });
    }
    try {
      const analysis = await analyzeText(text);
      res.status(200).send(analysis);
    } catch (error) {
      logger.error({ err: error }, 'Error during text analysis.');
      res.status(500).send({ error: 'Failed to analyze text.' });
    }
  });

  app.post('/embed', async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).send({ error: 'Text is required' });
    }
    try {
      const embedding = await createEmbedding(text);
      res.status(200).send({ embedding: Array.from(embedding.data) });
    } catch (error) {
      logger.error({ err: error }, 'Error during embedding creation.');
      res.status(500).send({ error: 'Failed to create embedding.' });
    }
  });

  return app;
}
