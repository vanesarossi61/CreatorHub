// CreatorHub — Stripe Connect API
// POST /api/stripe/connect — Create/resume Stripe Connect onboarding for creators
// GET  /api/stripe/connect — Get creator's Stripe Connect status

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@creatorhub/database";
import {
  createConnectAccount,
  createAccountLink,
  createDashboardLink,
  isAccountReady,
} from "@/lib/stripe";

// ---- GET: Check Stripe Connect status ----
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "CREATOR") {
      return NextResponse.json(
        { success: false, error: "Only creators can access Stripe Connect" },
        { status: 403 }
      );
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: user.id },
      select: {
        stripeAccountId: true,
        stripeOnboarded: true,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { success: false, error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // No Stripe account yet
    if (!creator.stripeAccountId) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          onboarded: false,
          dashboardUrl: null,
          chargesEnabled: false,
          payoutsEnabled: false,
        },
      });
    }

    // Check live status from Stripe
    const status = await isAccountReady(creator.stripeAccountId);

    // Generate dashboard link if onboarded
    let dashboardUrl: string | null = null;
    if (status.ready) {
      const link = await createDashboardLink(creator.stripeAccountId);
      dashboardUrl = link.url;
    }

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        onboarded: status.ready,
        dashboardUrl,
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
        detailsSubmitted: status.detailsSubmitted,
      },
    });
  } catch (error: any) {
    console.error("[Stripe Connect GET]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ---- POST: Create account or generate onboarding link ----
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "CREATOR") {
      return NextResponse.json(
        { success: false, error: "Only creators can set up Stripe Connect" },
        { status: 403 }
      );
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { success: false, error: "Creator profile not found" },
        { status: 404 }
      );
    }

    let stripeAccountId = creator.stripeAccountId;

    // Step 1: Create Stripe Express account if doesn't exist
    if (!stripeAccountId) {
      const body = await req.json().catch(() => ({}));
      const account = await createConnectAccount({
        creatorId: creator.id,
        email: user.email,
        country: body.country || creator.country || "US",
        displayName: creator.displayName,
      });

      stripeAccountId = account.id;

      // Save the Stripe account ID to creator profile
      await prisma.creator.update({
        where: { id: creator.id },
        data: { stripeAccountId: account.id },
      });
    }

    // Step 2: Generate onboarding link
    const accountLink = await createAccountLink(
      stripeAccountId,
      creator.id
    );

    return NextResponse.json({
      success: true,
      data: {
        accountId: stripeAccountId,
        onboardingUrl: accountLink.url,
        expiresAt: new Date(accountLink.expires_at * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Stripe Connect POST]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
