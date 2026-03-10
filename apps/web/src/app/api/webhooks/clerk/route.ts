// CreatorHub -- Clerk Webhook Handler
// Syncs Clerk user events (create, update, delete) with our PostgreSQL DB.
// Configure in Clerk Dashboard -> Webhooks -> Endpoint URL: /api/webhooks/clerk
//
// Required env var: CLERK_WEBHOOK_SECRET
// Docs: https://clerk.com/docs/integrations/webhooks/sync-data

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@creatorhub/database";
import type { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Verify the webhook signature using Svix
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  const eventType = event.type;

  try {
    switch (eventType) {
      // ---- USER CREATED ----
      case "user.created": {
        const { id, email_addresses, first_name, last_name, image_url } =
          event.data;

        const primaryEmail = email_addresses.find(
          (e) => e.id === event.data.primary_email_address_id
        );

        if (!primaryEmail) {
          console.error("No primary email found for user:", id);
          break;
        }

        const name = [first_name, last_name].filter(Boolean).join(" ") || "Usuario";

        await prisma.user.create({
          data: {
            clerkId: id,
            email: primaryEmail.email_address,
            name,
            imageUrl: image_url ?? null,
            userType: "CREATOR", // Default, updated during onboarding
            onboarded: false,
          },
        });

        console.log(`[Clerk Webhook] User created: ${id} (${primaryEmail.email_address})`);
        break;
      }

      // ---- USER UPDATED ----
      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } =
          event.data;

        const primaryEmail = email_addresses.find(
          (e) => e.id === event.data.primary_email_address_id
        );

        const name = [first_name, last_name].filter(Boolean).join(" ") || "Usuario";

        await prisma.user.update({
          where: { clerkId: id },
          data: {
            email: primaryEmail?.email_address,
            name,
            imageUrl: image_url ?? null,
          },
        });

        console.log(`[Clerk Webhook] User updated: ${id}`);
        break;
      }

      // ---- USER DELETED ----
      case "user.deleted": {
        const { id } = event.data;

        if (!id) break;

        // Soft delete -- mark as inactive rather than hard delete
        // This preserves campaign history and financial records
        await prisma.user.update({
          where: { clerkId: id },
          data: {
            isActive: false,
          },
        });

        console.log(`[Clerk Webhook] User soft-deleted: ${id}`);
        break;
      }

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(`[Clerk Webhook] Error handling ${eventType}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
