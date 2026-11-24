import {
  ArrowUpRight,
  Globe,
  Mail,
  MessageCircle,
  Mic,
  PlaySquare,
  Radio,
  Share2,
} from 'lucide-react';
import { MinistrySettings } from '../types/ministry';

interface SocialPortalsSectionProps {
  settings: MinistrySettings;
  isAdmin: boolean;
  onOpenStudioSocial: () => void;
}

interface PortalItem {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  icon: typeof PlaySquare;
}

export function SocialPortalsSection({
  settings,
  isAdmin,
  onOpenStudioSocial,
}: SocialPortalsSectionProps) {
  const portals: PortalItem[] = [
    {
      id: 'youtube',
      name: 'YouTube Channel',
      subtitle: 'Short video sermons, Gospel teachings & live streams',
      url: settings.youtubeUrl,
      icon: PlaySquare,
    },
    {
      id: 'facebook',
      name: 'Facebook Ministry',
      subtitle: 'Weekly devotions, fellowship updates & live prayer',
      url: settings.facebookUrl,
      icon: Globe,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      subtitle: 'Daily scripture graphics & encouragement reels',
      url: settings.instagramUrl,
      icon: Share2,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      subtitle: '60-second Gospel truths & morning encouragement',
      url: settings.tiktokUrl,
      icon: Radio,
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      subtitle: 'Daily prayer prompts & brief biblical reflections',
      url: settings.xUrl,
      icon: Globe,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Channel',
      subtitle: 'Direct devotional broadcasts & ministry updates',
      url: settings.whatsappUrl,
      icon: MessageCircle,
    },
    {
      id: 'podcast',
      name: 'Audio Podcast',
      subtitle: 'Listen to sermons on the go anywhere',
      url: settings.podcastUrl,
      icon: Mic,
    },
  ].filter((item) => item.url && item.url.trim().length > 0);

  return (
    <section
      aria-labelledby="social-portals-heading"
      className="py-8 sm:py-12 border-t border-[#E4E4E7]"
    >
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-3 md:gap-6 pb-5 sm:pb-6 text-center md:text-left">
        <div className="max-w-2xl space-y-1">
          <p className="text-[11px] sm:text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
            Social Portals
          </p>
          <h2
            id="social-portals-heading"
            className="text-xl sm:text-3xl font-semibold tracking-tight text-[#0B0B0D]"
          >
            Follow &amp; Connect Across Platforms
          </h2>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenStudioSocial}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-white text-[#0B0B0D] hover:bg-[#F4F4F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Edit Social Links
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {portals.map((portal) => {
          const Icon = portal.icon;
          return (
            <a
              key={portal.id}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between p-4 sm:p-5 rounded-none bg-white border border-[#E4E4E7] hover:border-[#2563EB] transition-colors text-center sm:text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-9 h-9 rounded-none flex items-center justify-center bg-[#F4F4F5] text-[#2563EB]">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.7} />
                </div>
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#71717A] group-hover:text-[#2563EB] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-base sm:text-lg font-semibold text-[#0B0B0D] group-hover:text-[#2563EB] transition-colors">
                  {portal.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                  {portal.subtitle}
                </p>
              </div>
            </a>
          );
        })}

        {settings.contactEmail && (
          <a
            href={`mailto:${settings.contactEmail}`}
            className="group flex flex-col justify-between p-4 sm:p-5 rounded-none bg-[#0B0B0D] text-white border border-[#0B0B0D] hover:bg-[#2563EB] hover:border-[#2563EB] transition-colors text-center sm:text-left"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-9 h-9 rounded-none flex items-center justify-center bg-white/10 text-white">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.7} />
              </div>
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/75 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Direct Ministry Email
              </h3>
              <p className="text-xs sm:text-sm text-white/80 break-all">
                {settings.contactEmail}
              </p>
            </div>
          </a>
        )}
      </div>
    </section>
  );
}
