# CreatorHub

Plataforma marketplace que conecta marcas con creadores de contenido para campañas de marketing de influencers. Gestión integral de campañas, deals, pagos y comunicación.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Clerk
- **Payments:** Stripe (Checkout + Connect)
- **Storage:** MinIO (S3-compatible)
- **Cache:** Redis
- **Email:** Resend
- **Monorepo:** Turborepo
- **Testing:** Vitest (unit) + Playwright (E2E)
- **CI/CD:** GitHub Actions + Vercel

## Project Structure

```
/
├── apps/
│   └── web/                    # Next.js 14 application
│       ├── e2e/                # Playwright E2E tests
│       ├── src/
│       │   ├── app/            # App Router pages & API routes
│       │   │   ├── (auth)/     # Auth pages (sign-in, sign-up, onboarding)
│       │   │   ├── (dashboard)/ # Dashboard pages
│       │   │   └── api/        # API route handlers
│       │   ├── components/     # React components
│       │   │   ├── layout/     # Navbar, Sidebar, Header
│       │   │   ├── payments/   # Stripe Connect, Payment Button
│       │   │   └── ui/         # Reusable UI components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utilities, API client, validations
│       │   ├── styles/         # Global CSS
│       │   └── __tests__/      # Vitest unit tests
│       └── playwright.config.ts
├── packages/
│   ├── database/               # Prisma schema, seed, client
│   └── shared/                 # Shared types, constants
├── docker-compose.yml          # Postgres + Redis + MinIO
├── Dockerfile                  # Production multi-stage build
├── vercel.json                 # Vercel deployment config
├── turbo.json                  # Turborepo pipeline config
└── DEPLOY.md                   # Deployment guide
```

## Features

### For Brands
- Create and manage marketing campaigns
- Browse and discover creators by niche, audience, engagement
- Send deal proposals with milestone-based payments
- Stripe Checkout for secure payments
- Real-time messaging with creators
- Dashboard with campaign analytics

### For Creators
- Portfolio profile with social stats
- Apply to brand campaigns
- Negotiate deals and track milestones
- Stripe Connect for receiving payouts
- Notification center for updates

### Admin Panel
- User management (view, suspend, role changes)
- Deal oversight and dispute resolution
- Platform statistics and revenue tracking
- Campaign moderation

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### Setup

```bash
# Clone the repo
git clone https://github.com/vanesarossi61/CreatorHub.git
cd CreatorHub

# Install dependencies
pnpm install

# Copy environment variables
cp env.example .env

# Start infrastructure (Postgres, Redis, MinIO)
docker-compose up -d

# Generate Prisma client & push schema
pnpm --filter @creatorhub/database db:generate
pnpm --filter @creatorhub/database db:push

# Seed the database
pnpm --filter @creatorhub/database db:seed

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

See `env.example` for all required variables. Key services:

| Variable | Service |
|----------|--------|
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Redis connection |
| `NEXT_PUBLIC_CLERK_*` | Clerk authentication |
| `STRIPE_SECRET_KEY` | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks |
| `RESEND_API_KEY` | Email service |
| `MINIO_*` | Object storage |

## Scripts

```bash
# Development
pnpm dev                  # Start all apps in dev mode
pnpm build                # Build all apps
pnpm lint                 # Lint all packages
pnpm type-check           # TypeScript type checking

# Database
pnpm db:generate          # Generate Prisma client
pnpm db:push              # Push schema to database
pnpm db:migrate           # Run migrations
pnpm db:seed              # Seed sample data
pnpm db:studio            # Open Prisma Studio

# Testing
pnpm test                 # Run Vitest unit tests
pnpm test:e2e             # Run Playwright E2E tests
```

## Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions covering:
- Vercel deployment
- Docker production builds
- Database migration strategy
- Environment configuration

## License

Private - All rights reserved.
