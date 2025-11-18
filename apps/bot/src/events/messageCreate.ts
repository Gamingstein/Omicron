import { Message } from 'discord.js';
import { Brain } from '@discord-agent/brain';
import { logger } from '@discord-agent/commons';
import { trackMessage, isUserTracked } from './session';

export async function handleMessageCreate(message: Message, brain: Brain) {
  if (message.author.bot) return;

  // Track participants in the conversation
  if (!isUserTracked(message.channel.id, message.author.id)) {
    trackMessage(message.channel.id, message.author.id, message.author.username);
  }

  try {
    // The brain will process the message and decide what to do.
    // The brain's response will trigger actions (like sending a message)
    // via the MCP or directly if it's a simple text response.
    const brainResponse = await brain.processMessage({
        id: message.id,
        content: message.content,
        author: { id: message.author.id, username: message.author.username },
        channel: { id: message.channel.id, name: (message.channel as any).name },
        guild: { id: message.guild!.id, name: message.guild!.name },
        mentions: [], // Simplified
    });

    // In this architecture, the `brain` calls the MCP.
    // The `bot` app's primary job is to forward events to the brain
    // and handle direct responses from the brain.
    // The `processMessage` in brain is currently void, but could return a text response.
    
    // Let's assume `processMessage` is modified to return the text response for simplicity here.
    // A better way is an event emitter or a message queue.
    /*
    if (brainResponse && brainResponse.should_respond && brainResponse.response) {
        message.channel.send(brainResponse.response.text);
    }
    */
   // For now, the brain logs the response. The MCP would handle sending messages
   // if a task for it was created. This keeps the bot app clean.

  } catch (error) {
    logger.error({ err: error, messageId: message.id }, 'Error processing message in brain.');
    message.channel.send("I'm having a little trouble thinking right now. Please try again in a moment.");
  }
}
