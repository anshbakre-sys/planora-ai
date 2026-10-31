import { describe, expect, it } from 'vitest';
import { alignPlanBudget } from '@/lib/ai/budget';
import type { AiPlanContent } from '@/lib/schemas';

const plan: AiPlanContent = {
  overview: '',
  theme: '',
  venueConsiderations: '',
  decoration: '',
  food: '',
  entertainment: '',
  guestExperience: '',
  budgetStrategy: '',
  timelineHighlights: '',
  vendorRequirements: '',
  risks: '',
  contingencies: '',
  tasks: [],
  checklist: [],
  ideas: [],
};

describe('alignPlanBudget', () => {
  it('uses the saved INR budget and removes conflicting generated amounts', () => {
    const aligned = alignPlanBudget({
      ...plan,
      budgetStrategy: 'Total budget is ₹12,000,000. Prioritize essential vendors.',
    }, 1_200_000);

    expect(aligned.budgetStrategy).toBe(
      'Total event budget: ₹12,00,000. Prioritize essential vendors.',
    );
    expect(aligned.budgetStrategy).not.toContain('₹12,000,000');
  });

  it('removes standalone total-budget numbers and currency estimates', () => {
    const aligned = alignPlanBudget({
      ...plan,
      budgetStrategy: 'Overall event budget 12000000. Catering: INR 500000. Keep a contingency.',
    }, 1_200_000);

    expect(aligned.budgetStrategy).toBe(
      'Total event budget: ₹12,00,000. Keep a contingency.',
    );
  });

  it('removes rupee estimates even when they are not labeled as the total budget', () => {
    const aligned = alignPlanBudget({
      ...plan,
      budgetStrategy: 'Catering estimate: ₹500,000. Plan for contingencies.',
    }, 1_200_000);

    expect(aligned.budgetStrategy).toBe(
      'Total event budget: ₹12,00,000. Plan for contingencies.',
    );
  });
});
