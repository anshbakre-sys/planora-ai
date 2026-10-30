import type { AiPlanContent } from '@/lib/schemas';
import type { EventType } from '@/lib/constants';

export interface PlanInput {
  name: string;
  type: EventType;
  date: string;
  city: string;
  guestCount: number;
  totalBudget: number;
  theme: string;
  colors: string;
  foodPreferences: string;
  venuePreferences: string;
  culturalPreferences: string;
  specialRequirements: string;
}

export interface IdeaInput {
  eventType: EventType;
  theme: string;
  guestCount: number;
  totalBudget: number;
  city: string;
  preferences: string;
  category?: string;
}

export interface PlanProvider {
  name: string;
  model: string;
  generatePlan(input: PlanInput): Promise<AiPlanContent>;
  generateIdeas(input: IdeaInput): Promise<{ category: string; text: string }[]>;
}

