import type { Metadata } from "next";
import { DirectMessageChat } from "@/components/chat/DirectMessageChat";

export const metadata: Metadata = {
  title: "Chat | HRDB-Lenard",
  description: "Direct messages with your team",
};

export default function ChatPage() {
  return <DirectMessageChat />;
}
