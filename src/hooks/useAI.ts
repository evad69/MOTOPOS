"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

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
async function requestAIReply(
  userMessage: string,
  accessToken: string | undefined,
): Promise<string> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
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
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function requestMessageReply(
    message: string,
    role: "user" | "ai",
  ): Promise<void> {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    if (role === "user") {
      setMessages((previousMessages) => {
        return [...previousMessages, createChatMessage("user", trimmedMessage)];
      });
    }

    try {
      const reply = await requestAIReply(trimmedMessage, session?.access_token);
      setMessages((previousMessages) => {
        return [...previousMessages, createChatMessage("ai", reply)];
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Authentication required.") {
        setErrorMessage("Your session expired. Sign in again to use the AI assistant.");
      } else {
        setErrorMessage("Hindi makonekta sa AI. Subukan ulit.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage(userMessage: string): Promise<void> {
    await requestMessageReply(userMessage, "user");
  }

  async function loadGreeting(promptMessage: string): Promise<void> {
    await requestMessageReply(promptMessage, "ai");
  }

  return { messages, isLoading, errorMessage, sendMessage, loadGreeting };
}
