import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-utils";

const sendMessageSchema = z.object({
  content: z.string().min(1, "Pesan tidak boleh kosong").max(2000),
  reply_to_id: z.string().uuid().optional().nullable(),
  sender_id: z.string().uuid(),
  sender_name: z.string(),
  sender_avatar: z.string().nullable().optional(),
});

const addReactionSchema = z.object({
  message_id: z.string().uuid(),
  user_id: z.string().uuid(),
  emoji: z.string().max(10),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before");
    const replyTo = searchParams.get("replyTo");

    let query = supabase
      .from("messages")
      .select(
        `
        id,
        content,
        sender_id,
        sender_name,
        sender_avatar,
        reply_to_id,
        created_at,
        reactions:message_reactions(emoji, user_id)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    if (replyTo) {
      query = query.eq("reply_to_id", replyTo);
    } else {
      query = query.is("reply_to_id", null);
    }

    const { data, error } = await query;

    if (error) return errorResponse(error.message, "DB_ERROR", 500);

    // Group reactions by emoji
    const messagesWithGroupedReactions =
      data?.map((msg) => {
        const reactions: Record<string, { count: number; users: string[] }> =
          {};
        msg.reactions?.forEach((r: any) => {
          if (!reactions[r.emoji]) {
            reactions[r.emoji] = { count: 0, users: [] };
          }
          reactions[r.emoji].count++;
          reactions[r.emoji].users.push(r.user_id);
        });
        return { ...msg, reactions };
      }) || [];

    return successResponse({
      messages: messagesWithGroupedReactions.reverse(),
      hasMore: (data?.length || 0) === limit,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const validation = sendMessageSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { content, reply_to_id, sender_id, sender_name, sender_avatar } =
      validation.data;

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          content,
          reply_to_id: reply_to_id || null,
          sender_id,
          sender_name,
          sender_avatar: sender_avatar || null,
        },
      ])
      .select(
        `
        id,
        content,
        sender_id,
        sender_name,
        sender_avatar,
        reply_to_id,
        created_at
      `,
      )
      .single();

    if (error) return errorResponse(error.message, "SEND_ERROR", 500);

    return successResponse(data, "Pesan terkirim", 201);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id) {
      return errorResponse("Message ID required", "MISSING_ID", 400);
    }

    // Check ownership
    const { data: message } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("id", id)
      .single();

    if (!message) {
      return errorResponse("Message not found", "NOT_FOUND", 404);
    }

    // Get user role
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (message.sender_id !== userId && user?.role !== "admin") {
      return errorResponse("Cannot delete this message", "FORBIDDEN", 403);
    }

    const { error } = await supabase.from("messages").delete().eq("id", id);

    if (error) return errorResponse(error.message, "DELETE_ERROR", 500);

    return successResponse(null, "Pesan dihapus");
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// Reactions
export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { action } = body;

    if (action === "toggle_reaction") {
      const validation = addReactionSchema.safeParse(body);
      if (!validation.success) {
        return validationErrorResponse(validation.error);
      }

      const { message_id, user_id, emoji } = validation.data;

      // Check if already reacted
      const { data: existing } = await supabase
        .from("message_reactions")
        .select("id")
        .eq("message_id", message_id)
        .eq("user_id", user_id)
        .eq("emoji", emoji)
        .single();

      if (existing) {
        // Remove reaction
        await supabase.from("message_reactions").delete().eq("id", existing.id);

        return successResponse({ added: false }, "Reaction removed");
      } else {
        // Add reaction
        await supabase
          .from("message_reactions")
          .insert([{ message_id, user_id, emoji }]);

        return successResponse({ added: true }, "Reaction added");
      }
    }

    // Di bagian PUT, tambahkan action 'update'
    if (action === "update") {
      const { id, content, user_id } = body;

      // Check ownership
      const { data: message } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("id", id)
        .single();

      if (!message) {
        return errorResponse("Message not found", "NOT_FOUND", 404);
      }

      if (message.sender_id !== user_id) {
        return errorResponse("Cannot edit this message", "FORBIDDEN", 403);
      }

      const { data, error } = await supabase
        .from("messages")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) return errorResponse(error.message, "UPDATE_ERROR", 500);

      return successResponse(data, "Pesan diperbarui");
    }

    return errorResponse("Invalid action", "INVALID_ACTION", 400);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
