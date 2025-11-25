import { ipcMain } from 'electron'
import { getDatabase } from '../database'

// Helper to get random element from array
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Helper to get random date in range
const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

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
}

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
]

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
]

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
]

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
]

const paymentMethods: Array<'cash' | 'card' | 'bank_transfer'> = [
  'cash',
  'card',
  'bank_transfer'
]

interface SeedOptions {
  numMembers?: number
  numPlans?: number
  checkInRate?: number
  clearExisting?: boolean
}

interface SeedResult {
  success: boolean
  message: string
  stats?: {
    plans: number
    members: number
    memberships: number
    checkIns: number
    scenarios: {
      active: number
      expiring: number
      expired: number
      inactive: number
    }
  }
}

function seedDatabase(options: SeedOptions = {}): SeedResult {
  const { numMembers = 100, numPlans = 10, checkInRate = 0.7, clearExisting = true } = options

  try {
    const db = getDatabase()

    // Clear existing data if requested
    if (clearExisting) {
      db.exec('DELETE FROM check_ins')
      db.exec('DELETE FROM memberships')
      db.exec('DELETE FROM members')
      db.exec('DELETE FROM membership_plans')
    }

    // Import crypto for UUID generation
    const crypto = require('crypto')
    const generateId = () => crypto.randomUUID()

    // Insert plans
    const insertPlan = db.prepare(`
      INSERT INTO membership_plans (id, name, duration_days, price, description, is_offer)
      VALUES (?, ?, ?, ?, ?, 0)
    `)

    const planIds: string[] = []
    for (let i = 0; i < Math.min(numPlans, planTemplates.length); i++) {
      const plan = planTemplates[i]
      const planId = generateId()
      insertPlan.run(planId, plan.name, plan.duration, plan.price, `${plan.name} membership plan`)
      planIds.push(planId)
    }

    // Insert members
    const insertMember = db.prepare(`
      INSERT INTO members (id, name, phone, email, gender, address, join_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const memberIds: Array<{ id: string; joinDate: string; gender: string }> = []
    const usedPhones = new Set<string>()

    for (let i = 0; i < numMembers; i++) {
      const gender = Math.random() > 0.5 ? 'male' : 'female'
      const firstName = getRandom(firstNames[gender])
      const lastName = getRandom(lastNames)
      const name = `${firstName} ${lastName}`

      // Generate unique phone
      let phone: string
      do {
        phone = `555${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`
      } while (usedPhones.has(phone))
      usedPhones.add(phone)

      const email =
        Math.random() > 0.3 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com` : null
      const address = Math.random() > 0.5 ? getRandom(addresses) : null
      const joinDate = formatDate(getRandomDate(new Date(2023, 0, 1), new Date(2025, 0, 1)))
      const note = getRandom(notes)
      const memberId = generateId()

      insertMember.run(memberId, name, phone, email, gender, address, joinDate, note)
      memberIds.push({ id: memberId, joinDate, gender })
    }

    // Insert memberships with diverse scenarios
    const insertMembership = db.prepare(`
      INSERT INTO memberships (id, member_id, plan_id, start_date, end_date, amount_paid, payment_method, payment_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const membershipIds: Array<{ id: string; memberId: string; endDate: Date }> = []
    const today = new Date()

    let activeCount = 0
    let expiringCount = 0
    let expiredCount = 0
    let inactiveCount = 0

    memberIds.forEach((member) => {
      // Determine membership scenario
      const scenario = Math.random()

      if (scenario < 0.6) {
        // 60% - Active members with current membership
        const planId = getRandom(planIds)
        const plan = planTemplates[planIds.indexOf(planId)]
        const startDate = getRandomDate(
          new Date(today.getFullYear(), today.getMonth() - 2, 1),
          today
        )
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + plan.duration)

        const membershipId = generateId()
        insertMembership.run(
          membershipId,
          member.id,
          planId,
          formatDate(startDate),
          formatDate(endDate),
          plan.price,
          getRandom(paymentMethods),
          formatDate(startDate),
          'Active membership'
        )
        membershipIds.push({ id: membershipId, memberId: member.id, endDate })
        activeCount++
      } else if (scenario < 0.75) {
        // 15% - Members with expiring membership (within 7 days)
        const planId = getRandom(planIds)
        const plan = planTemplates[planIds.indexOf(planId)]
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1)
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - plan.duration)

        const membershipId = generateId()
        insertMembership.run(
          membershipId,
          member.id,
          planId,
          formatDate(startDate),
          formatDate(endDate),
          plan.price,
          getRandom(paymentMethods),
          formatDate(startDate),
          'Expiring soon'
        )
        membershipIds.push({ id: membershipId, memberId: member.id, endDate })
        expiringCount++
      } else if (scenario < 0.85) {
        // 10% - Expired members (had membership, now expired)
        const planId = getRandom(planIds)
        const plan = planTemplates[planIds.indexOf(planId)]
        const endDate = getRandomDate(
          new Date(today.getFullYear(), today.getMonth() - 6, 1),
          new Date(today.getTime() - 24 * 60 * 60 * 1000)
        )
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - plan.duration)

        const membershipId = generateId()
        insertMembership.run(
          membershipId,
          member.id,
          planId,
          formatDate(startDate),
          formatDate(endDate),
          plan.price,
          getRandom(paymentMethods),
          formatDate(startDate),
          'Expired membership'
        )
        expiredCount++
      } else if (scenario < 0.95) {
        // 10% - Members with multiple memberships (renewals)
        const numMemberships = Math.floor(Math.random() * 3) + 2 // 2-4 memberships
        let currentDate = new Date(member.joinDate)

        for (let i = 0; i < numMemberships; i++) {
          const planId = getRandom(planIds)
          const plan = planTemplates[planIds.indexOf(planId)]
          const startDate = new Date(currentDate)
          const endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + plan.duration)

          const membershipId = generateId()
          insertMembership.run(
            membershipId,
            member.id,
            planId,
            formatDate(startDate),
            formatDate(endDate),
            plan.price,
            getRandom(paymentMethods),
            formatDate(startDate),
            `Membership #${i + 1}`
          )

          if (endDate > today) {
            membershipIds.push({ id: membershipId, memberId: member.id, endDate })
          }

          currentDate = new Date(endDate)
          currentDate.setDate(currentDate.getDate() + 1)
        }
        activeCount++
      } else {
        // Remaining 5% - Inactive members (never had membership)
        inactiveCount++
      }
    })

    // Insert check-ins
    const insertCheckIn = db.prepare(`
      INSERT INTO check_ins (id, member_id, check_in_time)
      VALUES (?, ?, ?)
    `)

    let checkInCount = 0
    // Generate check-ins for the last 90 days
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 90)

    membershipIds.forEach((membership) => {
      const currentDate = new Date(startDate)

      while (currentDate <= today && currentDate <= membership.endDate) {
        // Random check-in probability
        if (Math.random() < checkInRate) {
          const checkInTime = new Date(currentDate)
          checkInTime.setHours(
            Math.floor(Math.random() * 14) + 6, // 6 AM - 8 PM
            Math.floor(Math.random() * 60),
            0,
            0
          )

          const checkInId = generateId()
          insertCheckIn.run(checkInId, membership.memberId, checkInTime.toISOString())
          checkInCount++
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    return {
      success: true,
      message: 'Database seeded successfully',
      stats: {
        plans: planIds.length,
        members: memberIds.length,
        memberships: membershipIds.length,
        checkIns: checkInCount,
        scenarios: {
          active: activeCount,
          expiring: expiringCount,
          expired: expiredCount,
          inactive: inactiveCount
        }
      }
    }
  } catch (error) {
    console.error('Error seeding database:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export function registerSeedHandlers() {
  ipcMain.handle('seed:database', (_event, options: SeedOptions) => {
    return seedDatabase(options)
  })
}
