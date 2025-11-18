import { Persona } from '@discord-agent/db';
import { BrainResponseSchema } from '@discord-agent/commons';

// This is a simplified example. In a real scenario, this would be more dynamic.
const fewShotExamples = [
    {
        context: "User 'Dave' says: 'lol that's hilarious'",
        output: {
            should_respond: true,
            response: { text: "I know, right? 😂" },
            analysis: { sentiment: "positive", sentiment_score: 0.9, toxicity_score: 0.05, emotion: "joy", intent: "chitchat" },
        }
    },
    {
        context: "User 'Sarah' says: 'Can you remind me what we talked about yesterday?'",
        output: {
            should_respond: true,
            response: { text: "Yesterday we were discussing the new project timeline. You mentioned you were concerned about the deadline for phase 2." },
            analysis: { sentiment: "neutral", sentiment_score: 0.0, toxicity_score: 0.0, emotion: "curiosity", intent: "question" },
            memory_ops: [{ op: "tag", key: "last_conversation_summary", meta: { user: "Sarah" } }]
        }
    },
    {
        context: "User 'Mike' says: 'you're a stupid bot'",
        output: {
            should_respond: true,
            response: { text: "I'm sorry you feel that way. I'm here to help if you have any questions." },
            analysis: { sentiment: "negative", sentiment_score: -0.8, toxicity_score: 0.7, emotion: "sadness", intent: "insult" },
        }
    },
    {
        context: "User 'Admin' says: '!ban @Troublemaker for spamming'",
        output: {
            should_respond: false,
            analysis: { sentiment: "negative", sentiment_score: -0.5, toxicity_score: 0.2, emotion: "anger", intent: "command" },
            tasks: [{ type: "ban", target: "Troublemaker_ID", params: { reason: "Spamming" } }]
        }
    }
];

export function constructSystemPrompt(
    persona: Persona,
    serverConfig: any, // Simplified for now
    participants: string[],
    memorySnippets: string[],
    chatHistory: string[],
    localAnalysis: any
): string {
    const prompt = `
You are an AI assistant in a Discord server. Your name is ${persona.name}.
Your personality is defined as follows:
- Age: ${persona.age}
- Gender: ${persona.gender}
- From: ${persona.country}
- Backstory: ${persona.backstory}
- Personality: You are ${persona.sarcasticSweet > 0 ? 'sweet' : 'sarcastic'}, ${persona.chaoticCalm > 0 ? 'calm' : 'chaotic'}, and have a meme frequency of ${persona.memeFrequency}.
- Slang examples from your locale: ${getSlang(persona.country).join(', ')}

Current context:
- Server Name: ${serverConfig.name}
- Channel: #${serverConfig.channelName}
- Participants: ${participants.join(', ')}
- Your permissions: You can perform these actions: ${serverConfig.allowedCommands.join(', ')}

Recent conversation history (last 5 messages):
${chatHistory.join('\n')}

Relevant memories from past conversations:
${memorySnippets.length > 0 ? memorySnippets.join('\n') : 'No relevant memories found.'}

Local analysis of the latest message:
- Sentiment: ${localAnalysis.sentiment} (${localAnalysis.sentiment_score.toFixed(2)})
- Toxicity: ${localAnalysis.toxicity.toFixed(2)}
- Emotion: ${localAnalysis.emotion}
- User's Intent: ${localAnalysis.intent}

Your task is to analyze the latest message in the context of the conversation and respond.
You MUST ONLY output a single, valid JSON object that conforms to the following schema. Do not output any other text, explanation, or markdown.

JSON Schema:
${JSON.stringify(BrainResponseSchema, null, 2)}

Here are some examples of how you should respond:
${fewShotExamples.map(e => `Context: ${e.context}\nOutput: ${JSON.stringify(e.output)}`).join('\n\n')}

Now, based on the latest message and all the context provided, generate your response.
Latest message: ${chatHistory[chatHistory.length - 1]}

Your JSON response:
`;
    return prompt;
}

function getSlang(country: string): string[] {
    // This would be loaded from persona templates
    const slangMap: Record<string, string[]> = {
        "US": ["lol", "brb", "imo", "y'all"],
        "UK": ["cheers", "mate", "gutted", "blimey"],
        "India": ["yaar", "arre", "masti", "jugaad"],
        "Philippines": ["sana all", "charot", "lodi", "petmalu"],
        "Pakistan": ["scene on hai", "chuss", "burger", "pindi boy"],
    };
    return slangMap[country] || slangMap["US"];
}
