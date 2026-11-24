import { useEffect, useState } from 'react';
import { Check, Eye, Share2, Video, X } from 'lucide-react';
import {
  Sermon,
  formatDateValue,
  getYoutubeEmbedUrl,
} from '../types/ministry';
import { ResilientImage } from './ResilientImage';

interface SermonReaderModalProps {
  sermon: Sermon | null;
  onClose: () => void;
}

export function SermonReaderModal({ sermon, onClose }: SermonReaderModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sermon) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sermon, onClose]);

  if (!sermon) return null;

  const isBlogEncouragement = sermon.category === 'Word of Encouragement';
  const embedUrl = isBlogEncouragement ? null : getYoutubeEmbedUrl(sermon.videoUrl);
  const paragraphs = sermon.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const handleShare = async () => {
    const shareText = `${sermon.title} (${sermon.scriptureRef}) — ${sermon.authorName}\n\n${sermon.summary}\n${window.location.href}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: sermon.title,
          text: `${sermon.title} — ${sermon.scriptureRef}`,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sermon-reader-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white border border-[#E4E4E7] rounded-none shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-white/95 backdrop-blur-xs border-b border-[#E4E4E7]">
          <div className="flex items-center gap-2 text-xs text-[#52525B] truncate">
            <span className="font-semibold text-[#2563EB]">{sermon.category}</span>
            <span aria-hidden="true">·</span>
            <span>{sermon.scriptureRef}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Eye className="w-3.5 h-3.5 text-[#71717A]" />
              <span>{sermon.viewCount} views</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0B0B0D] border border-[#E4E4E7] rounded-lg bg-[#FAFAFA] hover:bg-[#F4F4F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close video and reading view"
              className="inline-flex items-center justify-center w-10 h-10 text-[#0B0B0D] hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <article className="p-6 sm:p-10 space-y-8">
          <header className="space-y-3">
            <h2
              id="sermon-reader-title"
              className="text-2xl sm:text-3xl font-semibold text-[#0B0B0D] tracking-tight leading-tight"
            >
              {sermon.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#52525B]">
              <span>By {sermon.authorName}</span>
              <span aria-hidden="true">·</span>
              <span>{formatDateValue(sermon.createdAt)}</span>
            </div>
          </header>

          {embedUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-none border border-[#E4E4E7] bg-black">
              <iframe
                title={sermon.title}
                src={`${embedUrl}&autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : sermon.category !== 'Word of Encouragement' ? (
            <div className="aspect-video w-full overflow-hidden rounded-none border border-[#E4E4E7] bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center space-y-2">
              <Video className="w-8 h-8 text-[#2563EB]" />
              <p className="text-sm font-semibold text-[#0B0B0D]">
                Video Player Ready
              </p>
              <p className="text-xs text-[#52525B] max-w-md">
                Paste a specific YouTube video link (e.g. youtube.com/watch?v=... or youtu.be/...) in the Admin Console to play this message right here.
              </p>
            </div>
          ) : sermon.coverImage ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-none border border-[#E4E4E7] bg-[#F4F4F5]">
              <ResilientImage
                src={sermon.coverImage}
                alt={sermon.title}
                fallbackTitle={sermon.title}
              />
            </div>
          ) : null}

          {sermon.scriptureQuote && (
            <blockquote className="py-6 border-y border-[#E4E4E7] text-center px-4 sm:px-8">
              <p className="italic text-xl sm:text-2xl text-[#0B0B0D] leading-relaxed font-normal">
                &ldquo;{sermon.scriptureQuote}&rdquo;
              </p>
              <footer className="mt-3 text-xs tracking-widest uppercase text-[#2563EB] font-semibold">
                {sermon.scriptureRef}
              </footer>
            </blockquote>
          )}

          <div className="max-w-prose mx-auto space-y-5 text-[16px] leading-[1.8] text-[#27272A]">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
