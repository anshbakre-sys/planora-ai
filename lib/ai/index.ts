import type { PlanProvider } from './provider';
import { DemoPlanProvider } from './demo';
import { GeminiPlanProvider } from './gemini';

export type { PlanProvider, PlanInput, IdeaInput } from './provider';
export { DemoPlanProvider } from './demo';
export { GeminiPlanProvider } from './gemini';

/** Get the active plan provider based on environment */
export const getProvider = (): PlanProvider => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    return new GeminiPlanProvider(apiKey, model);
  }
  return new DemoPlanProvider();
};

