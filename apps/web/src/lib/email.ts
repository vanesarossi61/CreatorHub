// CreatorHub — Email Service
// Transactional emails via Resend SDK.
// Templates for welcome, deal notifications, payment receipts, etc.

import { Resend } from "resend";

// =============================
// CLIENT
// =============================

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "CreatorHub <noreply@creatorhub.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// =============================
// SEND HELPER
// =============================

async function send(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("[Email] Send failed:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("[Email] Exception:", err);
    return { success: false, error: err.message };
  }
}

// =============================
// BASE LAYOUT
// =============================

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">CreatorHub</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#fafafa;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
                &copy; ${new Date().getFullYear()} CreatorHub. All rights reserved.<br/>
                <a href="${APP_URL}/settings" style="color:#7c3aed;text-decoration:none;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0;">${text}</a>`;
}

// =============================
// EMAIL TEMPLATES
// =============================

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  userType: "CREATOR" | "BRAND";
}) {
  const { to, name, userType } = params;
  const isCreator = userType === "CREATOR";

  const html = layout(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Welcome to CreatorHub, ${name}! 🎉</h2>
    <p style="color:#52525b;font-size:15px;line-height:1.6;">
      ${isCreator
        ? "You're now part of the fastest-growing creator marketplace. Complete your profile to start landing brand deals."
        : "You now have access to thousands of talented creators ready to bring your campaigns to life."
      }
    </p>
    <p style="color:#52525b;font-size:15px;line-height:1.6;">Here's what to do next:</p>
    <ol style="color:#52525b;font-size:15px;line-height:1.8;padding-left:20px;">
      ${isCreator
        ? `<li>Complete your creator profile</li>
           <li>Add your social accounts and portfolio</li>
           <li>Set up Stripe to receive payments</li>
           <li>Browse and apply to campaigns</li>`
        : `<li>Complete your brand profile</li>
           <li>Create your first campaign</li>
           <li>Browse creator profiles</li>
           <li>Start connecting with creators</li>`
      }
    </ol>
    ${button("Go to Dashboard", `${APP_URL}/dashboard`)}
  `);

  return send({ to, subject: `Welcome to CreatorHub, ${name}!`, html });
}

export async function sendApplicationReceivedEmail(params: {
  to: string;
  brandName: string;
  creatorName: string;
  campaignTitle: string;
  campaignSlug: string;
}) {
  const html = layout(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">New Application Received</h2>
    <p style="color:#52525b;font-size:15px;line-height:1.6;">
      Hi ${params.brandName},<br/><br/>
      <strong>${params.creatorName}</strong> has applied to your campaign <strong>"${params.campaignTitle}"</strong>.
    </p>
    <p style="color:#52525b;font-size:15px;line-height:1.6;">
      Review their application and profile to decide if they're a good fit.
    </p>
    ${button("Review Application", `${APP_URL}/campaigns/${params.campaignSlug}`)}
  `);

  return send({ to: params.to, subject: `New application for "${params.campaignTitle}"`, html });
}

export async function sendApplicationStatusEmail(params: {
  to: string;
  creatorName: string;
  campaignTitle: string;
  status: "ACCEPTED" | "REJECTED";
  reason?: string;
}) {
  const accepted = params.status === "ACCEPTED";

  const html = layout(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">
      Application ${accepted ? "Accepted! 🎉" : "Update"}
    </h2>
    <p style="color:#52525b;font-size:15px;line-height:1.6;">
      Hi ${params.creatorName},<br/><br/>
      Your application for <strong>"${params.campaignTitle}"</strong> has been 
      <strong style="color:${accepted ? '#059669' : '#dc2626'}">${accepted ? 'accepted' : 'declined'}</strong>.
    </p>
    ${!accepted && params.reason ? `<p style="color:#52525b;font-size:15px;line-height:1.6;">Reason: ${params.reason}</p>` : ""}
    ${accepted
      ? `<p style="color:#52525b;font-size:15px;line-height:1.6;">The brand will reach out to discuss deal terms. Check your deals page for updates.</p>
         ${button("View Your Deals", `${APP_URL}/deals`)}`
      : `<p style="color:#52525b;font-size:15px;line-height:1.6;">Don't worry — there are plenty more campaigns waiting for creators like you!</p>
         ${button("Browse Campaigns", `${APP_URL}/explore`)}`
    }
  `);

  return send({
    to: params.to,
    subject: accepted
      ? `You've been accepted for "${params.campaignTitle}"!`
      : `Application update for "${params.campaignTitle}"`,
    html,
  });
}

export async function sendPaymentReceiptEmail(params: {
  to: string;
  creatorName: string;
  amount: number;
  currency: string;
  campaignTitle: string;
  dealId: string;
  platformFee: number;
  netAmount: number;
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: params.currency }).format(n);

  const html = layout(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Payment Received! 💰</h2>
    <p style="color:#52525b;font-size:15px;line-height:1.6;">
      Hi ${params.creatorName},<br/><br/>
      You've received a payment for <strong>"${params.campaignTitle}"</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:14px;">Total Amount</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;color:#18181b;font-size:14px;font-weight:600;text-align:right;">${fmt(params.amount)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:14px;">Platform Fee (12%)</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;color:#dc2626;font-size:14px;text-align:right;">-${fmt(params.platformFee)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#71717a;font-size:14px;font-weight:600;">You Receive</td>
        <td style="padding:12px 16px;color:#059669;font-size:16px;font-weight:700;text-align:right;">${fmt(params.netAmount)}</td>
      </tr>
    </table>
    <p style="color:#52525b;font-size:15px;line-height:1.6;">
      Funds will be deposited to your connected bank account within 2-5 business days.
    </p>
    ${button("View Deal Details", `${APP_URL}/deals`)}
  `);

  return send({
    to: params.to,
    subject: `Payment of ${fmt(params.amount)} received for "${params.campaignTitle}"`,
    html,
  });
}

export async function sendDealStatusEmail(params: {
  to: string;
  recipientName: string;
  campaignTitle: string;
  dealId: string;
  newStatus: string;
  message?: string;
}) {
  const statusLabels: Record<string, string> = {
    CONTRACTED: "Deal Contracted",
    IN_PROGRESS: "Work Started",
    DELIVERED: "Deliverables Submitted",
    REVISION: "Revision Requested",
    COMPLETED: "Deal Completed",
    CANCELLED: "Deal Cancelled",
    DISPUTED: "Deal Disputed",
  };

  const statusLabel = statusLabels[params.newStatus] || params.newStatus;

  const html = layout(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Deal Update: ${statusLabel}</h2>
    <p style="color:#52525b;font-size:15px;line-height:1.6;">
      Hi ${params.recipientName},<br/><br/>
      The deal for <strong>"${params.campaignTitle}"</strong> has been updated to <strong>${statusLabel}</strong>.
    </p>
    ${params.message ? `<p style="color:#52525b;font-size:15px;line-height:1.6;background:#f4f4f5;padding:16px;border-radius:8px;">${params.message}</p>` : ""}
    ${button("View Deal", `${APP_URL}/deals`)}
  `);

  return send({
    to: params.to,
    subject: `Deal Update: ${statusLabel} — "${params.campaignTitle}"`,
    html,
  });
}

export async function sendNewMessageEmail(params: {
  to: string;
  recipientName: string;
  senderName: string;
  preview: string;
}) {
  const html = layout(`
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">New Message from ${params.senderName}</h2>
    <p style="color:#52525b;font-size:15px;line-height:1.6;">
      Hi ${params.recipientName},<br/><br/>
      You have a new message:
    </p>
    <div style="background:#f4f4f5;padding:16px 20px;border-radius:8px;border-left:4px solid #7c3aed;margin:16px 0;">
      <p style="margin:0;color:#3f3f46;font-size:14px;line-height:1.6;font-style:italic;">
        "${params.preview.slice(0, 200)}${params.preview.length > 200 ? '...' : ''}"
      </p>
      <p style="margin:8px 0 0;color:#7c3aed;font-size:13px;font-weight:600;">— ${params.senderName}</p>
    </div>
    ${button("Reply Now", `${APP_URL}/messages`)}
  `);

  return send({
    to: params.to,
    subject: `New message from ${params.senderName}`,
    html,
  });
}
