import { MinistrySettings, PrayerRequestType } from '../types/ministry';
import { PrayerContactSection } from '../components/PrayerContactSection';
import { SocialPortalsSection } from '../components/SocialPortalsSection';

interface ContactPageProps {
  settings: MinistrySettings;
  isAdmin: boolean;
  useNeonDb?: boolean;
  defaultSubject?: string;
  defaultType?: PrayerRequestType;
  onOpenStudioSocial: () => void;
}

export function ContactPage({
  settings,
  isAdmin,
  useNeonDb = false,
  defaultSubject,
  defaultType,
  onOpenStudioSocial,
}: ContactPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      <PrayerContactSection
        defaultSubject={defaultSubject}
        defaultType={defaultType}
        useNeonDb={useNeonDb}
      />
      <SocialPortalsSection
        settings={settings}
        isAdmin={isAdmin}
        onOpenStudioSocial={onOpenStudioSocial}
      />
    </div>
  );
}
