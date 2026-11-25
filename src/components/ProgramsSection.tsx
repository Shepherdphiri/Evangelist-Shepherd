import { ArrowRight, Calendar, MapPin } from 'lucide-react';
import { MinistryProgram } from '../types/ministry';

interface ProgramsSectionProps {
  programs: MinistryProgram[];
  onInquireProgram: (programTitle: string) => void;
}

export function ProgramsSection({
  programs,
  onInquireProgram,
}: ProgramsSectionProps) {
  const visiblePrograms = programs.filter(
    (program) =>
      !program.title.toLowerCase().includes('midweek') &&
      !program.format.toLowerCase().includes('midweek')
  );

  if (visiblePrograms.length === 0) return null;

  return (
    <section
      aria-labelledby="word-of-day-heading"
      className="py-8 sm:py-12 border-t border-[#E4E4E7]"
    >
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-2 md:gap-6 pb-5 sm:pb-6 text-center md:text-left">
        <div className="max-w-2xl space-y-1">
          <p className="text-[11px] sm:text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
            Daily Grace
          </p>
          <h2
            id="word-of-day-heading"
            className="text-lg sm:text-3xl font-semibold tracking-tight text-[#0B0B0D] whitespace-nowrap"
          >
            Word of the Day
          </h2>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${
          visiblePrograms.length > 1 ? 'md:grid-cols-2' : ''
        } gap-4 sm:gap-5 items-stretch`}
      >
        {visiblePrograms.map((program) => (
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
        ))}
      </div>
    </section>
  );
}
