// CreatorHub — Stripe Webhook Handler
// POST /api/stripe/webhooks — Processes Stripe events
// Must use raw body for signature verification.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@creatorhub/database";
import { constructWebhookEvent, getCheckoutSession } from "@/lib/stripe";
import type Stripe from "stripe";

// Disable body parsing — Stripe needs raw body for signature verification
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    event = constructWebhookEvent(rawBody, signature);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // ---- Payment succeeded (Checkout completed) ----
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      // ---- Payment failed ----
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      // ---- Refund processed ----
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      // ---- Connect account updated (onboarding status) ----
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
    // Return 200 to prevent Stripe retries for processing errors
    // (we log and handle internally)
    return NextResponse.json({ received: true, error: error.message });
  }
}

// =============================
// EVENT HANDLERS
// =============================

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const { dealId, milestoneId, type } = session.metadata || {};

  if (type !== "deal_payment" || !dealId) {
    console.log("[Stripe Webhook] Non-deal checkout, skipping");
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  // Create payout record
  await prisma.payout.create({
    data: {
      dealId,
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || "usd",
      status: "COMPLETED",
      stripePaymentId: paymentIntentId || session.id,
    },
  });

  // If milestone payment, mark milestone as PAID
  if (milestoneId) {
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: "PAID",
        completedAt: new Date(),
      },
    });

    // Check if ALL milestones are paid — if so, complete the deal
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { milestones: true },
    });

    if (deal) {
      const allPaid = deal.milestones.every((m) => m.status === "PAID");
      if (allPaid) {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }
    }
  } else {
    // Single payment deal — mark as completed
    await prisma.deal.update({
      where: { id: dealId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  // Update campaign budget spent
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { campaignId: true, agreedRate: true },
  });

  if (deal) {
    await prisma.campaign.update({
      where: { id: deal.campaignId },
      data: {
        budgetSpent: {
          increment: (session.amount_total || 0) / 100,
        },
      },
    });
  }

  // Create notification for the creator
  const fullDeal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      creator: { include: { user: true } },
      campaign: true,
    },
  });

  if (fullDeal) {
    await prisma.notification.create({
      data: {
        userId: fullDeal.creator.user.id,
        type: "PAYMENT_RECEIVED",
        title: "Payment received!",
        body: `You received a payment of $${((session.amount_total || 0) / 100).toFixed(2)} for "${fullDeal.campaign.title}"`,
        data: { dealId, milestoneId: milestoneId || null },
      },
    });
  }

  console.log(
    `[Stripe Webhook] Payment completed for deal ${dealId}${
      milestoneId ? ` milestone ${milestoneId}` : ""
    }`
  );
}

async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent
) {
  const { dealId, milestoneId } = paymentIntent.metadata || {};

  if (!dealId) return;

  // Record failed payout
  await prisma.payout.create({
    data: {
      dealId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: "FAILED",
      stripePaymentId: paymentIntent.id,
    },
  });

  // Notify brand about failed payment
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      campaign: { include: { brand: { include: { user: true } } } },
    },
  });

  if (deal) {
    await prisma.notification.create({
      data: {
        userId: deal.campaign.brand.user.id,
        type: "PAYMENT_FAILED",
        title: "Payment failed",
        body: `Payment of $${(paymentIntent.amount / 100).toFixed(2)} for "${deal.campaign.title}" failed. Please try again.`,
        data: {
          dealId,
          milestoneId: milestoneId || null,
          error: paymentIntent.last_payment_error?.message || "Unknown error",
        },
      },
    });
  }

  console.log(`[Stripe Webhook] Payment failed for deal ${dealId}`);
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  // Find payout by stripe payment ID and update status
  const payout = await prisma.payout.findFirst({
    where: { stripePaymentId: paymentIntentId },
  });

  if (payout) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: charge.amount_refunded === charge.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    });
  }

  console.log(`[Stripe Webhook] Refund processed for PI ${paymentIntentId}`);
}

async function handleAccountUpdated(account: Stripe.Account) {
  // Find creator by stripe account ID and update their status
  const creator = await prisma.creator.findFirst({
    where: { stripeAccountId: account.id },
  });

  if (!creator) return;

  // Update creator's stripe onboarding status
  const isReady =
    account.charges_enabled &&
    account.payouts_enabled &&
    account.details_submitted;

  await prisma.creator.update({
    where: { id: creator.id },
    data: {
      stripeOnboarded: isReady,
    },
  });

  // Notify creator of onboarding completion
  if (isReady) {
    const creatorUser = await prisma.creator.findUnique({
      where: { id: creator.id },
      include: { user: true },
    });

    if (creatorUser) {
      await prisma.notification.create({
        data: {
          userId: creatorUser.user.id,
          type: "STRIPE_READY",
          title: "Payments activated!",
          body: "Your Stripe account is verified. You can now receive payments from deals.",
          data: { stripeAccountId: account.id },
        },
      });
    }
  }

  console.log(
    `[Stripe Webhook] Account ${account.id} updated — ready: ${isReady}`
  );
}
