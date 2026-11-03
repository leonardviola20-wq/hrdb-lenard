import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  CHAT_PUBLIC_ID_PATTERN,
  directChatErrorResponse,
  getAuthorizedChatUser,
  isJsonRecord,
  readChatJsonBody,
} from "@/lib/chatApi";
import { directChatStore, MAX_DIRECT_MESSAGE_LENGTH } from "@/lib/directChatStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = getAuthorizedChatUser(req);
  if ("response" in auth) return auth.response;

  const otherUserId = req.nextUrl.searchParams.get("with");
  if (!otherUserId || !CHAT_PUBLIC_ID_PATTERN.test(otherUserId)) {
    return NextResponse.json({ error: "A valid conversation is required" }, { status: 400 });
  }

  try {
    const result = directChatStore.getConversation(auth.userId, otherUserId);
    if (!result.ok) return directChatErrorResponse(result.error);
    return NextResponse.json({ messages: result.value }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Load direct messages error:", error);
    return NextResponse.json({ error: "Unable to load this conversation" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = getAuthorizedChatUser(req);
  if ("response" in auth) return auth.response;

  const parsed = await readChatJsonBody(req);
  if ("response" in parsed) return parsed.response;
  const recipientId = isJsonRecord(parsed.body) ? parsed.body.recipientId : null;
  const requestedText = isJsonRecord(parsed.body) ? parsed.body.text : null;
  if (
    typeof recipientId !== "string" ||
    !CHAT_PUBLIC_ID_PATTERN.test(recipientId) ||
    typeof requestedText !== "string"
  ) {
    return NextResponse.json({ error: "A valid recipient and message are required" }, { status: 400 });
  }

  const text = requestedText.trim();
  if (!text || text.length > MAX_DIRECT_MESSAGE_LENGTH || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) {
    return NextResponse.json(
      { error: `Messages must be between 1 and ${MAX_DIRECT_MESSAGE_LENGTH} characters` },
      { status: 400 },
    );
  }

  const rateLimit = checkRateLimit(`chat:message:${auth.userId}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many messages. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const recipientUserId = directChatStore.resolvePublicUserId(recipientId);
    if (recipientUserId === undefined || recipientUserId === auth.userId) {
      return directChatErrorResponse("recipient-not-found");
    }

    const [sender, recipient] = await Promise.all([
      prisma.user.findUnique({
        where: { id: auth.userId },
        select: { name: true, username: true },
      }),
      prisma.user.findUnique({
        where: { id: recipientUserId },
        select: { id: true },
      }),
    ]);

    if (!sender || !recipient) {
      return directChatErrorResponse("recipient-not-found");
    }

    const result = directChatStore.sendMessage(
      auth.userId,
      recipientId,
      sender.name?.trim() || sender.username?.trim() || "User",
      text,
    );
    if (!result.ok) return directChatErrorResponse(result.error);
    return NextResponse.json({ message: result.value }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Send direct message error:", error);
    return NextResponse.json({ error: "Unable to send this message" }, { status: 500 });
  }
}
