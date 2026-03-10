// CreatorHub — Conversation API
// GET   /api/messages/[userId] — Get messages with a specific user
// PATCH /api/messages/[userId] — Mark conversation as read

import { NextRequest } from "next/server";
import { prisma } from "@creatorhub/database";
import {
  apiSuccess,
  requireAuthUser,
  getPagination,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";

interface RouteParams {
  params: { userId: string };
}

// ----------------------------------------
// GET /api/messages/[userId] — Messages in conversation
// ----------------------------------------
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuthUser();
    const otherUserId = params.userId;
    const { page, pageSize, skip } = getPagination(req);

    const where = {
      OR: [
        { senderId: user.dbId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: user.dbId },
      ],
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.message.count({ where }),
    ]);

    return paginatedResponse(messages, total, { page, pageSize, skip });
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// PATCH /api/messages/[userId] — Mark all as read
// ----------------------------------------
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuthUser();
    const otherUserId = params.userId;

    // Mark messages FROM the other user TO me as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: user.dbId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return apiSuccess({ message: "Conversation marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}
