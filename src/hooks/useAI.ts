"use client";

import { useState } from "react";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

interface AIChatResponse {
  reply?: string;
  error?: string;
}

/** Returns a timestamped chat message object for the current conversation. */
function createChatMessage(role: "user" | "ai", content: string): ChatMessage {
  return {
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

/** Returns the AI reply text from the server route or throws when the request fails. */
async function requestAIReply(userMessage: string): Promise<string> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userMessage }),
  });
  const responseBody = (await response.json()) as AIChatResponse;
  if (!response.ok || !responseBody.reply) {
    throw new Error(responseBody.error ?? "Failed to receive an AI reply.");
  }

  return responseBody.reply;
}

/** Manages AI chat messages, loading state, and server requests for the assistant UI. */
export function useAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function sendMessage(userMessage: string): Promise<void> {
    const trimmedUserMessage = userMessage.trim();
    if (!trimmedUserMessage) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setMessages((previousMessages) => {
      return [...previousMessages, createChatMessage("user", trimmedUserMessage)];
    });

    try {
      const reply = await requestAIReply(trimmedUserMessage);
      setMessages((previousMessages) => {
        return [...previousMessages, createChatMessage("ai", reply)];
      });
    } catch {
      setErrorMessage("Hindi makonekta sa AI. Subukan ulit.");
    } finally {
      setIsLoading(false);
    }
  }

  return { messages, isLoading, errorMessage, sendMessage };
}
