import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const env = {
  // Discord
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_OWNER_ID: process.env.DISCORD_OWNER_ID,

  // Gemini API Key
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  // MCP Server
  MCP_API_URL: process.env.MCP_API_URL,
  MCP_SECRET: process.env.MCP_SECRET,

  // Local LLM Server
  LOCAL_LLM_API_URL: process.env.LOCAL_LLM_API_URL,

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Qdrant
  QDRANT_URL: process.env.QDRANT_URL,

  // Node
  NODE_ENV: process.env.NODE_ENV,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL,
  
  // Model Paths
  LOCAL_LLM_MODEL_PATH_MACOS: process.env.LOCAL_LLM_MODEL_PATH_MACOS,
  LOCAL_LLM_MODEL_PATH_PI: process.env.LOCAL_LLM_MODEL_PATH_PI,

  // Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
};
