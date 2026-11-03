import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import type { DirectChatError } from "@/lib/directChatStore";

export const CHAT_SESSION_ID_PATTERN = /^[\da-f-]{36}$/i;
export const CHAT_PUBLIC_ID_PATTERN = /^[\da-f-]{36}$/i;

type JsonRecord = Record<string, unknown>;

export function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getAuthorizedChatUser(req: NextRequest):
  | { userId: number }
  | { response: NextResponse } {
  const session = getAuthenticatedSession(req);
  if (!session || typeof session.id !== "number") {
    return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  return { userId: session.id };
}

export async function readChatJsonBody(
  req: NextRequest,
  maximumLength = 4_000,
): Promise<{ body: unknown } | { response: NextResponse }> {
  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maximumLength) {
    return { response: NextResponse.json({ error: "Request is too large" }, { status: 413 }) };
  }

  const text = await req.text();
  if (text.length > maximumLength) {
    return { response: NextResponse.json({ error: "Request is too large" }, { status: 413 }) };
  }
  try {
    const body: unknown = JSON.parse(text);
    return { body };
  } catch {
    return { response: NextResponse.json({ error: "Invalid request body" }, { status: 400 }) };
  }
}

export function directChatErrorResponse(error: DirectChatError) {
  const errors: Record<DirectChatError, { status: number; message: string }> = {
    capacity: { status: 503, message: "Local chat is at capacity. Try again later." },
    "recipient-not-found": { status: 404, message: "That user is not available for chat." },
    "recipient-offline": { status: 409, message: "That user is no longer online." },
    "thread-not-found": { status: 404, message: "That conversation is not available." },
    "invalid-reaction": { status: 400, message: "Choose one valid emoji reaction." },
    "reaction-limit": { status: 409, message: "This message has reached its reaction limit." },
  };
  const { status, message } = errors[error];
  return NextResponse.json({ error: message }, { status });
}
