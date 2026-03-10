// CreatorHub — Admin Deals API
// GET  /api/admin/deals — List all deals with filters + stats
// PATCH /api/admin/deals — Admin actions on deals (cancel, force-complete, etc.)

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@creatorhub/database";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const where: any = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { campaign: { title: { contains: q, mode: "insensitive" } } },
        { creator: { displayName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [deals, total, stats] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          campaign: {
            select: {
              title: true,
              slug: true,
              brand: {
                select: { companyName: true, slug: true },
              },
            },
          },
          creator: {
            select: { displayName: true, slug: true },
          },
          _count: {
            select: { deliverables: true, milestones: true, payouts: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.deal.count({ where }),
      // Aggregate stats
      prisma.deal.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { agreedRate: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: deals,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: stats.map((s) => ({
          status: s.status,
          count: s._count.id,
          totalValue: s._sum.agreedRate,
        })),
      },
    });
  } catch (error: any) {
    console.error("[Admin Deals GET]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { dealId, action, reason } = body;

    if (!dealId || !action) {
      return NextResponse.json(
        { success: false, error: "dealId and action are required" },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "cancel": {
        await prisma.deal.update({
          where: { id: dealId },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason: reason || "Cancelled by admin",
          },
        });
        break;
      }
      case "complete": {
        await prisma.deal.update({
          where: { id: dealId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
        break;
      }
      case "dispute": {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "DISPUTED" },
        });
        break;
      }
      case "resolve": {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
        break;
      }
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: { dealId, action } });
  } catch (error: any) {
    console.error("[Admin Deals PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
