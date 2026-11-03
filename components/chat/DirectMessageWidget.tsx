"use client";

import type { FormEvent } from "react";
import type { DirectMessage, OnlineUser } from "@/lib/directChatClient";
import { ChatConversationPanel } from "./ChatConversationPanel";
import { ChatRosterPanel } from "./ChatRosterPanel";
import { ChatWidgetLauncher } from "./ChatWidgetLauncher";
import { IncomingMessageToast } from "./IncomingMessageToast";
import { useDirectMessageWidget } from "./useDirectMessageWidget";

export function DirectMessageWidget() {
  const chat = useDirectMessageWidget();

  const toggleReactionPicker = (messageId: string) => {
    chat.setReactionMessageId((current) => current === messageId ? null : messageId);
  };

  const toggleEmojiPicker = () => {
    chat.setEmojiPickerOpen((open) => !open);
  };

  const openUnreadMessage = (message: DirectMessage) => {
    chat.openUnreadMessage(message);
  };

  const openUser = (user: OnlineUser) => {
    chat.openConversation(user);
  };

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    void chat.sendMessage(event);
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    void chat.toggleMessageReaction(messageId, emoji);
  };

  return (
    <>
      <IncomingMessageToast
        message={chat.toastMessage}
        isWidgetOpen={chat.isOpen}
        onOpen={chat.showToastConversation}
        onDismiss={() => chat.setToastMessage(null)}
      />

      {chat.isOpen && (
        <ChatConversationPanel
          activeUser={chat.activeUser}
          onlineCount={chat.onlineUsers.length}
          error={chat.error}
          messages={chat.messages}
          selfPublicId={chat.selfPublicId}
          reactionMessageId={chat.reactionMessageId}
          messageListRef={chat.messageListRef}
          otherUserTyping={chat.otherUserTyping}
          draft={chat.draft}
          emojiPickerOpen={chat.emojiPickerOpen}
          sending={chat.sending}
          textareaRef={chat.textareaRef}
          rosterPanel={
            <ChatRosterPanel
              onlineUsers={chat.onlineUsers}
              visibleOnlineUsers={chat.visibleOnlineUsers}
              showAllUsers={chat.showAllUsers}
              unreadMessages={chat.unreadMessages}
              onToggleShowAll={() => chat.setShowAllUsers((value) => !value)}
              onOpenUser={openUser}
              onOpenUnreadMessage={openUnreadMessage}
            />
          }
          onBack={chat.closeConversation}
          onMinimize={chat.dismissWidget}
          onToggleReaction={toggleReaction}
          onToggleReactionPicker={toggleReactionPicker}
          onSubmit={submitMessage}
          onDraftChange={chat.updateDraft}
          onSelectionChange={chat.recordCaretPosition}
          onInsertEmoji={chat.insertEmoji}
          onToggleEmojiPicker={toggleEmojiPicker}
          onStopTyping={chat.stopTyping}
        />
      )}

      <ChatWidgetLauncher
        isOpen={chat.isOpen}
        unreadCount={chat.unreadMessages.length}
        onToggle={chat.toggleWidget}
      />
    </>
  );
}
