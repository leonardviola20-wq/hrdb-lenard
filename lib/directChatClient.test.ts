import assert from "node:assert/strict";
import test from "node:test";
import { ChatApiError, isChatAuthenticationError, requestChatJson } from "./directChatClient";

test("preserves unauthorized status from chat APIs", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json(
    { error: "Not authenticated" },
    { status: 401 },
  ));

  await assert.rejects(requestChatJson("/api/chat/presence"), (error: unknown) => {
    assert.ok(error instanceof ChatApiError);
    assert.equal(error.status, 401);
    assert.equal(isChatAuthenticationError(error), true);
    return true;
  });
});

test("preserves non-authentication failures for normal retry behavior", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json(
    { error: "Service unavailable" },
    { status: 503 },
  ));

  await assert.rejects(requestChatJson("/api/chat/messages/inbox"), (error: unknown) => {
    assert.ok(error instanceof ChatApiError);
    assert.equal(error.status, 503);
    assert.equal(isChatAuthenticationError(error), false);
    assert.equal(error.message, "Service unavailable");
    return true;
  });
});

test("preserves unauthorized status when the response body is unreadable", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("Not JSON", { status: 401 }));

  await assert.rejects(requestChatJson("/api/chat/presence"), (error: unknown) => {
    assert.ok(error instanceof ChatApiError);
    assert.equal(error.status, 401);
    assert.equal(isChatAuthenticationError(error), true);
    return true;
  });
});
