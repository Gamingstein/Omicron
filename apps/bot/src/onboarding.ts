import { Guild, ModalSubmitInteraction, ComponentType, TextInputStyle } from 'discord.js';
import { prisma } from '@discord-agent/db';
import { logger } from '@discord-agent/commons';

export function createOnboardingModal(guild: Guild) {
    return {
        custom_id: `onboarding-modal-${guild.id}`,
        title: `Bot Persona Setup for ${guild.name}`,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [{
                    type: ComponentType.TextInput,
                    custom_id: 'persona-name',
                    label: "What is the bot's name?",
                    style: TextInputStyle.Short,
                    placeholder: 'e.g., Luna, Sparky',
                    required: true,
                }]
            },
            {
                type: ComponentType.ActionRow,
                components: [{
                    type: ComponentType.TextInput,
                    custom_id: 'persona-age',
                    label: "What is the bot's age? (e.g., 16-19)",
                    style: TextInputStyle.Short,
                    value: '17',
                    required: true,
                }]
            },
            {
                type: ComponentType.ActionRow,
                components: [{
                    type: ComponentType.TextInput,
                    custom_id: 'persona-country',
                    label: "Bot's country? (US, UK, India, etc.)",
                    style: TextInputStyle.Short,
                    value: 'US',
                    required: true,
                }]
            },
            {
                type: ComponentType.ActionRow,
                components: [{
                    type: ComponentType.TextInput,
                    custom_id: 'persona-backstory',
                    label: "Bot's backstory (a few sentences)",
                    style: TextInputStyle.Paragraph,
                    placeholder: 'e.g., A time-traveling rubber duck...',
                    required: true,
                }]
            }
        ]
    };
}

export async function handleOnboardingSubmit(interaction: ModalSubmitInteraction) {
    if (!interaction.guild) return;

    try {
        await interaction.deferReply({ ephemeral: true });

        const name = interaction.fields.getTextInputValue('persona-name');
        const age = parseInt(interaction.fields.getTextInputValue('persona-age'), 10);
        const country = interaction.fields.getTextInputValue('persona-country');
        const backstory = interaction.fields.getTextInputValue('persona-backstory');

        if (isNaN(age)) {
            await interaction.editReply('Age must be a number.');
            return;
        }

        // Save to database
        const persona = await prisma.persona.create({
            data: {
                name,
                age,
                country,
                backstory,
                gender: 'female', // default
                chaoticCalm: 0,
                sarcasticSweet: 0,
                memeFrequency: 0.5,
            }
        });

        await prisma.serverConfig.upsert({
            where: { guildId: interaction.guild.id },
            update: { personaId: persona.id },
            create: {
                guildId: interaction.guild.id,
                ownerId: interaction.guild.ownerId,
                personaId: persona.id,
                allowedCommands: 'send_message', // Default allowed commands
            }
        });

        await interaction.editReply('Onboarding complete! The bot is now configured with its new persona.');

    } catch (error) {
        logger.error({ err: error }, 'Failed to handle onboarding submission.');
        await interaction.editReply('There was an error saving the configuration.');
    }
}
