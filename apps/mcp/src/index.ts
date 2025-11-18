import { createServer } from './server';
import { logger, env } from '@discord-agent/commons';
import { Client, GatewayIntentBits } from 'discord.js';

const PORT = env.MCP_API_URL?.split(':').pop() || 3001;

// The MCP needs its own Discord client to perform actions.
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

discordClient.once('ready', () => {
  logger.info('MCP Discord client is ready.');
  const app = createServer(discordClient);
  app.listen(PORT, () => {
    logger.info(`MCP server listening on port ${PORT}`);
  });
});

if (!env.DISCORD_TOKEN) {
    logger.fatal('DISCORD_TOKEN is required for MCP to function.');
    process.exit(1);
}

discordClient.login(env.DISCORD_TOKEN);
