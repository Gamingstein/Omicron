# Omicron - AI-Powered Discord Agent

A sophisticated, local-first Discord bot with advanced AI capabilities, built as a modular monorepo using TypeScript. Omicron features intelligent conversation handling, context-aware responses, and secure moderation capabilities powered by both local and cloud-based language models.

## 🌟 Key Features

- **🧠 Intelligent Conversation**: Context-aware responses using a single, optimized LLM call per message
- **🏠 Local-First Architecture**: Runs locally with minimal cloud dependencies (only the main LLM call)
- **🔒 Secure by Design**: Isolated action execution with permission-based command system
- **💾 Advanced Memory System**: Vector-based memory using Qdrant for semantic search and context retrieval
- **🎭 Customizable Personas**: Create unique bot personalities with configurable traits, backstories, and locales
- **⚡ Fast Local Analysis**: Quick message analysis (sentiment, toxicity, intent) using on-device models
- **🔐 Data Privacy**: Built-in encryption for sensitive data and GDPR-compliant data management
- **📊 Structured Responses**: JSON-validated outputs for predictable, reliable bot behavior
- **🛡️ Moderation Tools**: Secure API for executing Discord moderation actions
- **🚀 Monorepo Architecture**: Organized with Turborepo and pnpm workspaces

## 📋 Prerequisites

Before setting up Omicron, ensure you have the following installed:

- **Node.js** (v20 or later)
- **pnpm** (v10.22.0 - enforced by package manager)
- **Qdrant** (for vector storage)
- **Discord Bot Token** (from Discord Developer Portal)
- **Gemini API Key** (or other supported LLM provider)

### Installation on macOS (ARM64)

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install node pnpm
brew install qdrant/qdrant/qdrant

# Start Qdrant in the background
qdrant &
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Gamingstein/Omicron.git
cd Omicron
```

### 2. Configure Environment Variables

```bash
# Copy the environment template
cp ENV_TEMPLATE .env

# Edit .env with your configuration
nano .env
```

**Required environment variables:**
- `DISCORD_TOKEN`: Your Discord bot token
- `DISCORD_CLIENT_ID`: Your Discord application client ID
- `DISCORD_OWNER_ID`: Your Discord user ID
- `GEMINI_API_KEY`: Your Google AI Studio API key
- `MCP_SECRET`: A strong random secret (generate with `openssl rand -base64 32`)
- `ENCRYPTION_KEY`: 32-byte hex key (generate with `openssl rand -hex 32`)

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Set Up the Database

```bash
# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate
```

### 5. Download Local Models

```bash
# Create models directory
mkdir models

# Download pre-converted ONNX models from Hugging Face
# Example: Xenova/all-MiniLM-L6-v2
# Place model files in ./models/all-MiniLM-L6-v2

# Update .env with model path
# LOCAL_LLM_MODEL_PATH_MACOS=./models
```

### 6. Run the Application

#### Development Mode (with hot-reloading):
```bash
pnpm dev
```

#### Production Mode:
```bash
# Build all applications
pnpm build

# Start all services
pnpm start
```

### 7. Invite the Bot to Your Server

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application → OAuth2 → URL Generator
3. Select scopes: `bot`, `applications.commands`
4. Select permissions: `Send Messages`, `Manage Messages`, `Read Message History`, `Ban Members`
5. Copy the generated URL and open it in your browser to invite the bot

On first join, the bot will contact the server owner to configure its persona.

## 🏗️ Architecture Overview

Omicron follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐      ┌──────────────────┐      ┌────────────────────┐
│                 │      │                  │      │                    │
│ Discord Gateway │ ◄──► │   apps/bot       │─────►│  packages/brain    │
│                 │      │ (Event Handler)  │      │  (Orchestrator)    │
└─────────────────┘      └──────────────────┘      └─────────┬──────────┘
                                                               │
┌─────────────────┐      ┌──────────────────┐      ┌─────────▼──────────┐
│                 │      │                  │      │                    │
│   apps/mcp      │ ◄────┤   (HTTP API)     │ ◄────┤  (Single LLM Call) │
│ (Action Runner) │      │                  │      │                    │
└─────────────────┘      └──────────────────┘      └─────────┬──────────┘
      ▲                                                       │
      │ (Executes Tasks)                                     │ (Gathers Context)
      │                                                      │
┌─────┴───────────┐      ┌──────────────────┐      ┌────────▼───────────┐
│                 │      │                  │      │                    │
│  packages/db    │ ◄──► │ packages/memory  │ ◄──► │  apps/local-llm    │
│ (Prisma/SQLite) │      │ (Qdrant Wrapper) │      │ (Local Analysis)   │
└─────────────────┘      └──────────────────┘      └────────────────────┘
```

### Core Principles

1. **Single Call Principle**: One remote LLM call per message for cost efficiency and simplicity
2. **Local-First**: All processing except the main LLM call happens locally
3. **Structured I/O**: JSON-validated responses for predictable behavior
4. **Security Isolation**: Separate MCP service for privileged Discord actions

## 📁 Project Structure

```
Omicron/
├── apps/
│   ├── bot/              # Discord gateway event handler
│   ├── mcp/              # Mission Control Pad - secure action executor
│   └── local-llm/        # Local LLM service for fast analysis
├── packages/
│   ├── brain/            # Main orchestrator and decision-making logic
│   ├── commons/          # Shared utilities and helpers
│   ├── db/               # Prisma database schema and client
│   ├── embeddings/       # Vector embedding generation
│   ├── memory/           # Vector memory management with Qdrant
│   └── persona/          # Persona templates and system prompts
├── docs/
│   ├── ARCHITECTURE.md   # Detailed architecture documentation
│   ├── SETUP.md          # Comprehensive setup guide
│   ├── SECURITY.md       # Security and privacy documentation
│   └── PERSONA.md        # Persona configuration guide
├── examples/
│   ├── persona_luna.json # Example persona configuration
│   └── few_shot_example.json
├── config/               # Configuration files
├── tests/                # Test files
├── ENV_TEMPLATE          # Environment variables template
├── turbo.json            # Turborepo configuration
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── package.json          # Root package.json
```

### Applications (`apps/`)

- **bot**: Connects to Discord, handles events, and forwards messages to the Brain
- **mcp**: Secure HTTP API for executing Discord moderation actions
- **local-llm**: Runs local models for quick message analysis (sentiment, toxicity, intent)

### Packages (`packages/`)

- **brain**: Core orchestrator that gathers context and makes the single LLM call
- **commons**: Shared utilities (encryption, logging, validation)
- **db**: Prisma schema and database client (SQLite)
- **embeddings**: Generates vector embeddings for semantic search
- **memory**: Manages vector storage and retrieval using Qdrant
- **persona**: Persona templates and system prompt construction

## ⚙️ Configuration

### Persona Configuration

The bot's personality is defined through a persona configuration. When the bot first joins a server, it guides the owner through persona setup:

```json
{
  "name": "Luna",
  "age": 17,
  "gender": "female",
  "country": "US",
  "backstory": "A high school student from California...",
  "chaoticCalm": -0.5,
  "sarcasticSweet": 0.8,
  "memeFrequency": 0.7
}
```

See [`docs/PERSONA.md`](docs/PERSONA.md) for detailed persona customization options.

### Server Configuration

Each Discord server can configure:
- Allowed moderation commands
- Response settings
- Privacy preferences

Configuration is stored in the SQLite database and can be managed through bot commands.

## 🔧 Development

### Available Scripts

```bash
# Development with hot-reloading
pnpm dev

# Build all packages and apps
pnpm build

# Run linting
pnpm lint

# Run tests
pnpm test

# Start production build
pnpm start

# Database commands
pnpm db:generate   # Generate Prisma client
pnpm db:migrate    # Run migrations
pnpm db:studio     # Open Prisma Studio
```

### Adding a New Package

1. Create a new directory in `packages/`
2. Add `package.json` with appropriate name (`@discord-agent/package-name`)
3. Add to `pnpm-workspace.yaml` if needed
4. Run `pnpm install` to link dependencies

### Testing Changes

```bash
# Run tests for all packages
pnpm test

# Run tests for a specific package
cd packages/brain
pnpm test
```

## 🔐 Security & Privacy

Omicron is built with security and privacy as core principles:

- **MCP Isolation**: Only the MCP service can execute Discord actions, protected by authentication
- **Permission System**: Commands must be explicitly allowed per server
- **Data Encryption**: Sensitive data encrypted with AES-256-GCM
- **Rate Limiting**: API endpoints protected against abuse
- **Local Storage**: All data stored locally in SQLite and Qdrant
- **GDPR Compliance**: Built-in data purging capabilities

**⚠️ Important Security Notes:**
- Never commit your `.env` file
- Keep your `ENCRYPTION_KEY` and `MCP_SECRET` secure
- Regularly backup your database and vector store
- Review the [`docs/SECURITY.md`](docs/SECURITY.md) for detailed security guidelines

### Data Collected

- Message content (for context)
- User IDs and usernames
- Vector embeddings of conversations
- Server configurations and personas
- User bios (if provided)

See [`docs/SECURITY.md`](docs/SECURITY.md) for data handling and GDPR compliance details.

## 📚 Documentation

- **[Architecture](docs/ARCHITECTURE.md)**: Detailed system architecture and data flow
- **[Setup Guide](docs/SETUP.md)**: Comprehensive setup instructions for macOS ARM64
- **[Security](docs/SECURITY.md)**: Security model, privacy considerations, and data handling
- **[Persona Guide](docs/PERSONA.md)**: How to configure and customize bot personas

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the existing code style
4. Test your changes thoroughly
5. Commit with clear, descriptive messages
6. Push to your fork and submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing patterns and conventions
- Add JSDoc comments for public APIs
- Write tests for new features
- Run `pnpm lint` before committing

## 🐛 Troubleshooting

### Common Issues

**Bot doesn't respond:**
- Check that all services are running (`pnpm dev`)
- Verify Discord token is correct
- Ensure bot has proper permissions in the server
- Check logs for errors

**Database errors:**
- Run `pnpm db:generate` to regenerate Prisma client
- Run `pnpm db:migrate` to apply migrations
- Check that `DATABASE_URL` is correctly set

**Qdrant connection issues:**
- Verify Qdrant is running (`qdrant` or check Docker)
- Check `QDRANT_URL` in `.env`
- Ensure port 6333 is not blocked

**Local LLM errors:**
- Verify models are downloaded to the correct directory
- Check `LOCAL_LLM_MODEL_PATH_MACOS` points to model files
- Ensure sufficient memory is available

## 📄 License

This project is provided as-is for educational and personal use. Please ensure you comply with Discord's Terms of Service and any applicable data protection regulations when operating a bot instance.

## 🙏 Acknowledgments

- Built with [Discord.js](https://discord.js.org/)
- Powered by [Gemini API](https://ai.google.dev/)
- Vector storage by [Qdrant](https://qdrant.tech/)
- Database management with [Prisma](https://www.prisma.io/)
- Monorepo tooling by [Turborepo](https://turbo.build/)
- Local models via [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js)

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation in the `docs/` directory
- Review the troubleshooting section above

---

**Built with ❤️ for the Discord community**
