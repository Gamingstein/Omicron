# Persona Guide

The persona is the heart of the bot's personality. It dictates how the bot behaves, speaks, and interacts with users. A well-defined persona creates a consistent and engaging user experience.

## Persona Configuration

When the bot first joins a server, it will prompt the server owner to configure its persona. The following fields are defined in the `Persona` schema in `packages/db/prisma/schema.prisma`.

### Core Attributes

-   **`name` (String):** The bot's name.
-   **`age` (Int):** The bot's perceived age. This heavily influences its tone and references. The schema requires this to be a teenager (e.g., 16-19).
-   **`gender` (String):** The bot's gender identity.
-   **`country` (String):** The bot's country of origin. This is used to select appropriate slang and cultural references.
-   **`backstory` (String):** A brief biography or history for the bot. This gives the LLM context for its motivations and knowledge base. A good backstory might be a few sentences long.

### Personality Sliders

These are floating-point values, typically from `-1.0` to `1.0` or `0.0` to `1.0`, that tune the bot's behavior along different axes.

-   **`chaoticCalm` (Float):**
    -   `-1.0` (Chaotic): More unpredictable, uses more emojis, might make random jokes.
    -   `1.0` (Calm): More measured, thoughtful, and uses a more formal tone.
-   **`sarcasticSweet` (Float):**
    -   `-1.0` (Sarcastic): Dry wit, sarcastic humor, might gently poke fun at users.
    -   `1.0` (Sweet): Friendly, encouraging, and always positive.
-   **`memeFrequency` (Float):**
    -   `0.0` (Never): Avoids memes and internet slang entirely.
    -   `1.0` (Always): Frequently uses current memes, copypastas, and internet humor.

## Persona Templates

To make onboarding easier, the bot provides pre-defined persona templates based on the selected `country`. These templates are located in `packages/persona/src/templates.ts`.

### Template Structure

Each template provides a starting point for the core attributes and includes a list of sample slang relevant to the locale.

**Example (UK Template):**
```typescript
{
    name: "Charlie",
    age: 17,
    gender: "male",
    country: "UK",
    backstory: "Loves football (the real kind), grime music, and is always up for a bit of banter.",
    slang: ["mate", "innit", "chuffed", "cheeky"]
}
```

### Included Locales

The initial set of templates includes:
-   United States (US)
-   United Kingdom (UK)
-   India (IN)
-   Philippines (PH)
-   Pakistan (PK)

These templates are used to populate the system prompt with relevant slang and cultural context, making the bot's interactions feel more authentic to its chosen persona.

## How the Persona is Used

The configured `Persona` object is fetched from the database at the beginning of the message processing pipeline in the `Brain`. It is then passed to the `constructSystemPrompt` function in `packages/persona/src/system_prompts.ts`.

The system prompt explicitly tells the LLM to adopt the persona, using all the fields to guide its response generation.

**Example snippet from the system prompt:**
```
You are an AI assistant in a Discord server. Your name is ${persona.name}.
Your personality is defined as follows:
- Age: ${persona.age}
- From: ${persona.country}
- Backstory: ${persona.backstory}
- Personality: You are ${persona.sarcasticSweet > 0 ? 'sweet' : 'sarcastic'}, ${persona.chaoticCalm > 0 ? 'calm' : 'chaotic'}, and have a meme frequency of ${persona.memeFrequency}.
- Slang examples from your locale: ${getSlang(persona.country).join(', ')}
```

By injecting these details directly into the prompt, we ensure the LLM has clear instructions on how to behave, leading to a more consistent and believable character.
