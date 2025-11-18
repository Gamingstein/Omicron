import request from 'supertest';
import { createServer } from '../src/server';
import { Client } from 'discord.js';
import { env } from '@discord-agent/commons';
import { prisma } from '@discord-agent/db';

// Mock the discord.js client
const mockDiscordClient = {
  isReady: () => true,
  channels: {
    fetch: jest.fn().mockResolvedValue({
      isTextBased: () => true,
      send: jest.fn().mockResolvedValue(true),
    }),
  },
} as unknown as Client;

const app = createServer(mockDiscordClient);

describe('MCP Server', () => {
    beforeAll(async () => {
        // Seed the DB for tests
        await prisma.serverConfig.create({
            data: {
                guildId: 'test-guild',
                ownerId: 'test-owner',
                allowedCommands: ['send_message'],
                persona: {
                    create: {
                        name: 'TestBot',
                        age: 18,
                        gender: 'bot',
                        country: 'US',
                        backstory: 'A bot for testing.',
                        chaoticCalm: 0,
                        sarcasticSweet: 0,
                        memeFrequency: 0.5,
                    }
                }
            }
        });
    });

    afterAll(async () => {
        await prisma.serverConfig.delete({ where: { guildId: 'test-guild' }});
    });

    it('should deny access without a token', async () => {
        await request(app).post('/execute').send({}).expect(401);
    });

    it('should deny access with an invalid token', async () => {
        await request(app)
            .post('/execute')
            .set('Authorization', 'Bearer invalid-token')
            .send({})
            .expect(403);
    });

    it('should reject a task if the command is not allowed', async () => {
        const response = await request(app)
            .post('/execute')
            .set('Authorization', `Bearer ${env.MCP_SECRET}`)
            .send({
                guildId: 'test-guild',
                tasks: [{ type: 'ban', target: 'user-123' }]
            });
        
        expect(response.status).toBe(200);
        expect(response.body.results[0].success).toBe(false);
        expect(response.body.results[0].error).toContain('not allowed');
    });

    it('should execute an allowed task', async () => {
        const response = await request(app)
            .post('/execute')
            .set('Authorization', `Bearer ${env.MCP_SECRET}`)
            .send({
                guildId: 'test-guild',
                tasks: [{ type: 'send_message', target: 'channel-123', params: { text: 'hello' } }]
            });

        expect(response.status).toBe(200);
        expect(response.body.results[0].success).toBe(true);
    });
});
