import type { ChatMessage } from "../types";

export interface MessageValidationResult {
  valid: boolean;
  error?: string;
  cleanText: string;
}

export const MAX_MESSAGE_LENGTH = 1000;

export function validateMessageText(text: string): MessageValidationResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: "Message cannot be empty",
      cleanText: "",
    };
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less`,
      cleanText: trimmed,
    };
  }

  return {
    valid: true,
    cleanText: trimmed,
  };
}

export function formatMessageTimestamp(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
      return "Just now";
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "Just now";
  }
}

export function groupMessagesByDate(
  messages: ChatMessage[]
): { dateLabel: string; messages: ChatMessage[] }[] {
  const groups: Map<string, ChatMessage[]> = new Map();

  for (const msg of messages) {
    let dateKey: string;
    try {
      const d = new Date(msg.createdAt);
      if (isNaN(d.getTime())) {
        dateKey = "Today";
      } else {
        dateKey = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    } catch {
      dateKey = "Today";
    }

    const current = groups.get(dateKey) || [];
    current.push(msg);
    groups.set(dateKey, current);
  }

  return Array.from(groups.entries()).map(([dateLabel, msgs]) => ({
    dateLabel,
    messages: msgs,
  }));
}
