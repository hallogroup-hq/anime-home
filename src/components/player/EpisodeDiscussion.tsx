'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { EpisodeComment } from '@/types';
import { MessageSquare, ThumbsUp, AlertTriangle, Eye, EyeOff, Send, ShieldAlert } from 'lucide-react';

interface EpisodeDiscussionProps {
  episodeId: string;
  episodeNumber: string;
}

export function EpisodeDiscussion({ episodeId, episodeNumber }: EpisodeDiscussionProps) {
  const [comments, setComments] = useState<EpisodeComment[]>(() => db.getCommentsByEpisodeId(episodeId));
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [unmaskedSpoilers, setUnmaskedSpoilers] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const handleToggleSpoilerMask = (commentId: string) => {
    setUnmaskedSpoilers((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleLike = (commentId: string) => {
    if (likedComments.has(commentId)) return;
    db.likeEpisodeComment(commentId);
    setLikedComments((prev) => new Set(prev).add(commentId));
    setComments(db.getCommentsByEpisodeId(episodeId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const user = db.getUserProfile();
    const finalAuthor = authorName.trim() || (user.isLoggedIn ? user.username : 'Wibu Anonim');

    db.addEpisodeComment({
      episodeId,
      authorName: finalAuthor,
      content: content.trim(),
      isSpoiler,
    });

    setContent('');
    setIsSpoiler(false);
    setComments(db.getCommentsByEpisodeId(episodeId));
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] p-4 sm:p-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-red-500" />
          <h2 className="text-sm sm:text-base font-bold text-white">
            Diskusi Episode {episodeNumber}
          </h2>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 font-semibold">
            {comments.length}
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
          <ShieldAlert className="h-3 w-3 text-amber-400" />
          <span>Proteksi Spoiler Aktif</span>
        </span>
      </div>

      {/* Comment Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-zinc-950 p-3.5 rounded-xl border border-white/[0.06]">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Nama panggilan (opsional, default: Wibu Anonim)"
            className="flex-1 rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />

          <label className="flex items-center gap-2 text-xs text-amber-300 font-medium px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSpoiler}
              onChange={(e) => setIsSpoiler(e.target.checked)}
              className="accent-amber-500 h-3.5 w-3.5 rounded cursor-pointer"
            />
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Komentar Spoiler</span>
          </label>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Tulis ulasan, teori, atau reaksi untuk episode ini..."
          className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
          required
        />

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Send className="h-3 w-3" />
            <span>Kirim Komentar</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="flex flex-col gap-3">
        {comments.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            Belum ada diskusi untuk episode ini. Jadilah yang pertama memberikan reaksi!
          </div>
        ) : (
          comments.map((comment) => {
            const isMasked = comment.isSpoiler && !unmaskedSpoilers.has(comment.id);
            const isLiked = likedComments.has(comment.id);

            return (
              <div
                key={comment.id}
                className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                  comment.isSpoiler
                    ? 'bg-zinc-950/70 border-amber-500/20'
                    : 'bg-zinc-900/40 border-white/[0.04]'
                }`}
              >
                {/* Author & Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {comment.authorName}
                    </span>
                    {comment.isSpoiler && (
                      <span className="rounded bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-400">
                        SPOILER
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {new Date(comment.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Comment Content (with Spoiler Blurring) */}
                <div className="relative text-xs text-zinc-300 leading-relaxed py-1">
                  {isMasked ? (
                    <div className="relative">
                      {/* Blurred Text Preview */}
                      <p className="filter blur-sm select-none opacity-40">
                        {comment.content}
                      </p>

                      {/* Click to Reveal Spoiler Mask */}
                      <button
                        onClick={() => handleToggleSpoilerMask(comment.id)}
                        className="absolute inset-0 m-auto h-8 px-4 flex items-center justify-center gap-2 rounded-lg bg-zinc-900/90 border border-amber-500/40 text-xs font-semibold text-amber-300 hover:bg-zinc-800 transition-colors shadow-lg cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Komentar Mengandung Spoiler — Klik Buka</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p>{comment.content}</p>
                      {comment.isSpoiler && (
                        <button
                          onClick={() => handleToggleSpoilerMask(comment.id)}
                          className="mt-1 text-[11px] text-zinc-500 hover:text-zinc-400 flex items-center gap-1 cursor-pointer"
                        >
                          <EyeOff className="h-3 w-3" />
                          <span>Sembunyikan kembali</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions: Upvote */}
                <div className="flex items-center gap-3 pt-1 border-t border-white/[0.04] text-xs">
                  <button
                    onClick={() => handleLike(comment.id)}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isLiked ? 'text-red-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{comment.likes}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
