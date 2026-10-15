import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../types";
import { formatMessageTimestamp, groupMessagesByDate, hasUnreadMessages, validateMessageText } from "./messaging";

describe("messaging domain logic", () => {
  describe("validateMessageText", () => {
    it("rejects empty text", () => {
      const res = validateMessageText("");
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Message cannot be empty");
    });

    it("rejects whitespace-only text", () => {
      const res = validateMessageText("    \n\t  ");
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Message cannot be empty");
    });

    it("rejects overly long text (> 1000 characters)", () => {
      const longText = "a".repeat(1001);
      const res = validateMessageText(longText);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Message must be 1000 characters or less");
    });

    it("accepts valid text and trims whitespace", () => {
      const res = validateMessageText("  Hello, is the pickup still available?  ");
      expect(res.valid).toBe(true);
      expect(res.cleanText).toBe("Hello, is the pickup still available?");
    });
  });

  describe("formatMessageTimestamp", () => {
    it("formats ISO timestamps into hours and minutes", () => {
      // 2026-10-16T14:35:00.000Z
      const result = formatMessageTimestamp("2026-10-16T14:35:00.000Z");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("gracefully handles invalid date string", () => {
      const result = formatMessageTimestamp("invalid-date");
      expect(result).toBe("Just now");
    });
  });

  describe("groupMessagesByDate", () => {
    it("groups messages by calendar date", () => {
      const msgs: ChatMessage[] = [
        {
          id: "m1",
          bookingId: "b1",
          senderId: "u1",
          senderName: "Renter Anan",
          senderRole: "renter",
          text: "Can we meet at BTS Asok?",
          createdAt: "2026-10-15T10:00:00.000Z",
        },
        {
          id: "m2",
          bookingId: "b1",
          senderId: "u2",
          senderName: "Owner Somchai",
          senderRole: "owner",
          text: "Sure, Exit 3 works best.",
          createdAt: "2026-10-15T10:05:00.000Z",
        },
        {
          id: "m3",
          bookingId: "b1",
          senderId: "u1",
          senderName: "Renter Anan",
          senderRole: "renter",
          text: "I have arrived!",
          createdAt: "2026-10-16T09:00:00.000Z",
        },
      ];

      const groups = groupMessagesByDate(msgs);
      expect(groups.length).toBe(2);
      expect(groups[0].messages.length).toBe(2);
      expect(groups[1].messages.length).toBe(1);
    });
  });

  describe("hasUnreadMessages", () => {
    const messages: ChatMessage[] = [
      {
        id: "m1",
        bookingId: "b1",
        senderId: "owner-1",
        senderName: "Owner Somchai",
        senderRole: "owner",
        text: "Item is ready for pickup!",
        createdAt: "2026-10-15T10:00:00.000Z",
      },
    ];

    it("returns false if messages array is empty", () => {
      expect(hasUnreadMessages([], "renter-1", null)).toBe(false);
    });

    it("returns false if only viewer sent messages", () => {
      expect(hasUnreadMessages(messages, "owner-1", null)).toBe(false);
    });

    it("returns true if counterpart sent message and user never read", () => {
      expect(hasUnreadMessages(messages, "renter-1", null)).toBe(true);
    });

    it("returns false if user lastRead is after counterpart message", () => {
      expect(hasUnreadMessages(messages, "renter-1", "2026-10-15T11:00:00.000Z")).toBe(false);
    });

    it("returns true if counterpart sent message after user lastRead", () => {
      expect(hasUnreadMessages(messages, "renter-1", "2026-10-15T09:00:00.000Z")).toBe(true);
    });
  });
});
