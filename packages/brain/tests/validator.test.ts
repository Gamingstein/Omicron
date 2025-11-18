import { validateBrainResponse } from '../src/validator';

describe('Brain Response Validator', () => {
  it('should validate a correct and complete response', () => {
    const validResponse = {
      should_respond: true,
      response: {
        text: 'Hello world!',
        style: 'friendly',
      },
      analysis: {
        sentiment: 'positive',
        sentiment_score: 0.9,
        toxicity_score: 0.1,
        emotion: 'joy',
        intent: 'greeting',
      },
      tasks: [{
        type: 'create_thread',
        target: 'channel-123',
        params: { name: 'Follow-up discussion' },
      }],
      memory_ops: [{
        op: 'upsert',
        key: 'convo-123',
        meta: { text: 'User asked about the weather.' },
      }],
      confidence: 0.95,
    };
    const { valid, errors } = validateBrainResponse(validResponse);
    expect(valid).toBe(true);
    expect(errors).toBeNull();
  });

  it('should invalidate a response with missing required fields', () => {
    const invalidResponse = {
      // missing should_respond and analysis
      response: {
        text: 'Hello!',
      },
    };
    const { valid } = validateBrainResponse(invalidResponse);
    expect(valid).toBe(false);
  });

  it('should invalidate a response with incorrect enum values', () => {
    const invalidResponse = {
      should_respond: false,
      analysis: {
        sentiment: 'very_positive', // Invalid enum
      },
    };
    const { valid } = validateBrainResponse(invalidResponse);
    expect(valid).toBe(false);
  });

  it('should validate a minimal correct response', () => {
    const minimalResponse = {
      should_respond: false,
      analysis: {
        sentiment: 'neutral',
      },
    };
    const { valid, errors } = validateBrainResponse(minimalResponse);
    expect(valid).toBe(true);
    expect(errors).toBeNull();
  });
});
