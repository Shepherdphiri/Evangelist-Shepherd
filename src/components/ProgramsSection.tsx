import { ArrowRight, Calendar, Eye, MapPin, Play } from 'lucide-react';
import { MinistryProgram, Sermon } from '../types/ministry';

interface ProgramsSectionProps {
  programs: MinistryProgram[];
  latestMidweek?: Sermon | null;
  onInquireProgram: (programTitle: string) => void;
  onOpenMidweekNotes?: (sermon: Sermon) => void;
}

export function ProgramsSection({
  programs,
  latestMidweek,
  onInquireProgram,
  onOpenMidweekNotes,
}: ProgramsSectionProps) {
  if (programs.length === 0) return null;

  return (
    <section aria-labelledby="programs-heading" className="py-8 sm:py-12 border-t border-[#E4E4E7]">
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-2 md:gap-6 pb-5 sm:pb-6 text-center md:text-left">
        <div className="max-w-2xl space-y-1">
          <p className="text-[11px] sm:text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
            Ministry Rhythm
          </p>
          <h2
            id="programs-heading"
            className="text-lg sm:text-3xl font-semibold tracking-tight text-[#0B0B0D] whitespace-nowrap"
          >
            Ministry Programs &amp; Gatherings
          </h2>
          <p className="text-xs sm:text-sm text-[#52525B]">
            Daily encouragement and every Wednesday&rsquo;s Midweek Message.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {programs.map((program) => {
          const isMidweekProgram = program.title.toLowerCase().includes('midweek');

          return (
            <div
              key={program.id}
              className="bg-white border border-[#E4E4E7] rounded-none p-4 sm:p-6 flex flex-col justify-between gap-4 hover:border-[#2563EB] transition-colors text-center md:text-left"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-center md:justify-between gap-x-2.5 gap-y-1">
                  <h3 className="text-base sm:text-lg font-semibold text-[#0B0B0D] tracking-tight">
                    {program.title}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{program.schedule}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                  {program.description}
                </p>

                {isMidweekProgram && latestMidweek && onOpenMidweekNotes && (
                  <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenMidweekNotes(latestMidweek)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch Latest: {latestMidweek.title}</span>
                    </button>
                    <span className="inline-flex items-center gap-1 text-xs text-[#71717A] tabular-nums whitespace-nowrap">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{latestMidweek.viewCount} views</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#F4F4F5] flex flex-wrap items-center justify-center md:justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#52525B]">
                  <MapPin className="w-3.5 h-3.5 text-[#71717A]" />
                  <span>{program.locationOrLink}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onInquireProgram(program.title)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B0B0D] hover:text-[#2563EB] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Join or Inquire</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
