import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHAT_PRESENCE_TTL_MS,
  CHAT_THREAD_TTL_MS,
  CHAT_TYPING_TTL_MS,
  DirectChatStore,
  getVersionedDirectChatStore,
  MAX_CHAT_INBOX_BATCH_SIZE,
  MAX_CHAT_MESSAGES_PER_THREAD,
  MAX_CHAT_REACTIONS_PER_MESSAGE,
  isChatEmoji,
} from "./directChatStore";

function createTestStore() {
  let now = 1_000;
  let id = 0;
  const store = new DirectChatStore({
    now: () => now,
    createId: () => `00000000-0000-4000-8000-${String(++id).padStart(12, "0")}`,
  });
  return { store, advanceTime: (milliseconds: number) => { now += milliseconds; } };
}

describe("DirectChatStore", () => {
  it("replaces an incompatible store and preserves a compatible one", () => {
    const staleStore = createTestStore().store;
    assert.equal(staleStore.heartbeat(1, "stale-tab").ok, true);
    const state = {
      __hrdbDirectChatStore: staleStore,
      __hrdbDirectChatStoreVersion: -1,
    };

    const currentStore = getVersionedDirectChatStore(state);
    assert.notStrictEqual(currentStore, staleStore);
    assert.deepEqual(currentStore.listOnline(2), []);

    const compatibleStore = getVersionedDirectChatStore(state);
    assert.strictEqual(compatibleStore, currentStore);
  });

  it("tracks a user across tabs and expires presence after heartbeats stop", () => {
    const { store, advanceTime } = createTestStore();
    const firstTab = store.heartbeat(1, "tab-one");
    const secondTab = store.heartbeat(1, "tab-two");
    assert.equal(firstTab.ok, true);
    assert.equal(secondTab.ok, true);
    if (!firstTab.ok || !secondTab.ok) return;
    assert.equal(firstTab.value.id, secondTab.value.id);

    store.leave(1, "tab-one");
    assert.deepEqual(store.listOnline(2), [{ id: firstTab.value.id, userId: 1 }]);
    advanceTime(CHAT_PRESENCE_TTL_MS + 1);
    assert.deepEqual(store.listOnline(2), []);
  });

  it("routes direct messages to a single conversation and enforces the message cap", () => {
    const { store } = createTestStore();
    const host = store.heartbeat(1, "host-tab");
    const guest = store.heartbeat(2, "guest-tab");
    assert.equal(host.ok, true);
    assert.equal(guest.ok, true);
    if (!host.ok || !guest.ok) return;

    const sent = store.sendMessage(1, guest.value.id, "Host", "Hello");
    assert.equal(sent.ok, true);
    if (!sent.ok) return;

    const hostThread = store.getConversation(1, guest.value.id);
    const guestThread = store.getConversation(2, host.value.id);
    assert.equal(hostThread.ok, true);
    assert.equal(guestThread.ok, true);
    if (!hostThread.ok || !guestThread.ok) return;
    assert.deepEqual(hostThread.value, guestThread.value);
    assert.deepEqual(hostThread.value[0], sent.value);

    for (let index = 0; index < MAX_CHAT_MESSAGES_PER_THREAD + 2; index += 1) {
      assert.equal(store.sendMessage(1, guest.value.id, "Host", `Message ${index}`).ok, true);
    }
    const capped = store.getConversation(2, host.value.id);
    assert.equal(capped.ok, true);
    if (!capped.ok) return;
    assert.equal(capped.value.length, MAX_CHAT_MESSAGES_PER_THREAD);
    assert.equal(capped.value[0].text, "Message 2");
  });

  it("rejects offline, missing, and self recipients", () => {
    const { store } = createTestStore();
    const host = store.heartbeat(1, "host-tab");
    const guest = store.heartbeat(2, "guest-tab");
    assert.equal(host.ok, true);
    assert.equal(guest.ok, true);
    if (!host.ok || !guest.ok) return;

    assert.deepEqual(store.sendMessage(1, "missing-public-id", "Host", "Hello"), {
      ok: false,
      error: "recipient-not-found",
    });
    assert.deepEqual(store.sendMessage(1, host.value.id, "Host", "Hello"), {
      ok: false,
      error: "recipient-not-found",
    });
    store.leave(2, "guest-tab");
    assert.deepEqual(store.sendMessage(1, guest.value.id, "Host", "Hello"), {
      ok: false,
      error: "recipient-offline",
    });
  });

  it("uses a sequence cursor to include new messages without replaying older ones", () => {
    const { store } = createTestStore();
    const firstUser = store.heartbeat(10, "first-tab");
    const secondUser = store.heartbeat(20, "second-tab");
    const thirdUser = store.heartbeat(30, "third-tab");
    assert.equal(firstUser.ok, true);
    assert.equal(secondUser.ok, true);
    assert.equal(thirdUser.ok, true);
    if (!firstUser.ok || !secondUser.ok || !thirdUser.ok) return;

    assert.equal(store.sendMessage(10, secondUser.value.id, "First", "Before opening").ok, true);
    const initialInbox = store.getInbox(20, null);
    assert.deepEqual(initialInbox.messages, []);

    assert.equal(store.sendMessage(10, secondUser.value.id, "First", "First new").ok, true);
    assert.equal(store.sendMessage(10, thirdUser.value.id, "First", "For someone else").ok, true);
    assert.equal(store.sendMessage(30, secondUser.value.id, "Third", "Second new").ok, true);

    const newMessages = store.getInbox(20, initialInbox.nextCursor);
    assert.deepEqual(newMessages.messages.map((message) => message.text), ["First new", "Second new"]);
    assert.equal(newMessages.messages[0].createdAt, newMessages.messages[1].createdAt);
    assert.ok(newMessages.messages[0].sequence < newMessages.messages[1].sequence);
    assert.equal(newMessages.nextCursor, store.getInbox(20, newMessages.nextCursor).nextCursor);
  });

  it("paginates inbox batches without skipping messages", () => {
    const { store } = createTestStore();
    const sender = store.heartbeat(40, "sender-tab");
    const recipient = store.heartbeat(50, "recipient-tab");
    assert.equal(sender.ok, true);
    assert.equal(recipient.ok, true);
    if (!sender.ok || !recipient.ok) return;

    const initialCursor = store.getInbox(50, null).nextCursor;
    for (let index = 0; index < MAX_CHAT_INBOX_BATCH_SIZE + 1; index += 1) {
      assert.equal(store.sendMessage(40, recipient.value.id, "Sender", `Message ${index}`).ok, true);
    }

    const firstBatch = store.getInbox(50, initialCursor);
    assert.equal(firstBatch.messages.length, MAX_CHAT_INBOX_BATCH_SIZE);
    const secondBatch = store.getInbox(50, firstBatch.nextCursor);
    assert.deepEqual(secondBatch.messages.map((message) => message.text), [`Message ${MAX_CHAT_INBOX_BATCH_SIZE}`]);
    assert.deepEqual(store.getInbox(50, secondBatch.nextCursor).messages, []);
  });

  it("shares typing status only with the intended conversation and expires it", () => {
    const { store, advanceTime } = createTestStore();
    const sender = store.heartbeat(60, "typing-sender");
    const recipient = store.heartbeat(70, "typing-recipient");
    assert.equal(sender.ok, true);
    assert.equal(recipient.ok, true);
    if (!sender.ok || !recipient.ok) return;

    assert.deepEqual(store.getTypingStatus(70, sender.value.id), { ok: true, value: false });
    assert.deepEqual(store.setTypingStatus(60, recipient.value.id, true), { ok: true, value: undefined });
    assert.deepEqual(store.getTypingStatus(70, sender.value.id), { ok: true, value: true });
    assert.deepEqual(store.getTypingStatus(80, sender.value.id), { ok: true, value: false });

    assert.deepEqual(store.setTypingStatus(70, sender.value.id, true), { ok: true, value: undefined });
    assert.deepEqual(store.setTypingStatus(60, recipient.value.id, false), { ok: true, value: undefined });
    assert.deepEqual(store.getTypingStatus(70, sender.value.id), { ok: true, value: false });
    assert.deepEqual(store.getTypingStatus(60, recipient.value.id), { ok: true, value: true });

    advanceTime(CHAT_TYPING_TTL_MS);
    assert.deepEqual(store.getTypingStatus(70, sender.value.id), { ok: true, value: false });

    assert.deepEqual(store.setTypingStatus(60, recipient.value.id, true), { ok: true, value: undefined });
    assert.deepEqual(store.setTypingStatus(60, recipient.value.id, false), { ok: true, value: undefined });
    assert.deepEqual(store.getTypingStatus(70, sender.value.id), { ok: true, value: false });
  });

  it("lets both conversation participants toggle multiple message reactions", () => {
    const { store } = createTestStore();
    const sender = store.heartbeat(90, "reaction-sender");
    const recipient = store.heartbeat(91, "reaction-recipient");
    const outsider = store.heartbeat(92, "reaction-outsider");
    assert.equal(sender.ok, true);
    assert.equal(recipient.ok, true);
    assert.equal(outsider.ok, true);
    if (!sender.ok || !recipient.ok || !outsider.ok) return;

    const sent = store.sendMessage(90, recipient.value.id, "Sender", "React to me");
    assert.equal(sent.ok, true);
    if (!sent.ok) return;
    assert.deepEqual(sent.value.reactions, []);

    const senderReaction = store.toggleReaction(90, sent.value.id, "👍");
    assert.equal(senderReaction.ok, true);
    if (!senderReaction.ok) return;
    assert.deepEqual(senderReaction.value.reactions, [{ emoji: "👍", userIds: [sender.value.id] }]);

    const recipientReaction = store.toggleReaction(91, sent.value.id, "👍");
    assert.equal(recipientReaction.ok, true);
    if (!recipientReaction.ok) return;
    assert.deepEqual(recipientReaction.value.reactions, [{
      emoji: "👍",
      userIds: [sender.value.id, recipient.value.id],
    }]);

    const secondEmoji = store.toggleReaction(90, sent.value.id, "😂");
    assert.equal(secondEmoji.ok, true);
    if (!secondEmoji.ok) return;
    assert.equal(secondEmoji.value.reactions.length, 2);

    const removed = store.toggleReaction(90, sent.value.id, "👍");
    assert.equal(removed.ok, true);
    if (!removed.ok) return;
    assert.deepEqual(removed.value.reactions, [
      { emoji: "👍", userIds: [recipient.value.id] },
      { emoji: "😂", userIds: [sender.value.id] },
    ]);

    assert.deepEqual(store.toggleReaction(92, sent.value.id, "🎉"), {
      ok: false,
      error: "thread-not-found",
    });
    assert.deepEqual(store.toggleReaction(90, sent.value.id, "hello"), {
      ok: false,
      error: "invalid-reaction",
    });
  });

  it("validates single emoji graphemes and bounds distinct message reactions", () => {
    const { store } = createTestStore();
    const sender = store.heartbeat(100, "reaction-limit-sender");
    const recipient = store.heartbeat(101, "reaction-limit-recipient");
    assert.equal(sender.ok, true);
    assert.equal(recipient.ok, true);
    if (!sender.ok || !recipient.ok) return;

    assert.equal(isChatEmoji("😀"), true);
    assert.equal(isChatEmoji("👨‍👩‍👧‍👦"), true);
    assert.equal(isChatEmoji("hello😀"), false);
    assert.equal(isChatEmoji("ab"), false);

    const sent = store.sendMessage(100, recipient.value.id, "Sender", "Reaction cap");
    assert.equal(sent.ok, true);
    if (!sent.ok) return;

    for (let index = 0; index < MAX_CHAT_REACTIONS_PER_MESSAGE; index += 1) {
      const emoji = String.fromCodePoint(0x1f600 + index);
      assert.equal(store.toggleReaction(100, sent.value.id, emoji).ok, true);
    }
    assert.deepEqual(store.toggleReaction(100, sent.value.id, "🌟"), {
      ok: false,
      error: "reaction-limit",
    });
  });

  it("expires inactive conversations without database persistence", () => {
    const { store, advanceTime } = createTestStore();
    const host = store.heartbeat(1, "host-tab");
    const guest = store.heartbeat(2, "guest-tab");
    assert.equal(host.ok, true);
    assert.equal(guest.ok, true);
    if (!host.ok || !guest.ok) return;

    store.sendMessage(1, guest.value.id, "Host", "Hello");
    advanceTime(CHAT_THREAD_TTL_MS + 1);
    assert.deepEqual(store.getConversation(1, guest.value.id), { ok: true, value: [] });
  });
});
