import type { PlanProvider, PlanInput, IdeaInput } from './provider';
import type { AiPlanContent } from '@/lib/schemas';
import type { EventType } from '@/lib/constants';

const THEMES: Record<string, { adj: string; decor: string; food: string }> = {
  Traditional: { adj: 'classic', decor: 'traditional floral arrangements with marigolds and roses', food: 'authentic regional cuisine' },
  Modern: { adj: 'contemporary', decor: 'minimalist geometric centerpieces with LED accents', food: 'fusion cuisine with molecular gastronomy touches' },
  Rustic: { adj: 'rustic', decor: 'natural wood, burlap, and wildflower arrangements', food: 'farm-to-table seasonal menu' },
  Minimal: { adj: 'elegant minimal', decor: 'clean lines, white palette, and single-stem arrangements', food: 'curated tasting menu with paired beverages' },
  Floral: { adj: 'floral', decor: 'cascading flower walls, hanging gardens, and petal pathways', food: 'garden-fresh menu with edible flower garnishes' },
};

const resolveTheme = (theme: string) => THEMES[theme] || THEMES[Object.keys(THEMES).find(k => theme.toLowerCase().includes(k.toLowerCase())) || 'Traditional'];

const weddingTasks = (daysUntil: number) => [
  { title: 'Finalize guest list', description: 'Complete and confirm final guest count', offsetDays: Math.min(120, daysUntil), priority: 'HIGH' as const, category: 'Planning' },
  { title: 'Book venue', description: 'Visit and confirm venue booking with advance payment', offsetDays: Math.min(150, daysUntil), priority: 'HIGH' as const, category: 'Venue' },
  { title: 'Book caterer', description: 'Finalize menu and confirm catering service', offsetDays: Math.min(90, daysUntil), priority: 'HIGH' as const, category: 'Catering' },
  { title: 'Book photographer', description: 'Confirm photography and videography package', offsetDays: Math.min(90, daysUntil), priority: 'HIGH' as const, category: 'Photography' },
  { title: 'Book decorator', description: 'Finalize decoration theme and confirm booking', offsetDays: Math.min(60, daysUntil), priority: 'MEDIUM' as const, category: 'Decoration' },
  { title: 'Send invitations', description: 'Print and distribute wedding invitations', offsetDays: Math.min(45, daysUntil), priority: 'HIGH' as const, category: 'Invitations' },
  { title: 'Finalize outfits', description: 'Complete outfit selection and fittings', offsetDays: Math.min(30, daysUntil), priority: 'HIGH' as const, category: 'Personal' },
  { title: 'Arrange accommodation', description: 'Book rooms for out-of-town guests', offsetDays: Math.min(30, daysUntil), priority: 'MEDIUM' as const, category: 'Accommodation' },
  { title: 'Confirm all vendor bookings', description: 'Reconfirm all vendors and finalize schedules', offsetDays: Math.min(7, daysUntil), priority: 'HIGH' as const, category: 'Planning' },
  { title: 'Rehearsal and final walkthrough', description: 'Conduct ceremony rehearsal at venue', offsetDays: Math.min(2, daysUntil), priority: 'HIGH' as const, category: 'Planning' },
  { title: 'Wedding day coordination', description: 'Manage day-of timeline and vendor coordination', offsetDays: 0, priority: 'HIGH' as const, category: 'Planning' },
];

const birthdayTasks = (daysUntil: number) => [
  { title: 'Plan guest list', description: 'Create and finalize invitation list', offsetDays: Math.min(30, daysUntil), priority: 'HIGH' as const, category: 'Planning' },
  { title: 'Book venue', description: 'Reserve party venue', offsetDays: Math.min(30, daysUntil), priority: 'HIGH' as const, category: 'Venue' },
  { title: 'Order cake', description: 'Design and order birthday cake', offsetDays: Math.min(7, daysUntil), priority: 'HIGH' as const, category: 'Catering' },
  { title: 'Plan games and activities', description: 'Organize entertainment and games', offsetDays: Math.min(14, daysUntil), priority: 'MEDIUM' as const, category: 'Entertainment' },
  { title: 'Send invitations', description: 'Send out party invitations', offsetDays: Math.min(14, daysUntil), priority: 'HIGH' as const, category: 'Invitations' },
  { title: 'Buy return gifts', description: 'Purchase party favors and return gifts', offsetDays: Math.min(7, daysUntil), priority: 'MEDIUM' as const, category: 'Shopping' },
  { title: 'Finalize food menu', description: 'Confirm catering or food arrangements', offsetDays: Math.min(5, daysUntil), priority: 'HIGH' as const, category: 'Catering' },
  { title: 'Set up decorations', description: 'Decorate the venue', offsetDays: Math.min(1, daysUntil), priority: 'HIGH' as const, category: 'Decoration' },
  { title: 'Party day coordination', description: 'Manage the celebration', offsetDays: 0, priority: 'HIGH' as const, category: 'Planning' },
];

const communityTasks = (daysUntil: number) => [
  { title: 'Check permit requirements', description: 'Verify applicable permits and regulations for the event', offsetDays: Math.min(90, daysUntil), priority: 'HIGH' as const, category: 'Legal' },
  { title: 'Recruit volunteers', description: 'Build volunteer team and assign roles', offsetDays: Math.min(60, daysUntil), priority: 'HIGH' as const, category: 'Volunteers' },
  { title: 'Book venue', description: 'Secure and confirm community venue', offsetDays: Math.min(60, daysUntil), priority: 'HIGH' as const, category: 'Venue' },
  { title: 'Launch promotion', description: 'Start marketing and community outreach', offsetDays: Math.min(45, daysUntil), priority: 'HIGH' as const, category: 'Promotion' },
  { title: 'Arrange sponsors', description: 'Reach out to potential event sponsors', offsetDays: Math.min(45, daysUntil), priority: 'MEDIUM' as const, category: 'Sponsors' },
  { title: 'Plan first aid & safety', description: 'Arrange first aid, fire safety, and crowd management', offsetDays: Math.min(14, daysUntil), priority: 'HIGH' as const, category: 'Safety' },
  { title: 'Ensure accessibility', description: 'Verify venue accessibility and accommodations', offsetDays: Math.min(14, daysUntil), priority: 'HIGH' as const, category: 'Accessibility' },
  { title: 'Finalize catering', description: 'Confirm food and beverage arrangements', offsetDays: Math.min(7, daysUntil), priority: 'HIGH' as const, category: 'Catering' },
  { title: 'Event day management', description: 'Coordinate all activities and volunteers', offsetDays: 0, priority: 'HIGH' as const, category: 'Planning' },
];

const getTasksForType = (type: EventType, daysUntil: number) => {
  switch (type) {
    case 'WEDDING': return weddingTasks(daysUntil);
    case 'BIRTHDAY': return birthdayTasks(daysUntil);
    case 'COMMUNITY': return communityTasks(daysUntil);
  }
};

const weddingChecklist = [
  { vendorCategory: 'Venue', text: 'Confirm venue capacity matches guest count' },
  { vendorCategory: 'Venue', text: 'Check parking and accessibility' },
  { vendorCategory: 'Caterer', text: 'Schedule food tasting session' },
  { vendorCategory: 'Caterer', text: 'Confirm dietary accommodation options' },
  { vendorCategory: 'Decorator', text: 'Approve decoration mood board' },
  { vendorCategory: 'Photographer', text: 'Share shot list and key moments' },
  { vendorCategory: 'Photographer', text: 'Confirm backup equipment availability' },
];

const birthdayChecklist = [
  { vendorCategory: 'Venue', text: 'Verify venue has entertainment space' },
  { vendorCategory: 'Caterer', text: 'Confirm allergy-safe menu options' },
  { vendorCategory: 'Caterer', text: 'Arrange cake delivery timing' },
];

const communityChecklist = [
  { vendorCategory: 'Venue', text: 'Verify venue noise level regulations' },
  { vendorCategory: 'Venue', text: 'Confirm emergency exits and fire safety' },
  { vendorCategory: 'Caterer', text: 'Plan for diverse dietary needs' },
  { vendorCategory: 'Caterer', text: 'Arrange waste management and recycling' },
];

const getChecklistForType = (type: EventType) => {
  switch (type) {
    case 'WEDDING': return weddingChecklist;
    case 'BIRTHDAY': return birthdayChecklist;
    case 'COMMUNITY': return communityChecklist;
  }
};

const generateDemoIdeas = (type: EventType, theme: string, _budget: number): { category: string; text: string }[] => {
  const t = resolveTheme(theme);
  const base = [
    { category: 'Themes', text: `A ${t.adj} theme with personalized touches reflecting your style` },
    { category: 'Decoration', text: `Feature ${t.decor} throughout the venue` },
    { category: 'Food', text: `Serve ${t.food} with a live cooking station` },
    { category: 'Budget-Saving', text: 'Consider off-peak dates for better vendor rates' },
    { category: 'Backup Plans', text: 'Arrange a covered backup area in case of weather changes' },
  ];

  if (type === 'WEDDING') {
    base.push(
      { category: 'Guest Engagement', text: 'Set up a photo booth with themed props' },
      { category: 'Entertainment', text: 'Plan a choreographed first dance or sangeet performance' },
      { category: 'Sustainability', text: 'Use plantable seed paper for invitations' },
    );
  } else if (type === 'BIRTHDAY') {
    base.push(
      { category: 'Activities', text: 'Organize a creative workshop or themed treasure hunt' },
      { category: 'Guest Engagement', text: 'Create a memory wall where guests share wishes' },
      { category: 'Entertainment', text: 'Hire a magician or caricature artist' },
    );
  } else {
    base.push(
      { category: 'Guest Engagement', text: 'Set up interactive community art installations' },
      { category: 'Sustainability', text: 'Partner with local NGOs for zero-waste event management' },
      { category: 'Activities', text: 'Organize skill-sharing workshops led by community members' },
    );
  }
  return base;
};

import { daysBetween } from '@/lib/date';

export class DemoPlanProvider implements PlanProvider {
  name = 'demo';
  model = 'deterministic-templates';

  async generatePlan(input: PlanInput): Promise<AiPlanContent> {
    const t = resolveTheme(input.theme || 'Traditional');
    const perGuest = input.guestCount > 0 ? Math.floor(input.totalBudget / input.guestCount) : input.totalBudget;
    const daysUntil = Math.max(0, daysBetween(input.date, new Date().toISOString().slice(0, 10)));

    const typeLabel = input.type === 'WEDDING' ? 'wedding' : input.type === 'BIRTHDAY' ? 'birthday celebration' : 'community event';
    const foodNote = input.foodPreferences ? ` Menu will prioritize ${input.foodPreferences}.` : '';
    const culturalNote = input.culturalPreferences ? ` Incorporating ${input.culturalPreferences} traditions.` : '';

    const riskMap: Record<EventType, string> = {
      WEDDING: 'Weather disruptions for outdoor ceremonies, vendor no-shows, guest count exceeding venue capacity. Have backup indoor arrangements and confirm vendors 48 hours before.',
      BIRTHDAY: 'Allergy concerns with food and cake, schedule overruns, and age-appropriate safety considerations. Keep a detailed allergy list and have first-aid supplies ready.',
      COMMUNITY: 'Weather changes, crowd exceeding capacity, noise complaints from neighbors. Verify permits, have crowd management volunteers, and maintain communication with local authorities.',
    };

    return {
      overview: `A ${t.adj} ${typeLabel} in ${input.city} for ${input.guestCount} guests with a budget of ₹${perGuest}/guest.${culturalNote} This plan covers all essential elements from venue to day-of coordination.`,
      theme: `${input.theme || 'Traditional'} — ${t.adj} aesthetic with ${t.decor.split(',')[0]}.`,
      venueConsiderations: `Select a venue in ${input.city} accommodating ${input.guestCount}+ guests. Verify parking, accessibility, and backup weather arrangements. Visit at least 2-3 venues before finalizing.`,
      decoration: `${t.decor}. Coordinate colors${input.colors ? ` using ${input.colors} palette` : ''} for a cohesive look throughout the venue.`,
      food: `${t.food} for ${input.guestCount} guests.${foodNote} Include vegetarian and vegan options. Arrange for live stations if budget permits.`,
      entertainment: `Plan ${input.type === 'WEDDING' ? 'music, dance performances, and a DJ' : input.type === 'BIRTHDAY' ? 'games, activities, and background music' : 'performances, workshops, and community activities'} suited to your ${t.adj} theme.`,
      guestExperience: `Welcome drinks on arrival, comfortable seating, clear signage, and a personalized touch at each table. ${input.type === 'COMMUNITY' ? 'Ensure accessibility for all attendees.' : 'Consider party favors as takeaways.'}`,
      budgetStrategy: `With ₹${perGuest}/guest, ${perGuest > 2000 ? 'you have a comfortable budget for premium services' : 'focus on essential categories first'}. Allocate contingency for unexpected expenses. Track actuals against estimates.`,
      timelineHighlights: `${daysUntil > 30 ? 'Start vendor shortlisting now. Book key vendors within 2 weeks.' : daysUntil > 7 ? 'Accelerated timeline — prioritize booking essentials immediately.' : 'Very tight timeline — focus only on must-have arrangements.'}`,
      vendorRequirements: `Essential vendors: ${input.type === 'WEDDING' ? 'venue, caterer, decorator, photographer' : 'venue, caterer'}. Get at least 3 quotes per category before finalizing.`,
      risks: riskMap[input.type],
      contingencies: `Maintain a contingency fund of 10-15% of total budget. Have backup vendor contacts ready. Prepare indoor alternatives for outdoor elements.${input.type === 'COMMUNITY' ? ' Verify all applicable permits and regulations before the event.' : ''}`,
      tasks: getTasksForType(input.type, daysUntil),
      checklist: getChecklistForType(input.type),
      ideas: generateDemoIdeas(input.type, input.theme || 'Traditional', input.totalBudget),
    };
  }

  async generateIdeas(input: IdeaInput): Promise<{ category: string; text: string }[]> {
    return generateDemoIdeas(input.eventType, input.theme, input.totalBudget);
  }
}

