import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  CHAT_PUBLIC_ID_PATTERN,
  directChatErrorResponse,
  getAuthorizedChatUser,
  isJsonRecord,
  readChatJsonBody,
} from "@/lib/chatApi";
import { directChatStore, isChatEmoji } from "@/lib/directChatStore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = getAuthorizedChatUser(req);
  if ("response" in auth) return auth.response;

  const parsed = await readChatJsonBody(req);
  if ("response" in parsed) return parsed.response;
  if (
    !isJsonRecord(parsed.body) ||
    typeof parsed.body.messageId !== "string" ||
    !CHAT_PUBLIC_ID_PATTERN.test(parsed.body.messageId) ||
    typeof parsed.body.emoji !== "string" ||
    !isChatEmoji(parsed.body.emoji)
  ) {
    return NextResponse.json({ error: "A valid message and single emoji reaction are required" }, { status: 400 });
  }

  const rateLimit = checkRateLimit(`chat:reaction:${auth.userId}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many reactions. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const result = directChatStore.toggleReaction(auth.userId, parsed.body.messageId, parsed.body.emoji);
    if (!result.ok) return directChatErrorResponse(result.error);
    return NextResponse.json(
      { message: result.value },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Update direct message reaction error:", error);
    return NextResponse.json({ error: "Unable to update this reaction" }, { status: 500 });
  }
}
