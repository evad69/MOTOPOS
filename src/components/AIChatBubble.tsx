import { SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

interface AIChatBubbleProps {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

/** Returns a localized time label for a chat message timestamp. */
function formatMessageTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Returns the layout classes for a chat bubble wrapper based on message role. */
function getWrapperClassName(role: "user" | "ai"): string {
  return role === "user" ? "flex justify-end" : "flex justify-start";
}

/** Returns the message bubble theme classes for the current chat role. */
function getBubbleClassName(role: "user" | "ai"): string {
  if (role === "user") {
    return "bg-accent-navy text-white rounded-lg rounded-br-none";
  }

  return "bg-[var(--ai-bubble-bg)] text-text-primary rounded-lg rounded-bl-none";
}

/** Renders a single AI or user chat message bubble with timestamp metadata. */
export function AIChatBubble({ role, content, timestamp }: AIChatBubbleProps) {
  return (
    <div className={getWrapperClassName(role)}>
      <div
        className={getBubbleClassName(role)}
        style={{ maxWidth: "80%", padding: SPACING.lg }}
      >
        <p
          className="whitespace-pre-wrap"
          style={{ fontSize: fontSizes.body, fontWeight: fontWeights.regular }}
        >
          {content}
        </p>
        <p
          className="mt-2 opacity-70"
          style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.medium }}
        >
          {formatMessageTime(timestamp)}
        </p>
      </div>
    </div>
  );
}
