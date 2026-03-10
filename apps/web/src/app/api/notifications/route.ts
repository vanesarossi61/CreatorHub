// CreatorHub — Notifications API
// GET   /api/notifications           — List notifications (paginated)
// PATCH /api/notifications           — Mark all as read

import { NextRequest } from "next/server";
import { prisma } from "@creatorhub/database";
import {
  apiSuccess,
  requireAuthUser,
  getPagination,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";

// ----------------------------------------
// GET /api/notifications
// ----------------------------------------
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const { page, pageSize, skip } = getPagination(req);
    const url = new URL(req.url);

    const isReadParam = url.searchParams.get("isRead");
    const where: any = { userId: user.dbId };

    if (isReadParam === "true") where.isRead = true;
    if (isReadParam === "false") where.isRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return paginatedResponse(notifications, total, { page, pageSize, skip });
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// PATCH /api/notifications — Mark all read
// ----------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuthUser();

    await prisma.notification.updateMany({
      where: { userId: user.dbId, isRead: false },
      data: { isRead: true },
    });

    return apiSuccess({ message: "All notifications marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}
