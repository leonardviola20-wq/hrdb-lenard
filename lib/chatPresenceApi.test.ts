import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { DELETE, POST as updatePresence } from "../app/api/chat/presence/route";
import { GET as getMessages, POST as sendMessage } from "../app/api/chat/messages/route";
import { GET as getInbox } from "../app/api/chat/messages/inbox/route";
import { POST as toggleMessageReaction } from "../app/api/chat/messages/reactions/route";
import { GET as getTypingStatus, POST as updateTypingStatus } from "../app/api/chat/typing/route";
import { directChatStore } from "./directChatStore";

const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "chat-presence-api-tests-only";
const testUserId = 987_654_322;
const sessionId = "00000000-0000-4000-8000-000000000123";

after(() => {
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

function createRequest(
  method: string,
  session: { accessiblePages: string[] },
  body?: unknown,
  path = "/api/chat/presence",
  userId = testUserId,
) {
  const token = jwt.sign(
    { id: userId, role: "USER", accessiblePages: session.accessiblePages },
    process.env.JWT_SECRET!,
  );
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      cookie: `token=${token}`,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("chat presence API", () => {
  it("rejects unauthenticated presence requests", async () => {
    const response = await updatePresence(new NextRequest("http://localhost/api/chat/presence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "heartbeat", sessionId }),
    }));

    assert.equal(response.status, 401);
  });

  it("registers and removes a signed-in app session", async () => {
    const response = await updatePresence(createRequest(
      "POST",
      { accessiblePages: ["/chat"] },
      { action: "heartbeat", sessionId },
    ));

    assert.ok(response);
    assert.equal(response.status, 204);

    const cleanup = await DELETE(createRequest(
      "DELETE",
      { accessiblePages: ["/chat"] },
      { sessionId },
    ));
    assert.ok(cleanup);
    assert.equal(cleanup.status, 204);
  });

  it("allows users without chat permission and rejects invalid sessions", async () => {
    const response = await updatePresence(createRequest(
      "POST",
      { accessiblePages: ["/tasks"] },
      { action: "heartbeat", sessionId },
    ));
    assert.ok(response);
    assert.equal(response.status, 204);

    const cleanup = await DELETE(createRequest(
      "DELETE",
      { accessiblePages: ["/tasks"] },
      { sessionId },
    ));
    assert.equal(cleanup.status, 204);

    const invalid = await updatePresence(createRequest(
      "POST",
      { accessiblePages: ["/chat"] },
      { action: "heartbeat", sessionId: "not-a-session" },
    ));
    assert.ok(invalid);
    assert.equal(invalid.status, 400);
  });

  it("allows authenticated users without chat permission and validates conversation input", async () => {
    const missingConversation = await getMessages(createRequest(
      "GET",
      { accessiblePages: ["/tasks"] },
      undefined,
      "/api/chat/messages?with=00000000-0000-4000-8000-000000000123",
    ));
    assert.equal(missingConversation.status, 404);

    const invalidMessage = await sendMessage(createRequest(
      "POST",
      { accessiblePages: ["/chat"] },
      { recipientId: "00000000-0000-4000-8000-000000000123", text: " " },
      "/api/chat/messages",
    ));
    assert.equal(invalidMessage.status, 400);
  });

  it("authenticates inbox polling and validates the sequence cursor", async () => {
    const unauthenticated = await getInbox(new NextRequest("http://localhost/api/chat/messages/inbox"));
    assert.equal(unauthenticated.status, 401);

    const invalidCursor = await getInbox(createRequest(
      "GET",
      { accessiblePages: ["/tasks"] },
      undefined,
      "/api/chat/messages/inbox?after=not-a-number",
    ));
    assert.equal(invalidCursor.status, 400);

    const initialInbox = await getInbox(createRequest(
      "GET",
      { accessiblePages: ["/tasks"] },
      undefined,
      "/api/chat/messages/inbox",
    ));
    assert.equal(initialInbox.status, 200);
    const payload = await initialInbox.json() as { messages?: unknown[]; nextCursor?: unknown };
    assert.deepEqual(payload.messages, []);
    assert.equal(typeof payload.nextCursor, "number");
  });

  it("authenticates reaction toggles and limits them to conversation participants", async () => {
    const senderId = testUserId + 20;
    const recipientId = testUserId + 21;
    const outsiderId = testUserId + 22;
    const senderSessionId = "00000000-0000-4000-8000-000000000126";
    const recipientSessionId = "00000000-0000-4000-8000-000000000127";
    const outsiderSessionId = "00000000-0000-4000-8000-000000000128";
    const sender = directChatStore.heartbeat(senderId, senderSessionId);
    const recipient = directChatStore.heartbeat(recipientId, recipientSessionId);
    const outsider = directChatStore.heartbeat(outsiderId, outsiderSessionId);
    assert.equal(sender.ok, true);
    assert.equal(recipient.ok, true);
    assert.equal(outsider.ok, true);
    if (!sender.ok || !recipient.ok || !outsider.ok) return;

    const sent = directChatStore.sendMessage(senderId, recipient.value.id, "Sender", "React here");
    assert.equal(sent.ok, true);
    if (!sent.ok) return;

    const unauthenticated = await toggleMessageReaction(new NextRequest(
      "http://localhost/api/chat/messages/reactions",
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messageId: sent.value.id, emoji: "👍" }) },
    ));
    assert.equal(unauthenticated.status, 401);

    const invalidEmoji = await toggleMessageReaction(createRequest(
      "POST",
      { accessiblePages: [] },
      { messageId: sent.value.id, emoji: "text" },
      "/api/chat/messages/reactions",
      senderId,
    ));
    assert.equal(invalidEmoji.status, 400);

    const forbiddenParticipant = await toggleMessageReaction(createRequest(
      "POST",
      { accessiblePages: [] },
      { messageId: sent.value.id, emoji: "🎉" },
      "/api/chat/messages/reactions",
      outsiderId,
    ));
    assert.equal(forbiddenParticipant.status, 404);

    const senderReaction = await toggleMessageReaction(createRequest(
      "POST",
      { accessiblePages: [] },
      { messageId: sent.value.id, emoji: "👍" },
      "/api/chat/messages/reactions",
      senderId,
    ));
    assert.equal(senderReaction.status, 200);

    const recipientReaction = await toggleMessageReaction(createRequest(
      "POST",
      { accessiblePages: [] },
      { messageId: sent.value.id, emoji: "👍" },
      "/api/chat/messages/reactions",
      recipientId,
    ));
    assert.equal(recipientReaction.status, 200);

    const removedSenderReaction = await toggleMessageReaction(createRequest(
      "POST",
      { accessiblePages: [] },
      { messageId: sent.value.id, emoji: "👍" },
      "/api/chat/messages/reactions",
      senderId,
    ));
    assert.equal(removedSenderReaction.status, 200);
    const payload = await removedSenderReaction.json() as { message?: { reactions?: Array<{ emoji: string; userIds: string[] }> } };
    assert.deepEqual(payload.message?.reactions, [{ emoji: "👍", userIds: [recipient.value.id] }]);

    directChatStore.leave(senderId, senderSessionId);
    directChatStore.leave(recipientId, recipientSessionId);
    directChatStore.leave(outsiderId, outsiderSessionId);
  });

  it("authenticates, validates, and scopes typing status to a direct conversation", async () => {
    const senderId = testUserId + 10;
    const recipientId = testUserId + 11;
    const senderSessionId = "00000000-0000-4000-8000-000000000124";
    const recipientSessionId = "00000000-0000-4000-8000-000000000125";
    const sender = directChatStore.heartbeat(senderId, senderSessionId);
    const recipient = directChatStore.heartbeat(recipientId, recipientSessionId);
    assert.equal(sender.ok, true);
    assert.equal(recipient.ok, true);
    if (!sender.ok || !recipient.ok) return;

    const unauthorized = await getTypingStatus(new NextRequest(
      `http://localhost/api/chat/typing?with=${sender.value.id}`,
    ));
    assert.equal(unauthorized.status, 401);

    const invalid = await updateTypingStatus(createRequest(
      "POST",
      { accessiblePages: ["/tasks"] },
      { recipientId: recipient.value.id, isTyping: "yes" },
      "/api/chat/typing",
      senderId,
    ));
    assert.equal(invalid.status, 400);

    const typing = await updateTypingStatus(createRequest(
      "POST",
      { accessiblePages: ["/tasks"] },
      { recipientId: recipient.value.id, isTyping: true },
      "/api/chat/typing",
      senderId,
    ));
    assert.equal(typing.status, 204);

    const status = await getTypingStatus(createRequest(
      "GET",
      { accessiblePages: ["/tasks"] },
      undefined,
      `/api/chat/typing?with=${sender.value.id}`,
      recipientId,
    ));
    assert.equal(status.status, 200);
    assert.deepEqual(await status.json(), { isTyping: true });

    const cleared = await updateTypingStatus(createRequest(
      "POST",
      { accessiblePages: ["/tasks"] },
      { recipientId: recipient.value.id, isTyping: false },
      "/api/chat/typing",
      senderId,
    ));
    assert.equal(cleared.status, 204);
    const clearedStatus = await getTypingStatus(createRequest(
      "GET",
      { accessiblePages: ["/tasks"] },
      undefined,
      `/api/chat/typing?with=${sender.value.id}`,
      recipientId,
    ));
    assert.deepEqual(await clearedStatus.json(), { isTyping: false });

    directChatStore.leave(senderId, senderSessionId);
    directChatStore.leave(recipientId, recipientSessionId);
  });
});
