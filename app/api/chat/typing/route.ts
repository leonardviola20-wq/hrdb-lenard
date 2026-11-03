import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  CHAT_PUBLIC_ID_PATTERN,
  directChatErrorResponse,
  getAuthorizedChatUser,
  isJsonRecord,
  readChatJsonBody,
} from "@/lib/chatApi";
import { directChatStore } from "@/lib/directChatStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = getAuthorizedChatUser(req);
  if ("response" in auth) return auth.response;

  const otherUserId = req.nextUrl.searchParams.get("with");
  if (!otherUserId || !CHAT_PUBLIC_ID_PATTERN.test(otherUserId)) {
    return NextResponse.json({ error: "A valid conversation is required" }, { status: 400 });
  }

  try {
    const result = directChatStore.getTypingStatus(auth.userId, otherUserId);
    if (!result.ok) return directChatErrorResponse(result.error);
    return NextResponse.json({ isTyping: result.value }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Load chat typing status error:", error);
    return NextResponse.json({ error: "Unable to load typing status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = getAuthorizedChatUser(req);
  if ("response" in auth) return auth.response;

  const parsed = await readChatJsonBody(req);
  if ("response" in parsed) return parsed.response;
  if (
    !isJsonRecord(parsed.body) ||
    typeof parsed.body.recipientId !== "string" ||
    !CHAT_PUBLIC_ID_PATTERN.test(parsed.body.recipientId) ||
    typeof parsed.body.isTyping !== "boolean"
  ) {
    return NextResponse.json({ error: "A valid recipient and typing status are required" }, { status: 400 });
  }

  const rateLimit = checkRateLimit(`chat:typing:${auth.userId}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Typing status is updating too frequently" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const result = directChatStore.setTypingStatus(auth.userId, parsed.body.recipientId, parsed.body.isTyping);
    if (!result.ok) return directChatErrorResponse(result.error);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Update chat typing status error:", error);
    return NextResponse.json({ error: "Unable to update typing status" }, { status: 500 });
  }
}
