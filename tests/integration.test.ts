// This is a placeholder for a root-level integration test.
// Setting this up requires a more complex test runner setup
// that can launch all the services. For now, this file
// serves as a template for how such a test might be structured.

describe('E2E Integration Test', () => {
    // Before running tests, you would need a script to:
    // 1. Start the local-llm server
    // 2. Start the mcp server
    // 3. Start the bot app
    // 4. Potentially mock the remote Gemini API

    it('should receive a message, make one remote call, and execute a task', async () => {
        // 1. Mock the Discord client to emit a 'messageCreate' event.
        const mockMessage = {
            author: { bot: false, id: 'user1', username: 'TestUser' },
            content: 'Hey, can you send a test message?',
            channel: { id: 'channel1', name: 'testing', send: jest.fn() },
            guild: { id: 'guild1', name: 'Test Server' },
        };

        // 2. Mock the remote LLM call (e.g., using nock or msw)
        // The mock should return a valid JSON response that includes a task.
        const mockLLMResponse = {
            should_respond: true,
            response: { text: "Sure, I'll send that test message for you." },
            analysis: { sentiment: 'neutral' },
            tasks: [{
                type: 'send_message',
                target: 'channel1',
                params: { text: 'This is a test message from an integration test!' }
            }]
        };
        // setup mock for fetch/axios to return mockLLMResponse

        // 3. Mock the MCP server's 'execute' endpoint to verify it gets called.
        // This could be done by spying on the axios post call in the brain.

        // 4. Trigger the message handler in apps/bot/src/events/messageCreate.ts
        // await handleMessageCreate(mockMessage as any, brain);

        // 5. Assertions:
        // - Assert that the remote LLM was called exactly once.
        // - Assert that the MCP's /execute endpoint was called with the correct task.
        // - Assert that the bot sent the initial response message.
        
        expect(true).toBe(true); // Placeholder assertion
    });
});
