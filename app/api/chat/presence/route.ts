import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  CHAT_SESSION_ID_PATTERN,
  getAuthorizedChatUser,
  isJsonRecord,
  readChatJsonBody,
} from "@/lib/chatApi";
import { directChatStore } from "@/lib/directChatStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = getAuthorizedChatUser(req);
  if ("response" in auth) return auth.response;

  try {
    const online = directChatStore.listOnline(auth.userId);
    const users = online.length
      ? await prisma.user.findMany({
        where: {
          id: { in: online.map((user) => user.userId) },
        },
        select: { id: true, name: true, username: true, role: true },
      })
      : [];
    const presenceByUserId = new Map(online.map((user) => [user.userId, user.id]));

    return NextResponse.json({
      selfId: directChatStore.getPublicUserId(auth.userId),
      users: users.map((user) => ({
        id: presenceByUserId.get(user.id)!,
        name: user.name?.trim() || user.username?.trim() || "User",
        role: user.role === "ADMIN" ? "ADMIN" : "USER",
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Load chat presence error:", error);
    return NextResponse.json({ error: "Unable to load online users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = getAuthorizedChatUser(req);
  if ("response" in auth) return auth.response;

  const parsed = await readChatJsonBody(req);
  if ("response" in parsed) return parsed.response;
  if (
    !isJsonRecord(parsed.body) ||
    parsed.body.action !== "heartbeat" ||
    typeof parsed.body.sessionId !== "string" ||
    !CHAT_SESSION_ID_PATTERN.test(parsed.body.sessionId)
  ) {
    return NextResponse.json({ error: "A valid chat presence session is required" }, { status: 400 });
  }

  const rateLimit = checkRateLimit(`chat:presence:${auth.userId}:${parsed.body.sessionId}`, 10, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Chat presence is updating too frequently" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const result = directChatStore.heartbeat(auth.userId, parsed.body.sessionId);
    if (!result.ok) {
      return NextResponse.json({ error: "Local chat is at capacity. Try again later." }, { status: 503 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Update chat presence error:", error);
    return NextResponse.json({ error: "Unable to update chat presence" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = getAuthorizedChatUser(req);
  if ("response" in auth) return auth.response;

  const parsed = await readChatJsonBody(req);
  if ("response" in parsed) return parsed.response;
  if (
    !isJsonRecord(parsed.body) ||
    typeof parsed.body.sessionId !== "string" ||
    !CHAT_SESSION_ID_PATTERN.test(parsed.body.sessionId)
  ) {
    return NextResponse.json({ error: "A valid chat presence session is required" }, { status: 400 });
  }

  directChatStore.leave(auth.userId, parsed.body.sessionId);
  return new NextResponse(null, { status: 204 });
}
