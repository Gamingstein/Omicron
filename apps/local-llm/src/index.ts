import { createServer } from './server';
import { logger, env } from '@discord-agent/commons';
import { initializeModels } from './llm';

const PORT = env.LOCAL_LLM_API_URL?.split(':').pop() || 3002;

async function main() {
    try {
        logger.info('Initializing local LLM models...');
        await initializeModels();
        logger.info('Models initialized successfully.');

        const app = createServer();
        app.listen(PORT, () => {
            logger.info(`Local LLM server listening on port ${PORT}`);
        });
    } catch (error) {
        logger.fatal({ err: error }, 'Failed to initialize local LLM service.');
        process.exit(1);
    }
}

main();
