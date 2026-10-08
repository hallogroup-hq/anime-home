'use client';

import { AnimeCharacter } from '@/types';
import { Mic } from 'lucide-react';

interface CharacterListProps {
  characters: AnimeCharacter[];
}

export function CharacterList({ characters }: CharacterListProps) {
  if (characters.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6 text-center text-xs text-zinc-500">
        Informasi karakter dan pengisi suara untuk anime ini belum tersedia.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {characters.map((char) => (
        <div
          key={char.id}
          className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06] hover:border-zinc-700 transition-colors"
        >
          {/* Character Avatar */}
          <img
            src={char.imageUrl}
            alt={char.name}
            className="h-14 w-14 rounded-lg object-cover shrink-0 border border-white/[0.08]"
          />

          {/* Character & Seiyuu Names */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">
                {char.name}
              </span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                char.role === 'Main' 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {char.role}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
              <Mic className="h-3 w-3 text-zinc-500 shrink-0" />
              <span className="text-zinc-300 font-medium truncate">
                {char.voiceActorName}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5">
              {char.voiceActorLanguage}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
