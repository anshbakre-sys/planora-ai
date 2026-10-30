import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { checkOrigin, originError, jsonData } from '@/lib/api-helpers';
import { computeAllocations } from '@/lib/planning/budget';
import { addDays, today } from '@/lib/date';
import { computeDueDates } from '@/lib/planning/timeline';
import { DemoPlanProvider } from '@/lib/ai/demo';

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) return originError();

  const totalBudget = 1_200_000; // ₹12,00,000
  const guestCount = 250;
  const eventDate = addDays(today(), 90);

  // 1. Base allocations
  const allocs = computeAllocations(totalBudget, 'WEDDING');

  // Modify estimates so total planned commitment exceeds budget by ~₹85,000:
  // E.g., Catering estimate +50,000, Decoration estimate +35,000 => exactly +85,000
  const categoriesWithOverrun = allocs.map(c => {
    if (c.name === 'Catering') {
      return { ...c, estimated: c.estimated + 50_000 };
    }
    if (c.name === 'Decoration') {
      return { ...c, estimated: c.estimated + 35_000 };
    }
    return c;
  });

  const demoProvider = new DemoPlanProvider();
  const demoPlan = await demoProvider.generatePlan({
    name: 'Sample Royal Indore Wedding (Fictional Demo)',
    type: 'WEDDING',
    date: eventDate,
    city: 'Indore',
    guestCount,
    totalBudget,
    theme: 'Elegant Traditional',
    colors: 'Ivory, Gold & Royal Maroon',
    foodPreferences: 'Indori specialties, Traditional vegetarian banquet',
    venuePreferences: 'Heritage palace banquet hall',
    culturalPreferences: 'Traditional North-Central Indian rituals',
    specialRequirements: 'Grand entrance for baraat, dedicated photo booth area',
  });

  const dueDates = computeDueDates(
    demoPlan.tasks.map((t, i) => ({ id: String(i), offsetDays: t.offsetDays })),
    eventDate,
  );

  const sampleEvent = await prisma.$transaction(async (tx) => {
    const evt = await tx.event.create({
      data: {
        name: 'Sample Royal Indore Wedding (Fictional Demo)',
        type: 'WEDDING',
        date: eventDate,
        city: 'Indore',
        guestCount,
        totalBudget,
        theme: 'Elegant Traditional',
        colors: 'Ivory, Gold & Royal Maroon',
        foodPreferences: 'Indori specialties, Traditional vegetarian banquet',
        venuePreferences: 'Heritage palace banquet hall',
        culturalPreferences: 'Traditional North-Central Indian rituals',
        specialRequirements: 'Grand entrance for baraat, dedicated photo booth area',
      },
    });

    // Create budget categories with the stored overrun
    for (const cat of categoriesWithOverrun) {
      await tx.budgetCategory.create({
        data: {
          eventId: evt.id,
          name: cat.name,
          allocated: cat.allocated,
          estimated: cat.estimated,
          locked: false,
        },
      });
    }

    // Create AI plan
    await tx.aiPlan.create({
      data: {
        eventId: evt.id,
        provider: 'demo',
        model: 'deterministic-sample',
        content: JSON.stringify(demoPlan),
      },
    });

    // Create tasks
    for (let i = 0; i < demoPlan.tasks.length; i++) {
      const t = demoPlan.tasks[i];
      const dd = dueDates.find(d => d.taskId === String(i));
      await tx.task.create({
        data: {
          eventId: evt.id,
          title: t.title,
          description: t.description,
          dueDate: dd?.computedDueDate || eventDate,
          offsetDays: t.offsetDays,
          priority: t.priority,
          status: i < 2 ? 'COMPLETED' : 'PENDING',
          category: t.category,
          source: 'SAMPLE',
        },
      });
    }

    // Create checklist
    for (const c of demoPlan.checklist) {
      await tx.checklistItem.create({
        data: {
          eventId: evt.id,
          vendorCategory: c.vendorCategory,
          text: c.text,
          source: 'SAMPLE',
          done: false,
        },
      });
    }

    // Create ideas
    for (const idea of demoPlan.ideas) {
      await tx.savedIdea.create({
        data: {
          eventId: evt.id,
          category: idea.category,
          text: idea.text,
          source: 'SAMPLE',
          favorite: false,
        },
      });
    }

    // Add fictional sample vendors (clearly labeled)
    await tx.vendor.create({
      data: {
        eventId: evt.id,
        category: 'Venue',
        name: 'The Grand Heritage Palace (Fictional Sample)',
        contactName: 'Manager Mr. Sharma',
        phone: '+91 98765 00001',
        email: 'events@grandheritage-sample.com',
        quote: 240000,
        status: 'BOOKED',
        notes: 'Fictional sample vendor for evaluation testing.',
      },
    });

    await tx.vendor.create({
      data: {
        eventId: evt.id,
        category: 'Caterer',
        name: 'Royal Malwa Caterers (Fictional Sample)',
        contactName: 'Chef Rajesh',
        phone: '+91 98765 00002',
        email: 'taste@malwacaterers-sample.com',
        quote: 430000,
        status: 'SHORTLISTED',
        notes: 'Includes Indori chaat counter and banquet.',
      },
    });

    return evt;
  });

  return jsonData(sampleEvent, 201);
}

