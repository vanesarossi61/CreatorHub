# CreatorHub — Deployment Guide

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16 (Neon/Supabase recommended for serverless)
- Redis (Upstash recommended for serverless)
- Stripe account (test + live keys)
- Clerk account (auth provider)
- Resend account (transactional email)
- Vercel account (hosting)

## Environment Variables

Copy `.env.example` to `.env` and fill in all values.

### Required for Production

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/creatorhub?sslmode=require
DIRECT_URL=postgresql://user:pass@host:5432/creatorhub  # For migrations

# Redis
REDIS_URL=rediss://default:token@host:6379

# Auth (Clerk)
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=CreatorHub <noreply@yourdomain.com>

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
ADMIN_EMAILS=admin@yourdomain.com

# Storage (MinIO/S3)
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=creatorhub-uploads
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=us-east-1
```

## Deploy to Vercel (Recommended)

### 1. Connect Repository

```bash
npx vercel link
```

### 2. Set Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add all vars above.

### 3. Database Setup (Neon)

```bash
# Create database on neon.tech, then:
pnpm --filter @creatorhub/database db:push
pnpm --filter @creatorhub/database db:seed  # Optional: seed sample data
```

### 4. Deploy

```bash
npx vercel --prod
```

### 5. Set Up Webhooks

- **Clerk**: Dashboard > Webhooks > Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
  - Events: `user.created`, `user.updated`, `user.deleted`

- **Stripe**: Dashboard > Developers > Webhooks > Add endpoint: `https://yourdomain.com/api/stripe/webhooks`
  - Events: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`

## Deploy with Docker

### 1. Build Image

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://yourdomain.com \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... \
  -t creatorhub .
```

### 2. Run

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  -e CLERK_SECRET_KEY=... \
  -e STRIPE_SECRET_KEY=... \
  -e RESEND_API_KEY=... \
  creatorhub
```

### 3. Docker Compose (Full Stack)

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, MinIO, and the app.

## Performance Checklist

### Bundle Optimization

- [x] Next.js `output: 'standalone'` in next.config.ts
- [x] Dynamic imports for heavy components (Stripe.js, charts)
- [x] Image optimization via `next/image` with remote patterns
- [x] Route-level code splitting (App Router automatic)

### Caching Strategy

- [x] Static assets: `immutable` cache headers (1 year)
- [x] API routes: `no-store` (real-time data)
- [x] Images: 24h cache + stale-while-revalidate
- [ ] Consider ISR for public pages (explore, campaign detail)
- [ ] Redis caching for expensive queries (stats, search)

### Database Performance

- [x] Prisma query optimization with selective `include`/`select`
- [x] Pagination on all list endpoints
- [ ] Add database indexes for frequent queries:
  ```sql
  CREATE INDEX idx_campaign_status ON "Campaign"(status);
  CREATE INDEX idx_deal_status ON "Deal"(status);
  CREATE INDEX idx_user_clerk_id ON "User"("clerkId");
  CREATE INDEX idx_creator_slug ON "Creator"(slug);
  CREATE INDEX idx_notification_user ON "Notification"("userId", read);
  ```
- [ ] Connection pooling via PgBouncer or Neon's built-in pooler

### Security Hardening

- [x] Security headers via vercel.json
- [x] Stripe webhook signature verification
- [x] Clerk webhook verification
- [x] Admin email allowlist
- [x] Role-based route protection
- [ ] Rate limiting on API routes (consider Upstash Ratelimit)
- [ ] CSRF protection for mutation routes
- [ ] Content Security Policy headers

### Monitoring (Recommended)

- [ ] Vercel Analytics (built-in)
- [ ] Sentry for error tracking
- [ ] Stripe Dashboard for payment monitoring
- [ ] Clerk Dashboard for auth monitoring

## Scripts Reference

```bash
# Development
pnpm dev              # Start all services
pnpm dev:web          # Start web app only

# Database
pnpm db:push          # Push schema to DB
pnpm db:seed          # Seed sample data
pnpm db:studio        # Open Prisma Studio
pnpm db:migrate       # Run migrations

# Testing
pnpm test             # Run Vitest unit tests
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:coverage    # Unit tests with coverage

# Build & Deploy
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript check
```
