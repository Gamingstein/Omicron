# Security & Privacy Document

This document details the security model, privacy considerations, and data handling practices for the AI Discord Agent project.

## Security Architecture

The security of the agent is based on the principle of least privilege and isolation of components.

### 1. MCP (Mission Control Pad) as a Secure Executor

- **Isolation:** The `apps/mcp` service is the *only* component with the ability to perform actions in Discord (e.g., send messages, ban users, manage roles). It runs as a separate process and exposes a firewalled HTTP API.
- **Authentication:** The `Brain` authenticates with the `mcp` server using a shared secret key (`MCP_SECRET`) sent as a Bearer token. This prevents unauthorized actors on the network from calling the MCP API.
- **Authorization:** Even when a task is received from a trusted `Brain`, the `mcp` performs a final authorization check. It looks up the `ServerConfig` for the relevant guild and verifies that the requested task type (e.g., `ban`) is in the `allowedCommands` list for that server. This prevents the LLM from executing a command that the server owner has not explicitly permitted.

### 2. Environment Variable Security

- **`.env` File:** All secrets (API keys, tokens) are managed through an `.env` file, which is listed in `.gitignore` and should **never** be committed to version control.
- **`ENV_TEMPLATE`:** A template file is provided to show which variables are needed, but it contains no actual secrets.

### 3. Data Encryption

- **At-Rest Encryption:** The `packages/commons/src/utils.ts` file contains helper functions (`encrypt`, `decrypt`) that use the built-in `crypto` module to perform AES-256-GCM encryption.
- **Usage:** This should be used to encrypt sensitive data before it is stored in the SQLite database. For example, the `UserBio` model's `bio` field should be encrypted.
- **Key Management:** The `ENCRYPTION_KEY` is a 32-byte hex string stored in the `.env` file. The security of the encrypted data depends entirely on the secrecy of this key.

### 4. Rate Limiting & Safeguards

- **API Limiting:** The `mcp` server uses `express-rate-limit` to prevent abuse of its API, mitigating denial-of-service risks.
- **Dangerous Command Confirmation:** For highly destructive actions (e.g., mass-ban), the implementation should include a confirmation loop. For example, the `mcp` could send a direct message to the server owner with a confirmation link or button before proceeding. (This feature is noted as a design goal).

## Privacy Considerations

### Data Collection

The bot collects and stores the following types of data:

1.  **Message Content:** Public messages sent in channels where the bot is active are processed.
2.  **User Information:** User IDs and usernames are stored to track conversation participants.
3.  **Vector Embeddings:** Message content is converted into numerical vectors for semantic search. These vectors, while not directly readable by humans, represent the semantic meaning of the text.
4.  **Vector Metadata (`VectorMetadata` table):** This links a vector to its original text, a summary, the guild/channel it came from, and the user who sent it. This is the most sensitive stored data from a privacy perspective.
5.  **User Bios (`UserBio` table):** Explicitly provided user information is stored to personalize interactions.
6.  **Server Configuration (`ServerConfig`, `Persona` tables):** Guild-specific settings and persona configurations.

### Data Storage & Retention

- **Database:** All metadata is stored in a local SQLite file (`packages/db/prisma/sqlite/dev.db`).
- **Vector Store:** All embeddings are stored in a local Qdrant instance (`qdrant_storage` directory).
- **Retention Policy:** By default, data is stored indefinitely. It is the responsibility of the bot operator to manage data retention policies.

### GDPR & Data Rights

Operating a bot that stores user data carries responsibilities under regulations like GDPR.

- **Right to Access:** A user can request a copy of their data. The bot operator would need to query the `VectorMetadata` and `UserBio` tables for the user's ID.
- **Right to Erasure ("Right to be Forgotten"):** A user can request the deletion of their data.
    - The `memory` package includes a `purgeServerMemory(guildId)` function.
    - A more granular `purgeUserMemory(userId)` function should be implemented for individual requests. This function would need to:
        1.  Query `VectorMetadata` for all records associated with the `userId`.
        2.  Extract the Qdrant point IDs from these records.
        3.  Call `qdrant.delete()` with the list of point IDs.
        4.  Delete the records from the `VectorMetadata` table in Prisma.
        5.  Delete the user's record from the `UserBio` table.
- **Data Portability:** Data can be exported from the SQLite database in standard formats like CSV or JSON.

### Warnings for Bot Operators

The documentation (specifically this file and `SETUP.md`) must clearly state:
- The bot stores message content and user information.
- The operator is responsible for complying with local data protection laws.
- The operator should create and publish a privacy policy for their bot instance, explaining what data is collected and why.
- The `ENCRYPTION_KEY` and other secrets must be protected. Loss of the encryption key will result in the inability to decrypt stored data.
