const Database = require('better-sqlite3');
const path = require('path');

// Helper to get random element from array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random date in range
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Sample data pools
const firstNames = {
  male: [
    'John',
    'Michael',
    'David',
    'James',
    'Robert',
    'William',
    'Richard',
    'Joseph',
    'Thomas',
    'Christopher',
    'Daniel',
    'Matthew',
    'Anthony',
    'Mark',
    'Steven',
    'Ahmed',
    'Mohammed',
    'Ali',
    'Omar',
    'Khaled'
  ],
  female: [
    'Mary',
    'Patricia',
    'Jennifer',
    'Linda',
    'Barbara',
    'Elizabeth',
    'Susan',
    'Jessica',
    'Sarah',
    'Karen',
    'Nancy',
    'Lisa',
    'Betty',
    'Margaret',
    'Sandra',
    'Fatima',
    'Aisha',
    'Layla',
    'Noor',
    'Zainab'
  ]
};

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Khan',
  'Ahmed',
  'Hassan',
  'Ali',
  'Ibrahim'
];

const addresses = [
  '123 Main St',
  '456 Oak Ave',
  '789 Elm Street',
  '321 Maple Drive',
  '654 Pine Road',
  '987 Cedar Lane',
  '147 Birch Boulevard',
  '258 Willow Way',
  '369 Spruce Court',
  '741 Ash Place'
];

const notes = [
  'VIP member',
  'Prefers morning sessions',
  'Interested in personal training',
  'Has previous knee injury',
  'Student discount applied',
  'Referred by existing member',
  'Looking to lose weight',
  'Training for marathon',
  'Bodybuilding enthusiast',
  ''
];

// Plan templates
const planTemplates = [
  { name: 'Monthly Basic', duration: 30, price: 50 },
  { name: 'Monthly Premium', duration: 30, price: 80 },
  { name: 'Quarterly Basic', duration: 90, price: 135 },
  { name: 'Quarterly Premium', duration: 90, price: 216 },
  { name: 'Semi-Annual', duration: 180, price: 240 },
  { name: 'Annual Basic', duration: 365, price: 480 },
  { name: 'Annual Premium', duration: 365, price: 768 },
  { name: 'Student Monthly', duration: 30, price: 35 },
  { name: 'Weekend Only', duration: 30, price: 40 },
  { name: 'Day Pass', duration: 1, price: 15 }
];

const paymentMethods = ['cash', 'card', 'bank_transfer'];

function seedDatabase(dbPath, options = {}) {
  const {
    numMembers = 100,
    numPlans = 10,
    checkInRate = 0.7, // 70% chance of check-ins
    clearExisting = true
  } = options;

  console.log('🚀 Starting database seeding...');
  console.log(`📊 Target: ${numMembers} members, ${numPlans} plans`);

  const db = new Database(dbPath);

  try {
    // Clear existing data if requested
    if (clearExisting) {
      console.log('🗑️  Clearing existing data...');
      db.exec('DELETE FROM check_ins');
      db.exec('DELETE FROM memberships');
      db.exec('DELETE FROM members');
      db.exec('DELETE FROM plans');
      console.log('✓ Existing data cleared');
    }

    // Insert plans
    console.log('📋 Creating plans...');
    const insertPlan = db.prepare(`
      INSERT INTO plans (name, duration_days, price, features, description, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    const planIds = [];
    for (let i = 0; i < Math.min(numPlans, planTemplates.length); i++) {
      const plan = planTemplates[i];
      const result = insertPlan.run(
        plan.name,
        plan.duration,
        plan.price,
        JSON.stringify(['Access to all equipment', 'Locker room access']),
        `${plan.name} membership plan`,
        1
      );
      planIds.push(result.lastInsertRowid);
    }
    console.log(`✓ Created ${planIds.length} plans`);

    // Insert members
    console.log('👥 Creating members...');
    const insertMember = db.prepare(`
      INSERT INTO members (name, phone, email, gender, address, join_date, notes, barcode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const memberIds = [];
    const usedPhones = new Set();

    for (let i = 0; i < numMembers; i++) {
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      const firstName = getRandom(firstNames[gender]);
      const lastName = getRandom(lastNames);
      const name = `${firstName} ${lastName}`;

      // Generate unique phone
      let phone;
      do {
        phone = `555${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`;
      } while (usedPhones.has(phone));
      usedPhones.add(phone);

      const email = Math.random() > 0.3 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com` : null;
      const address = Math.random() > 0.5 ? getRandom(addresses) : null;
      const joinDate = formatDate(
        getRandomDate(new Date(2023, 0, 1), new Date(2025, 0, 1))
      );
      const note = getRandom(notes);
      const barcode = `GYM${String(i + 1).padStart(6, '0')}`;

      const result = insertMember.run(
        name,
        phone,
        email,
        gender,
        address,
        joinDate,
        note,
        barcode
      );
      memberIds.push({ id: result.lastInsertRowid, joinDate, gender });
    }
    console.log(`✓ Created ${memberIds.length} members`);

    // Insert memberships with diverse scenarios
    console.log('💳 Creating memberships...');
    const insertMembership = db.prepare(`
      INSERT INTO memberships (member_id, plan_id, start_date, end_date, amount_paid, payment_method, payment_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const membershipIds = [];
    const today = new Date();

    memberIds.forEach((member, index) => {
      // Determine membership scenario
      const scenario = Math.random();

      if (scenario < 0.6) {
        // 60% - Active members with current membership
        const planId = getRandom(planIds);
        const plan = planTemplates[planIds.indexOf(planId)];
        const startDate = getRandomDate(
          new Date(today.getFullYear(), today.getMonth() - 2, 1),
          today
        );
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.duration);

        const result = insertMembership.run(
          member.id,
          planId,
          formatDate(startDate),
          formatDate(endDate),
          plan.price,
          getRandom(paymentMethods),
          formatDate(startDate),
          'Active membership'
        );
        membershipIds.push({ id: result.lastInsertRowid, memberId: member.id, endDate });
      } else if (scenario < 0.75) {
        // 15% - Members with expiring membership (within 7 days)
        const planId = getRandom(planIds);
        const plan = planTemplates[planIds.indexOf(planId)];
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - plan.duration);

        const result = insertMembership.run(
          member.id,
          planId,
          formatDate(startDate),
          formatDate(endDate),
          plan.price,
          getRandom(paymentMethods),
          formatDate(startDate),
          'Expiring soon'
        );
        membershipIds.push({ id: result.lastInsertRowid, memberId: member.id, endDate });
      } else if (scenario < 0.85) {
        // 10% - Expired members (had membership, now expired)
        const planId = getRandom(planIds);
        const plan = planTemplates[planIds.indexOf(planId)];
        const endDate = getRandomDate(
          new Date(today.getFullYear(), today.getMonth() - 6, 1),
          new Date(today.getTime() - 24 * 60 * 60 * 1000)
        );
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - plan.duration);

        insertMembership.run(
          member.id,
          planId,
          formatDate(startDate),
          formatDate(endDate),
          plan.price,
          getRandom(paymentMethods),
          formatDate(startDate),
          'Expired membership'
        );
      } else if (scenario < 0.95) {
        // 10% - Members with multiple memberships (renewals)
        const numMemberships = Math.floor(Math.random() * 3) + 2; // 2-4 memberships
        let currentDate = new Date(member.joinDate);

        for (let i = 0; i < numMemberships; i++) {
          const planId = getRandom(planIds);
          const plan = planTemplates[planIds.indexOf(planId)];
          const startDate = new Date(currentDate);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + plan.duration);

          const result = insertMembership.run(
            member.id,
            planId,
            formatDate(startDate),
            formatDate(endDate),
            plan.price,
            getRandom(paymentMethods),
            formatDate(startDate),
            `Membership #${i + 1}`
          );

          if (endDate > today) {
            membershipIds.push({ id: result.lastInsertRowid, memberId: member.id, endDate });
          }

          currentDate = new Date(endDate);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      // Remaining 5% - Inactive members (never had membership)
    });

    console.log(`✓ Created memberships for various scenarios`);

    // Insert check-ins
    console.log('✅ Creating check-ins...');
    const insertCheckIn = db.prepare(`
      INSERT INTO check_ins (member_id, check_in_time)
      VALUES (?, ?)
    `);

    let checkInCount = 0;
    // Generate check-ins for the last 90 days
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 90);

    membershipIds.forEach((membership) => {
      const currentDate = new Date(startDate);

      while (currentDate <= today && currentDate <= membership.endDate) {
        // Random check-in probability
        if (Math.random() < checkInRate) {
          const checkInTime = new Date(currentDate);
          checkInTime.setHours(
            Math.floor(Math.random() * 14) + 6, // 6 AM - 8 PM
            Math.floor(Math.random() * 60),
            0,
            0
          );

          insertCheckIn.run(
            membership.memberId,
            checkInTime.toISOString()
          );
          checkInCount++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    console.log(`✓ Created ${checkInCount} check-ins`);

    // Print summary
    console.log('\n📊 Seeding Summary:');
    console.log(`  Plans: ${planIds.length}`);
    console.log(`  Members: ${memberIds.length}`);
    console.log(`    - Active: ~${Math.floor(memberIds.length * 0.6)}`);
    console.log(`    - Expiring Soon: ~${Math.floor(memberIds.length * 0.15)}`);
    console.log(`    - Expired: ~${Math.floor(memberIds.length * 0.10)}`);
    console.log(`    - Inactive: ~${Math.floor(memberIds.length * 0.05)}`);
    console.log(`  Check-ins: ${checkInCount}`);
    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run if called directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {};
  let dbPath = null;

  args.forEach((arg) => {
    if (arg.startsWith('--members=')) {
      options.numMembers = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--plans=')) {
      options.numPlans = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--check-in-rate=')) {
      options.checkInRate = parseFloat(arg.split('=')[1]);
    } else if (arg === '--keep-existing') {
      options.clearExisting = false;
    } else if (arg.startsWith('--db=')) {
      dbPath = arg.split('=')[1];
    }
  });

  // If no db path provided, use default location
  if (!dbPath) {
    const os = require('os');
    const appDataPath = process.env.APPDATA ||
                       (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') :
                        path.join(os.homedir(), '.config'));
    dbPath = path.join(appDataPath, 'fitflow', 'fitflow.db');
  }

  console.log(`📁 Using database: ${dbPath}`);
  seedDatabase(dbPath, options);
}

module.exports = { seedDatabase };
