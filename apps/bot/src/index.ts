import { Client, GatewayIntentBits, Events, REST, Routes } from 'discord.js';
import { env, logger } from '@discord-agent/commons';
import { Brain } from '@discord-agent/brain';
import { handleMessageCreate } from './events/messageCreate';
import { commands } from './commands';
import { handleOnboardingSubmit } from './onboarding';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildIntegrations,
  ],
});

const brain = new Brain();

client.once(Events.ClientReady, async (readyClient) => {
  logger.info(`Ready! Logged in as ${readyClient.user.tag}`);

  const rest = new REST().setToken(env.DISCORD_TOKEN!);
  try {
    logger.info('Started refreshing application (/) commands.');
    const commandData = commands.map(command => command.data.toJSON());
    await rest.put(
      Routes.applicationCommands(env.DISCORD_CLIENT_ID!),
      { body: commandData },
    );
    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error({ err: error }, 'Failed to reload application (/) commands.');
  }
});

client.on(Events.GuildCreate, async (guild) => {
    logger.info(`Joined a new guild: ${guild.name} (${guild.id})`);
    try {
        const owner = await guild.fetchOwner();
        await owner.send(
            `Hello! Thanks for adding me to **${guild.name}**.\n` +
            `To get started, please use the \`/onboard\` command in your server to configure my personality.`
        );
    } catch (error) {
        logger.error({ err: error }, `Could not send onboarding message to owner of ${guild.name}.`);
        // Optionally, find a public channel and post the message there.
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = commands.find(cmd => cmd.data.name === interaction.commandName);
    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error({ err: error }, `Error executing command ${interaction.commandName}`);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('onboarding-modal-')) {
        await handleOnboardingSubmit(interaction);
    }
  }
});

client.on(Events.MessageCreate, (message) => {
    handleMessageCreate(message, brain);
});

async function main() {
    if (!env.DISCORD_TOKEN) {
        logger.fatal('DISCORD_TOKEN environment variable is not set.');
        process.exit(1);
    }
    if (!env.DISCORD_CLIENT_ID) {
        logger.fatal('DISCORD_CLIENT_ID environment variable is not set.');
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
