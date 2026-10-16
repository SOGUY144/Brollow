"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  PackageCheck,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import type { BookingWithItem, DataApi } from "@/lib/data/api";
import { formatMessageTimestamp, groupMessagesByDate, setBookingLastRead, validateMessageText } from "@/lib/domain/messaging";
import { formatDateRange, formatMoney } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface BookingChatDrawerProps {
  booking: BookingWithItem;
  currentViewerId: string;
  isOpen: boolean;
  onClose: () => void;
  api: DataApi;
  onMarkRead?: (bookingId: string) => void;
}

const QUICK_PROMPTS = [
  { icon: MapPin, text: "Where is the pickup location?" },
  { icon: Clock, text: "What time works best for you?" },
  { icon: PackageCheck, text: "Equipment is packed & ready for pickup." },
  { icon: ShieldCheck, text: "Arrived at the pickup location." },
];

export function BookingChatDrawer({
  booking,
  currentViewerId,
  isOpen,
  onClose,
  api,
  onMarkRead,
}: BookingChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const onMarkReadRef = useRef(onMarkRead);
  useEffect(() => {
    onMarkReadRef.current = onMarkRead;
  }, [onMarkRead]);

  const isViewerOwner = currentViewerId === booking.ownerId;
  const counterpartRole = isViewerOwner ? "Renter" : "Owner";
  const counterpartName = booking.counterpart?.displayName ?? counterpartRole;

  // Load message history on open and poll every 3 seconds while open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setBookingLastRead(booking.id);
    onMarkReadRef.current?.(booking.id);

    async function loadData(showSpinner = false) {
      if (showSpinner) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const data = await api.listMessages(booking.id);
        if (isMounted) {
          setMessages((prev) => {
            const existingIds = new Set(data.map((m) => m.id));
            const pendingLocal = prev.filter(
              (m) => !existingIds.has(m.id) && m.bookingId === booking.id
            );
            const merged = [...data, ...pendingLocal];
            if (
              prev.length === merged.length &&
              prev[prev.length - 1]?.id === merged[merged.length - 1]?.id
            ) {
              return prev;
            }
            return merged;
          });
        }
      } catch (err) {
        if (isMounted && showSpinner) {
          setError(err instanceof Error ? err.message : "Failed to load messages");
        }
      } finally {
        if (isMounted && showSpinner) {
          setIsLoading(false);
        }
      }
    }

    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [api, booking.id, isOpen]);

  // Auto-scroll to bottom whenever messages count changes
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (isOpen && messages.length !== prevCountRef.current) {
      prevCountRef.current = messages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const validation = validateMessageText(inputText);
    if (!validation.valid) {
      if (inputText.trim()) setError(validation.error ?? "Invalid message");
      return;
    }
    if (isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const newMsg = await api.sendMessage(booking.id, validation.cleanText);
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setInputText("");
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  function handleQuickPromptClick(text: string) {
    setInputText(text);
    inputRef.current?.focus();
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className="w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b p-4 bg-muted/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {booking.item?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={booking.item.images[0]}
                    alt={booking.item.title}
                    className="size-11 rounded-lg object-cover border shrink-0"
                  />
                ) : (
                  <div className="size-11 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <MessageCircle className="size-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate text-foreground">
                      {counterpartName}
                    </h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {counterpartRole}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {booking.item?.title ?? "Rental Item"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDateRange(booking.startDate, booking.endDate)} · {formatMoney(booking.totalSatang)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                aria-label="Close chat"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-6">
                <MessageCircle className="size-10 mb-2 opacity-40 text-primary" />
                <p className="text-sm font-medium text-foreground">No messages yet</p>
                <p className="text-xs mt-1">
                  Send a message to coordinate equipment pickup, timing, and location.
                </p>
              </div>
            ) : (
              messageGroups.map((group) => (
                <div key={group.dateLabel} className="space-y-3">
                  <div className="flex items-center justify-center my-2">
                    <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {group.dateLabel}
                    </span>
                  </div>

                  {group.messages.map((msg) => {
                    const isMe = msg.senderId === currentViewerId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm shadow-2xs break-words ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-xs"
                              : "bg-muted text-foreground rounded-bl-xs border border-border/50"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1">
                          {!isMe && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {msg.senderName} ·
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatMessageTimestamp(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error notice */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs border-t border-destructive/20">
              {error}
            </div>
          )}

          {/* Quick Prompts */}
          <div className="border-t bg-muted/10 p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5 px-1">
              Quick Coordination Prompts:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt, idx) => {
                const IconComponent = prompt.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPromptClick(prompt.text)}
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    <IconComponent className="size-3 text-primary shrink-0" />
                    <span>{prompt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Input */}
          <div className="p-3 border-t bg-card">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                maxLength={1000}
                disabled={isSending}
                className="flex-1 resize-none min-h-[40px] max-h-28 rounded-xl border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim() || isSending}
                className="rounded-xl shrink-0"
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
