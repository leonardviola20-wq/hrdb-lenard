import { NextResponse, type NextRequest } from "next/server";
import {
  getAuthorizedChatUser,
} from "@/lib/chatApi";
import {
  directChatStore,
  MAX_CHAT_INBOX_BATCH_SIZE,
} from "@/lib/directChatStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = getAuthorizedChatUser(req);
  if ("response" in auth) return auth.response;

  const requestedCursor = req.nextUrl.searchParams.get("after");
  const cursor = requestedCursor === null ? null : Number(requestedCursor);
  if (cursor !== null && (!Number.isSafeInteger(cursor) || cursor < 0)) {
    return NextResponse.json({ error: "A valid inbox cursor is required" }, { status: 400 });
  }

  try {
    const inbox = directChatStore.getInbox(auth.userId, cursor);
    return NextResponse.json({
      ...inbox,
      batchSize: MAX_CHAT_INBOX_BATCH_SIZE,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Load direct message inbox error:", error);
    return NextResponse.json({ error: "Unable to load new messages" }, { status: 500 });
  }
}
