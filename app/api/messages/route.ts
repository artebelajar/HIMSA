import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from "@/lib/api-utils";

const sendMessageSchema = z.object({
  content: z.string().min(1, "Pesan tidak boleh kosong").max(2000),
  reply_to_id: z.string().uuid().optional().nullable(),
  sender_id: z.string().uuid(),
  sender_name: z.string(),
  sender_avatar: z.string().nullable().optional(),
});

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const before = searchParams.get("before");

    // Ambil semua pesan (tidak filter reply_to_id)
    let query = supabase
      .from("messages")
      .select(`id, content, sender_id, sender_name, sender_avatar, reply_to_id, created_at, updated_at`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;
    if (error) return errorResponse(error.message, "DB_ERROR", 500);

    const messages = data || [];

    // Hitung reply count untuk setiap pesan
    const messageIds = messages.map(m => m.id);
    const { data: replyCounts } = await supabase
      .from("messages")
      .select("reply_to_id")
      .in("reply_to_id", messageIds);

    const replyCountMap: Record<string, number> = {};
    replyCounts?.forEach(r => {
      if (r.reply_to_id) replyCountMap[r.reply_to_id] = (replyCountMap[r.reply_to_id] || 0) + 1;
    });

    // Ambil reactions
    const { data: reactions } = await supabase
      .from("message_reactions")
      .select("message_id, emoji, user_id")
      .in("message_id", messageIds);

    const reactionsMap: Record<string, Record<string, { count: number; users: string[] }>> = {};
    reactions?.forEach(r => {
      if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = {};
      if (!reactionsMap[r.message_id][r.emoji]) reactionsMap[r.message_id][r.emoji] = { count: 0, users: [] };
      reactionsMap[r.message_id][r.emoji].count++;
      reactionsMap[r.message_id][r.emoji].users.push(r.user_id);
    });

    const messagesWithData = messages.map(msg => ({
      ...msg,
      reply_count: replyCountMap[msg.id] || 0,
      reactions: reactionsMap[msg.id] || {},
    }));

    return successResponse({
      messages: messagesWithData.reverse(),
      hasMore: messages.length === limit,
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
    if (!validation.success) return validationErrorResponse(validation.error);

    const { content, reply_to_id, sender_id, sender_name, sender_avatar } = validation.data;

    const { data, error } = await supabase
      .from("messages")
      .insert([{ content, reply_to_id, sender_id, sender_name, sender_avatar }])
      .select()
      .single();

    if (error) return errorResponse(error.message, "SEND_ERROR", 500);
    return successResponse(data, "Pesan terkirim", 201);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { action } = body;

    if (action === "update") {
      const { id, content } = body;
      const { data, error } = await supabase
        .from("messages")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return errorResponse(error.message, "UPDATE_ERROR", 500);
      return successResponse(data, "Pesan diperbarui");
    }

    if (action === "toggle_reaction") {
      const { message_id, user_id, emoji } = body;
      const { data: existing } = await supabase
        .from("message_reactions")
        .select("id")
        .eq("message_id", message_id)
        .eq("user_id", user_id)
        .eq("emoji", emoji)
        .single();

      if (existing) {
        await supabase.from("message_reactions").delete().eq("id", existing.id);
        return successResponse({ added: false }, "Reaksi dihapus");
      } else {
        await supabase.from("message_reactions").insert([{ message_id, user_id, emoji }]);
        return successResponse({ added: true }, "Reaksi ditambah");
      }
    }

    return errorResponse("Invalid action", "INVALID_ACTION", 400);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) return errorResponse("Message ID required", "MISSING_ID", 400);

    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) return errorResponse(error.message, "DELETE_ERROR", 500);
    return successResponse(null, "Pesan dihapus");
  } catch (error) {
    return serverErrorResponse(error);
  }
}