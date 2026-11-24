import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScriptureItem {
  ref: string;
  text: string;
}

interface WeeklyScriptureCarouselProps {
  primaryRef: string;
  primaryVerse: string;
}

const ADDITIONAL_VERSES: ScriptureItem[] = [
  {
    ref: 'John 3:16',
    text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
  },
  {
    ref: 'Romans 10:9',
    text: 'If you confess with your mouth that Jesus is Lord and believe in your heart that God raised him from the dead, you will be saved.',
  },
  {
    ref: 'Isaiah 41:10',
    text: 'Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.',
  },
  {
    ref: 'Matthew 11:28',
    text: 'Come to me, all who labor and are heavy laden, and I will give you rest.',
  },
  {
    ref: '2 Corinthians 5:17',
    text: 'Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.',
  },
  {
    ref: 'Philippians 4:6–7',
    text: 'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.',
  },
];

export function WeeklyScriptureCarousel({
  primaryRef,
  primaryVerse,
}: WeeklyScriptureCarouselProps) {
  const verses = useMemo<ScriptureItem[]>(() => {
    const first: ScriptureItem = {
      ref: primaryRef,
      text: primaryVerse,
    };
    const filteredOthers = ADDITIONAL_VERSES.filter(
      (item) => item.ref.toLowerCase() !== primaryRef.trim().toLowerCase()
    );
    return [first, ...filteredOthers].slice(0, 6);
  }, [primaryRef, primaryVerse]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || verses.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % verses.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused, verses.length]);

  const safeIndex = activeIndex % verses.length;
  const current = verses[safeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + verses.length) % verses.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % verses.length);
  };

  return (
    <div
      className="relative z-10 mt-3 pt-3 sm:mt-8 sm:pt-5 border-t border-[#E4E4E7] space-y-2 text-center sm:text-left"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="text-[9px] sm:text-xs uppercase tracking-widest text-[#71717A] font-semibold">
        Weekly Scripture · {current.ref}
      </p>

      <p className="text-[11px] sm:text-sm lg:text-base italic text-[#0B0B0D] leading-snug sm:leading-normal min-h-[2.75rem] sm:min-h-[3.25rem]">
        &ldquo;{current.text}&rdquo;
      </p>

      <div className="flex items-center justify-center sm:justify-between gap-2 pt-0.5">
        <div
          className="flex items-center gap-1"
          role="tablist"
          aria-label="Select scripture verse"
        >
          {verses.map((v, idx) => (
            <button
              key={v.ref}
              type="button"
              role="tab"
              aria-selected={idx === safeIndex}
              aria-label={`Verse ${idx + 1}: ${v.ref}`}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-none transition-all cursor-pointer ${
                idx === safeIndex
                  ? 'w-5 sm:w-6 bg-[#2563EB]'
                  : 'w-2 sm:w-2.5 bg-[#E4E4E7] hover:bg-[#A1A1AA]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] sm:text-xs text-[#71717A] tabular-nums mr-1">
            {safeIndex + 1}/{verses.length}
          </span>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous scripture verse"
            className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-none border border-[#E4E4E7] bg-[#FAFAFA] text-[#0B0B0D] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next scripture verse"
            className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-none border border-[#E4E4E7] bg-[#FAFAFA] text-[#0B0B0D] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
