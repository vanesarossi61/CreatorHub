// CreatorHub — Stripe Server Utilities
// Stripe SDK initialization, helpers for Checkout, Connect, and webhooks.
// Uses Stripe API version 2024-12-18.acacia

import Stripe from "stripe";

// =============================
// CLIENT INITIALIZATION
// =============================

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as any,
  typescript: true,
  appInfo: {
    name: "CreatorHub",
    version: "1.0.0",
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
});

// =============================
// CONSTANTS
// =============================

/** Platform commission rate (default 12%) */
export const PLATFORM_FEE_RATE = parseFloat(
  process.env.PLATFORM_COMMISSION_RATE || "0.12"
);

/** Minimum payout amount in cents */
export const MIN_PAYOUT_CENTS = 500; // $5.00

/** Supported currencies */
export const SUPPORTED_CURRENCIES = ["usd", "eur", "ars", "brl", "mxn"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// =============================
// HELPERS: MONEY
// =============================

/** Convert dollars to cents (Stripe uses smallest currency unit) */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Convert cents to dollars */
export function toDollars(cents: number): number {
  return cents / 100;
}

/** Calculate platform fee and net amount */
export function calculateFees(amountCents: number): {
  platformFee: number;
  netAmount: number;
  totalCharge: number;
} {
  const platformFee = Math.round(amountCents * PLATFORM_FEE_RATE);
  const netAmount = amountCents - platformFee;
  return {
    platformFee,
    netAmount,
    totalCharge: amountCents,
  };
}

// =============================
// CHECKOUT SESSION
// =============================

export interface CreateCheckoutParams {
  dealId: string;
  milestoneId?: string;
  amount: number; // in dollars
  currency?: string;
  brandEmail: string;
  creatorStripeAccountId: string;
  campaignTitle: string;
  creatorName: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Create a Stripe Checkout Session for a deal payment.
 * Uses Stripe Connect with destination charges so the platform
 * collects its fee and the creator receives the net amount.
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const {
    dealId,
    milestoneId,
    amount,
    currency = "usd",
    brandEmail,
    creatorStripeAccountId,
    campaignTitle,
    creatorName,
    successUrl,
    cancelUrl,
  } = params;

  const amountCents = toCents(amount);
  const { platformFee } = calculateFees(amountCents);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: brandEmail,
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Deal: ${campaignTitle}`,
            description: `Pago a ${creatorName}${milestoneId ? " (milestone)" : ""}`,
            metadata: { dealId, milestoneId: milestoneId || "" },
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: {
        destination: creatorStripeAccountId,
      },
      metadata: {
        dealId,
        milestoneId: milestoneId || "",
        platformFee: platformFee.toString(),
        netAmount: (amountCents - platformFee).toString(),
      },
    },
    success_url:
      successUrl ||
      `${appUrl}/deals/${dealId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:
      cancelUrl || `${appUrl}/deals/${dealId}?payment=cancelled`,
    metadata: {
      dealId,
      milestoneId: milestoneId || "",
      type: "deal_payment",
    },
  });

  return session;
}

// =============================
// STRIPE CONNECT (CREATOR ONBOARDING)
// =============================

export interface CreateConnectAccountParams {
  creatorId: string;
  email: string;
  country?: string;
  displayName: string;
}

/**
 * Create a Stripe Connect Express account for a creator.
 * This enables them to receive payouts from deal payments.
 */
export async function createConnectAccount(
  params: CreateConnectAccountParams
): Promise<Stripe.Account> {
  const { creatorId, email, country = "US", displayName } = params;

  const account = await stripe.accounts.create({
    type: "express",
    email,
    country,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: "individual",
    business_profile: {
      name: displayName,
      product_description: "Content creation services via CreatorHub",
    },
    metadata: {
      creatorId,
      platform: "creatorhub",
    },
  });

  return account;
}

/**
 * Generate an Account Link for Stripe Connect onboarding flow.
 * The creator is redirected to Stripe to complete KYC.
 */
export async function createAccountLink(
  accountId: string,
  creatorId: string
): Promise<Stripe.AccountLink> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/settings?tab=payments&stripe=refresh`,
    return_url: `${appUrl}/settings?tab=payments&stripe=complete`,
    type: "account_onboarding",
  });

  return accountLink;
}

/**
 * Create a Login Link so the creator can access their Stripe Express Dashboard.
 */
export async function createDashboardLink(
  accountId: string
): Promise<Stripe.LoginLink> {
  return stripe.accounts.createLoginLink(accountId);
}

/**
 * Check if a Connect account is fully onboarded and can receive payouts.
 */
export async function isAccountReady(
  accountId: string
): Promise<{
  ready: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    ready:
      account.charges_enabled &&
      account.payouts_enabled &&
      account.details_submitted,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

// =============================
// REFUNDS
// =============================

/**
 * Refund a payment (full or partial).
 * Used when a deal is cancelled or disputed.
 */
export async function refundPayment(
  paymentIntentId: string,
  amountCents?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
    reason: reason || "requested_by_customer",
    reverse_transfer: true, // reverse the transfer to connected account
    refund_application_fee: true, // refund our platform fee too
  };

  if (amountCents) {
    refundParams.amount = amountCents;
  }

  return stripe.refunds.create(refundParams);
}

// =============================
// WEBHOOK VERIFICATION
// =============================

/**
 * Verify and construct a Stripe webhook event.
 * Must use the raw body (not parsed JSON).
 */
export function constructWebhookEvent(
  rawBody: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

// =============================
// RETRIEVE HELPERS
// =============================

export async function getPaymentIntent(
  id: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.retrieve(id);
}

export async function getCheckoutSession(
  id: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(id, {
    expand: ["payment_intent", "line_items"],
  });
}

export async function getConnectAccount(
  id: string
): Promise<Stripe.Account> {
  return stripe.accounts.retrieve(id);
}
