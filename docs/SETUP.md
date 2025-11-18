# Discord Agent Setup Guide (macOS ARM64)

This guide will walk you through setting up the Discord Agent on a macOS machine with Apple Silicon (M1/M2/M3).

## 1. Prerequisites

### Homebrew
If you don't have Homebrew, install it first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### PNPM
We use `pnpm` for package management.
```bash
brew install pnpm
```
The required version `10.22.0` will be enforced by the project's `packageManager` field.

### Node.js
Install Node.js (v20 or later recommended).
```bash
brew install node
```

### Qdrant (Vector Store)
Qdrant can be run easily using Docker, but for a local-only setup, you can install the binary.
```bash
brew install qdrant/qdrant/qdrant
```
Once installed, you can run it in the background:
```bash
qdrant &
```
This will start the Qdrant server on its default port `6333`.

## 2. Project Setup

### Clone the Repository
```bash
git clone <your-repo-url>
cd discord-agent-monorepo
```

### Environment Variables
Copy the template file to create your own environment configuration.
```bash
cp ENV_TEMPLATE .env
```
Now, edit the `.env` file and fill in the required values:
- `DISCORD_TOKEN`: Your Discord bot's token.
- `DISCORD_CLIENT_ID`: Your Discord application's client ID.
- `DISCORD_OWNER_ID`: Your Discord user ID.
- `GEMINI_API_KEY`: Your Google AI Studio API key.
- `MCP_SECRET`: A long, random string for securing the Brain-MCP communication.
- `ENCRYPTION_KEY`: A 32-byte (64-character hex) key for encrypting sensitive data. You can generate one with `openssl rand -hex 32`.

### Install Dependencies
Install all dependencies for the monorepo using `pnpm`.
```bash
pnpm install
```

### Database Setup
The project uses Prisma with a SQLite database.
1.  **Generate Prisma Client**: This is usually done during the build, but you can run it manually.
    ```bash
    pnpm db:generate
    ```
2.  **Run Migrations**: This will create the SQLite database file and apply the schema.
    ```bash
    pnpm db:migrate
    ```
    You can view the database with Prisma Studio:
    ```bash
    pnpm db:studio
    ```

### Local Models
The `local-llm` service requires quantized models to be downloaded.
1. Create a `models` directory in the root of the project.
   ```bash
   mkdir models
   ```
2. Download the required models. For `@huggingface/transformers.js`, you need to convert them to the ONNX format. You can find pre-converted models on the Hugging Face Hub.
   - Go to the Hugging Face Hub (e.g., `https://huggingface.co/Xenova/all-MiniLM-L6-v2`).
   - Download the `onnx` subdirectory contents.
   - Place them in a folder inside `./models`, e.g., `./models/all-MiniLM-L6-v2`.
3. Update your `.env` file to point to the correct model path:
   ```
   LOCAL_LLM_MODEL_PATH_MACOS=./models
   ```

## 3. Running the Application

### Development Mode
This command uses `turbo` to run all applications (`bot`, `mcp`, `local-llm`) concurrently with hot-reloading.
```bash
pnpm dev
```
You should see logs from all services in your terminal.

### Production Mode
1.  **Build all applications**:
    ```bash
    pnpm build
    ```
2.  **Start all applications**:
    ```bash
    pnpm start
    ```
This will run the compiled JavaScript code from the `dist` directories.

## 4. Inviting the Bot
1. Go to the Discord Developer Portal -> Your Application -> OAuth2 -> URL Generator.
2. Select the `bot` and `applications.commands` scopes.
3. Select the necessary Bot Permissions (e.g., `Send Messages`, `Manage Messages`, `Read Message History`, `Ban Members`).
4. Copy the generated URL and paste it into your browser to invite the bot to your server.

On first join, the bot should contact the server owner (you) to begin the persona setup process.
