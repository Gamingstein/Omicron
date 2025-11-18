export * from './system_prompts';
export * from './templates';

import { prisma, Persona } from '@discord-agent/db';
import { logger } from '@discord-agent/commons';

export async function getPersonaForGuild(guildId: string): Promise<Persona | null> {
    try {
        const serverConfig = await prisma.serverConfig.findUnique({
            where: { guildId },
            include: { persona: true },
        });
        return serverConfig?.persona ?? null;
    } catch (error) {
        logger.error({ err: error, guildId }, "Failed to retrieve persona for guild");
        return null;
    }
}
