import { useMemo, useState } from 'react';
import { Eye, Play, Search, X } from 'lucide-react';
import {
  Sermon,
  formatDateValue,
  getTimestampMillis,
} from '../types/ministry';
import { ResilientImage } from '../components/ResilientImage';

interface SermonsPageProps {
  youtubeSermons: Sermon[];
  onWatchSermon: (sermon: Sermon) => void;
}

export function SermonsPage({
  youtubeSermons,
  onWatchSermon,
}: SermonsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const sortedSermons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? youtubeSermons.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.scriptureRef.toLowerCase().includes(q) ||
            s.scriptureQuote.toLowerCase().includes(q) ||
            s.summary.toLowerCase().includes(q) ||
            s.content.toLowerCase().includes(q)
        )
      : youtubeSermons;

    return [...list].sort(
      (a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
    );
  }, [youtubeSermons, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-4 pb-6 border-b border-[#E4E4E7] text-center lg:text-left">
        <div className="max-w-2xl space-y-1.5">
          <p className="text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
            Video Ministry
          </p>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#0B0B0D] whitespace-nowrap">
            Short Sermons
          </h1>
          <p className="text-sm sm:text-base text-[#52525B]">
            Select any sermon video to pop open and watch right here on the site.
          </p>
        </div>

        <div className="relative w-full max-w-sm lg:w-80">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sermons by title or keyword..."
            aria-label="Search sermons by title or keyword"
            className="w-full pl-9 pr-9 py-2.5 rounded-lg text-sm bg-white border border-[#E4E4E7] text-[#0B0B0D] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#2563EB]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear sermon search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-[#71717A] hover:text-[#0B0B0D] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {searchQuery.trim() && sortedSermons.length > 0 && (
        <p className="text-xs text-[#52525B]">
          Showing {sortedSermons.length}{' '}
          {sortedSermons.length === 1 ? 'sermon' : 'sermons'} for &ldquo;
          {searchQuery.trim()}&rdquo;
        </p>
      )}

      {sortedSermons.length === 0 ? (
        <div className="bg-white border border-[#E4E4E7] rounded-none p-8 sm:p-10 text-center space-y-3">
          <p className="text-base sm:text-lg font-semibold text-[#0B0B0D]">
            {searchQuery
              ? 'No sermon videos matched your search'
              : 'No Sermon videos published yet'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white cursor-pointer"
            >
              Show All
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {sortedSermons.map((video) => (
            <article
              key={video.id}
              className="bg-white border border-[#E4E4E7] rounded-none overflow-hidden flex flex-col justify-between hover:border-[#2563EB] transition-colors"
            >
              <div>
                <div className="relative aspect-video bg-[#F4F4F5] border-b border-[#E4E4E7]">
                  <ResilientImage
                    src={video.coverImage}
                    alt={video.title}
                    fallbackTitle={video.title}
                  />
                  <button
                    type="button"
                    onClick={() => onWatchSermon(video)}
                    aria-label={`Watch ${video.title}`}
                    className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/40 transition-colors cursor-pointer"
                  >
                    <span className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-md">
                      <Play className="w-4 h-4 fill-[#2563EB] text-[#2563EB] ml-0.5" />
                    </span>
                  </button>
                </div>

                <div className="p-4 sm:p-5 space-y-2 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-1.5 gap-y-0.5 text-xs text-[#52525B]">
                    <span className="font-semibold text-[#DC2626] whitespace-nowrap">
                      Sermon Video
                    </span>
                    <span className="whitespace-nowrap">
                      · {formatDateValue(video.createdAt)}
                    </span>
                    <span className="whitespace-nowrap">
                      · {video.scriptureRef}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-[#0B0B0D] leading-snug">
                    {video.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#52525B] line-clamp-3 leading-relaxed">
                    {video.summary}
                  </p>
                </div>
              </div>

              <div className="px-4 sm:px-5 py-3.5 border-t border-[#F4F4F5] flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#71717A] tabular-nums whitespace-nowrap">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{video.viewCount} views</span>
                </span>
                <button
                  type="button"
                  onClick={() => onWatchSermon(video)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Watch Video</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
