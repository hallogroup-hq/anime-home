'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, MerchItem } from '@/types';
import { MessageSquare, X, Send, Bot, ShieldCheck, Sparkles, Loader2, ArrowUpRight } from 'lucide-react';

export function LiveSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedMerch, setAttachedMerch] = useState<MerchItem | null>(null);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or load session ID
  useEffect(() => {
    let sid = '';
    if (typeof window !== 'undefined') {
      sid = localStorage.getItem('anime_home_chat_session') || '';
      if (!sid) {
        sid = `session-usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        localStorage.setItem('anime_home_chat_session', sid);
      }
      setSessionId(sid);
    }
  }, []);

  // Fetch messages for session
  const fetchMessages = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        // Calculate unread admin messages
        const unreads = (data.messages || []).filter((m: ChatMessage) => m.sender === 'admin' && !m.read).length;
        setUnreadCount(unreads);
      }
    } catch {}
  };

  useEffect(() => {
    if (sessionId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Listen for global custom event to open chat with merch ref
  useEffect(() => {
    const handleOpenWithMerch = (e: any) => {
      const merch = e.detail?.merch;
      if (merch) {
        setAttachedMerch(merch);
        setIsOpen(true);
        setInputText(`Halo min, saya mau tanya ketersediaan produk ${merch.name}...`);
      }
    };
    window.addEventListener('open-anime-chat-merch', handleOpenWithMerch);
    return () => window.removeEventListener('open-anime-chat-merch', handleOpenWithMerch);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    const text = inputText;
    const merch = attachedMerch;
    setInputText('');
    setAttachedMerch(null);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sender: 'customer',
          senderName: 'Pengunjung',
          message: text,
          merchRef: merch
            ? {
                id: merch.id,
                name: merch.name,
                imageUrl: merch.imageUrl,
                price: merch.price,
              }
            : undefined,
        }),
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch {
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
          title="Tanya Customer Support Anime Home"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-bold tracking-wide hidden sm:inline">
            Tanya Store & CS
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* Live Chat Window */}
      {isOpen && (
        <div className="relative w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-zinc-900 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">Anime Home Store Support</h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-zinc-400">Bantuan Dropship, Resi, & Pertanyaan Merch</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-zinc-950/70">
            {/* Greeting */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1 text-center">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Customer Assistant
              </span>
              <p className="text-[11px] text-zinc-300">
                Selamat datang di Anime Home Store! Ada yang bisa kami bantu seputar merchandise anime favoritmu?
              </p>
            </div>

            {/* Conversation Log */}
            {messages.map((m) => {
              const isCust = m.sender === 'customer';
              return (
                <div key={m.id} className={`flex flex-col ${isCust ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] text-zinc-500 px-1 mb-0.5">
                    {isCust ? 'Kamu' : m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Optional Attached Merch Thumbnail */}
                  {m.merchRef && (
                    <div className="mb-1 p-2 rounded-lg bg-zinc-900 border border-white/10 flex items-center gap-2 max-w-[85%]">
                      <img src={m.merchRef.imageUrl} alt="" className="w-8 h-8 rounded object-cover border border-white/10" />
                      <div className="truncate">
                        <div className="text-[10px] font-bold text-white truncate">{m.merchRef.name}</div>
                        <div className="text-[9px] text-emerald-400 font-semibold">
                          Rp {m.merchRef.price.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${
                      isCust
                        ? 'bg-red-600 text-white rounded-br-none shadow-sm'
                        : 'bg-zinc-900 text-zinc-200 border border-white/[0.08] rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed text-[11px] sm:text-xs">{m.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached Merch Chip inside input */}
          {attachedMerch && (
            <div className="px-3 py-1.5 bg-zinc-900 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 truncate flex items-center gap-1.5">
                <span className="text-red-400 font-bold">Produk:</span> {attachedMerch.name}
              </span>
              <button
                type="button"
                onClick={() => setAttachedMerch(null)}
                className="text-zinc-500 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-zinc-900/90 border-t border-white/[0.08] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis pesan ke admin..."
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
