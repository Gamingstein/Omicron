import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  BrainResponseType,
  env,
  logger,
  LocalAnalysis,
} from "@discord-agent/commons";
import { getPersonaForGuild } from "@discord-agent/persona";
import { constructSystemPrompt } from "@discord-agent/persona";
import { memoryManager } from "@discord-agent/memory";
import { validateBrainResponse } from "./validator";
import axios from "axios";
import { LRUCache } from "lru-cache";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const mcpApi = axios.create({
  baseURL: env.MCP_API_URL,
  headers: { Authorization: `Bearer ${env.MCP_SECRET}` },
});

const resultCache = new LRUCache<string, BrainResponseType>({ max: 100 });

export class Brain {
  public async processMessage(message: {
    id: string;
    content: string;
    author: { id: string; username: string };
    channel: { id: string; name: string };
    guild: { id: string; name: string };
    mentions: any[];
  }) {
    const cacheKey = `${message.channel.id}-${message.id}`;
    if (resultCache.has(cacheKey)) {
      logger.info(`[Cache] Hit for message ${message.id}`);
      return this.handleBrainResponse(
        resultCache.get(cacheKey)!,
        message.guild.id,
        message.channel.id,
      );
    }

    // 1. Triage for commands
    if (message.content.startsWith("!") || message.content.startsWith("/")) {
      // Simple command triage to avoid LLM call
      logger.info(
        `[Triage] Message '${message.content}' identified as command.`,
      );
      // In a real implementation, you'd parse and execute here or send to MCP
      return;
    }

    // 2. Get local analysis
    const localAnalysis = await this.getLocalAnalysis(message.content);

    // 3. Retrieve context (persona, memory, etc.)
    const persona = await getPersonaForGuild(message.guild.id);
    if (!persona) {
      logger.warn(`No persona found for guild ${message.guild.id}. Skipping.`);
      return;
    }
    const memories = await memoryManager.retrieve(
      message.content,
      message.guild.id,
    );
    const memorySnippets = memories.map(
      (m) => m.metadata.summary || m.metadata.text,
    );

    // 4. Construct the prompt
    const systemPrompt = constructSystemPrompt(
      persona,
      {
        name: message.guild.name,
        channelName: message.channel.name,
        allowedCommands: [],
      },
      [message.author.username], // Simplified participant list
      memorySnippets,
      [message.content], // Simplified history
      localAnalysis,
    );

    // console.log("System Prompt:", systemPrompt);
    // 5. Make the single remote LLM call
    try {
      const result = await model.generateContent(systemPrompt);
      const responseJsonText = result.response.text();

      // 6. Validate and parse the response
      const brainResponse = this.parseAndValidate(responseJsonText);

      resultCache.set(cacheKey, brainResponse);

      // 7. Execute the brain's decisions
      await this.handleBrainResponse(
        brainResponse,
        message.guild.id,
        message.channel.id,
      );
    } catch (error) {
      logger.error(
        { err: error },
        "Error during Gemini API call or subsequent processing.",
      );
      // Implement fallback logic
    }
  }

  private async getLocalAnalysis(text: string): Promise<LocalAnalysis> {
    try {
      const response = await axios.post(`${env.LOCAL_LLM_API_URL}/analyze`, {
        text,
      });
      return response.data;
    } catch (error) {
      logger.error({ err: error }, "Failed to get local analysis.");
      // Return a neutral default
      return {
        sentiment: "neutral",
        sentiment_score: 0,
        toxicity: 0,
        emotion: "unknown",
        intent: "unknown",
      };
    }
  }

  private parseAndValidate(jsonText: string): BrainResponseType {
    let parsed;
    try {
      // First attempt: parse directly
      parsed = JSON.parse(jsonText);
    } catch (e) {
      // Fallback: extract from markdown code block
      const match = jsonText.match(/```json\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        try {
          parsed = JSON.parse(match[1]);
        } catch (e2) {
          logger.error({ err: e2 }, "Failed to parse extracted JSON.");
          throw new Error("Invalid JSON response even after extraction.");
        }
      } else {
        logger.error({ err: e, jsonText }, "Failed to parse JSON response.");
        throw new Error("Invalid JSON response from LLM.");
      }
    }

    const { valid, errors } = validateBrainResponse(parsed);
    if (!valid) {
      logger.warn({ errors }, "LLM response failed schema validation.");
      // Potentially try to fix the response or just throw
      throw new Error("LLM response failed validation.");
    }
    return parsed;
  }

  private async handleBrainResponse(
    response: BrainResponseType,
    guildId: string,
    channelId: string,
  ) {
    const tasksToExecute = response.tasks ? [...response.tasks] : [];

    // If the brain decides to respond, treat it as a `send_message` task for the MCP
    if (response.should_respond && response.response) {
      logger.info(
        { response: response.response },
        "Brain decided to respond. Creating send_message task.",
      );
      tasksToExecute.push({
        type: "send_message",
        target: channelId,
        params: {
          text: response.response.text,
        },
      });
    }

    // Execute tasks via MCP
    if (tasksToExecute.length > 0) {
      logger.info({ tasks: tasksToExecute }, "Forwarding tasks to MCP.");
      // We don't await this, let it run in the background
      mcpApi
        .post("/execute", { tasks: tasksToExecute, guildId })
        .catch((err) => {
          logger.error({ err }, "Failed to send tasks to MCP.");
        });
    }

    // Perform memory operations
    if (response.memory_ops && response.memory_ops.length > 0) {
      for (const op of response.memory_ops) {
        switch (op.op) {
          case "upsert":
            if (op.meta?.text) {
              await memoryManager.upsert({
                text: op.meta.text,
                summary: op.meta.summary || op.meta.text,
                guildId: guildId,
                channelId: op.meta.channelId,
              });
            }
            break;
          case "delete":
            await memoryManager.delete(op.key);
            break;
        }
      }
    }
  }
}
