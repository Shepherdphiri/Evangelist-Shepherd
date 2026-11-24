/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Shield } from 'lucide-react';
import {
  ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  handleFirestoreError,
} from './firebase';
import {
  FaithArticle,
  MinistryProgram,
  MinistrySettings,
  PageRoute,
  PrayerRequestType,
  ReactionType,
  Sermon,
  getTimestampMillis,
} from './types/ministry';
import {
  DEFAULT_MINISTRY_SETTINGS,
  PORTRAIT_IMAGE_PATH,
  STARTER_FAITH_ARTICLES,
  STARTER_PROGRAMS,
  STARTER_SERMONS,
} from './data/defaultMinistryData';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { SermonReaderModal } from './components/SermonReaderModal';
import { ArticleReaderModal } from './components/ArticleReaderModal';
import {
  MinistryStudioModal,
  StudioTab,
} from './components/MinistryStudioModal';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { SermonsPage } from './pages/SermonsPage';
import { BlogPage } from './pages/BlogPage';
import { ContactPage } from './pages/ContactPage';

const REACTIONS_STORAGE_KEY = 'evangelist_shepherd_reactions_v1';
const VIEWS_SESSION_KEY = 'evangelist_shepherd_viewed_v1';

interface EngagementMetricOffsets {
  viewCount: number;
  amenCount: number;
  prayCount: number;
  loveCount: number;
}

function parseHashRoute(): PageRoute {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (
    hash === 'about' ||
    hash === 'sermons' ||
    hash === 'blog' ||
    hash === 'contact'
  ) {
    return hash;
  }
  return 'home';
}

function EvangelistShepherdApp() {
  const [currentPage, setCurrentPage] = useState<PageRoute>(() => parseHashRoute());
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [firestoreSermons, setFirestoreSermons] = useState<Sermon[]>([]);
  const [sermonsLoaded, setSermonsLoaded] = useState(false);

  const [firestoreArticles, setFirestoreArticles] = useState<FaithArticle[]>([]);
  const [articlesLoaded, setArticlesLoaded] = useState(false);

  const [firestorePrograms, setFirestorePrograms] = useState<MinistryProgram[]>([]);
  const [programsLoaded, setProgramsLoaded] = useState(false);

  const [settings, setSettings] = useState<MinistrySettings>(
    DEFAULT_MINISTRY_SETTINGS
  );

  const [activeSermon, setActiveSermon] = useState<Sermon | null>(null);
  const [activeArticle, setActiveArticle] = useState<FaithArticle | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<StudioTab>('sermons');

  const [contactDefaultSubject, setContactDefaultSubject] = useState('');
  const [contactDefaultType, setContactDefaultType] =
    useState<PrayerRequestType>('Prayer Request');

  const [reactedKeys, setReactedKeys] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(REACTIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [engagementMetrics, setEngagementMetrics] = useState<
    Record<string, EngagementMetricOffsets>
  >({});
  const viewedSessionRef = useRef<Set<string>>(
    (() => {
      try {
        const raw = sessionStorage.getItem(VIEWS_SESSION_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return new Set<string>(Array.isArray(parsed) ? parsed : []);
      } catch {
        return new Set<string>();
      }
    })()
  );

  const isAdmin = Boolean(
    authReady && user && user.email === ADMIN_EMAIL && user.emailVerified
  );

  useEffect(() => {
    const onHashChange = () => {
      setCurrentPage(parseHashRoute());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (page: PageRoute) => {
    const targetHash = page === 'home' ? '#home' : `#${page}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const path = 'ministry_settings/main';
    const unsubscribe = onSnapshot(
      doc(db, 'ministry_settings', 'main'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setSettings({
            evangelistName:
              d.evangelistName || DEFAULT_MINISTRY_SETTINGS.evangelistName,
            heroEyebrow:
              d.heroEyebrow || DEFAULT_MINISTRY_SETTINGS.heroEyebrow,
            ministryTagline:
              d.ministryTagline || DEFAULT_MINISTRY_SETTINGS.ministryTagline,
            heroPrimaryCtaLabel:
              d.heroPrimaryCtaLabel ||
              DEFAULT_MINISTRY_SETTINGS.heroPrimaryCtaLabel,
            heroSecondaryCtaLabel:
              d.heroSecondaryCtaLabel ||
              DEFAULT_MINISTRY_SETTINGS.heroSecondaryCtaLabel,
            aboutBio: d.aboutBio || DEFAULT_MINISTRY_SETTINGS.aboutBio,
            portraitUrl: d.portraitUrl || PORTRAIT_IMAGE_PATH,
            weeklyVerse: d.weeklyVerse || DEFAULT_MINISTRY_SETTINGS.weeklyVerse,
            weeklyVerseRef:
              d.weeklyVerseRef || DEFAULT_MINISTRY_SETTINGS.weeklyVerseRef,
            contactEmail:
              d.contactEmail || DEFAULT_MINISTRY_SETTINGS.contactEmail,
            location: d.location || DEFAULT_MINISTRY_SETTINGS.location,
            footerHeading:
              d.footerHeading ||
              d.evangelistName ||
              DEFAULT_MINISTRY_SETTINGS.footerHeading,
            footerBio:
              d.footerBio ??
              d.ministryTagline ??
              DEFAULT_MINISTRY_SETTINGS.footerBio,
            footerCopyright:
              d.footerCopyright ?? DEFAULT_MINISTRY_SETTINGS.footerCopyright,
            footerCredit:
              d.footerCredit ?? DEFAULT_MINISTRY_SETTINGS.footerCredit,
            hideDemoSermons: Boolean(d.hideDemoSermons),
            hideDemoArticles: Boolean(d.hideDemoArticles),
            hideDemoPrograms: Boolean(d.hideDemoPrograms),
            youtubeUrl: d.youtubeUrl ?? DEFAULT_MINISTRY_SETTINGS.youtubeUrl,
            facebookUrl: d.facebookUrl ?? DEFAULT_MINISTRY_SETTINGS.facebookUrl,
            instagramUrl:
              d.instagramUrl ?? DEFAULT_MINISTRY_SETTINGS.instagramUrl,
            tiktokUrl: d.tiktokUrl ?? DEFAULT_MINISTRY_SETTINGS.tiktokUrl,
            xUrl: d.xUrl ?? DEFAULT_MINISTRY_SETTINGS.xUrl,
            whatsappUrl: d.whatsappUrl ?? DEFAULT_MINISTRY_SETTINGS.whatsappUrl,
            podcastUrl: d.podcastUrl ?? DEFAULT_MINISTRY_SETTINGS.podcastUrl,
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const path = 'sermons';
    const q = isAdmin
      ? query(collection(db, path))
      : query(collection(db, path), where('isPublished', '==', true));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Sermon[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            title: d.title || '',
            category: d.category || 'Short Sermon',
            scriptureRef: d.scriptureRef || '',
            scriptureQuote: d.scriptureQuote || '',
            summary: d.summary || '',
            content: d.content || '',
            readTimeMinutes: Number(d.readTimeMinutes) || 3,
            coverImage: d.coverImage || '',
            videoUrl: d.videoUrl || '',
            isFeatured: Boolean(d.isFeatured),
            isPublished: Boolean(d.isPublished),
            amenCount: Number(d.amenCount) || 0,
            prayCount: Number(d.prayCount) || 0,
            loveCount: Number(d.loveCount) || 0,
            viewCount: Number(d.viewCount) || 0,
            authorId: d.authorId || '',
            authorName: d.authorName || 'Evangelist Shepherd',
            createdAt: d.createdAt || null,
            updatedAt: d.updatedAt || null,
          };
        });
        loaded.sort(
          (a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
        );
        setFirestoreSermons(loaded);
        setSermonsLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsubscribe();
  }, [authReady, isAdmin]);

  useEffect(() => {
    if (!authReady) return;
    const path = 'faith_articles';
    const q = isAdmin
      ? query(collection(db, path))
      : query(collection(db, path), where('isPublished', '==', true));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: FaithArticle[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            title: d.title || '',
            questionPrompt: d.questionPrompt || '',
            topic: d.topic || 'Faith',
            scriptureRef: d.scriptureRef || '',
            excerpt: d.excerpt || '',
            content: d.content || '',
            coverImage: d.coverImage || '',
            readTimeMinutes: Number(d.readTimeMinutes) || 4,
            viewCount: Number(d.viewCount) || 0,
            isPublished: Boolean(d.isPublished),
            authorId: d.authorId || '',
            authorName: d.authorName || 'Evangelist Shepherd',
            createdAt: d.createdAt || null,
            updatedAt: d.updatedAt || null,
          };
        });
        loaded.sort(
          (a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
        );
        setFirestoreArticles(loaded);
        setArticlesLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsubscribe();
  }, [authReady, isAdmin]);

  useEffect(() => {
    if (!authReady) return;
    const path = 'programs';
    const q = isAdmin
      ? query(collection(db, path))
      : query(collection(db, path), where('isActive', '==', true));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: MinistryProgram[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            title: d.title || '',
            schedule: d.schedule || '',
            format: d.format || '',
            description: d.description || '',
            locationOrLink: d.locationOrLink || '',
            isActive: Boolean(d.isActive),
            orderIndex: Number(d.orderIndex) || 1,
            authorId: d.authorId || '',
            createdAt: d.createdAt || null,
            updatedAt: d.updatedAt || null,
          };
        });
        loaded.sort((a, b) => a.orderIndex - b.orderIndex);
        setFirestorePrograms(loaded);
        setProgramsLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsubscribe();
  }, [authReady, isAdmin]);

  useEffect(() => {
    const path = 'engagement_metrics';
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const next: Record<string, EngagementMetricOffsets> = {};
        snapshot.docs.forEach((docSnap) => {
          const d = docSnap.data();
          next[docSnap.id] = {
            viewCount: Number(d.viewCount) || 0,
            amenCount: Number(d.amenCount) || 0,
            prayCount: Number(d.prayCount) || 0,
            loveCount: Number(d.loveCount) || 0,
          };
        });
        setEngagementMetrics(next);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsubscribe();
  }, []);

  const publishedPosts: Sermon[] = useMemo(() => {
    if (firestoreSermons.length > 0) {
      return firestoreSermons.filter((s) => s.isPublished);
    }
    if (!sermonsLoaded || settings.hideDemoSermons) return [];
    return STARTER_SERMONS.map((s, idx) => {
      const id = `starter-sermon-${idx}`;
      const offsets = engagementMetrics[id];
      return {
        ...s,
        id,
        amenCount: s.amenCount + (offsets?.amenCount || 0),
        prayCount: s.prayCount + (offsets?.prayCount || 0),
        loveCount: s.loveCount + (offsets?.loveCount || 0),
        viewCount: s.viewCount + (offsets?.viewCount || 0),
        authorId: 'evangelist-shepherd',
        createdAt: new Date(2026, 10, 22 - idx * 3),
        updatedAt: new Date(2026, 10, 22 - idx * 3),
      };
    });
  }, [
    firestoreSermons,
    sermonsLoaded,
    settings.hideDemoSermons,
    engagementMetrics,
  ]);

  // Strict Separation: Words of Encouragement vs Short Sermon Videos vs Midweek Message Videos
  const encouragements = useMemo(
    () => publishedPosts.filter((s) => s.category === 'Word of Encouragement'),
    [publishedPosts]
  );

  const youtubeSermons = useMemo(
    () => publishedPosts.filter((s) => s.category === 'Short Sermon'),
    [publishedPosts]
  );

  const midweekVideos = useMemo(
    () => publishedPosts.filter((s) => s.category === 'Midweek Message'),
    [publishedPosts]
  );

  const latestMidweek = midweekVideos[0] ?? null;

  const publishedArticles: FaithArticle[] = useMemo(() => {
    if (firestoreArticles.length > 0) {
      return firestoreArticles.filter((a) => a.isPublished);
    }
    if (!articlesLoaded || settings.hideDemoArticles) return [];
    return STARTER_FAITH_ARTICLES.map((a, idx) => {
      const id = `starter-article-${idx}`;
      const offsets = engagementMetrics[id];
      return {
        ...a,
        id,
        viewCount: a.viewCount + (offsets?.viewCount || 0),
        authorId: 'evangelist-shepherd',
        createdAt: new Date(2026, 10, 20 - idx * 4),
        updatedAt: new Date(2026, 10, 20 - idx * 4),
      };
    });
  }, [
    firestoreArticles,
    articlesLoaded,
    settings.hideDemoArticles,
    engagementMetrics,
  ]);

  const activePrograms: MinistryProgram[] = useMemo(() => {
    if (firestorePrograms.length > 0) {
      return firestorePrograms.filter((p) => p.isActive);
    }
    if (!programsLoaded || settings.hideDemoPrograms) return [];
    return STARTER_PROGRAMS.map((p, idx) => ({
      ...p,
      id: `starter-program-${idx}`,
      authorId: 'evangelist-shepherd',
      createdAt: new Date(2026, 10, 15),
      updatedAt: new Date(2026, 10, 15),
    }));
  }, [firestorePrograms, programsLoaded, settings.hideDemoPrograms]);

  const incrementStarterMetric = async (
    metricId: string,
    field: 'viewCount' | ReactionType
  ) => {
    const path = `engagement_metrics/${metricId}`;
    const ref = doc(db, 'engagement_metrics', metricId);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) {
          tx.set(ref, {
            viewCount: field === 'viewCount' ? 1 : 0,
            amenCount: field === 'amenCount' ? 1 : 0,
            prayCount: field === 'prayCount' ? 1 : 0,
            loveCount: field === 'loveCount' ? 1 : 0,
            updatedAt: serverTimestamp(),
          });
        } else {
          const data = snap.data();
          const current = Number(data[field]) || 0;
          tx.update(ref, {
            [field]: current + 1,
            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const markViewedInSession = (viewKey: string): boolean => {
    if (viewedSessionRef.current.has(viewKey)) return false;
    viewedSessionRef.current.add(viewKey);
    try {
      sessionStorage.setItem(
        VIEWS_SESSION_KEY,
        JSON.stringify(Array.from(viewedSessionRef.current))
      );
    } catch {
      // ignore session storage errors
    }
    return true;
  };

  const recordSermonView = async (sermon: Sermon) => {
    if (!markViewedInSession(`sermon:${sermon.id}`)) return;
    if (sermon.id.startsWith('starter-')) {
      await incrementStarterMetric(sermon.id, 'viewCount');
      return;
    }
    const path = `sermons/${sermon.id}`;
    try {
      await updateDoc(doc(db, 'sermons', sermon.id), {
        viewCount: increment(1),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const recordArticleView = async (article: FaithArticle) => {
    if (!markViewedInSession(`article:${article.id}`)) return;
    if (article.id.startsWith('starter-')) {
      await incrementStarterMetric(article.id, 'viewCount');
      return;
    }
    const path = `faith_articles/${article.id}`;
    try {
      await updateDoc(doc(db, 'faith_articles', article.id), {
        viewCount: increment(1),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleOpenSermon = (sermon: Sermon) => {
    setActiveSermon(sermon);
    void recordSermonView(sermon);
  };

  const handleOpenArticle = (article: FaithArticle) => {
    setActiveArticle(article);
    void recordArticleView(article);
  };

  const handleReactToPost = async (post: Sermon, reaction: ReactionType) => {
    const key = `${post.id}:${reaction}`;
    if (reactedKeys[key]) return;

    const nextReacted = { ...reactedKeys, [key]: true };
    setReactedKeys(nextReacted);
    try {
      localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(nextReacted));
    } catch {
      // ignore storage quota errors
    }

    if (post.id.startsWith('starter-')) {
      await incrementStarterMetric(post.id, reaction);
      return;
    }

    const path = `sermons/${post.id}`;
    try {
      await updateDoc(doc(db, 'sermons', post.id), {
        [reaction]: increment(1),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const openStudio = (tab: StudioTab) => {
    setStudioTab(tab);
    setStudioOpen(true);
  };

  const handleInquireProgram = (programTitle: string) => {
    setContactDefaultType('Inquiry');
    setContactDefaultSubject(`Program Inquiry: ${programTitle}`);
    navigateTo('contact');
  };

  const handleAskFaithQuestion = (topicTitle?: string) => {
    setContactDefaultType('Inquiry');
    setContactDefaultSubject(
      topicTitle ? `Faith Question: ${topicTitle}` : 'Question About Faith'
    );
    navigateTo('contact');
  };

  const handleOpenEncouragementInBlog = (post: Sermon) => {
    navigateTo('blog');
    handleOpenSermon(post);
  };

  const liveActiveSermon = useMemo(() => {
    if (!activeSermon) return null;
    return publishedPosts.find((s) => s.id === activeSermon.id) || activeSermon;
  }, [activeSermon, publishedPosts]);

  const liveActiveArticle = useMemo(() => {
    if (!activeArticle) return null;
    return (
      publishedArticles.find((a) => a.id === activeArticle.id) || activeArticle
    );
  }, [activeArticle, publishedArticles]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0B0B0D]">
      <Header
        brandName={settings.evangelistName}
        currentPage={currentPage}
        onNavigate={navigateTo}
      />

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            settings={settings}
            encouragements={encouragements}
            latestMidweek={latestMidweek}
            articles={publishedArticles}
            programs={activePrograms}
            reactedKeys={reactedKeys}
            onReact={(post, reaction) => void handleReactToPost(post, reaction)}
            onOpenEncouragementInBlog={handleOpenEncouragementInBlog}
            onOpenMidweekNotes={handleOpenSermon}
            onReadArticle={handleOpenArticle}
            onNavigate={navigateTo}
            onInquireProgram={handleInquireProgram}
          />
        )}

        {currentPage === 'about' && (
          <AboutPage
            settings={settings}
            programs={activePrograms}
            latestMidweek={latestMidweek}
            isAdmin={isAdmin}
            onNavigate={navigateTo}
            onInquireProgram={handleInquireProgram}
            onOpenMidweekNotes={handleOpenSermon}
            onOpenStudioSocial={() => openStudio('social')}
          />
        )}

        {currentPage === 'sermons' && (
          <SermonsPage
            youtubeSermons={youtubeSermons}
            onWatchSermon={handleOpenSermon}
          />
        )}

        {currentPage === 'blog' && (
          <BlogPage
            encouragements={encouragements}
            articles={publishedArticles}
            reactedKeys={reactedKeys}
            onReact={(post, reaction) => void handleReactToPost(post, reaction)}
            onReadEncouragement={handleOpenSermon}
            onReadArticle={handleOpenArticle}
            onAskFaithQuestion={() => handleAskFaithQuestion()}
          />
        )}

        {currentPage === 'contact' && (
          <ContactPage
            settings={settings}
            isAdmin={isAdmin}
            defaultSubject={contactDefaultSubject}
            defaultType={contactDefaultType}
            onOpenStudioSocial={() => openStudio('social')}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0B0B0D] text-[#E4E4E7] py-12 border-t border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-2 max-w-md mx-auto md:mx-0">
            <p className="text-lg font-semibold tracking-tight text-white">
              {settings.footerHeading}
            </p>
            {settings.footerBio && (
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {settings.footerBio}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-5 text-xs font-semibold tracking-wider uppercase text-[#D4D4D8]">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              HOME
            </button>
            <button
              type="button"
              onClick={() => navigateTo('about')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              ABOUT
            </button>
            <button
              type="button"
              onClick={() => navigateTo('sermons')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              SERMONS
            </button>
            <button
              type="button"
              onClick={() => navigateTo('blog')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              BLOG
            </button>
            <button
              type="button"
              onClick={() => navigateTo('contact')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              GET IN TOUCH
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-[#27272A] grid grid-cols-1 sm:grid-cols-3 items-center gap-3 text-xs text-[#A1A1AA] text-center">
          <span className="sm:text-left">{settings.footerCopyright}</span>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => openStudio('sermons')}
              aria-label="Admin login"
              title="Admin login"
              className="inline-flex items-center justify-center w-8 h-8 text-white/10 hover:text-white/50 transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
          <span className="font-medium text-white sm:text-right">
            {settings.footerCredit}
          </span>
        </div>
      </footer>

      <SermonReaderModal
        sermon={liveActiveSermon}
        onClose={() => setActiveSermon(null)}
      />

      <ArticleReaderModal
        article={liveActiveArticle}
        onClose={() => setActiveArticle(null)}
        onAskFollowUp={(title) => handleAskFaithQuestion(title)}
      />

      <MinistryStudioModal
        isOpen={studioOpen}
        initialTab={studioTab}
        onClose={() => setStudioOpen(false)}
        user={user}
        isAdmin={isAdmin}
        sermons={firestoreSermons.length > 0 ? firestoreSermons : publishedPosts}
        hasFirestoreSermons={firestoreSermons.length > 0}
        articles={firestoreArticles.length > 0 ? firestoreArticles : publishedArticles}
        hasFirestoreArticles={firestoreArticles.length > 0}
        programs={firestorePrograms.length > 0 ? firestorePrograms : activePrograms}
        hasFirestorePrograms={firestorePrograms.length > 0}
        settings={settings}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <EvangelistShepherdApp />
    </ErrorBoundary>
  );
}
