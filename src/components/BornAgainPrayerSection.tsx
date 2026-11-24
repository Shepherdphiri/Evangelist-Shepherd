import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PageRoute } from '../types/ministry';

interface BornAgainPrayerSectionProps {
  onNavigate: (page: PageRoute) => void;
}

const CONFESSION_PRAYERS = {
  english: {
    label: 'English',
    text: "Lord Jesus, I confess that I am a sinner and I need Your grace. I believe that You died on the cross for my sins and rose from the dead to give me eternal life. Today, I turn away from my old life and invite You into my heart as my Lord and Savior. Wash me clean, make me new, and fill me with Your Holy Spirit so I can follow You all the days of my life. In Jesus' name, Amen.",
    followUp: 'Just prayed this prayer? Let us walk with you.',
    ctaLabel: 'Share & Connect',
  },
  chichewa: {
    label: 'Chichewa',
    text: "Ambuye Yesu, ndikuvomereza kuti ndine wochimwa ndipo ndikufuna chisomo Chanu. Ndikukhulupirira kuti mudafa pa mtanda chifukwa cha machimo anga ndipo mudauka kwa akufa kuti mundipatse moyo wosatha. Lero, ndikutembenuka kuchoka ku moyo wanga wakale ndipo ndikukuitanani mu mtima mwanga monga Ambuye ndi Mpulumutsi wanga. Ndisambitseni ndi kundiyeretsa, ndipangeni kukhala watsopano, ndipo ndidzazeni ndi Mzimu Wanu Woyera kuti ndikutsateni masiku onse a moyo wanga. M'dzina la Yesu, Ameni.",
    followUp: 'Kodi mwapemphera pempheroli? Lumikizanani nafe.',
    ctaLabel: 'Lumikizanani Nafe',
  },
} as const;

type PrayerLanguage = keyof typeof CONFESSION_PRAYERS;

export function BornAgainPrayerSection({
  onNavigate,
}: BornAgainPrayerSectionProps) {
  const [language, setLanguage] = useState<PrayerLanguage>('english');
  const activePrayer = CONFESSION_PRAYERS[language];

  return (
    <section
      className="py-7 sm:py-10 border-t border-[#E4E4E7]"
      aria-labelledby="born-again-prayer-heading"
    >
      <div className="bg-white border border-[#E4E4E7] rounded-none p-5 sm:p-8 space-y-5">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4 pb-4 border-b border-[#F4F4F5] text-center md:text-left">
          <div className="space-y-1">
            <p className="text-[11px] sm:text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
              Confession Prayer
            </p>
            <h2
              id="born-again-prayer-heading"
              className="text-lg sm:text-3xl font-semibold tracking-tight text-[#0B0B0D] whitespace-nowrap"
            >
              Become A Born Again Today
            </h2>
          </div>

          <div
            className="inline-flex items-center p-1 rounded-none bg-[#FAFAFA] border border-[#E4E4E7] shrink-0"
            role="tablist"
            aria-label="Confession prayer language"
          >
            <button
              type="button"
              role="tab"
              aria-selected={language === 'english'}
              onClick={() => setLanguage('english')}
              className={`px-4 py-1.5 rounded-none text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                language === 'english'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#52525B] hover:text-[#0B0B0D]'
              }`}
            >
              English
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={language === 'chichewa'}
              onClick={() => setLanguage('chichewa')}
              className={`px-4 py-1.5 rounded-none text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                language === 'chichewa'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#52525B] hover:text-[#0B0B0D]'
              }`}
            >
              Chichewa
            </button>
          </div>
        </div>

        <blockquote className="text-center md:text-left">
          <p className="text-sm sm:text-lg italic text-[#0B0B0D] leading-relaxed">
            &ldquo;{activePrayer.text}&rdquo;
          </p>
        </blockquote>

        <div className="pt-4 border-t border-[#F4F4F5] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-xs text-[#52525B]">{activePrayer.followUp}</p>
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
          >
            <span>{activePrayer.ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
