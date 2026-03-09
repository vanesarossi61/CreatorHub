// CreatorHub — Prisma Seed Script
// Run with: npx prisma db seed
// Configured in package.json: "prisma": { "seed": "tsx prisma/seed.ts" }

import { PrismaClient, UserType, CreatorCategory, SocialPlatform, DealType, CampaignStatus, CampaignVisibility, ApplicationStatus, DealStatus, DeliverableType, DeliverableStatus, MilestoneStatus, PayoutStatus, NotificationType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CreatorHub database...\n");

  // Clean existing data (in reverse dependency order)
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.application.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.creatorSkill.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.creator.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformReport.deleteMany();

  console.log("  Cleaned existing data.");

  // =============================
  // SKILLS
  // =============================
  const skills = await Promise.all(
    [
      { name: "Streaming en vivo", slug: "streaming", category: "Content" },
      { name: "Edicion de video", slug: "video-editing", category: "Production" },
      { name: "Fotografia", slug: "photography", category: "Production" },
      { name: "Diseno grafico", slug: "graphic-design", category: "Design" },
      { name: "Copywriting", slug: "copywriting", category: "Content" },
      { name: "Social Media", slug: "social-media", category: "Marketing" },
      { name: "SEO", slug: "seo", category: "Marketing" },
      { name: "Podcasting", slug: "podcasting", category: "Content" },
      { name: "Motion Graphics", slug: "motion-graphics", category: "Production" },
      { name: "UGC", slug: "ugc", category: "Content" },
      { name: "Reviews de producto", slug: "product-reviews", category: "Content" },
      { name: "Gaming", slug: "gaming", category: "Niche" },
      { name: "Fitness & Wellness", slug: "fitness", category: "Niche" },
      { name: "Cocina", slug: "cooking", category: "Niche" },
      { name: "Tech & Gadgets", slug: "tech", category: "Niche" },
    ].map((s) => prisma.skill.create({ data: s }))
  );

  console.log(`  Created ${skills.length} skills.`);

  // =============================
  // USERS — Creators
  // =============================
  const userCreator1 = await prisma.user.create({
    data: {
      clerkId: "clerk_creator_001",
      email: "lucia.gaming@example.com",
      firstName: "Lucia",
      lastName: "Martinez",
      type: UserType.CREATOR,
      onboardingDone: true,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=lucia",
    },
  });

  const userCreator2 = await prisma.user.create({
    data: {
      clerkId: "clerk_creator_002",
      email: "tomas.photo@example.com",
      firstName: "Tomas",
      lastName: "Rodriguez",
      type: UserType.CREATOR,
      onboardingDone: true,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=tomas",
    },
  });

  const userCreator3 = await prisma.user.create({
    data: {
      clerkId: "clerk_creator_003",
      email: "carla.fitness@example.com",
      firstName: "Carla",
      lastName: "Gonzalez",
      type: UserType.CREATOR,
      onboardingDone: true,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=carla",
    },
  });

  console.log("  Created 3 creator users.");

  // =============================
  // USERS — Brands
  // =============================
  const userBrand1 = await prisma.user.create({
    data: {
      clerkId: "clerk_brand_001",
      email: "marketing@techflow.io",
      firstName: "Santiago",
      lastName: "Lopez",
      type: UserType.BRAND,
      onboardingDone: true,
    },
  });

  const userBrand2 = await prisma.user.create({
    data: {
      clerkId: "clerk_brand_002",
      email: "partnerships@greenlife.com",
      firstName: "Valentina",
      lastName: "Silva",
      type: UserType.BRAND,
      onboardingDone: true,
    },
  });

  console.log("  Created 2 brand users.");

  // =============================
  // CREATOR PROFILES
  // =============================
  const creator1 = await prisma.creator.create({
    data: {
      userId: userCreator1.id,
      displayName: "LuciaPlays",
      bio: "Streamer de gaming y tech reviews. +50k seguidores en Twitch. Especialista en shooters y RPGs con contenido en espanol.",
      slug: "luciaplays",
      category: CreatorCategory.STREAMER,
      country: "AR",
      city: "Buenos Aires",
      languages: ["es", "en"],
      website: "https://luciaplays.gg",
      isVerified: true,
      isAvailable: true,
      hourlyRateMin: new Decimal("25.00"),
      hourlyRateMax: new Decimal("75.00"),
      totalEarnings: new Decimal("12500.00"),
      avgRating: new Decimal("4.85"),
      totalReviews: 23,
      completedDeals: 18,
      responseTime: 2,
    },
  });

  const creator2 = await prisma.creator.create({
    data: {
      userId: userCreator2.id,
      displayName: "TomasVisual",
      bio: "Fotografo y editor de video freelance. Creo contenido visual para marcas, desde product shots hasta campanas completas.",
      slug: "tomasvisual",
      category: CreatorCategory.PHOTOGRAPHER,
      country: "MX",
      city: "Ciudad de Mexico",
      languages: ["es", "en", "pt"],
      website: "https://tomasvisual.com",
      isVerified: true,
      isAvailable: true,
      hourlyRateMin: new Decimal("40.00"),
      hourlyRateMax: new Decimal("120.00"),
      totalEarnings: new Decimal("28000.00"),
      avgRating: new Decimal("4.92"),
      totalReviews: 41,
      completedDeals: 35,
      responseTime: 4,
    },
  });

  const creator3 = await prisma.creator.create({
    data: {
      userId: userCreator3.id,
      displayName: "CarlaFit",
      bio: "Creadora de contenido fitness e influencer en Instagram y TikTok. Colaboro con marcas de wellness, suplementos y ropa deportiva.",
      slug: "carlafit",
      category: CreatorCategory.INSTAGRAMMER,
      country: "CO",
      city: "Bogota",
      languages: ["es"],
      isVerified: false,
      isAvailable: true,
      hourlyRateMin: new Decimal("30.00"),
      hourlyRateMax: new Decimal("80.00"),
      totalEarnings: new Decimal("5200.00"),
      avgRating: new Decimal("4.60"),
      totalReviews: 8,
      completedDeals: 6,
      responseTime: 6,
    },
  });

  console.log("  Created 3 creator profiles.");

  // =============================
  // SOCIAL ACCOUNTS
  // =============================
  await prisma.socialAccount.createMany({
    data: [
      {
        creatorId: creator1.id,
        platform: SocialPlatform.TWITCH,
        username: "LuciaPlays",
        profileUrl: "https://twitch.tv/luciaplays",
        followers: 52000,
        isVerified: true,
      },
      {
        creatorId: creator1.id,
        platform: SocialPlatform.YOUTUBE,
        username: "LuciaPlays",
        profileUrl: "https://youtube.com/@luciaplays",
        followers: 28000,
        isVerified: true,
      },
      {
        creatorId: creator1.id,
        platform: SocialPlatform.TWITTER,
        username: "luciaplays_",
        profileUrl: "https://twitter.com/luciaplays_",
        followers: 15000,
      },
      {
        creatorId: creator2.id,
        platform: SocialPlatform.INSTAGRAM,
        username: "tomasvisual",
        profileUrl: "https://instagram.com/tomasvisual",
        followers: 85000,
        isVerified: true,
      },
      {
        creatorId: creator2.id,
        platform: SocialPlatform.YOUTUBE,
        username: "TomasVisual",
        profileUrl: "https://youtube.com/@tomasvisual",
        followers: 42000,
      },
      {
        creatorId: creator3.id,
        platform: SocialPlatform.INSTAGRAM,
        username: "carlafit.ok",
        profileUrl: "https://instagram.com/carlafit.ok",
        followers: 120000,
        isVerified: true,
      },
      {
        creatorId: creator3.id,
        platform: SocialPlatform.TIKTOK,
        username: "carlafit",
        profileUrl: "https://tiktok.com/@carlafit",
        followers: 310000,
      },
    ],
  });

  console.log("  Created 7 social accounts.");

  // =============================
  // CREATOR SKILLS
  // =============================
  const skillMap = Object.fromEntries(skills.map((s) => [s.slug, s.id]));

  await prisma.creatorSkill.createMany({
    data: [
      { creatorId: creator1.id, skillId: skillMap["streaming"] },
      { creatorId: creator1.id, skillId: skillMap["gaming"] },
      { creatorId: creator1.id, skillId: skillMap["tech"] },
      { creatorId: creator1.id, skillId: skillMap["product-reviews"] },
      { creatorId: creator2.id, skillId: skillMap["photography"] },
      { creatorId: creator2.id, skillId: skillMap["video-editing"] },
      { creatorId: creator2.id, skillId: skillMap["graphic-design"] },
      { creatorId: creator2.id, skillId: skillMap["ugc"] },
      { creatorId: creator3.id, skillId: skillMap["fitness"] },
      { creatorId: creator3.id, skillId: skillMap["social-media"] },
      { creatorId: creator3.id, skillId: skillMap["ugc"] },
    ],
  });

  console.log("  Created 11 creator-skill links.");

  // =============================
  // BRAND PROFILES
  // =============================
  const brand1 = await prisma.brand.create({
    data: {
      userId: userBrand1.id,
      companyName: "TechFlow",
      slug: "techflow",
      description: "Startup de SaaS para productividad. Buscamos creadores tech y gaming para hacer awareness de nuestra plataforma.",
      website: "https://techflow.io",
      industry: "Technology",
      companySize: "SMALL",
      country: "AR",
      isVerified: true,
      totalSpent: new Decimal("15000.00"),
      avgRating: new Decimal("4.70"),
      totalReviews: 12,
    },
  });

  const brand2 = await prisma.brand.create({
    data: {
      userId: userBrand2.id,
      companyName: "GreenLife",
      slug: "greenlife",
      description: "Marca de suplementos naturales y productos de bienestar. Colaboramos con influencers de fitness, wellness y lifestyle.",
      website: "https://greenlife.com",
      industry: "Health & Wellness",
      companySize: "MEDIUM",
      country: "CO",
      isVerified: true,
      totalSpent: new Decimal("42000.00"),
      avgRating: new Decimal("4.55"),
      totalReviews: 28,
    },
  });

  console.log("  Created 2 brand profiles.");

  // =============================
  // CAMPAIGNS
  // =============================
  const campaign1 = await prisma.campaign.create({
    data: {
      brandId: brand1.id,
      title: "TechFlow Launch - Streamers & Tech Reviewers",
      slug: "techflow-launch-streamers",
      description: "Buscamos streamers y tech reviewers para promocionar el lanzamiento de TechFlow 2.0. Queremos demos en vivo de la plataforma durante streams y videos de review.",
      brief: "El creator debe hacer al menos 1 stream de 2hs usando TechFlow en vivo, mostrando las features principales. Bonus si hace un video de review en YouTube.",
      category: CreatorCategory.STREAMER,
      budget: new Decimal("5000.00"),
      budgetSpent: new Decimal("1500.00"),
      currency: "USD",
      dealType: DealType.FIXED_PRICE,
      status: CampaignStatus.ACTIVE,
      visibility: CampaignVisibility.PUBLIC,
      maxCreators: 5,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-04-30"),
      applicationDeadline: new Date("2026-03-20"),
      requirements: {
        minFollowers: 10000,
        platforms: ["TWITCH", "YOUTUBE"],
        languages: ["es"],
      },
      deliverables: {
        items: [
          { type: "STREAM", quantity: 1, description: "Stream de 2hs usando TechFlow" },
          { type: "VIDEO", quantity: 1, description: "Video review en YouTube (opcional, bonus)" },
        ],
      },
      tags: ["tech", "saas", "streaming", "review", "launch"],
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      brandId: brand2.id,
      title: "GreenLife Summer - Fitness Influencers",
      slug: "greenlife-summer-fitness",
      description: "Campana de verano para nuestra nueva linea de suplementos. Buscamos fitness influencers para crear contenido UGC en Instagram y TikTok.",
      brief: "Crear 3 piezas de contenido: 1 reel de Instagram, 1 TikTok y 1 story set (3-5 stories). Mostrar el producto en tu rutina de entrenamiento.",
      category: CreatorCategory.INSTAGRAMMER,
      budget: new Decimal("8000.00"),
      budgetSpent: new Decimal("2400.00"),
      currency: "USD",
      dealType: DealType.FIXED_PRICE,
      status: CampaignStatus.ACTIVE,
      visibility: CampaignVisibility.PUBLIC,
      maxCreators: 8,
      startDate: new Date("2026-03-15"),
      endDate: new Date("2026-06-15"),
      applicationDeadline: new Date("2026-04-01"),
      requirements: {
        minFollowers: 5000,
        platforms: ["INSTAGRAM", "TIKTOK"],
        engagement: "3%+",
      },
      deliverables: {
        items: [
          { type: "REEL", quantity: 1, description: "Instagram Reel con producto" },
          { type: "VIDEO", quantity: 1, description: "TikTok mostrando rutina" },
          { type: "STORY", quantity: 1, description: "Set de 3-5 stories" },
        ],
      },
      tags: ["fitness", "wellness", "supplements", "ugc", "summer"],
    },
  });

  console.log("  Created 2 campaigns.");

  // =============================
  // APPLICATIONS
  // =============================
  const app1 = await prisma.application.create({
    data: {
      campaignId: campaign1.id,
      creatorId: creator1.id,
      status: ApplicationStatus.ACCEPTED,
      coverLetter: "Hola! Soy streamer de gaming y tech con 52k en Twitch. Me encantaria hacer un stream usando TechFlow y un review en mi canal de YouTube.",
      proposedRate: new Decimal("750.00"),
    },
  });

  const app2 = await prisma.application.create({
    data: {
      campaignId: campaign2.id,
      creatorId: creator3.id,
      status: ApplicationStatus.ACCEPTED,
      coverLetter: "Hola! Soy Carla, creadora de contenido fitness con 120k en IG y 310k en TikTok. Mis seguidores aman productos de wellness y tengo un engagement rate del 5.2%.",
      proposedRate: new Decimal("1200.00"),
    },
  });

  // Pending application
  await prisma.application.create({
    data: {
      campaignId: campaign2.id,
      creatorId: creator2.id,
      status: ApplicationStatus.PENDING,
      coverLetter: "Hola! Aunque mi foco es fotografia, tambien hago contenido de lifestyle. Me encantaria crear visual content para GreenLife.",
      proposedRate: new Decimal("900.00"),
    },
  });

  console.log("  Created 3 applications.");

  // =============================
  // DEALS
  // =============================
  const deal1 = await prisma.deal.create({
    data: {
      campaignId: campaign1.id,
      creatorId: creator1.id,
      applicationId: app1.id,
      status: DealStatus.IN_PROGRESS,
      agreedRate: new Decimal("750.00"),
      currency: "USD",
      terms: "1 stream de 2hs con TechFlow + 1 video review en YouTube. Pago 50% al inicio, 50% al completar.",
      startDate: new Date("2026-03-05"),
      endDate: new Date("2026-03-25"),
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      campaignId: campaign2.id,
      creatorId: creator3.id,
      applicationId: app2.id,
      status: DealStatus.ACTIVE,
      agreedRate: new Decimal("1200.00"),
      currency: "USD",
      terms: "1 Reel IG + 1 TikTok + 1 set de Stories. Contenido debe mostrar producto en rutina de gym. Pago al completar todos los deliverables.",
      startDate: new Date("2026-03-20"),
      endDate: new Date("2026-04-20"),
    },
  });

  console.log("  Created 2 deals.");

  // =============================
  // DELIVERABLES
  // =============================
  await prisma.deliverable.createMany({
    data: [
      {
        dealId: deal1.id,
        title: "Stream en vivo con TechFlow",
        description: "Stream de minimo 2 horas usando TechFlow en pantalla",
        type: DeliverableType.STREAM,
        status: DeliverableStatus.SUBMITTED,
        dueDate: new Date("2026-03-15"),
        submittedAt: new Date("2026-03-12"),
        submissionUrl: "https://twitch.tv/videos/12345",
        sortOrder: 1,
      },
      {
        dealId: deal1.id,
        title: "Review en YouTube",
        description: "Video de review de TechFlow (10-15 min)",
        type: DeliverableType.VIDEO,
        status: DeliverableStatus.IN_PROGRESS,
        dueDate: new Date("2026-03-25"),
        sortOrder: 2,
      },
      {
        dealId: deal2.id,
        title: "Instagram Reel",
        description: "Reel mostrando producto GreenLife en rutina de gym",
        type: DeliverableType.REEL,
        status: DeliverableStatus.PENDING,
        dueDate: new Date("2026-04-05"),
        sortOrder: 1,
      },
      {
        dealId: deal2.id,
        title: "TikTok Video",
        description: "Video de TikTok con producto en rutina de entrenamiento",
        type: DeliverableType.VIDEO,
        status: DeliverableStatus.PENDING,
        dueDate: new Date("2026-04-10"),
        sortOrder: 2,
      },
      {
        dealId: deal2.id,
        title: "Instagram Stories Set",
        description: "Set de 3-5 stories mostrando uso diario del producto",
        type: DeliverableType.STORY,
        status: DeliverableStatus.PENDING,
        dueDate: new Date("2026-04-15"),
        sortOrder: 3,
      },
    ],
  });

  console.log("  Created 5 deliverables.");

  // =============================
  // MILESTONES
  // =============================
  await prisma.milestone.createMany({
    data: [
      {
        dealId: deal1.id,
        title: "Anticipo - Inicio del deal",
        amount: new Decimal("375.00"),
        status: MilestoneStatus.PAID,
        dueDate: new Date("2026-03-05"),
        paidAt: new Date("2026-03-05"),
        sortOrder: 1,
      },
      {
        dealId: deal1.id,
        title: "Pago final - Entrega completada",
        amount: new Decimal("375.00"),
        status: MilestoneStatus.PENDING,
        dueDate: new Date("2026-03-25"),
        sortOrder: 2,
      },
      {
        dealId: deal2.id,
        title: "Pago completo al entregar",
        amount: new Decimal("1200.00"),
        status: MilestoneStatus.PENDING,
        dueDate: new Date("2026-04-20"),
        sortOrder: 1,
      },
    ],
  });

  console.log("  Created 3 milestones.");

  // =============================
  // PAYOUTS
  // =============================
  await prisma.payout.create({
    data: {
      creatorId: creator1.id,
      dealId: deal1.id,
      amount: new Decimal("375.00"),
      platformFee: new Decimal("37.50"), // 10% fee
      netAmount: new Decimal("337.50"),
      status: PayoutStatus.COMPLETED,
      stripePaymentId: "pi_test_001",
      paidAt: new Date("2026-03-05"),
    },
  });

  console.log("  Created 1 payout.");

  // =============================
  // REVIEWS
  // =============================
  // (Solo para deals completados previamente — simulamos uno historico)
  // Nota: en produccion esto se crea cuando el deal se marca COMPLETED

  // =============================
  // CONVERSATIONS & MESSAGES
  // =============================
  const convo1 = await prisma.conversation.create({
    data: {
      dealId: deal1.id,
      participants: {
        createMany: {
          data: [
            { userId: userCreator1.id },
            { userId: userBrand1.id },
          ],
        },
      },
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: convo1.id,
        senderId: userBrand1.id,
        content: "Hola Lucia! Bienvenida al deal. Te mando acceso a TechFlow para que puedas probarlo antes del stream.",
        isRead: true,
        readAt: new Date("2026-03-05T10:05:00Z"),
      },
      {
        conversationId: convo1.id,
        senderId: userCreator1.id,
        content: "Genial! Ya me llego el acceso. Voy a hacer un stream de prueba el viernes para familiarizarme y el stream oficial el sabado.",
        isRead: true,
        readAt: new Date("2026-03-05T14:30:00Z"),
      },
      {
        conversationId: convo1.id,
        senderId: userBrand1.id,
        content: "Perfecto! Te paso los talking points clave que nos gustaria que menciones durante el stream.",
        isRead: false,
      },
    ],
  });

  console.log("  Created 1 conversation with 3 messages.");

  // =============================
  // NOTIFICATIONS
  // =============================
  await prisma.notification.createMany({
    data: [
      {
        userId: userCreator1.id,
        type: NotificationType.NEW_DEAL,
        title: "Nuevo deal confirmado!",
        body: "TechFlow acepto tu aplicacion para la campana 'TechFlow Launch'. Revisa los detalles del deal.",
        data: { dealId: deal1.id, campaignId: campaign1.id },
        isRead: true,
        readAt: new Date("2026-03-05"),
      },
      {
        userId: userCreator1.id,
        type: NotificationType.PAYOUT_COMPLETED,
        title: "Pago recibido!",
        body: "Recibiste un anticipo de $337.50 USD por el deal con TechFlow.",
        data: { dealId: deal1.id, amount: 337.50 },
        isRead: true,
        readAt: new Date("2026-03-05"),
      },
      {
        userId: userCreator1.id,
        type: NotificationType.NEW_MESSAGE,
        title: "Nuevo mensaje de TechFlow",
        body: "Santiago de TechFlow te envio un mensaje sobre los talking points.",
        data: { conversationId: convo1.id },
        isRead: false,
      },
      {
        userId: userCreator3.id,
        type: NotificationType.APPLICATION_ACCEPTED,
        title: "Aplicacion aceptada!",
        body: "GreenLife acepto tu aplicacion para la campana 'GreenLife Summer'. Revisa los detalles.",
        data: { dealId: deal2.id, campaignId: campaign2.id },
        isRead: false,
      },
      {
        userId: userBrand1.id,
        type: NotificationType.DELIVERABLE_SUBMITTED,
        title: "Nuevo entregable recibido",
        body: "LuciaPlays envio el stream en vivo para revision.",
        data: { dealId: deal1.id },
        isRead: false,
      },
      {
        userId: userBrand2.id,
        type: NotificationType.NEW_APPLICATION,
        title: "Nueva aplicacion recibida",
        body: "TomasVisual aplico a tu campana 'GreenLife Summer'. Revisa su perfil.",
        data: { campaignId: campaign2.id },
        isRead: false,
      },
    ],
  });

  console.log("  Created 6 notifications.");

  // =============================
  // PORTFOLIO ITEMS
  // =============================
  await prisma.portfolioItem.createMany({
    data: [
      {
        creatorId: creator1.id,
        title: "Stream Highlight: Valorant Tournament",
        description: "Highlights del torneo de Valorant con 8k viewers en vivo",
        mediaKey: "portfolio/lucia/valorant-highlight.mp4",
        mediaType: "VIDEO",
        sortOrder: 1,
      },
      {
        creatorId: creator1.id,
        title: "Review: Razer Keyboard 2025",
        description: "Review completo del nuevo teclado Razer — 45k views en YouTube",
        mediaKey: "portfolio/lucia/razer-review.mp4",
        mediaType: "VIDEO",
        externalUrl: "https://youtube.com/watch?v=example1",
        sortOrder: 2,
      },
      {
        creatorId: creator2.id,
        title: "Campana Nike LATAM",
        description: "Shoot de producto y lifestyle para Nike LATAM — 12 fotos",
        mediaKey: "portfolio/tomas/nike-campaign.jpg",
        mediaType: "IMAGE",
        sortOrder: 1,
      },
      {
        creatorId: creator2.id,
        title: "Video Reel 2025",
        description: "Compilado de mis mejores trabajos del 2025",
        mediaKey: "portfolio/tomas/reel-2025.mp4",
        mediaType: "VIDEO",
        externalUrl: "https://vimeo.com/example",
        sortOrder: 2,
      },
      {
        creatorId: creator3.id,
        title: "Collab con FitBrand",
        description: "Reel de Instagram para FitBrand — 250k views, 12k likes",
        mediaKey: "portfolio/carla/fitbrand-reel.mp4",
        mediaType: "VIDEO",
        sortOrder: 1,
      },
    ],
  });

  console.log("  Created 5 portfolio items.");

  // =============================
  // PLATFORM REPORT (sample)
  // =============================
  await prisma.platformReport.create({
    data: {
      period: "2026-03",
      totalUsers: 5,
      totalCreators: 3,
      totalBrands: 2,
      totalCampaigns: 2,
      totalDeals: 2,
      totalGmv: new Decimal("1950.00"),
      totalFees: new Decimal("195.00"),
      data: {
        topCategory: "STREAMER",
        avgDealSize: 975,
        conversionRate: 0.67,
      },
    },
  });

  console.log("  Created 1 platform report.\n");

  console.log("✅ Seed completed successfully!");
  console.log("   Summary:");
  console.log("   - 5 users (3 creators + 2 brands)");
  console.log("   - 3 creator profiles with socials, skills & portfolios");
  console.log("   - 2 brand profiles");
  console.log("   - 15 skills");
  console.log("   - 2 active campaigns");
  console.log("   - 3 applications (2 accepted, 1 pending)");
  console.log("   - 2 deals with deliverables & milestones");
  console.log("   - 1 conversation with 3 messages");
  console.log("   - 6 notifications");
  console.log("   - 1 payout completed");
  console.log("   - 1 platform report");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
