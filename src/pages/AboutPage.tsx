import { ArrowRight } from 'lucide-react';
import {
  MinistryProgram,
  MinistrySettings,
  PageRoute,
  Sermon,
} from '../types/ministry';
import {
  ABSTRACT_ART_PATH,
  PORTRAIT_IMAGE_PATH,
} from '../data/defaultMinistryData';
import { ResilientImage } from '../components/ResilientImage';
import { ProgramsSection } from '../components/ProgramsSection';
import { SocialPortalsSection } from '../components/SocialPortalsSection';

interface AboutPageProps {
  settings: MinistrySettings;
  programs: MinistryProgram[];
  latestMidweek: Sermon | null;
  isAdmin: boolean;
  onNavigate: (page: PageRoute) => void;
  onInquireProgram: (programTitle: string) => void;
  onOpenMidweekNotes: (sermon: Sermon) => void;
  onOpenStudioSocial: () => void;
}

const CORE_PILLARS = [
  {
    num: '01',
    title: 'Clear Gospel Preaching',
    body: 'Proclaiming the grace, cross, and resurrection of Jesus Christ in plain language that speaks to everyday life.',
  },
  {
    num: '02',
    title: 'Honest Answers About Faith',
    body: 'Creating a thoughtful space where seekers, skeptics, and believers can ask real questions and receive biblical clarity.',
  },
  {
    num: '03',
    title: 'Daily Words of Encouragement',
    body: 'Strengthening weary hearts through brief scripture reflections, short YouTube teachings, and pastoral care.',
  },
  {
    num: '04',
    title: 'Intercession & Outreach',
    body: 'Standing with families in private prayer and partnering with local churches for Gospel outreach.',
  },
];

export function AboutPage({
  settings,
  programs,
  latestMidweek,
  isAdmin,
  onNavigate,
  onInquireProgram,
  onOpenMidweekNotes,
  onOpenStudioSocial,
}: AboutPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12">
      {/* Intro Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
        <div className="lg:col-span-5 rounded-none overflow-hidden border border-[#E4E4E7] bg-[#F4F4F5] min-h-[300px] sm:min-h-[360px]">
          <ResilientImage
            src={settings.portraitUrl || PORTRAIT_IMAGE_PATH}
            alt="Evangelist Shepherd Portrait"
            className="w-full h-full object-cover object-top"
            fallbackTitle="Evangelist Shepherd"
          />
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E4E4E7] rounded-none p-5 sm:p-9 flex flex-col justify-between space-y-6 text-center lg:text-left">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
              About the Ministry
            </p>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#0B0B0D] leading-tight">
              Calling, Vision &amp; Pastoral Ministry
            </h1>
            <p className="text-sm sm:text-base text-[#3F3F46] leading-relaxed">
              {settings.aboutBio}
            </p>
          </div>

          <div className="pt-5 border-t border-[#E4E4E7] flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#71717A] font-semibold">
                Ministry Base
              </p>
              <p className="text-sm font-medium text-[#0B0B0D] mt-0.5">
                {settings.location}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Invite or Send Prayer Request</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Core Pillars + Abstract Architectural Frame */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {CORE_PILLARS.map((pillar) => (
            <div
              key={pillar.num}
              className="bg-white border border-[#E4E4E7] rounded-none p-5 space-y-2 text-center sm:text-left"
            >
              <p className="text-xs font-semibold text-[#2563EB] tabular-nums">
                {pillar.num}.
              </p>
              <h2 className="text-base sm:text-lg font-semibold text-[#0B0B0D]">
                {pillar.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 rounded-none overflow-hidden border border-[#E4E4E7] bg-[#F4F4F5] min-h-[240px]">
          <ResilientImage
            src={ABSTRACT_ART_PATH}
            alt="Abstract light and architectural geometry"
            fallbackTitle="Ministry Vision"
          />
        </div>
      </section>

      {/* Programs */}
      <ProgramsSection
        programs={programs}
        latestMidweek={latestMidweek}
        onInquireProgram={onInquireProgram}
        onOpenMidweekNotes={onOpenMidweekNotes}
      />

      {/* Social Media Portals */}
      <SocialPortalsSection
        settings={settings}
        isAdmin={isAdmin}
        onOpenStudioSocial={onOpenStudioSocial}
      />
    </div>
  );
}
