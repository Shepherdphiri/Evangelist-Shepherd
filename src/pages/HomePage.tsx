import { ArrowRight, Eye, HelpCircle, Youtube } from 'lucide-react';
import {
  FaithArticle,
  MinistryProgram,
  MinistrySettings,
  PageRoute,
  ReactionType,
  Sermon,
} from '../types/ministry';
import { PORTRAIT_IMAGE_PATH } from '../data/defaultMinistryData';
import { ResilientImage } from '../components/ResilientImage';
import { EncouragementPostCard } from '../components/EncouragementPostCard';
import { ProgramsSection } from '../components/ProgramsSection';
import { BornAgainPrayerSection } from '../components/BornAgainPrayerSection';
import { WeeklyScriptureCarousel } from '../components/WeeklyScriptureCarousel';

interface HomePageProps {
  settings: MinistrySettings;
  encouragements: Sermon[];
  latestMidweek: Sermon | null;
  articles: FaithArticle[];
  programs: MinistryProgram[];
  reactedKeys: Record<string, boolean>;
  onReact: (post: Sermon, reaction: ReactionType) => void;
  onOpenEncouragementInBlog: (post: Sermon) => void;
  onOpenMidweekNotes: (sermon: Sermon) => void;
  onReadArticle: (article: FaithArticle) => void;
  onNavigate: (page: PageRoute) => void;
  onInquireProgram: (programTitle: string) => void;
}

export function HomePage({
  settings,
  encouragements,
  latestMidweek,
  articles,
  programs,
  reactedKeys,
  onReact,
  onOpenEncouragementInBlog,
  onOpenMidweekNotes,
  onReadArticle,
  onNavigate,
  onInquireProgram,
}: HomePageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ABSTRACT PORTFOLIO HERO: Side-by-Side (Minimizes & Stays Wide on Mobile) */}
      <section className="py-5 sm:py-10 lg:py-14">
        <div className="grid grid-cols-12 gap-3 sm:gap-6 lg:gap-10 items-stretch">
          <div className="col-span-7 relative flex flex-col justify-between bg-white border border-[#E4E4E7] rounded-none p-4 sm:p-7 lg:p-10 overflow-hidden">
            <svg
              aria-hidden="true"
              viewBox="0 0 320 320"
              className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 sm:w-64 sm:h-64 text-[#2563EB]/10"
              fill="none"
            >
              <circle cx="160" cy="160" r="120" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="160" cy="160" r="76" stroke="currentColor" strokeWidth="1.5" />
              <path d="M40 160H280M160 40V280" stroke="currentColor" strokeWidth="1.5" />
            </svg>

            <div className="relative z-10 space-y-2 sm:space-y-4 text-center sm:text-left">
              <p className="text-[9px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.22em] text-[#2563EB] font-semibold leading-tight">
                {settings.heroEyebrow}
              </p>

              <h1 className="text-base sm:text-3xl lg:text-5xl font-semibold tracking-tight text-[#0B0B0D] leading-[1.08]">
                {settings.evangelistName}
              </h1>

              <p className="text-[11px] sm:text-sm lg:text-base text-[#52525B] leading-snug sm:leading-relaxed max-w-xl mx-auto sm:mx-0">
                {settings.ministryTagline}
              </p>

              <div className="pt-1 sm:pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('sermons')}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg text-[11px] sm:text-sm font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{settings.heroPrimaryCtaLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('blog')}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg text-[11px] sm:text-sm font-semibold border border-[#E4E4E7] bg-[#FAFAFA] text-[#0B0B0D] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{settings.heroSecondaryCtaLabel}</span>
                </button>
              </div>
            </div>

            <WeeklyScriptureCarousel
              primaryRef={settings.weeklyVerseRef}
              primaryVerse={settings.weeklyVerse}
            />
          </div>

          {/* Right Column: Evangelist Shepherd Portrait */}
          <div className="col-span-5 relative flex flex-col">
            <div className="relative flex-1 min-h-[200px] sm:min-h-[340px] lg:min-h-[440px] rounded-none overflow-hidden border border-[#E4E4E7] bg-[#F4F4F5]">
              <ResilientImage
                src={settings.portraitUrl || PORTRAIT_IMAGE_PATH}
                alt="Portrait of Evangelist Shepherd"
                className="w-full h-full object-cover object-top"
                fallbackTitle="Evangelist Shepherd"
              />
            </div>
          </div>
        </div>
      </section>

      {/* BORN AGAIN CONFESSION PRAYER (English | Chichewa) */}
      <BornAgainPrayerSection onNavigate={onNavigate} />

      {/* WORDS OF ENCOURAGEMENT WITH REACTIONS (Read in full inside Blog) */}
      <section className="py-8 sm:py-12 border-t border-[#E4E4E7]" aria-labelledby="encouragement-feed-heading">
        <div className="pb-5 sm:pb-6 text-center md:text-left">
          <div className="max-w-2xl space-y-1 mx-auto md:mx-0">
            <p className="text-[11px] sm:text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
              Daily Grace
            </p>
            <h2
              id="encouragement-feed-heading"
              className="text-xl sm:text-3xl font-semibold tracking-tight text-[#0B0B0D] whitespace-nowrap"
            >
              Words of Encouragement
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {encouragements.map((post) => (
            <EncouragementPostCard
              key={post.id}
              post={post}
              reactedKeys={reactedKeys}
              onReact={onReact}
              onReadMore={onOpenEncouragementInBlog}
              readButtonLabel="Read Full in Blog"
            />
          ))}
        </div>
      </section>

      {/* MINISTRY PROGRAMS SECTION */}
      <ProgramsSection
        programs={programs}
        latestMidweek={latestMidweek}
        onInquireProgram={onInquireProgram}
        onOpenMidweekNotes={onOpenMidweekNotes}
      />

      {/* ANSWERS ABOUT FAITH PREVIEW */}
      {articles.length > 0 && (
        <section className="py-8 sm:py-12 border-t border-[#E4E4E7]" aria-labelledby="home-faith-qa">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-3 md:gap-6 pb-5 sm:pb-6 text-center md:text-left">
            <div className="max-w-2xl space-y-1">
              <p className="text-[11px] sm:text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
                Faith Blog &amp; Q&amp;A
              </p>
              <h2
                id="home-faith-qa"
                className="text-lg sm:text-3xl font-semibold tracking-tight text-[#0B0B0D]"
              >
                Honest Answers About Faith
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('blog')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Visit Blog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {articles.slice(0, 3).map((article) => (
              <div
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
                  <div className="p-4 sm:p-5 space-y-2">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-[#52525B]">
                      <span className="font-semibold text-[#2563EB]">{article.topic}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.scriptureRef}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#0B0B0D] leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#52525B] line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                </div>
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 border-t border-[#F4F4F5] flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 text-xs text-[#71717A] tabular-nums whitespace-nowrap">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{article.viewCount} views</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onReadArticle(article)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B0B0D] hover:text-[#2563EB] transition-colors cursor-pointer"
                  >
                    <span>Read Biblical Answer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
