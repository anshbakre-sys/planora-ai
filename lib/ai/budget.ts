import type { AiPlanContent } from '@/lib/schemas';
import { formatINR } from '@/lib/date';

const monetaryAmountPattern = /(?:₹|INR\b|Rs\.?)\s*\d[\d,]*(?:\.\d+)?|\b\d[\d,]*(?:\.\d+)?\s*(?:INR\b|rupees?|lakhs?|crores?)\b/i;
const totalBudgetNumberPattern = /\b(?:total|overall)(?:\s+event)?\s+budget\b[^.!?]*\d[\d,]*/i;

export function alignPlanBudget(plan: AiPlanContent, totalBudget: number): AiPlanContent {
  const budgetAdvice = plan.budgetStrategy
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !monetaryAmountPattern.test(sentence) && !totalBudgetNumberPattern.test(sentence))
    .join(' ')
    .trim();

  return {
    ...plan,
    budgetStrategy: [
      `Total event budget: ${formatINR(totalBudget)}.`,
      budgetAdvice,
    ].filter(Boolean).join(' '),
  };
}
