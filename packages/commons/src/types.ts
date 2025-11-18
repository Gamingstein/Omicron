// This file contains shared types used across the monorepo.

// As defined in the requirements
export const BrainResponseSchema = {
  type: 'object',
  properties: {
    should_respond: { type: 'boolean' },
    response: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        style: { type: 'string' },
      },
      required: ['text'],
    },
    analysis: {
      type: 'object',
      properties: {
        sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
        sentiment_score: { type: 'number' },
        toxicity_score: { type: 'number' },
        emotion: { type: 'string' },
        intent: { type: 'string' },
      },
      required: ['sentiment'],
    },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          target: { type: 'string' },
          params: { type: 'object' },
        },
        required: ['type'],
      },
    },
    memory_ops: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          op: { type: 'string', enum: ['upsert', 'delete', 'tag'] },
          key: { type: 'string' },
          vector: { type: 'array', items: { type: 'number' } },
          meta: { type: 'object' },
        },
        required: ['op', 'key'],
      },
    },
    confidence: { type: 'number' },
  },
  required: ['should_respond', 'analysis'],
} as const;

export type BrainResponseType = {
    should_respond: boolean;
    response?: {
        text: string;
        style?: string;
    };
    analysis: {
        sentiment: 'positive' | 'neutral' | 'negative';
        sentiment_score?: number;
        toxicity_score?: number;
        emotion?: string;
        intent?: string;
    };
    tasks?: {
        type: string;
        target?: string;
        params?: Record<string, any>;
    }[];
    memory_ops?: {
        op: 'upsert' | 'delete' | 'tag';
        key: string;
        vector?: number[];
        meta?: Record<string, any>;
    }[];
    confidence?: number;
};

export type LocalAnalysis = {
    sentiment: 'positive' | 'neutral' | 'negative';
    sentiment_score: number;
    toxicity: number;
    emotion: string;
    intent: string;
};
