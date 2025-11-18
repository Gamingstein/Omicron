import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '@discord-agent/commons';

let qdrantClient: QdrantClient;

export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    // The Qdrant JS client can be configured to run in-memory,
    // but it requires a WASM file. For simplicity and Pi compatibility,
    // we'll assume a local Qdrant instance is running via Docker or binary.
    // The PI_ZERO_SETUP.md will contain instructions for this.
    qdrantClient = new QdrantClient({
      url: env.QDRANT_URL,
    });
  }
  return qdrantClient;
}
