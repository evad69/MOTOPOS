import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

const markdownComponents: Components = {
  p({ children }) {
    return (
      <p
        className="break-words"
        style={{ fontSize: fontSizes.body, lineHeight: 1.7 }}
      >
        {children}
      </p>
    );
  },
  strong({ children }) {
    return <strong style={{ fontWeight: fontWeights.bold }}>{children}</strong>;
  },
  em({ children }) {
    return <em className="italic">{children}</em>;
  },
  ul({ children }) {
    return (
      <ul
        className="list-disc"
        style={{ paddingLeft: SPACING.xl, fontSize: fontSizes.body, lineHeight: 1.7 }}
      >
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol
        className="list-decimal"
        style={{ paddingLeft: SPACING.xl, fontSize: fontSizes.body, lineHeight: 1.7 }}
      >
        {children}
      </ol>
    );
  },
  li({ children }) {
    return <li style={{ marginBottom: SPACING.xs }}>{children}</li>;
  },
  h1({ children }) {
    return (
      <h1 style={{ fontSize: fontSizes.display, fontWeight: fontWeights.bold }}>
        {children}
      </h1>
    );
  },
  h2({ children }) {
    return (
      <h2 style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold }}>
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 style={{ fontSize: fontSizes.section, fontWeight: fontWeights.semibold }}>
        {children}
      </h3>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote
        className="border-l-2 border-[var(--border)]"
        style={{ paddingLeft: SPACING.md, opacity: 0.9 }}
      >
        {children}
      </blockquote>
    );
  },
  a({ children, href }) {
    return (
      <a
        className="underline underline-offset-2"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  },
  pre({ children }) {
    return (
      <pre
        className="overflow-x-auto"
        style={{
          borderRadius: 12,
          backgroundColor: "rgba(15, 23, 42, 0.08)",
          padding: SPACING.md,
        }}
      >
        {children}
      </pre>
    );
  },
  code({ children }) {
    return (
      <code
        style={{
          borderRadius: 8,
          backgroundColor: "rgba(15, 23, 42, 0.08)",
          paddingInline: SPACING.xs,
          paddingBlock: 2,
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.medium,
        }}
      >
        {children}
      </code>
    );
  },
  hr() {
    return <hr className="border-[var(--border)]" />;
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ fontSize: fontSizes.body }}
        >
          {children}
        </table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th
        className="border border-[var(--border)] text-left"
        style={{ padding: SPACING.sm, fontWeight: fontWeights.semibold }}
      >
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td
        className="border border-[var(--border)] align-top"
        style={{ padding: SPACING.sm }}
      >
        {children}
      </td>
    );
  },
};

/** Renders plain text for user bubbles and markdown for assistant bubbles. */
function BubbleContent({ content, role }: Pick<AIChatBubbleProps, "content" | "role">) {
  if (role === "user") {
    return (
      <p
        className="whitespace-pre-wrap break-words"
        style={{ fontSize: fontSizes.body, fontWeight: fontWeights.regular }}
      >
        {content}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 break-words">
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** Renders a single AI or user chat message bubble with timestamp metadata. */
export function AIChatBubble({ role, content, timestamp }: AIChatBubbleProps) {
  return (
    <div className={getWrapperClassName(role)}>
      <div
        className={getBubbleClassName(role)}
        style={{ maxWidth: "80%", padding: SPACING.lg }}
      >
        <BubbleContent content={content} role={role} />
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
