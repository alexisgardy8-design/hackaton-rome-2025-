import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const investor = await prisma.user.upsert({
    where: { email: 'investor@test.com' },
    update: {},
    create: {
      email: 'investor@test.com',
      password: hashedPassword,
      name: 'Test Investor',
      role: 'INVESTOR'
    }
  });

  const startup = await prisma.user.upsert({
    where: { email: 'startup@test.com' },
    update: {},
    create: {
      email: 'startup@test.com',
      password: hashedPassword,
      name: 'Test Startup',
      role: 'STARTUP'
    }
  });

  console.log('✅ Created users:', { investor, startup });

  // Create a test campaign
  const campaign = await prisma.campaign.create({
    data: {
      title: 'Revolutionary AI Platform',
      description: 'Building the next generation of AI-powered solutions for businesses worldwide.',
      goalAmount: 100000,
      currentAmount: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      status: 'ACTIVE',
      creatorId: startup.id
    }
  });

  console.log('✅ Created campaign:', campaign);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('   Investor: investor@test.com / Password123!');
  console.log('   Startup:  startup@test.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
