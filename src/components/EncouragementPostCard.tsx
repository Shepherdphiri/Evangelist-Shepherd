import { useState } from 'react';
import { ArrowRight, Check, Eye, Flame, Heart, Share2 } from 'lucide-react';
import {
  ReactionType,
  Sermon,
  formatDateValue,
} from '../types/ministry';
import { ResilientImage } from './ResilientImage';

interface EncouragementPostCardProps {
  post: Sermon;
  reactedKeys: Record<string, boolean>;
  onReact: (post: Sermon, reaction: ReactionType) => void;
  onReadMore: (post: Sermon) => void;
  readButtonLabel?: string;
}

export function EncouragementPostCard({
  post,
  reactedKeys,
  onReact,
  onReadMore,
  readButtonLabel = 'Read Full in Blog',
}: EncouragementPostCardProps) {
  const [copied, setCopied] = useState(false);
  const amenActive = Boolean(reactedKeys[`${post.id}:amenCount`]);
  const loveActive = Boolean(reactedKeys[`${post.id}:loveCount`]);

  const handleShare = async () => {
    const shareText = `${post.title} (${post.scriptureRef}) — ${post.authorName}\n\n${post.summary}\n${window.location.href}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: `${post.title} — ${post.scriptureRef}`,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <article className="bg-white border border-[#E4E4E7] rounded-none overflow-hidden flex flex-col justify-between hover:border-[#D4D4D8] transition-colors">
      <div>
        {post.coverImage && (
          <div className="aspect-video w-full bg-[#F4F4F5] border-b border-[#E4E4E7] overflow-hidden">
            <ResilientImage
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
              fallbackTitle={post.title}
            />
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-2 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-between gap-2 text-[11px] sm:text-xs text-[#52525B]">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-1.5 gap-y-0.5">
              <span className="font-semibold text-[#2563EB] whitespace-nowrap">
                Word of Encouragement
              </span>
              <span className="whitespace-nowrap">
                · {formatDateValue(post.createdAt)}
              </span>
              <span className="whitespace-nowrap">
                · {post.scriptureRef}
              </span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#71717A]" />
                <span>{post.viewCount} views</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{post.readTimeMinutes} min read</span>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-semibold text-[#0B0B0D] tracking-tight leading-snug">
            {post.title}
          </h3>

          <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
            {post.summary}
          </p>

          {post.scriptureQuote && (
            <p className="text-xs sm:text-sm italic text-[#3F3F46] pt-0.5">
              &ldquo;{post.scriptureQuote}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-4 pt-3 border-t border-[#F4F4F5] flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-2 flex-nowrap"
          role="group"
          aria-label="React and share this word of encouragement"
        >
          <button
            type="button"
            onClick={() => onReact(post, 'amenCount')}
            disabled={amenActive}
            aria-label={`Amen (${post.amenCount})`}
            title="Amen"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-default ${
              amenActive
                ? 'bg-[#EEF2FF] border-[#2563EB] text-[#2563EB]'
                : 'bg-[#FAFAFA] border-[#E4E4E7] text-[#3F3F46] hover:border-[#2563EB] hover:text-[#2563EB]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="tabular-nums font-semibold">{post.amenCount}</span>
          </button>

          <button
            type="button"
            onClick={() => onReact(post, 'loveCount')}
            disabled={loveActive}
            aria-label={`Love (${post.loveCount})`}
            title="Love"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-default ${
              loveActive
                ? 'bg-[#EEF2FF] border-[#2563EB] text-[#2563EB]'
                : 'bg-[#FAFAFA] border-[#E4E4E7] text-[#3F3F46] hover:border-[#2563EB] hover:text-[#2563EB]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span className="tabular-nums font-semibold">{post.loveCount}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleShare()}
            aria-label="Share word of encouragement"
            title={copied ? 'Link copied' : 'Share'}
            className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-none text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
              copied
                ? 'bg-[#EEF2FF] border-[#2563EB] text-[#2563EB]'
                : 'bg-[#FAFAFA] border-[#E4E4E7] text-[#3F3F46] hover:border-[#2563EB] hover:text-[#2563EB]'
            }`}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => onReadMore(post)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>{readButtonLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}
