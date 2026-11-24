import { useMemo, useState } from 'react';
import { ArrowRight, Eye, MessageSquare, Search } from 'lucide-react';
import {
  FaithArticle,
  ReactionType,
  Sermon,
  formatDateValue,
} from '../types/ministry';
import { EncouragementPostCard } from '../components/EncouragementPostCard';
import { ResilientImage } from '../components/ResilientImage';

interface BlogPageProps {
  encouragements: Sermon[];
  articles: FaithArticle[];
  reactedKeys: Record<string, boolean>;
  onReact: (post: Sermon, reaction: ReactionType) => void;
  onReadEncouragement: (post: Sermon) => void;
  onReadArticle: (article: FaithArticle) => void;
  onAskFaithQuestion: () => void;
}

export function BlogPage({
  encouragements,
  articles,
  reactedKeys,
  onReact,
  onReadEncouragement,
  onReadArticle,
  onAskFaithQuestion,
}: BlogPageProps) {
  const [sectionFilter, setSectionFilter] = useState<'all' | 'encouragement' | 'faith'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const q = searchQuery.trim().toLowerCase();

  const filteredEncouragements = useMemo(() => {
    if (sectionFilter === 'faith') return [];
    return encouragements.filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.scriptureRef.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
      );
    });
  }, [encouragements, sectionFilter, q]);

  const filteredArticles = useMemo(() => {
    if (sectionFilter === 'encouragement') return [];
    return articles.filter((a) => {
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.questionPrompt.toLowerCase().includes(q) ||
        a.topic.toLowerCase().includes(q) ||
        a.scriptureRef.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q)
      );
    });
  }, [articles, sectionFilter, q]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-4 pb-6 border-b border-[#E4E4E7] text-center lg:text-left">
        <div className="max-w-2xl space-y-1.5">
          <p className="text-[11px] sm:text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
            Words of Encouragement &amp; Answers About Faith
          </p>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#0B0B0D] whitespace-nowrap">
            Ministry Blog
          </h1>
          <p className="text-sm sm:text-base text-[#52525B]">
            Read full Words of Encouragement and Scripture-based answers to real questions about Christian faith.
          </p>
        </div>

        <button
          type="button"
          onClick={onAskFaithQuestion}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] transition-colors cursor-pointer whitespace-nowrap shrink-0 self-center lg:self-auto"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask a Question About Faith</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center justify-center gap-1 p-1 rounded-none bg-white border border-[#E4E4E7]">
          {(
            [
              { id: 'all', label: 'All Reading' },
              { id: 'encouragement', label: 'Words of Encouragement' },
              { id: 'faith', label: 'Answers About Faith' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSectionFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                sectionFilter === tab.id
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#52525B] hover:text-[#0B0B0D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-sm md:w-64">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search encouragement or faith topic..."
            aria-label="Search blog posts"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7] text-[#0B0B0D] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Words of Encouragement Full Posts */}
      {filteredEncouragements.length > 0 && (
        <section className="space-y-4 sm:space-y-5">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#0B0B0D] tracking-tight text-center md:text-left whitespace-nowrap">
            Words of Encouragement
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {filteredEncouragements.map((post) => (
              <EncouragementPostCard
                key={post.id}
                post={post}
                reactedKeys={reactedKeys}
                onReact={onReact}
                onReadMore={onReadEncouragement}
                readButtonLabel="Read Full Post"
              />
            ))}
          </div>
        </section>
      )}

      {/* Answers About Faith Articles */}
      {filteredArticles.length > 0 && (
        <section className="space-y-4 sm:space-y-5 pt-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#0B0B0D] tracking-tight text-center md:text-left">
            Answers About Christian Faith
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                className="bg-white border border-[#E4E4E7] rounded-none overflow-hidden flex flex-col justify-between hover:border-[#2563EB] transition-colors text-center md:text-left"
              >
                <div>
                  {article.coverImage && (
                    <div className="aspect-video w-full bg-[#F4F4F5] border-b border-[#E4E4E7] overflow-hidden">
                      <ResilientImage
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        fallbackTitle={article.title}
                      />
                    </div>
                  )}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-[#52525B]">
                      <span className="font-semibold text-[#2563EB]">{article.topic}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.scriptureRef}</span>
                    </div>

                    <p className="text-xs font-medium text-[#71717A]">
                      Q: {article.questionPrompt}
                    </p>

                    <h3 className="text-base sm:text-lg font-semibold text-[#0B0B0D] tracking-tight leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-4 sm:px-5 pb-4 pt-3.5 border-t border-[#F4F4F5] flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#71717A] tabular-nums">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{article.viewCount} views</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDateValue(article.createdAt)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onReadArticle(article)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
                  >
                    <span>Read Answer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {filteredEncouragements.length === 0 && filteredArticles.length === 0 && (
        <div className="bg-white border border-[#E4E4E7] rounded-none p-8 sm:p-10 text-center space-y-3">
          <p className="text-lg font-semibold text-[#0B0B0D]">
            No posts matched your search
          </p>
          <button
            type="button"
            onClick={() => {
              setSectionFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white cursor-pointer"
          >
            Show All Reading
          </button>
        </div>
      )}
    </div>
  );
}
