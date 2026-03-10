// CreatorHub — Stripe Checkout API
// POST /api/stripe/checkout — Create a Checkout Session for deal payment

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@creatorhub/database";
import {
  createCheckoutSession,
  toCents,
  calculateFees,
} from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "BRAND") {
      return NextResponse.json(
        { success: false, error: "Only brands can initiate payments" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { dealId, milestoneId } = body;

    if (!dealId) {
      return NextResponse.json(
        { success: false, error: "dealId is required" },
        { status: 400 }
      );
    }

    // Fetch deal with all relations needed for payment
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        campaign: {
          include: { brand: { include: { user: true } } },
        },
        creator: { include: { user: true } },
        milestones: milestoneId
          ? { where: { id: milestoneId } }
          : undefined,
      },
    });

    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 }
      );
    }

    // Verify the brand owns this deal's campaign
    if (deal.campaign.brand.user.id !== user.id) {
      return NextResponse.json(
        { success: false, error: "You do not own this deal" },
        { status: 403 }
      );
    }

    // Verify deal is in a payable state
    const payableStatuses = ["IN_PROGRESS", "DELIVERED", "REVISION"];
    if (!payableStatuses.includes(deal.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot pay a deal with status ${deal.status}` },
        { status: 400 }
      );
    }

    // Check creator has Stripe Connect account
    const creatorStripeId = deal.creator.stripeAccountId;
    if (!creatorStripeId) {
      return NextResponse.json(
        { success: false, error: "Creator has not set up Stripe payments yet" },
        { status: 400 }
      );
    }

    // Determine payment amount
    let amount: number;
    let targetMilestoneId: string | undefined;

    if (milestoneId && deal.milestones?.length) {
      const milestone = deal.milestones[0];
      if (!milestone) {
        return NextResponse.json(
          { success: false, error: "Milestone not found" },
          { status: 404 }
        );
      }
      if (milestone.status === "PAID") {
        return NextResponse.json(
          { success: false, error: "Milestone already paid" },
          { status: 400 }
        );
      }
      amount = milestone.amount.toNumber();
      targetMilestoneId = milestone.id;
    } else {
      amount = deal.agreedRate.toNumber();
    }

    // Calculate fees for response
    const amountCents = toCents(amount);
    const fees = calculateFees(amountCents);

    // Create Checkout Session
    const session = await createCheckoutSession({
      dealId: deal.id,
      milestoneId: targetMilestoneId,
      amount,
      currency: deal.currency,
      brandEmail: deal.campaign.brand.user.email,
      creatorStripeAccountId: creatorStripeId,
      campaignTitle: deal.campaign.title,
      creatorName: deal.creator.displayName,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        sessionUrl: session.url,
        amount,
        currency: deal.currency,
        platformFee: fees.platformFee / 100,
        netToCreator: fees.netAmount / 100,
      },
    });
  } catch (error: any) {
    console.error("[Stripe Checkout Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Payment initiation failed" },
      { status: 500 }
    );
  }
}
