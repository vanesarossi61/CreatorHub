// CreatorHub — Messages API
// GET  /api/messages  — List conversations (grouped by other user)
// POST /api/messages  — Send a new message

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@creatorhub/database";
import {
  apiSuccess,
  apiCreated,
  requireAuthUser,
  handleApiError,
  parseBody,
} from "@/lib/api-helpers";

// ----------------------------------------
// GET /api/messages — Conversation list
// ----------------------------------------
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser();

    // Get all unique conversations where user is sender or receiver
    // Group by the "other" user and return latest message + unread count
    const conversations = await prisma.$queryRaw`
      WITH user_messages AS (
        SELECT
          m.*,
          CASE
            WHEN m.sender_id = ${user.dbId} THEN m.receiver_id
            ELSE m.sender_id
          END AS other_user_id
        FROM messages m
        WHERE m.sender_id = ${user.dbId} OR m.receiver_id = ${user.dbId}
      ),
      ranked AS (
        SELECT
          um.*,
          ROW_NUMBER() OVER (
            PARTITION BY um.other_user_id
            ORDER BY um.created_at DESC
          ) AS rn
        FROM user_messages um
      )
      SELECT
        r.other_user_id AS "otherUserId",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.avatar_url AS "avatarUrl",
        u.type AS "userType",
        r.body AS "lastMessageBody",
        r.created_at AS "lastMessageAt",
        r.is_read AS "lastMessageRead",
        (
          SELECT COUNT(*)
          FROM user_messages um2
          WHERE um2.other_user_id = r.other_user_id
            AND um2.sender_id != ${user.dbId}
            AND um2.is_read = false
        )::int AS "unreadCount"
      FROM ranked r
      JOIN users u ON u.id = r.other_user_id
      WHERE r.rn = 1
      ORDER BY r.created_at DESC
    ` as any[];

    const formatted = conversations.map((c: any) => ({
      id: c.otherUserId,
      otherUser: {
        id: c.otherUserId,
        name: [c.firstName, c.lastName].filter(Boolean).join(" ") || "Usuario",
        avatarUrl: c.avatarUrl,
        type: c.userType,
      },
      lastMessage: c.lastMessageBody
        ? {
            body: c.lastMessageBody,
            createdAt: c.lastMessageAt,
            isRead: c.lastMessageRead,
          }
        : null,
      unreadCount: c.unreadCount || 0,
    }));

    return apiSuccess(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// POST /api/messages — Send message
// ----------------------------------------

const sendMessageSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().min(1).max(5000),
  attachmentKeys: z.array(z.string()).max(5).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const data = await parseBody(req, sendMessageSchema);

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: data.recipientId },
      select: { id: true },
    });

    if (!recipient) {
      return new Response(
        JSON.stringify({ success: false, error: "Recipient not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Can't message yourself
    if (data.recipientId === user.dbId) {
      return new Response(
        JSON.stringify({ success: false, error: "Cannot message yourself" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.dbId,
        receiverId: data.recipientId,
        body: data.body,
        attachmentKeys: data.attachmentKeys || [],
      },
    });

    // Create notification for recipient
    const senderName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Alguien";
    await prisma.notification.create({
      data: {
        userId: data.recipientId,
        type: "NEW_MESSAGE",
        title: "Nuevo mensaje",
        body: `${senderName} te envio un mensaje`,
        data: { senderId: user.dbId, messageId: message.id },
      },
    });

    return apiCreated(message);
  } catch (error) {
    return handleApiError(error);
  }
}
