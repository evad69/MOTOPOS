"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { AIChatBubble } from "@/components/AIChatBubble";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TopBar } from "@/components/TopBar";
import { useAI } from "@/hooks/useAI";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

const quickPrompts = [
  "Kumusta benta?",
  "Low stock?",
  "Top items this week",
  "Suggest reorder",
];

const openingGreetingPrompt = "Hello! What can I do for you?";

interface PromptChipsProps {
  isLoading: boolean;
  onSelectPrompt: (promptText: string) => Promise<void>;
}

interface ChatComposerProps {
  inputValue: string;
  isLoading: boolean;
  onInputChange: (nextValue: string) => void;
  onSubmit: () => Promise<void>;
}

/** Scrolls the message list to the latest entry whenever chat content changes. */
function useAutoScroll(messageCount: number, isLoading: boolean) {
  const messagesEndReference = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndReference.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount, isLoading]);

  return messagesEndReference;
}

/** Sends the opening AI greeting exactly once when the page first loads. */
function useOpeningGreeting(messageCount: number) {
  const [hasGreeting, setHasGreeting] = useState(false);

  useEffect(() => {
    if (messageCount > 0) {
      setHasGreeting(true);
    }
  }, [messageCount]);

  if (hasGreeting) {
    return null;
  }

  return (
    <AIChatBubble
      content={openingGreetingPrompt}
      role="ai"
      timestamp={new Date().toISOString()}
    />
  );
}

/** Renders the navy assistant header inside the chat card. */
function AssistantHeader() {
  return (
    <div className="bg-accent-navy text-white" style={{ padding: SPACING.xl }}>
      <h2 style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold }}>AI Assistant</h2>
      <p className="opacity-80" style={{ fontSize: fontSizes.body }}>
        Powered by Gemini Flash
      </p>
    </div>
  );
}

/** Renders the animated typing indicator shown while the AI reply is loading. */
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-2 bg-[var(--ai-bubble-bg)] rounded-lg rounded-bl-none"
        style={{ padding: SPACING.lg }}
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent-navy" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent-navy" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent-navy" />
      </div>
    </div>
  );
}

/** Renders the dismissible error banner shown for failed AI requests. */
function ErrorBanner({ errorMessage }: { errorMessage: string | null }) {
  if (!errorMessage) {
    return null;
  }

  return (
    <div
      className="border text-text-primary"
      style={{ borderColor: "var(--warning)", borderRadius: RADIUS.md, padding: SPACING.md }}
    >
      {errorMessage}
    </div>
  );
}

/** Renders the quick-prompt chip row above the message composer. */
function PromptChips({ isLoading, onSelectPrompt }: PromptChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {quickPrompts.map((promptText) => (
        <Button
          key={promptText}
          disabled={isLoading}
          onClick={() => void onSelectPrompt(promptText)}
          variant="secondary"
        >
          {promptText}
        </Button>
      ))}
    </div>
  );
}

/** Renders the scrollable chat history and typing state for the AI assistant. */
function MessageList({
  isLoading,
  messages,
  messagesEndReference,
}: {
  isLoading: boolean;
  messages: { role: "user" | "ai"; content: string; timestamp: string }[];
  messagesEndReference: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: SPACING.xl }}>
      <div className="flex flex-col gap-4">
        {messages.map((message) => (
          <AIChatBubble
            key={`${message.role}-${message.timestamp}`}
            content={message.content}
            role={message.role}
            timestamp={message.timestamp}
          />
        ))}
        {isLoading ? <TypingIndicator /> : null}
        <div ref={messagesEndReference} />
      </div>
    </div>
  );
}

/** Renders the text input and send button used to submit AI questions. */
function ChatComposer({
  inputValue,
  isLoading,
  onInputChange,
  onSubmit,
}: ChatComposerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <form className="flex gap-3" onSubmit={handleSubmit}>
      <input
        className="flex-1 border bg-bg-primary text-text-primary outline-none"
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Ask about sales, inventory, or reorder needs..."
        style={{ borderColor: "var(--border)", borderRadius: RADIUS.md, minHeight: LAYOUT.minClickTarget, paddingInline: SPACING.lg, paddingBlock: SPACING.md }}
        value={inputValue}
      />
      <Button
        aria-label="Send AI message"
        disabled={isLoading || !inputValue.trim()}
        type="submit"
      >
        <SendHorizontal aria-hidden="true" size={18} />
      </Button>
    </form>
  );
}

/** Renders the fully wired AI assistant chat page with prompts, bubbles, and composer. */
export default function AIPage() {
  const { messages, isLoading, errorMessage, sendMessage } = useAI();
  const [inputValue, setInputValue] = useState("");
  const messagesEndReference = useAutoScroll(messages.length, isLoading);
  const greetingBubble = useOpeningGreeting(messages.length);

  async function handleSendMessage() {
    const trimmedInputValue = inputValue.trim();
    if (!trimmedInputValue) {
      return;
    }

    setInputValue("");
    await sendMessage(trimmedInputValue);
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary text-text-primary">
      <TopBar title="AI Assistant" />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col" style={{ padding: SPACING.xl }}>
        <Card className="flex flex-1 flex-col overflow-hidden">
          <AssistantHeader />
          <MessageList isLoading={isLoading} messages={messages} messagesEndReference={messagesEndReference} />
          {greetingBubble}
          <div className="border-t border-[var(--border)]" style={{ padding: SPACING.xl }}>
            <div className="flex flex-col gap-4">
              <ErrorBanner errorMessage={errorMessage} />
              <PromptChips isLoading={isLoading} onSelectPrompt={sendMessage} />
              <ChatComposer
                inputValue={inputValue}
                isLoading={isLoading}
                onInputChange={setInputValue}
                onSubmit={handleSendMessage}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
