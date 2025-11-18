import express, { Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import { Client } from 'discord.js';
import { logger, env } from '@discord-agent/commons';
import { prisma } from '@discord-agent/db';
import { authMiddleware } from './auth';

export function createServer(discordClient: Client): Express {
  const app = express();
  app.use(express.json());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  app.use(limiter);
  app.use(authMiddleware);

  app.get('/health', (req, res) => {
    res.status(200).send({ status: 'ok', discord: discordClient.isReady() });
  });

  app.post('/execute', async (req, res) => {
    const { tasks, guildId } = req.body;
    if (!Array.isArray(tasks) || !guildId) {
      return res.status(400).send({ error: 'Invalid request body' });
    }

    const serverConfig = await prisma.serverConfig.findUnique({ where: { guildId } });
    if (!serverConfig) {
        return res.status(404).send({ error: 'Guild not configured.' });
    }

    const results = [];
    for (const task of tasks) {
      const allowed = serverConfig.allowedCommands.split(',');
      if (!allowed.includes(task.type)) {
        results.push({ task, success: false, error: 'Command not allowed in this server.' });
        continue;
      }
      
      try {
        // In a real app, each task would be a separate file/handler
        switch (task.type) {
          case 'send_message':
            const channel = await discordClient.channels.fetch(task.target);
            if (channel && 'send' in channel) {
              await channel.send(task.params.text);
              results.push({ task, success: true });
            } else {
              throw new Error('Channel not found or is not a sendable channel.');
            }
            break;
          // Add cases for ban, kick, mute, etc.
          default:
            results.push({ task, success: false, error: 'Unknown task type' });
        }
      } catch (error) {
        logger.error({ err: error, task }, 'Failed to execute task.');
        results.push({ task, success: false, error: (error as Error).message });
      }
    }
    res.status(200).send({ results });
  });

  app.post('/audit/log', async (req, res) => {
      try {
          const logEntry = await prisma.auditLog.create({
              data: req.body
          });
          res.status(201).send(logEntry);
      } catch (error) {
          logger.error({ err: error }, 'Failed to write to audit log.');
          res.status(500).send({ error: 'Could not write to audit log.' });
      }
  });

  return app;
}
