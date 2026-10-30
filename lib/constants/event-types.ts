export const EVENT_TYPES = ['WEDDING', 'BIRTHDAY', 'COMMUNITY'] as const;
export type EventType = typeof EVENT_TYPES[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  WEDDING: 'Wedding',
  BIRTHDAY: 'Birthday',
  COMMUNITY: 'Community Event',
};

/** Budget allocation weights per event type (must sum to 100) */
export const BUDGET_WEIGHTS: Record<EventType, Record<string, number>> = {
  WEDDING: {
    Venue: 20, Catering: 32, Decoration: 12, Photography: 8,
    Entertainment: 5, 'Invitations/Promotion': 2, Transportation: 3,
    Accommodation: 5, Miscellaneous: 3, Contingency: 10,
  },
  BIRTHDAY: {
    Venue: 15, Catering: 30, Decoration: 15, Photography: 5,
    Entertainment: 15, 'Invitations/Promotion': 3, Transportation: 2,
    Accommodation: 0, Miscellaneous: 5, Contingency: 10,
  },
  COMMUNITY: {
    Venue: 15, Catering: 25, Decoration: 8, Photography: 5,
    Entertainment: 12, 'Invitations/Promotion': 7, Transportation: 3,
    Accommodation: 0, Miscellaneous: 10, Contingency: 15,
  },
};

export const BUDGET_CATEGORIES = [
  'Venue', 'Catering', 'Decoration', 'Photography', 'Entertainment',
  'Invitations/Promotion', 'Transportation', 'Accommodation', 'Miscellaneous', 'Contingency',
] as const;
export type BudgetCategoryName = typeof BUDGET_CATEGORIES[number];

/** Rough per-guest floor (INR) — planning heuristic, not verified quotes */
export const FEASIBILITY_FLOORS: Record<EventType, number> = {
  WEDDING: 1500,
  BIRTHDAY: 600,
  COMMUNITY: 200,
};

export const ESSENTIAL_VENDORS: Record<EventType, string[]> = {
  WEDDING: ['Venue', 'Caterer', 'Decorator', 'Photographer'],
  BIRTHDAY: ['Venue', 'Caterer'],
  COMMUNITY: ['Venue', 'Caterer'],
};

export const VENDOR_CATEGORIES = [
  'Venue', 'Caterer', 'Decorator', 'Photographer', 'Florist',
  'Entertainment', 'Transportation', 'Other',
] as const;
export type VendorCategory = typeof VENDOR_CATEGORIES[number];

export const VENDOR_STATUSES = [
  'NOT_CONTACTED', 'CONTACTED', 'SHORTLISTED', 'BOOKED', 'REJECTED',
] as const;
export type VendorStatus = typeof VENDOR_STATUSES[number];

export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];

export const TASK_SOURCES = ['AI', 'USER', 'SAMPLE'] as const;
export type TaskSource = typeof TASK_SOURCES[number];

export const IDEA_CATEGORIES = [
  'Themes', 'Decoration', 'Food', 'Entertainment', 'Activities',
  'Invitations', 'Guest Engagement', 'Sustainability', 'Budget-Saving', 'Backup Plans',
] as const;
export type IdeaCategory = typeof IDEA_CATEGORIES[number];

/** Budget Rescue reduction priority (first = cut first) */
export const RESCUE_PRIORITY: string[] = [
  'Decoration', 'Entertainment', 'Photography', 'Invitations/Promotion',
  'Accommodation', 'Transportation', 'Miscellaneous', 'Catering', 'Venue',
];

/** Max reduction per category in Budget Rescue */
export const RESCUE_MAX_CUT_RATIO = 0.3;

/** Min contingency warning threshold */
export const CONTINGENCY_WARN_RATIO = 0.05;

/** AI rate limit: max requests per minute */
export const AI_RATE_LIMIT = 10;

/** AI timeout in ms */
export const AI_TIMEOUT_MS = 30_000;

/** Validation limits */
export const VALIDATION = {
  NAME_MIN: 3,
  NAME_MAX: 80,
  GUESTS_MIN: 1,
  GUESTS_MAX: 5000,
  BUDGET_MIN: 10_000,
  BUDGET_MAX: 10_00_00_000,
  TEXT_MAX: 300,
  SPECIAL_REQ_MAX: 1000,
  DATE_FUTURE_YEARS: 5,
} as const;
