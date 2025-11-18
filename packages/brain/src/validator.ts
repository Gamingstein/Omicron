import Ajv from 'ajv';
import { BrainResponseSchema, BrainResponseType } from '@discord-agent/commons';

const ajv = new Ajv();
const validate = ajv.compile(BrainResponseSchema);

export function validateBrainResponse(data: any): { valid: boolean; errors: typeof validate.errors } {
  const valid = validate(data);
  return {
    valid,
    errors: validate.errors,
  };
}
