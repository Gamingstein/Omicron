import { SlashCommandBuilder, CommandInteraction, PermissionsBitField } from 'discord.js';
import { createOnboardingModal } from '../onboarding';

export const onboardingCommand = {
  data: new SlashCommandBuilder()
    .setName('onboard')
    .setDescription('Manually trigger the bot onboarding process (Owner only).')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  async execute(interaction: CommandInteraction) {
    if (interaction.user.id !== interaction.guild?.ownerId) {
        await interaction.reply({ content: 'Only the server owner can use this command.', ephemeral: true });
        return;
    }
    
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }

    const modal = createOnboardingModal(interaction.guild);
    await interaction.showModal(modal as any);
  },
};

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays help information about the bot.'),
  async execute(interaction: CommandInteraction) {
    await interaction.reply({ content: 'Here are the available commands:\n- `/onboard`: Manually trigger the bot onboarding process.\n- `/help`: Displays this help message.', ephemeral: true });
  },
};

export const commands = [onboardingCommand, helpCommand];
