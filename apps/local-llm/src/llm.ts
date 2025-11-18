// This file uses @huggingface/transformers for on-device models.

import { pipeline, env as hfEnv, Pipeline, Tensor } from '@huggingface/transformers';
import { env, logger } from '@discord-agent/commons';

// Disable remote model downloads for local-only focus
hfEnv.allowRemoteModels = false;
hfEnv.localModelPath = env.LOCAL_LLM_MODEL_PATH_MACOS;

let sentimentAnalyzer: Pipeline;
let textEmbedder: Pipeline;

// These model names are placeholders. You would download quantized GGUF/ONNX models
// and place them in the path specified in your .env file.
const SENTIMENT_MODEL = 'distilbert-base-uncased-finetuned-sst-2-english';
const EMBEDDING_MODEL = 'all-MiniLM-L6-v2'; // A common sentence transformer

export async function initializeModels() {
    try {
        logger.info(`Loading models from local path: ${hfEnv.localModelPath}`);
        
        sentimentAnalyzer = await pipeline('sentiment-analysis', SENTIMENT_MODEL, {
            quantized: true, // Use quantized models for better performance
        });
        textEmbedder = await pipeline('feature-extraction', EMBEDDING_MODEL, {
            quantized: true,
        });
    } catch (error) {
        logger.error({ err: error }, `Failed to initialize models. Ensure models like '${SENTIMENT_MODEL}' exist at '${hfEnv.localModelPath}'.`);
        throw error;
    }
}

export async function analyzeText(text: string): Promise<any> {
    if (!sentimentAnalyzer) throw new Error('Sentiment analysis model not initialized.');
    
    const result = await sentimentAnalyzer(text);
    // This is a placeholder for more complex analysis
    return {
        sentiment: result[0].label.toLowerCase(),
        sentiment_score: result[0].score,
        toxicity: Math.random() * 0.1, // Placeholder
        emotion: 'neutral', // Placeholder
        intent: 'unknown', // Placeholder
    };
}

export async function createEmbedding(text: string): Promise<Tensor> {
    if (!textEmbedder) throw new Error('Embedding model not initialized.');

    const output = await textEmbedder(text, { pooling: 'mean', normalize: true });
    return output;
}
