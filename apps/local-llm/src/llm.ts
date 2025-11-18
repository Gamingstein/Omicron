// This file uses @huggingface/transformers for on-device models.

import { pipeline, env as hfEnv, Tensor } from "@huggingface/transformers";
import { env, logger } from "@discord-agent/commons";

// Enable remote model downloads
hfEnv.allowRemoteModels = true;
// No local model path is set, models will be downloaded to cache

let sentimentAnalyzer: any;
let textEmbedder: any;

// These model names are placeholders. Hugging Face will download them remotely.
const SENTIMENT_MODEL =
  "Xenova/distilbert-base-uncased-finetuned-sst-2-english";
const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"; // A common sentence transformer

export async function initializeModels() {
  try {
    logger.info(
      "Initializing Hugging Face models (remote download enabled)...",
    );

    sentimentAnalyzer = await pipeline("sentiment-analysis", SENTIMENT_MODEL);
    textEmbedder = await pipeline("feature-extraction", EMBEDDING_MODEL);
    logger.info("Hugging Face models initialized successfully.");
  } catch (error) {
    logger.error(
      { err: error },
      `Failed to initialize Hugging Face models. Ensure models like '${SENTIMENT_MODEL}' can be downloaded.`,
    );
    throw error;
  }
}

export async function analyzeText(text: string): Promise<any> {
  if (!sentimentAnalyzer)
    throw new Error("Sentiment analysis model not initialized.");

  const result = await sentimentAnalyzer(text);
  // This is a placeholder for more complex analysis
  return {
    sentiment: result[0].label.toLowerCase(),
    sentiment_score: result[0].score,
    toxicity: Math.random() * 0.1, // Placeholder
    emotion: "neutral", // Placeholder
    intent: "unknown", // Placeholder
  };
}

export async function createEmbedding(text: string): Promise<Tensor> {
  if (!textEmbedder) throw new Error("Embedding model not initialized.");

  const output = await textEmbedder(text, { pooling: "mean", normalize: true });
  return output;
}
