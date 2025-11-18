import { Client, GatewayIntentBits, Events } from 'discord.js';
import { env, logger } from '@discord-agent/commons';
import { Brain } from '@discord-agent/brain';
import { handleMessageCreate } from './events/messageCreate';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const brain = new Brain();

client.once(Events.ClientReady, (readyClient) => {
  logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, (message) => {
    handleMessageCreate(message, brain);
});

async function main() {
    if (!env.DISCORD_TOKEN) {
        logger.fatal('DISCORD_TOKEN environment variable is not set.');
        process.exit(1);
    }
    try {
        await client.login(env.DISCORD_TOKEN);
    } catch (error) {
        logger.fatal({ err: error }, 'Failed to log in to Discord.');
        process.exit(1);
    }
}

main();
