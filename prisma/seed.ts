import { prisma } from '@/lib/db'
import { seedCampaigns } from './seed-campaigns'

async function main() {
  try {
    console.log('Starting database seed...')

    // Clear existing data if needed (be careful with this!)
    const clearData = process.env.SEED_CLEAR === 'true'
    if (clearData) {
      console.log('Clearing existing seed data...')
      await prisma.comment.deleteMany({})
      await prisma.share.deleteMany({})
      await prisma.lobby.deleteMany({})
      await prisma.campaign.deleteMany({})
      await prisma.user.deleteMany({})
      console.log('Cleared existing data')
    }

    // Create demo users
    console.log('Creating demo users...')
    const demoUsers = await Promise.all([
      prisma.user.upsert({
        where: { email: 'sarah@example.com' },
        update: {},
        create: {
          email: 'sarah@example.com',
          displayName: 'Sarah Chen',
          handle: 'sarah_innovations',
          bio: 'Product designer & sustainability advocate. Always looking for better solutions.',
          emailVerified: true,
          phoneVerified: false,
        },
      }),
      prisma.user.upsert({
        where: { email: 'marcus@example.com' },
        update: {},
        create: {
          email: 'marcus@example.com',
          displayName: 'Marcus Williams',
          handle: 'marcus_tech',
          bio: 'Tech enthusiast and early adopter. Loves smart home products.',
          emailVerified: true,
          phoneVerified: false,
        },
      }),
      prisma.user.upsert({
        where: { email: 'elena@example.com' },
        update: {},
        create: {
          email: 'elena@example.com',
          displayName: 'Elena Rodriguez',
          handle: 'elena_wellness',
          bio: 'Health coach focused on sustainable living and wellness.',
          emailVerified: true,
          phoneVerified: false,
        },
      }),
      prisma.user.upsert({
        where: { email: 'james@example.com' },
        update: {},
        create: {
          email: 'james@example.com',
          displayName: 'James Liu',
          handle: 'james_maker',
          bio: 'DIY enthusiast and woodworker. Workshop organization is my passion.',
          emailVerified: true,
          phoneVerified: false,
        },
      }),
      prisma.user.upsert({
        where: { email: 'amit@example.com' },
        update: {},
        create: {
          email: 'amit@example.com',
          displayName: 'Amit Patel',
          handle: 'amit_travel',
          bio: 'Frequent traveler looking for products that make trips easier.',
          emailVerified: true,
          phoneVerified: false,
        },
      }),
    ])

    console.log('Created 5 demo users')

    // Create additional community members
    console.log('Creating community members...')
    const communityEmails = [
      'alex@example.com',
      'beth@example.com',
      'carlos@example.com',
      'diana@example.com',
      'ethan@example.com',
      'fiona@example.com',
      'george@example.com',
      'hannah@example.com',
      'ivan@example.com',
      'julia@example.com',
    ]

    const firstNames = [
      'Alex',
      'Beth',
      'Carlos',
      'Diana',
      'Ethan',
      'Fiona',
      'George',
      'Hannah',
      'Ivan',
      'Julia',
    ]
    const handles = [
      'alex_advocate',
      'beth_builder',
      'carlos_creator',
      'diana_designer',
      'ethan_explorer',
      'fiona_founder',
      'george_green',
      'hannah_hacker',
      'ivan_innovator',
      'julia_judge',
    ]

    const communityUsers = await Promise.all(
      communityEmails.map((email, idx) =>
        prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            displayName: firstNames[idx],
            handle: handles[idx],
            bio: 'Community member interested in innovative products',
            emailVerified: true,
            phoneVerified: false,
          },
        })
      )
    )

    console.log('Created 10 community members')

    // Seed campaigns with all users
    const allUsers = [...demoUsers, ...communityUsers]
    await seedCampaigns(demoUsers.map((u) => ({ id: u.id, handle: u.handle || u.displayName })))

    // ------------------------------------------------------------------
    // Claimed-brand fixture: a VERIFIED brand with a BrandTeam member, so
    // the brand persona (brand dashboard, claim gate, brand-side audience
    // insights) can be exercised locally. Idempotent: upserts throughout.
    // ------------------------------------------------------------------
    console.log('Seeding claimed-brand fixture...')

    const brandRep = await prisma.user.upsert({
      where: { email: 'brandrep@example.com' },
      update: {},
      create: {
        email: 'brandrep@example.com',
        displayName: 'Dana Brandrep',
        handle: 'dana_dyson',
        bio: 'Brand representative at Dyson. Listening to what the community wants.',
        emailVerified: true,
        phoneVerified: false,
      },
    })

    // Dyson is seeded (UNCLAIMED) by seedCampaigns; promote it to VERIFIED.
    const claimedBrand = await prisma.brand.upsert({
      where: { slug: 'dyson' },
      update: { status: 'VERIFIED' },
      create: {
        name: 'Dyson',
        slug: 'dyson',
        website: 'https://www.dyson.co.uk',
        status: 'VERIFIED',
      },
    })

    await prisma.brandTeam.upsert({
      where: {
        brandId_userId: { brandId: claimedBrand.id, userId: brandRep.id },
      },
      update: { role: 'OWNER' },
      create: {
        brandId: claimedBrand.id,
        userId: brandRep.id,
        role: 'OWNER',
      },
    })

    // A completed verification record, as the claim flow would leave behind.
    const existingVerification = await prisma.brandVerification.findFirst({
      where: { brandId: claimedBrand.id, status: 'VERIFIED' },
    })
    if (!existingVerification) {
      await prisma.brandVerification.create({
        data: {
          brandId: claimedBrand.id,
          method: 'EMAIL_DOMAIN',
          status: 'VERIFIED',
          token: 'seed-brand-verification-dyson',
          code: null,
          verifiedAt: new Date(),
        },
      })
    }

    // Make sure at least 3 campaigns target the claimed brand so its
    // dashboard has real data to aggregate.
    const targetedCount = await prisma.campaign.count({
      where: { targetedBrandId: claimedBrand.id },
    })
    if (targetedCount < 3) {
      const retargetable = await prisma.campaign.findMany({
        where: { targetedBrandId: { not: claimedBrand.id } },
        orderBy: { createdAt: 'asc' },
        take: 3 - targetedCount,
        select: { id: true, title: true },
      })
      for (const campaign of retargetable) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { targetedBrandId: claimedBrand.id, openToAlternatives: false },
        })
        console.log(`Retargeted campaign at ${claimedBrand.name}: ${campaign.title}`)
      }
    }

    const finalTargetedCount = await prisma.campaign.count({
      where: { targetedBrandId: claimedBrand.id },
    })
    console.log(
      `Claimed-brand fixture ready: ${claimedBrand.name} (VERIFIED), ` +
        `team member brandrep@example.com (OWNER), ` +
        `${finalTargetedCount} campaigns targeting it`
    )

    console.log('Database seeding complete!')
    console.log(`Total users: ${allUsers.length}`)

    // Print summary
    const campaignCount = await prisma.campaign.count()
    const lobbyCount = await prisma.lobby.count()
    const commentCount = await prisma.comment.count()

    console.log('\nSeed Summary:')
    console.log(`- Campaigns: ${campaignCount}`)
    console.log(`- Lobbies: ${lobbyCount}`)
    console.log(`- Comments: ${commentCount}`)
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
