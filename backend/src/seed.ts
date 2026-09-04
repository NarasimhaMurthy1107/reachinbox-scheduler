import { prisma } from './config/prisma';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding sample senders and data...');

  const senders = [
    {
      email: 'alex.growth@reachinbox.ai',
      name: 'Alex Growth',
      hourlyLimit: 50,
    },
    {
      email: 'sarah.outreach@reachinbox.ai',
      name: 'Sarah Outreach',
      hourlyLimit: 25,
    },
    {
      email: 'partners@reachinbox.ai',
      name: 'ReachInbox Partnerships',
      hourlyLimit: 100,
    },
  ];

  for (const s of senders) {
    await prisma.sender.upsert({
      where: { email: s.email },
      update: { name: s.name, hourlyLimit: s.hourlyLimit },
      create: s,
    });
  }

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@reachinbox.ai' },
    update: {},
    create: {
      email: 'demo@reachinbox.ai',
      name: 'ReachInbox Demo User',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('✅ Senders & User seeded successfully!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(() => {
    process.exit(0);
  });
