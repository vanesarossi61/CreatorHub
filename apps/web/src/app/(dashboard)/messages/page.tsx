"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import api from "@/lib/api-client";
import type { ConversationSummary, MessageItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================
// MAIN COMPONENT
// =============================================

export default function MessagesPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeUserId = searchParams.get("with");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.messages.listConversations();
      setConversations(data);
    } catch (err) {
      // silent on poll errors
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for active conversation
  const loadMessages = useCallback(async (userId: string) => {
    setLoadingMessages(true);
    try {
      const data = await api.messages.getConversation(userId);
      setMessages(data.data.reverse()); // API returns desc, we want asc
      // Mark as read
      await api.messages.markRead(userId);
    } catch (err) {
      toast.error("Error al cargar mensajes");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeUserId) {
      loadMessages(activeUserId);
    } else {
      setMessages([]);
    }
  }, [activeUserId, loadMessages]);

  // Poll for new messages every 5s
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadConversations();
      if (activeUserId) {
        loadMessages(activeUserId);
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeUserId, loadConversations, loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUserId || sending) return;

    setSending(true);
    try {
      const msg = await api.messages.send(activeUserId, newMessage.trim());
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      loadConversations(); // refresh sidebar
    } catch (err) {
      toast.error("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (userId: string) => {
    router.push(`/messages?with=${userId}`);
  };

  const activeConversation = conversations.find((c) => c.otherUser.id === activeUserId);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (!currentUser?.isLoaded) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ===== SIDEBAR: Conversation List ===== */}
      <div
        className={cn(
          "w-full sm:w-80 lg:w-96 border-r border-border flex flex-col bg-card",
          activeUserId && "hidden sm:flex",
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold">
            Mensajes
            {totalUnread > 0 && (
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </h1>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No tenes conversaciones aun.</p>
              <p className="text-xs mt-1">
                Cuando apliques a una campana o aceptes un creator, podras chatear aca.
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.otherUser.id}
                onClick={() => selectConversation(conv.otherUser.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left",
                  activeUserId === conv.otherUser.id && "bg-muted",
                )}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {conv.otherUser.avatarUrl ? (
                    <img
                      src={conv.otherUser.avatarUrl}
                      alt={conv.otherUser.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {conv.otherUser.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">
                      {conv.otherUser.name}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage?.body || "Sin mensajes"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="text-xs bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ===== MAIN: Chat View ===== */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          !activeUserId && "hidden sm:flex",
        )}
      >
        {!activeUserId ? (
          // Empty state
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">Selecciona una conversacion</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              {/* Back button (mobile) */}
              <button
                onClick={() => router.push("/messages")}
                className="sm:hidden text-muted-foreground hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {activeConversation?.otherUser.avatarUrl ? (
                  <img
                    src={activeConversation.otherUser.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-primary">
                    {activeConversation?.otherUser.name.charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {activeConversation?.otherUser.name || "Conversacion"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {activeConversation?.otherUser.type.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={cn("flex", i % 2 === 0 && "justify-end")}>
                      <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">No hay mensajes aun. Envia el primero!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex", isMine && "justify-end")}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] px-4 py-2 rounded-2xl text-sm",
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <p
                          className={cn(
                            "text-[10px] mt-1",
                            isMine ? "text-primary-foreground/60" : "text-muted-foreground",
                          )}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t border-border flex gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                maxLength={5000}
                className="flex-1 px-4 py-2.5 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {sending ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================
// HELPERS
// =============================================

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
