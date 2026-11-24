import { useEffect, useState } from 'react';
import { Check, Eye, MessageSquare, Share2, X } from 'lucide-react';
import { FaithArticle, formatDateValue } from '../types/ministry';
import { ResilientImage } from './ResilientImage';

interface ArticleReaderModalProps {
  article: FaithArticle | null;
  onClose: () => void;
  onAskFollowUp: (articleTitle: string) => void;
}

export function ArticleReaderModal({
  article,
  onClose,
  onAskFollowUp,
}: ArticleReaderModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!article) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [article, onClose]);

  if (!article) return null;

  const paragraphs = article.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const handleShare = async () => {
    const shareText = `${article.title} (${article.scriptureRef}) — ${article.authorName}\n${window.location.href}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // ignore clipboard failures
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="faith-article-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white border border-[#E4E4E7] rounded-none shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-white/95 backdrop-blur-xs border-b border-[#E4E4E7]">
          <div className="flex items-center gap-2 text-xs text-[#52525B] truncate">
            <span className="font-semibold text-[#2563EB]">{article.topic}</span>
            <span aria-hidden="true">·</span>
            <span>{article.scriptureRef}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Eye className="w-3.5 h-3.5 text-[#71717A]" />
              <span>{article.viewCount} views</span>
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
              aria-label="Close article"
              className="inline-flex items-center justify-center w-10 h-10 text-[#0B0B0D] hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <article className="p-6 sm:p-10 space-y-7">
          <header className="space-y-3 border-b border-[#E4E4E7] pb-6">
            <p className="text-sm font-medium text-[#52525B]">
              Question: {article.questionPrompt}
            </p>
            <h2
              id="faith-article-title"
              className="text-2xl sm:text-3xl font-semibold text-[#0B0B0D] tracking-tight leading-tight"
            >
              {article.title}
            </h2>
            <p className="text-xs text-[#71717A]">
              By {article.authorName} · {formatDateValue(article.createdAt)}
            </p>
          </header>

          {article.coverImage && (
            <div className="aspect-video w-full overflow-hidden rounded-none border border-[#E4E4E7] bg-[#F4F4F5]">
              <ResilientImage
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover"
                fallbackTitle={article.title}
              />
            </div>
          )}

          <div className="max-w-prose mx-auto space-y-5 text-[16px] leading-[1.8] text-[#27272A]">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>

          <div className="max-w-prose mx-auto pt-6 border-t border-[#E4E4E7] flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#0B0B0D]">
                Still have questions about this topic?
              </p>
              <p className="text-xs text-[#52525B]">
                Send a personal faith question directly to Evangelist Shepherd.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAskFollowUp(article.title);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] transition-colors cursor-pointer whitespace-nowrap"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask About Faith</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
