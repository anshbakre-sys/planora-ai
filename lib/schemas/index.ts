import { z } from 'zod';
import { EVENT_TYPES, TASK_STATUSES, TASK_PRIORITIES, TASK_SOURCES, VENDOR_CATEGORIES, VENDOR_STATUSES, IDEA_CATEGORIES, VALIDATION } from '@/lib/constants';
import { today } from '@/lib/date';

const eventTypeSchema = z.enum(EVENT_TYPES);

export const createEventSchema = z.object({
  name: z.string().min(VALIDATION.NAME_MIN).max(VALIDATION.NAME_MAX),
  type: eventTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  city: z.string().min(1).max(VALIDATION.TEXT_MAX),
  guestCount: z.number().int().min(VALIDATION.GUESTS_MIN).max(VALIDATION.GUESTS_MAX),
  totalBudget: z.number().int().min(VALIDATION.BUDGET_MIN).max(VALIDATION.BUDGET_MAX),
  theme: z.string().max(VALIDATION.TEXT_MAX).default(''),
  colors: z.string().max(VALIDATION.TEXT_MAX).default(''),
  foodPreferences: z.string().max(VALIDATION.TEXT_MAX).default(''),
  venuePreferences: z.string().max(VALIDATION.TEXT_MAX).default(''),
  culturalPreferences: z.string().max(VALIDATION.TEXT_MAX).default(''),
  specialRequirements: z.string().max(VALIDATION.SPECIAL_REQ_MAX).default(''),
});

/** For new events, date must be today or future (IST) */
export const createEventWithDateCheck = createEventSchema.refine(
  (d) => d.date >= today(),
  { message: 'Event date must be today or in the future', path: ['date'] },
);

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string(),
});

export const taskSchema = z.object({
  title: z.string().min(1).max(VALIDATION.TEXT_MAX),
  description: z.string().max(VALIDATION.SPECIAL_REQ_MAX).default(''),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().nullable().optional(),
  priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
  status: z.enum(TASK_STATUSES).default('PENDING'),
  category: z.string().max(VALIDATION.TEXT_MAX).default(''),
});

export const vendorSchema = z.object({
  category: z.enum(VENDOR_CATEGORIES),
  name: z.string().min(1).max(VALIDATION.TEXT_MAX),
  contactName: z.string().max(VALIDATION.TEXT_MAX).default(''),
  phone: z.string().max(50).default(''),
  email: z.string().email().or(z.literal('')).default(''),
  quote: z.number().int().min(0).nullable().optional(),
  status: z.enum(VENDOR_STATUSES).default('NOT_CONTACTED'),
  notes: z.string().max(VALIDATION.SPECIAL_REQ_MAX).default(''),
});

export const expenseSchema = z.object({
  description: z.string().min(1).max(VALIDATION.TEXT_MAX),
  amount: z.number().int().min(1),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const checklistItemSchema = z.object({
  vendorCategory: z.string().min(1),
  text: z.string().min(1).max(VALIDATION.TEXT_MAX),
});

export const ideaSchema = z.object({
  category: z.enum(IDEA_CATEGORIES),
  text: z.string().min(1).max(VALIDATION.SPECIAL_REQ_MAX),
});

/** AI plan content schema — shared between Gemini and Demo providers */
export const aiPlanContentSchema = z.object({
  overview: z.string(),
  theme: z.string(),
  venueConsiderations: z.string(),
  decoration: z.string(),
  food: z.string(),
  entertainment: z.string(),
  guestExperience: z.string(),
  budgetStrategy: z.string(),
  timelineHighlights: z.string(),
  vendorRequirements: z.string(),
  risks: z.string(),
  contingencies: z.string(),
  tasks: z.array(z.object({
    title: z.string(),
    description: z.string().default(''),
    offsetDays: z.number().int().min(0).max(540),
    priority: z.enum(TASK_PRIORITIES),
    category: z.string(),
  })),
  checklist: z.array(z.object({
    vendorCategory: z.string(),
    text: z.string(),
  })),
  ideas: z.array(z.object({
    category: z.string(),
    text: z.string(),
  })),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type VendorInput = z.infer<typeof vendorSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type AiPlanContent = z.infer<typeof aiPlanContentSchema>;

