'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import { 
  MessageSquare, Send, User, Bot, Clock, CheckCheck, 
  Sparkles, RefreshCw, Loader2, ArrowRight
} from 'lucide-react';

interface ChatSession {
  sessionId: string;
  customerName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

export function AdminInboxPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/admin/chat/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        if (!selectedSessionId && (data.sessions || []).length > 0) {
          setSelectedSessionId(data.sessions[0].sessionId);
        }
      }
    } catch {}
  };

  const fetchMessagesForSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
      // Mark as read in background
      await fetch('/api/admin/chat/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch {}
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchMessagesForSession(selectedSessionId);
      const interval = setInterval(() => fetchMessagesForSession(selectedSessionId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSessionId || sending) return;

    setSending(true);
    const text = replyText;
    setReplyText('');

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          sender: 'admin',
          senderName: 'Anime Home Support',
          message: text,
        }),
      });
      fetchMessagesForSession(selectedSessionId);
      fetchSessions();
    } catch {
    } finally {
      setSending(false);
    }
  };

  const selectedSession = sessions.find(s => s.sessionId === selectedSessionId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-red-500" />
            <span>Customer Support & Live Chat Inbox</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Balas pertanyaan pembeli seputar pesanan merchandise dan bantuan streaming langsung di web.
          </p>
        </div>
        <button
          onClick={() => {
            fetchSessions();
            if (selectedSessionId) fetchMessagesForSession(selectedSessionId);
          }}
          className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Refresh pesan"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px] bg-zinc-900/40 border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Left Column: Sessions List */}
        <div className="border-r border-white/[0.08] flex flex-col bg-zinc-950/40">
          <div className="p-3.5 border-b border-white/[0.08] bg-zinc-900/60 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Daftar Obrolan ({sessions.length})
            </span>
            <span className="text-[10px] text-zinc-500">Realtime</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Belum ada percakapan masuk dari pengunjung.
              </div>
            ) : (
              sessions.map((s) => {
                const isSelected = s.sessionId === selectedSessionId;
                return (
                  <button
                    key={s.sessionId}
                    onClick={() => setSelectedSessionId(s.sessionId)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-red-600/10 border-l-2 border-red-500'
                        : 'hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 font-bold shrink-0 text-xs">
                      {s.customerName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-red-400' : 'text-white'}`}>
                          {s.customerName}
                        </span>
                        {s.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                            {s.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{s.lastMessage}</p>
                      <span className="text-[9px] text-zinc-600 block mt-1">
                        {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Conversation */}
        <div className="md:col-span-2 flex flex-col bg-zinc-950/80">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-white/[0.08] bg-zinc-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 font-bold text-xs">
                    {selectedSession.customerName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{selectedSession.customerName}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono">ID: {selectedSession.sessionId}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sesi Terhubung
                </span>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {messages.map((m) => {
                  const isCust = m.sender === 'customer';
                  return (
                    <div key={m.id} className={`flex flex-col ${isCust ? 'items-start' : 'items-end'}`}>
                      <span className="text-[9px] text-zinc-500 px-1 mb-0.5">
                        {isCust ? m.senderName : 'Kamu (Admin Support)'} •{' '}
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {/* Product Preview if customer asked about a product */}
                      {m.merchRef && (
                        <div className="mb-1 p-2 rounded-lg bg-zinc-900 border border-white/10 flex items-center gap-2 max-w-[75%]">
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
                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${
                          isCust
                            ? 'bg-zinc-900 text-zinc-200 border border-white/[0.08] rounded-bl-none'
                            : 'bg-red-600 text-white rounded-br-none shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed text-[11px] sm:text-xs">{m.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Bar */}
              <form onSubmit={handleSendReply} className="p-3 bg-zinc-900/90 border-t border-white/[0.08] flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Balas ke ${selectedSession.customerName}...`}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Kirim</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-zinc-500">
              Pilih salah satu sesi obrolan di sebelah kiri untuk melihat pesan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminInboxPage;
