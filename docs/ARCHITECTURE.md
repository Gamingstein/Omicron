# Architecture Document

This document outlines the architecture of the AI Discord Agent, a monorepo project designed for modularity, local-first operation, and a single-call-per-message decision-making process.

## Core Philosophy

- **Monorepo:** Use `turborepo` and `pnpm` workspaces to manage dependencies and streamline builds across multiple related apps and packages.
- **Local First:** All core components (vector store, database, local LLM) are designed to run on a local machine, minimizing reliance on cloud services. The only exception is the main, powerful LLM call (e.g., to Gemini).
- **Single Call Principle:** For each user message, the `Brain` package makes exactly one call to the remote large language model. This is crucial for managing cost, latency, and complexity. All necessary context is gathered and pre-processed *before* this single call.
- **Structured I/O:** The remote LLM is prompted to return a structured JSON object, which is then validated against a schema. This makes the bot's behavior predictable and reliable, avoiding free-form text parsing.

## Data Flow: A Message's Journey

1.  **Event Ingestion (`apps/bot`):**
    - The `bot` application connects to the Discord Gateway.
    - When a `messageCreate` event occurs, it ignores bots and performs initial session tracking (who is in the channel?).
    - It then passes a standardized message object to the `Brain` package for processing.

2.  **Pre-computation (`packages/brain` & `apps/local-llm`):**
    - The `Brain` receives the message.
    - It immediately calls the `local-llm` service's `/analyze` endpoint.
    - The `local-llm` service, using a small, quantized on-device model, performs quick analysis (sentiment, toxicity, emotion, intent) and returns the results to the `Brain`. This step is fast and local.

3.  **Context Aggregation (`packages/brain`):**
    - The `Brain` gathers all necessary context for its single, decisive LLM call:
        - **Persona:** Loads the server's configured persona from the `db` package (which reads from the SQLite database).
        - **Memory:** Queries the `memory` package. The `memory` package generates an embedding of the incoming message (by calling `apps/local-llm`) and searches the Qdrant vector store for the top-K most relevant past conversations or user bios.
        - **Participants:** Gets the list of active users in the channel from the `bot` app's session tracker.
        - **Chat History:** Retrieves the last N messages from the channel.
        - **Local Analysis:** The results from the `local-llm` service.

4.  **The Single Remote Call (`packages/brain`):**
    - The `Brain` uses the `persona` package to construct a detailed system prompt. This prompt includes all the aggregated context and, most importantly, instructs the remote LLM to return **only a valid JSON object** matching a specific schema.
    - It includes few-shot examples in the prompt to guide the model toward the correct output format.
    - The `Brain` makes the single API call to the configured remote LLM (e.g., Gemini).

5.  **Validation & Fallback (`packages/brain`):**
    - The `Brain` receives the text response from the LLM.
    - It uses `AJV` (via the `validator.ts` helper) to validate the JSON against the required schema.
    - **If validation passes:** The structured `BrainResponseType` object is used for the next steps.
    - **If validation fails:** The `Brain` attempts a fallback by trying to extract a JSON block from the text. If still invalid, it logs the failure and defaults to a safe, generic response to avoid crashing.

6.  **Action Execution (`packages/brain` -> `apps/mcp` & `packages/memory`):**
    - The `Brain` inspects the validated JSON object.
    - **`tasks` array:** If the LLM decided an action is needed (e.g., ban, mute, send embed), the `Brain` makes a secure, authenticated API call to the `mcp` (Mission Control Pad) server's `/execute` endpoint, forwarding the tasks. The `mcp` app has its own Discord client and is the only component authorized to perform moderator actions.
    - **`memory_ops` array:** If the LLM decided a memory should be stored or deleted, the `Brain` calls the appropriate function in the `memory` package (e.g., `memoryManager.upsert`).
    - **`response` object:** If the LLM generated a text response, the `Brain` signals back to the `bot` app (or calls an MCP task) to send the message to the Discord channel.

## Component Diagram

```
+-----------------+      +------------------+      +--------------------+
|                 |      |                  |      |                    |
|  Discord Gateway| <--> |    apps/bot      |----->|   packages/brain   |
|                 |      | (Event Handler)  |      | (Orchestrator)     |
+-----------------+      +------------------+      +---------+----------+
                                                               |
+-----------------+      +------------------+      +---------+----------+
|                 |      |                  |      |                    |
|  apps/mcp       | <----|   (HTTP API)     | <----|   (Single LLM Call)  |
| (Action Runner) |      |                  |      |                    |
+-----------------+      +------------------+      +---------+----------+
      ^                                                        |
      | (Executes Tasks)                                       | (Gathers Context)
      |                                                        |
+-----+-----------+      +------------------+      +-----------v----------+
|                 |      |                  |      |                      |
| packages/db     | <--> | packages/memory  | <--> | apps/local-llm       |
| (Prisma/SQLite) |      | (Qdrant Wrapper) |      | (Local Analysis/Embed)|
+-----------------+      +------------------+      +----------------------+
```

## Security Considerations

- **MCP Isolation:** The `mcp` server is the only component with permissions to execute sensitive Discord actions. It is protected by a secret key (`MCP_SECRET`), isolating the `Brain` from direct control over the Discord API for moderation.
- **Permission Checks:** Before executing a task, the `mcp` server checks against a list of `allowedCommands` stored in the `ServerConfig` table in the database. This prevents the LLM from hallucinating and executing a destructive command that the server owner has not explicitly enabled.
- **Data Encryption:** The `commons/utils` package provides `encrypt` and `decrypt` functions using AES-256-GCM. Sensitive data, such as user bios, should be encrypted before being stored in the database. The `ENCRYPTION_KEY` must be kept secret.
- **Rate Limiting:** The `mcp` server implements rate limiting to prevent abuse of its API endpoints.
- **PII Redaction:** Logging should be configured to redact personally identifiable information. The provided `pino` logger setup is a starting point.
- **Memory Purging:** The `memory` package provides a `purgeServerMemory` function, which can be exposed via a secure admin command to comply with data removal requests.
