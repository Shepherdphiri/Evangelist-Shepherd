import React, { useEffect, useState } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  BookOpen,
  Calendar,
  Check,
  Edit3,
  EyeOff,
  FileText,
  Inbox,
  LogIn,
  LogOut,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';
import {
  FaithArticle,
  MinistryProgram,
  MinistrySettings,
  PrayerRequest,
  PrayerRequestStatus,
  Sermon,
  SermonCategory,
  VALIDATION_LIMITS,
  formatDateValue,
  generateDocumentId,
  getTimestampMillis,
  sanitizeExternalUrl,
  truncateText,
} from '../types/ministry';
import {
  COVER_IMAGE_PRESETS,
  DEFAULT_MINISTRY_SETTINGS,
  STARTER_FAITH_ARTICLES,
  STARTER_PROGRAMS,
  STARTER_SERMONS,
} from '../data/defaultMinistryData';
import { fetchNeonInbox, postNeonAction } from '../lib/neonClient';
import { ImageUploadField } from './ImageUploadField';

export type StudioTab = 'sermons' | 'blog' | 'programs' | 'inbox' | 'social';

interface MinistryStudioModalProps {
  isOpen: boolean;
  initialTab?: StudioTab;
  onClose: () => void;
  user: User | null;
  isAdmin: boolean;
  useNeonDb?: boolean;
  onNeonDataChanged?: () => void;
  sermons: Sermon[];
  hasFirestoreSermons: boolean;
  articles: FaithArticle[];
  hasFirestoreArticles: boolean;
  programs: MinistryProgram[];
  hasFirestorePrograms: boolean;
  settings: MinistrySettings;
}

export function MinistryStudioModal({
  isOpen,
  initialTab = 'sermons',
  onClose,
  user,
  isAdmin,
  useNeonDb = false,
  onNeonDataChanged,
  sermons,
  hasFirestoreSermons,
  articles,
  hasFirestoreArticles,
  programs,
  hasFirestorePrograms,
  settings,
}: MinistryStudioModalProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab);
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [confirmReplaceAll, setConfirmReplaceAll] = useState(false);
  const [replacingAll, setReplacingAll] = useState(false);

  // Sermons & Midweek Videos editor (videos only)
  const [editingSermonId, setEditingSermonId] = useState<string | null>(null);
  const [showSermonForm, setShowSermonForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SermonCategory>('Short Sermon');
  const [scriptureRef, setScriptureRef] = useState('');
  const [scriptureQuote, setScriptureQuote] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [readTimeMinutes, setReadTimeMinutes] = useState(3);
  const [coverImage, setCoverImage] = useState(COVER_IMAGE_PRESETS[2].path);
  const [videoUrl, setVideoUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [savingSermon, setSavingSermon] = useState(false);
  const [sermonFeedback, setSermonFeedback] = useState('');

  // Blog Posts sub-tab ('encouragement' | 'faith')
  const [blogSubTab, setBlogSubTab] = useState<'encouragement' | 'faith'>('encouragement');

  // Encouragement Blog editor (image-only, no video)
  const [editingEncId, setEditingEncId] = useState<string | null>(null);
  const [showEncForm, setShowEncForm] = useState(false);
  const [encTitle, setEncTitle] = useState('');
  const [encScriptureRef, setEncScriptureRef] = useState('');
  const [encScriptureQuote, setEncScriptureQuote] = useState('');
  const [encSummary, setEncSummary] = useState('');
  const [encContent, setEncContent] = useState('');
  const [encReadTime, setEncReadTime] = useState(2);
  const [encCoverImage, setEncCoverImage] = useState(COVER_IMAGE_PRESETS[3].path);
  const [encPublished, setEncPublished] = useState(true);
  const [savingEnc, setSavingEnc] = useState(false);
  const [encFeedback, setEncFeedback] = useState('');

  // Faith Blog Q&A editor (image-only, no video)
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [artTitle, setArtTitle] = useState('');
  const [artQuestion, setArtQuestion] = useState('');
  const [artTopic, setArtTopic] = useState('Foundations of Faith');
  const [artRef, setArtRef] = useState('');
  const [artExcerpt, setArtExcerpt] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artCoverImage, setArtCoverImage] = useState(COVER_IMAGE_PRESETS[4].path);
  const [artReadTime, setArtReadTime] = useState(4);
  const [artPublished, setArtPublished] = useState(true);
  const [savingArticle, setSavingArticle] = useState(false);
  const [articleFeedback, setArticleFeedback] = useState('');

  // Programs editor
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [progTitle, setProgTitle] = useState('');
  const [progSchedule, setProgSchedule] = useState('');
  const [progFormat, setProgFormat] = useState('');
  const [progDesc, setProgDesc] = useState('');
  const [progLocation, setProgLocation] = useState('');
  const [progOrder, setProgOrder] = useState(1);
  const [progActive, setProgActive] = useState(true);
  const [savingProgram, setSavingProgram] = useState(false);
  const [programFeedback, setProgramFeedback] = useState('');

  // Inbox state
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [inboxFilter, setInboxFilter] = useState<'all' | PrayerRequestStatus>('all');
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Settings / Social state
  const [settingsForm, setSettingsForm] = useState<MinistrySettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    if (!isOpen || !isAdmin || !user) {
      setPrayerRequests([]);
      return;
    }

    if (useNeonDb) {
      let cancelled = false;
      const loadNeonInbox = async () => {
        try {
          const items = await fetchNeonInbox(user);
          if (!cancelled) {
            setPrayerRequests(items);
          }
        } catch {
          // Ignore transient inbox polling failure
        }
      };
      void loadNeonInbox();
      const timer = window.setInterval(() => {
        void loadNeonInbox();
      }, 10000);
      return () => {
        cancelled = true;
        window.clearInterval(timer);
      };
    }

    const path = 'prayer_requests';
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items: PrayerRequest[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            senderName: d.senderName || '',
            senderEmail: d.senderEmail || '',
            senderPhone: d.senderPhone || '',
            requestType: d.requestType || 'Prayer Request',
            subject: d.subject || '',
            message: d.message || '',
            isPrivate: Boolean(d.isPrivate),
            status: d.status || 'unread',
            adminNote: d.adminNote || '',
            createdAt: d.createdAt || null,
            updatedAt: d.updatedAt || null,
          };
        });
        items.sort(
          (a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
        );
        setPrayerRequests(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [isOpen, isAdmin, useNeonDb, user]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    setAuthError('');
    if (user) {
      await signOut(auth);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/unauthorized-domain') {
        const host =
          typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setAuthError(
          `Domain "${host}" is not authorized in Firebase Authentication yet. Add "${host}" in Firebase Console → Authentication → Settings → Authorized domains.`
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'Sign-in pop-up was blocked by your browser. Please allow pop-ups for this site and try again.'
        );
      } else if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        setAuthError('Google sign-in was cancelled. Click the button to try again.');
      } else {
        setAuthError(
          err instanceof Error
            ? err.message
            : 'Google sign-in failed. Please try again.'
        );
      }
    } finally {
      setSigningIn(false);
    }
  };

  // --- SETTINGS PAYLOAD HELPER (Matches firestore.rules exact keys) ---
  const buildSettingsPayload = (source: MinistrySettings, uid: string) => ({
    evangelistName: truncateText(
      source.evangelistName || 'EVANGELIST SHEPHERD',
      VALIDATION_LIMITS.settings.evangelistNameMax
    ),
    heroEyebrow: truncateText(
      source.heroEyebrow || 'Gospel Ministry · Faith Portfolio · Daily Grace',
      VALIDATION_LIMITS.settings.heroEyebrowMax
    ),
    ministryTagline: truncateText(
      source.ministryTagline ||
        'Short sermons, honest answers about Christian faith, and daily words of encouragement.',
      VALIDATION_LIMITS.settings.ministryTaglineMax
    ),
    heroPrimaryCtaLabel: truncateText(
      source.heroPrimaryCtaLabel || 'Watch Sermons',
      VALIDATION_LIMITS.settings.heroCtaMax
    ),
    heroSecondaryCtaLabel: truncateText(
      source.heroSecondaryCtaLabel || 'Answers About Faith',
      VALIDATION_LIMITS.settings.heroCtaMax
    ),
    aboutBio: truncateText(
      source.aboutBio ||
        'Shepherd Zisper Phiri (Evangelist Shepherd) serves through short gospel sermons, daily words of encouragement, and biblical answers for anyone seeking truth and hope in Jesus Christ.',
      VALIDATION_LIMITS.settings.aboutBioMax
    ),
    portraitUrl: truncateText(
      source.portraitUrl || '',
      VALIDATION_LIMITS.settings.portraitUrlMax
    ),
    weeklyVerse: truncateText(
      source.weeklyVerse ||
        'Come to me, all you who are weary and burdened, and I will give you rest.',
      VALIDATION_LIMITS.settings.weeklyVerseMax
    ),
    weeklyVerseRef: truncateText(
      source.weeklyVerseRef || 'Matthew 11:28',
      VALIDATION_LIMITS.settings.weeklyVerseRefMax
    ),
    contactEmail: truncateText(
      source.contactEmail || '',
      VALIDATION_LIMITS.settings.contactEmailMax
    ),
    location: truncateText(
      source.location || '',
      VALIDATION_LIMITS.settings.locationMax
    ),
    footerHeading: truncateText(
      source.footerHeading || source.evangelistName || 'EVANGELIST SHEPHERD',
      VALIDATION_LIMITS.settings.footerHeadingMax
    ),
    footerBio: truncateText(
      source.footerBio || '',
      VALIDATION_LIMITS.settings.footerBioMax
    ),
    footerCopyright: truncateText(
      source.footerCopyright || '',
      VALIDATION_LIMITS.settings.footerCopyrightMax
    ),
    footerCredit: truncateText(
      source.footerCredit || '',
      VALIDATION_LIMITS.settings.footerCreditMax
    ),
    hideDemoSermons: Boolean(source.hideDemoSermons),
    hideDemoArticles: Boolean(source.hideDemoArticles),
    hideDemoPrograms: Boolean(source.hideDemoPrograms),
    youtubeUrl: sanitizeExternalUrl(
      source.youtubeUrl || '',
      VALIDATION_LIMITS.settings.socialUrlMax
    ),
    facebookUrl: sanitizeExternalUrl(
      source.facebookUrl || '',
      VALIDATION_LIMITS.settings.socialUrlMax
    ),
    instagramUrl: sanitizeExternalUrl(
      source.instagramUrl || '',
      VALIDATION_LIMITS.settings.socialUrlMax
    ),
    tiktokUrl: sanitizeExternalUrl(
      source.tiktokUrl || '',
      VALIDATION_LIMITS.settings.socialUrlMax
    ),
    xUrl: sanitizeExternalUrl(
      source.xUrl || '',
      VALIDATION_LIMITS.settings.socialUrlMax
    ),
    whatsappUrl: sanitizeExternalUrl(
      source.whatsappUrl || '',
      VALIDATION_LIMITS.settings.socialUrlMax
    ),
    podcastUrl: sanitizeExternalUrl(
      source.podcastUrl || '',
      VALIDATION_LIMITS.settings.socialUrlMax
    ),
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  });

  const persistDemoFlag = async (
    key: 'hideDemoSermons' | 'hideDemoArticles' | 'hideDemoPrograms',
    value: boolean
  ) => {
    if (!user || !isAdmin) return;
    const nextSettings: MinistrySettings = {
      ...settingsForm,
      [key]: value,
    };
    setSettingsForm(nextSettings);
    if (useNeonDb) {
      await postNeonAction('save_settings', nextSettings as unknown as Record<string, unknown>, user);
      onNeonDataChanged?.();
      return;
    }
    await setDoc(
      doc(db, 'ministry_settings', 'main'),
      buildSettingsPayload(nextSettings, user.uid)
    );
  };

  const handleReplaceAllOldData = async () => {
    if (!user || !isAdmin) return;
    setReplacingAll(true);
    setConfirmReplaceAll(false);
    setSermonFeedback('');
    setEncFeedback('');
    setArticleFeedback('');
    setProgramFeedback('');

    try {
      if (useNeonDb) {
        await postNeonAction('replace_all_data', {}, user);
        onNeonDataChanged?.();
      } else {
        const collectionsToClear = ['sermons', 'faith_articles', 'programs', 'engagement_metrics'] as const;
        for (const colName of collectionsToClear) {
          const snap = await getDocs(collection(db, colName));
          for (const d of snap.docs) {
            await deleteDoc(doc(db, colName, d.id));
          }
        }

        for (const starter of STARTER_SERMONS) {
          await setDoc(doc(db, 'sermons', generateDocumentId('sermon')), {
            ...starter,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        for (const starter of STARTER_FAITH_ARTICLES) {
          await setDoc(doc(db, 'faith_articles', generateDocumentId('faith')), {
            ...starter,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        for (const starter of STARTER_PROGRAMS) {
          await setDoc(doc(db, 'programs', generateDocumentId('prog')), {
            ...starter,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        const refreshedSettings: MinistrySettings = {
          ...DEFAULT_MINISTRY_SETTINGS,
          youtubeUrl: settingsForm.youtubeUrl,
          facebookUrl: settingsForm.facebookUrl,
          instagramUrl: settingsForm.instagramUrl,
          tiktokUrl: settingsForm.tiktokUrl,
          xUrl: settingsForm.xUrl,
          whatsappUrl: settingsForm.whatsappUrl,
          podcastUrl: settingsForm.podcastUrl,
          hideDemoSermons: true,
          hideDemoArticles: true,
          hideDemoPrograms: true,
        };
        setSettingsForm(refreshedSettings);
        await setDoc(
          doc(db, 'ministry_settings', 'main'),
          buildSettingsPayload(refreshedSettings, user.uid)
        );
      }

      setSermonFeedback('All old data replaced with the fresh content set.');
      setEncFeedback('All old data replaced with the fresh content set.');
      setArticleFeedback('All old data replaced with the fresh content set.');
      setProgramFeedback('All old data replaced with the fresh content set.');
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(error, OperationType.WRITE, 'sermons');
      } else {
        setSermonFeedback(
          error instanceof Error ? error.message : 'Unable to replace old data.'
        );
      }
    } finally {
      setReplacingAll(false);
    }
  };

  // --- SERMON CRUD ---
  const resetSermonForm = () => {
    setEditingSermonId(null);
    setTitle('');
    setCategory('Short Sermon');
    setScriptureRef('');
    setScriptureQuote('');
    setSummary('');
    setContent('');
    setReadTimeMinutes(3);
    setCoverImage(COVER_IMAGE_PRESETS[0].path);
    setVideoUrl('');
    setIsFeatured(false);
    setIsPublished(true);
    setSermonFeedback('');
  };

  const startEditSermon = (s: Sermon) => {
    setEditingSermonId(s.id);
    setTitle(s.title);
    setCategory(s.category);
    setScriptureRef(s.scriptureRef);
    setScriptureQuote(s.scriptureQuote);
    setSummary(s.summary);
    setContent(s.content);
    setReadTimeMinutes(s.readTimeMinutes || 3);
    setCoverImage(s.coverImage || COVER_IMAGE_PRESETS[0].path);
    setVideoUrl(s.videoUrl || '');
    setIsFeatured(s.isFeatured);
    setIsPublished(s.isPublished);
    setSermonFeedback('');
    setShowSermonForm(true);
  };

  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setSermonFeedback('');

    const cleanTitle = truncateText(title, VALIDATION_LIMITS.sermon.titleMax);
    const cleanRef = truncateText(scriptureRef, VALIDATION_LIMITS.sermon.scriptureRefMax);
    const cleanQuote = truncateText(scriptureQuote, VALIDATION_LIMITS.sermon.scriptureQuoteMax);
    const cleanSummary = truncateText(summary, VALIDATION_LIMITS.sermon.summaryMax);
    const cleanContent = truncateText(content, VALIDATION_LIMITS.sermon.contentMax);
    const cleanCover = truncateText(coverImage, VALIDATION_LIMITS.sermon.coverImageMax);
    const cleanVideo = sanitizeExternalUrl(videoUrl, VALIDATION_LIMITS.sermon.videoUrlMax);
    const cleanReadTime = Math.min(
      VALIDATION_LIMITS.sermon.readTimeMax,
      Math.max(VALIDATION_LIMITS.sermon.readTimeMin, Math.round(Number(readTimeMinutes) || 3))
    );

    if (cleanTitle.length < VALIDATION_LIMITS.sermon.titleMin) {
      setSermonFeedback('Title must be at least 3 characters.');
      return;
    }
    if (cleanRef.length < VALIDATION_LIMITS.sermon.scriptureRefMin) {
      setSermonFeedback('Please enter a scripture reference.');
      return;
    }
    if (cleanSummary.length < VALIDATION_LIMITS.sermon.summaryMin) {
      setSermonFeedback('Summary must be at least 10 characters.');
      return;
    }
    if (cleanContent.length < VALIDATION_LIMITS.sermon.contentMin) {
      setSermonFeedback('Full message content must be at least 20 characters.');
      return;
    }

    setSavingSermon(true);
    const isEditingDemo = Boolean(editingSermonId?.startsWith('starter-'));
    const targetId =
      editingSermonId && !isEditingDemo
        ? editingSermonId
        : generateDocumentId('sermon');
    const resolvedAuthorName = truncateText(
      settingsForm.evangelistName || 'Evangelist Shepherd',
      VALIDATION_LIMITS.sermon.authorNameMax
    );

    try {
      if (useNeonDb) {
        const existing = editingSermonId
          ? sermons.find((s) => s.id === editingSermonId)
          : undefined;
        await postNeonAction(
          'upsert_sermon',
          {
            id: targetId,
            title: cleanTitle,
            category,
            scriptureRef: cleanRef,
            scriptureQuote: cleanQuote,
            summary: cleanSummary,
            content: cleanContent,
            readTimeMinutes: cleanReadTime,
            coverImage: cleanCover,
            videoUrl: cleanVideo,
            isFeatured,
            isPublished,
            amenCount: existing?.amenCount ?? 0,
            prayCount: existing?.prayCount ?? 0,
            loveCount: existing?.loveCount ?? 0,
            viewCount: existing?.viewCount ?? 0,
            authorName: resolvedAuthorName,
          },
          user
        );
        onNeonDataChanged?.();
      } else if (editingSermonId && !isEditingDemo) {
        const existing = sermons.find((s) => s.id === editingSermonId);
        await updateDoc(doc(db, 'sermons', targetId), {
          title: cleanTitle,
          category,
          scriptureRef: cleanRef,
          scriptureQuote: cleanQuote,
          summary: cleanSummary,
          content: cleanContent,
          readTimeMinutes: cleanReadTime,
          coverImage: cleanCover,
          videoUrl: cleanVideo,
          isFeatured,
          isPublished,
          amenCount: existing?.amenCount ?? 0,
          prayCount: existing?.prayCount ?? 0,
          loveCount: existing?.loveCount ?? 0,
          viewCount: existing?.viewCount ?? 0,
          authorName: resolvedAuthorName,
          updatedAt: serverTimestamp(),
        });
      } else {
        const existingDemo = isEditingDemo
          ? sermons.find((s) => s.id === editingSermonId)
          : undefined;
        await setDoc(doc(db, 'sermons', targetId), {
          title: cleanTitle,
          category,
          scriptureRef: cleanRef,
          scriptureQuote: cleanQuote,
          summary: cleanSummary,
          content: cleanContent,
          readTimeMinutes: cleanReadTime,
          coverImage: cleanCover,
          videoUrl: cleanVideo,
          isFeatured,
          isPublished,
          amenCount: existingDemo?.amenCount ?? 0,
          prayCount: existingDemo?.prayCount ?? 0,
          loveCount: existingDemo?.loveCount ?? 0,
          viewCount: existingDemo?.viewCount ?? 0,
          authorId: user.uid,
          authorName: resolvedAuthorName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (isEditingDemo) {
          const otherDemos = sermons.filter((s) => s.id !== editingSermonId);
          for (const demo of otherDemos) {
            const demoDocId = generateDocumentId('sermon');
            await setDoc(doc(db, 'sermons', demoDocId), {
              title: demo.title,
              category: demo.category,
              scriptureRef: demo.scriptureRef,
              scriptureQuote: demo.scriptureQuote,
              summary: demo.summary,
              content: demo.content,
              readTimeMinutes: demo.readTimeMinutes,
              coverImage: demo.coverImage,
              videoUrl: demo.videoUrl,
              isFeatured: demo.isFeatured,
              isPublished: demo.isPublished,
              amenCount: demo.amenCount,
              prayCount: demo.prayCount,
              loveCount: demo.loveCount,
              viewCount: demo.viewCount ?? 0,
              authorId: user.uid,
              authorName: demo.authorName || resolvedAuthorName,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          await persistDemoFlag('hideDemoSermons', true);
        }
      }
      setShowSermonForm(false);
      resetSermonForm();
      setSermonFeedback('Sermon / encouragement post saved.');
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(
          error,
          editingSermonId && !isEditingDemo ? OperationType.UPDATE : OperationType.CREATE,
          `sermons/${targetId}`
        );
      } else {
        setSermonFeedback(
          error instanceof Error ? error.message : 'Unable to save sermon.'
        );
      }
    } finally {
      setSavingSermon(false);
    }
  };

  const handleSeedStarterSermons = async () => {
    if (!user || !isAdmin) return;
    setSavingSermon(true);
    try {
      if (useNeonDb) {
        for (const starter of STARTER_SERMONS) {
          await postNeonAction(
            'upsert_sermon',
            { id: generateDocumentId('sermon'), ...starter },
            user
          );
        }
        onNeonDataChanged?.();
      } else {
        for (const starter of STARTER_SERMONS) {
          const docId = generateDocumentId('sermon');
          await setDoc(doc(db, 'sermons', docId), {
            ...starter,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await persistDemoFlag('hideDemoSermons', true);
      }
      setSermonFeedback('Starter posts imported into your database.');
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(error, OperationType.CREATE, 'sermons');
      }
    } finally {
      setSavingSermon(false);
    }
  };

  const handleToggleDemoSermons = async (hide: boolean) => {
    if (!user || !isAdmin) return;
    setSavingSermon(true);
    setSermonFeedback('');
    try {
      await persistDemoFlag('hideDemoSermons', hide);
      setSermonFeedback(
        hide ? 'All demo sermons and encouragement posts removed.' : 'Starter demo posts restored.'
      );
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(error, OperationType.WRITE, 'ministry_settings/main');
      }
    } finally {
      setSavingSermon(false);
    }
  };

  const handleDeleteSermon = async (id: string) => {
    if (!user || !isAdmin) return;
    if (useNeonDb) {
      try {
        await postNeonAction('delete_sermon', { id }, user);
        onNeonDataChanged?.();
      } catch (err) {
        setSermonFeedback(err instanceof Error ? err.message : 'Failed to delete sermon.');
      }
      return;
    }

    if (id.startsWith('starter-')) {
      setSavingSermon(true);
      try {
        const remaining = sermons.filter((s) => s.id !== id);
        if (remaining.length === 0) {
          await persistDemoFlag('hideDemoSermons', true);
          setSermonFeedback('Demo post removed.');
        } else {
          for (const demo of remaining) {
            const docId = generateDocumentId('sermon');
            await setDoc(doc(db, 'sermons', docId), {
              title: demo.title,
              category: demo.category,
              scriptureRef: demo.scriptureRef,
              scriptureQuote: demo.scriptureQuote,
              summary: demo.summary,
              content: demo.content,
              readTimeMinutes: demo.readTimeMinutes,
              coverImage: demo.coverImage,
              videoUrl: demo.videoUrl,
              isFeatured: demo.isFeatured,
              isPublished: demo.isPublished,
              amenCount: demo.amenCount,
              prayCount: demo.prayCount,
              loveCount: demo.loveCount,
              viewCount: demo.viewCount ?? 0,
              authorId: user.uid,
              authorName: demo.authorName || 'Evangelist Shepherd',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          await persistDemoFlag('hideDemoSermons', true);
          setSermonFeedback('Demo post removed.');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'sermons');
      } finally {
        setSavingSermon(false);
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'sermons', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sermons/${id}`);
    }
  };

  // --- WORD OF ENCOURAGEMENT BLOG CRUD (Image-only, No Video) ---
  const resetEncForm = () => {
    setEditingEncId(null);
    setEncTitle('');
    setEncScriptureRef('');
    setEncScriptureQuote('');
    setEncSummary('');
    setEncContent('');
    setEncReadTime(2);
    setEncCoverImage(COVER_IMAGE_PRESETS[3].path);
    setEncPublished(true);
    setEncFeedback('');
  };

  const startEditEnc = (s: Sermon) => {
    setEditingEncId(s.id);
    setEncTitle(s.title);
    setEncScriptureRef(s.scriptureRef);
    setEncScriptureQuote(s.scriptureQuote);
    setEncSummary(s.summary);
    setEncContent(s.content);
    setEncReadTime(s.readTimeMinutes || 2);
    setEncCoverImage(s.coverImage || COVER_IMAGE_PRESETS[3].path);
    setEncPublished(s.isPublished);
    setEncFeedback('');
    setShowEncForm(true);
  };

  const handleSaveEnc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setEncFeedback('');

    const cleanTitle = truncateText(encTitle, VALIDATION_LIMITS.sermon.titleMax);
    const cleanRef = truncateText(encScriptureRef, VALIDATION_LIMITS.sermon.scriptureRefMax);
    const cleanQuote = truncateText(encScriptureQuote, VALIDATION_LIMITS.sermon.scriptureQuoteMax);
    const cleanSummary = truncateText(encSummary, VALIDATION_LIMITS.sermon.summaryMax);
    const cleanContent = truncateText(encContent, VALIDATION_LIMITS.sermon.contentMax);
    const cleanCover = truncateText(encCoverImage, VALIDATION_LIMITS.sermon.coverImageMax);
    const cleanReadTime = Math.min(
      VALIDATION_LIMITS.sermon.readTimeMax,
      Math.max(VALIDATION_LIMITS.sermon.readTimeMin, Math.round(Number(encReadTime) || 2))
    );

    if (cleanTitle.length < VALIDATION_LIMITS.sermon.titleMin) {
      setEncFeedback('Title must be at least 3 characters.');
      return;
    }
    if (cleanRef.length < VALIDATION_LIMITS.sermon.scriptureRefMin) {
      setEncFeedback('Please enter a scripture reference.');
      return;
    }
    if (cleanSummary.length < VALIDATION_LIMITS.sermon.summaryMin) {
      setEncFeedback('Summary must be at least 10 characters.');
      return;
    }
    if (cleanContent.length < VALIDATION_LIMITS.sermon.contentMin) {
      setEncFeedback('Full encouragement post must be at least 20 characters.');
      return;
    }

    setSavingEnc(true);
    const isEditingDemo = Boolean(editingEncId?.startsWith('starter-'));
    const targetId =
      editingEncId && !isEditingDemo
        ? editingEncId
        : generateDocumentId('sermon');
    const resolvedAuthorName = truncateText(
      settingsForm.evangelistName || 'Evangelist Shepherd',
      VALIDATION_LIMITS.sermon.authorNameMax
    );

    try {
      if (useNeonDb) {
        const existing = editingEncId
          ? sermons.find((s) => s.id === editingEncId)
          : undefined;
        await postNeonAction(
          'upsert_sermon',
          {
            id: targetId,
            title: cleanTitle,
            category: 'Word of Encouragement',
            scriptureRef: cleanRef,
            scriptureQuote: cleanQuote,
            summary: cleanSummary,
            content: cleanContent,
            readTimeMinutes: cleanReadTime,
            coverImage: cleanCover,
            videoUrl: '',
            isFeatured: false,
            isPublished: encPublished,
            amenCount: existing?.amenCount ?? 0,
            prayCount: existing?.prayCount ?? 0,
            loveCount: existing?.loveCount ?? 0,
            viewCount: existing?.viewCount ?? 0,
            authorName: resolvedAuthorName,
          },
          user
        );
        onNeonDataChanged?.();
      } else if (editingEncId && !isEditingDemo) {
        const existing = sermons.find((s) => s.id === editingEncId);
        await updateDoc(doc(db, 'sermons', targetId), {
          title: cleanTitle,
          category: 'Word of Encouragement',
          scriptureRef: cleanRef,
          scriptureQuote: cleanQuote,
          summary: cleanSummary,
          content: cleanContent,
          readTimeMinutes: cleanReadTime,
          coverImage: cleanCover,
          videoUrl: '',
          isFeatured: false,
          isPublished: encPublished,
          amenCount: existing?.amenCount ?? 0,
          prayCount: existing?.prayCount ?? 0,
          loveCount: existing?.loveCount ?? 0,
          viewCount: existing?.viewCount ?? 0,
          authorName: resolvedAuthorName,
          updatedAt: serverTimestamp(),
        });
      } else {
        const existingDemo = isEditingDemo
          ? sermons.find((s) => s.id === editingEncId)
          : undefined;
        await setDoc(doc(db, 'sermons', targetId), {
          title: cleanTitle,
          category: 'Word of Encouragement',
          scriptureRef: cleanRef,
          scriptureQuote: cleanQuote,
          summary: cleanSummary,
          content: cleanContent,
          readTimeMinutes: cleanReadTime,
          coverImage: cleanCover,
          videoUrl: '',
          isFeatured: false,
          isPublished: encPublished,
          amenCount: existingDemo?.amenCount ?? 0,
          prayCount: existingDemo?.prayCount ?? 0,
          loveCount: existingDemo?.loveCount ?? 0,
          viewCount: existingDemo?.viewCount ?? 0,
          authorId: user.uid,
          authorName: resolvedAuthorName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (isEditingDemo) {
          const otherDemos = sermons.filter((s) => s.id !== editingEncId);
          for (const demo of otherDemos) {
            const demoDocId = generateDocumentId('sermon');
            await setDoc(doc(db, 'sermons', demoDocId), {
              title: demo.title,
              category: demo.category,
              scriptureRef: demo.scriptureRef,
              scriptureQuote: demo.scriptureQuote,
              summary: demo.summary,
              content: demo.content,
              readTimeMinutes: demo.readTimeMinutes,
              coverImage: demo.coverImage,
              videoUrl: demo.category === 'Word of Encouragement' ? '' : demo.videoUrl,
              isFeatured: demo.isFeatured,
              isPublished: demo.isPublished,
              amenCount: demo.amenCount,
              prayCount: demo.prayCount,
              loveCount: demo.loveCount,
              viewCount: demo.viewCount ?? 0,
              authorId: user.uid,
              authorName: demo.authorName || resolvedAuthorName,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          await persistDemoFlag('hideDemoSermons', true);
        }
      }
      setShowEncForm(false);
      resetEncForm();
      setEncFeedback('Word of Encouragement blog post saved.');
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(
          error,
          editingEncId && !isEditingDemo ? OperationType.UPDATE : OperationType.CREATE,
          `sermons/${targetId}`
        );
      } else {
        setEncFeedback(
          error instanceof Error ? error.message : 'Unable to save encouragement post.'
        );
      }
    } finally {
      setSavingEnc(false);
    }
  };

  // --- FAITH BLOG ARTICLE CRUD ---
  const resetArticleForm = () => {
    setEditingArticleId(null);
    setArtTitle('');
    setArtQuestion('');
    setArtTopic('Foundations of Faith');
    setArtRef('');
    setArtExcerpt('');
    setArtContent('');
    setArtCoverImage(COVER_IMAGE_PRESETS[4].path);
    setArtReadTime(4);
    setArtPublished(true);
    setArticleFeedback('');
  };

  const startEditArticle = (a: FaithArticle) => {
    setEditingArticleId(a.id);
    setArtTitle(a.title);
    setArtQuestion(a.questionPrompt);
    setArtTopic(a.topic);
    setArtRef(a.scriptureRef);
    setArtExcerpt(a.excerpt);
    setArtContent(a.content);
    setArtCoverImage(a.coverImage || '');
    setArtReadTime(a.readTimeMinutes || 4);
    setArtPublished(a.isPublished);
    setArticleFeedback('');
    setShowArticleForm(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setArticleFeedback('');

    const cleanTitle = truncateText(artTitle, VALIDATION_LIMITS.article.titleMax);
    const cleanQ = truncateText(artQuestion, VALIDATION_LIMITS.article.questionPromptMax);
    const cleanTopic = truncateText(artTopic, VALIDATION_LIMITS.article.topicMax);
    const cleanRef = truncateText(artRef, VALIDATION_LIMITS.article.scriptureRefMax);
    const cleanExcerpt = truncateText(artExcerpt, VALIDATION_LIMITS.article.excerptMax);
    const cleanContent = truncateText(artContent, VALIDATION_LIMITS.article.contentMax);
    const cleanCover = truncateText(artCoverImage, VALIDATION_LIMITS.article.coverImageMax);
    const cleanTime = Math.min(60, Math.max(1, Math.round(Number(artReadTime) || 4)));

    if (cleanTitle.length < 3 || cleanQ.length < 3 || cleanTopic.length < 2 || cleanRef.length < 2 || cleanExcerpt.length < 10 || cleanContent.length < 20) {
      setArticleFeedback('Please complete all required article fields.');
      return;
    }

    setSavingArticle(true);
    const isEditingDemo = Boolean(editingArticleId?.startsWith('starter-'));
    const targetId =
      editingArticleId && !isEditingDemo
        ? editingArticleId
        : generateDocumentId('faith');
    const resolvedAuthorName = truncateText(
      settingsForm.evangelistName || 'Evangelist Shepherd',
      80
    );

    try {
      if (useNeonDb) {
        const existingArticle = editingArticleId
          ? articles.find((a) => a.id === editingArticleId)
          : undefined;
        await postNeonAction(
          'upsert_article',
          {
            id: targetId,
            title: cleanTitle,
            questionPrompt: cleanQ,
            topic: cleanTopic,
            scriptureRef: cleanRef,
            excerpt: cleanExcerpt,
            content: cleanContent,
            coverImage: cleanCover,
            readTimeMinutes: cleanTime,
            viewCount: existingArticle?.viewCount ?? 0,
            isPublished: artPublished,
            authorName: resolvedAuthorName,
          },
          user
        );
        onNeonDataChanged?.();
      } else if (editingArticleId && !isEditingDemo) {
        const existingArticle = articles.find((a) => a.id === editingArticleId);
        await updateDoc(doc(db, 'faith_articles', targetId), {
          title: cleanTitle,
          questionPrompt: cleanQ,
          topic: cleanTopic,
          scriptureRef: cleanRef,
          excerpt: cleanExcerpt,
          content: cleanContent,
          coverImage: cleanCover,
          readTimeMinutes: cleanTime,
          viewCount: existingArticle?.viewCount ?? 0,
          isPublished: artPublished,
          authorName: resolvedAuthorName,
          updatedAt: serverTimestamp(),
        });
      } else {
        const existingDemo = isEditingDemo
          ? articles.find((a) => a.id === editingArticleId)
          : undefined;
        await setDoc(doc(db, 'faith_articles', targetId), {
          title: cleanTitle,
          questionPrompt: cleanQ,
          topic: cleanTopic,
          scriptureRef: cleanRef,
          excerpt: cleanExcerpt,
          content: cleanContent,
          coverImage: cleanCover,
          readTimeMinutes: cleanTime,
          viewCount: existingDemo?.viewCount ?? 0,
          isPublished: artPublished,
          authorId: user.uid,
          authorName: resolvedAuthorName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (isEditingDemo) {
          const otherDemos = articles.filter((a) => a.id !== editingArticleId);
          for (const demo of otherDemos) {
            const demoId = generateDocumentId('faith');
            await setDoc(doc(db, 'faith_articles', demoId), {
              title: demo.title,
              questionPrompt: demo.questionPrompt,
              topic: demo.topic,
              scriptureRef: demo.scriptureRef,
              excerpt: demo.excerpt,
              content: demo.content,
              coverImage: demo.coverImage || '',
              readTimeMinutes: demo.readTimeMinutes,
              viewCount: demo.viewCount ?? 0,
              isPublished: demo.isPublished,
              authorId: user.uid,
              authorName: demo.authorName || resolvedAuthorName,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          await persistDemoFlag('hideDemoArticles', true);
        }
      }
      setShowArticleForm(false);
      resetArticleForm();
      setArticleFeedback('Faith Q&A article saved.');
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(
          error,
          editingArticleId && !isEditingDemo ? OperationType.UPDATE : OperationType.CREATE,
          `faith_articles/${targetId}`
        );
      } else {
        setArticleFeedback(
          error instanceof Error ? error.message : 'Unable to save article.'
        );
      }
    } finally {
      setSavingArticle(false);
    }
  };

  const handleSeedStarterArticles = async () => {
    if (!user || !isAdmin) return;
    setSavingArticle(true);
    try {
      if (useNeonDb) {
        for (const starter of STARTER_FAITH_ARTICLES) {
          await postNeonAction(
            'upsert_article',
            { id: generateDocumentId('faith'), ...starter },
            user
          );
        }
        onNeonDataChanged?.();
      } else {
        for (const starter of STARTER_FAITH_ARTICLES) {
          const docId = generateDocumentId('faith');
          await setDoc(doc(db, 'faith_articles', docId), {
            ...starter,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await persistDemoFlag('hideDemoArticles', true);
      }
      setArticleFeedback('Starter Faith Q&A articles imported into your database.');
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(error, OperationType.CREATE, 'faith_articles');
      }
    } finally {
      setSavingArticle(false);
    }
  };

  const handleToggleDemoArticles = async (hide: boolean) => {
    if (!user || !isAdmin) return;
    setSavingArticle(true);
    setArticleFeedback('');
    try {
      await persistDemoFlag('hideDemoArticles', hide);
      setArticleFeedback(
        hide ? 'All demo faith articles removed.' : 'Starter demo faith articles restored.'
      );
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(error, OperationType.WRITE, 'ministry_settings/main');
      }
    } finally {
      setSavingArticle(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!user || !isAdmin) return;
    if (useNeonDb) {
      try {
        await postNeonAction('delete_article', { id }, user);
        onNeonDataChanged?.();
      } catch (err) {
        setArticleFeedback(err instanceof Error ? err.message : 'Failed to delete article.');
      }
      return;
    }

    if (id.startsWith('starter-')) {
      setSavingArticle(true);
      try {
        const remaining = articles.filter((a) => a.id !== id);
        if (remaining.length === 0) {
          await persistDemoFlag('hideDemoArticles', true);
          setArticleFeedback('Demo article removed.');
        } else {
          for (const demo of remaining) {
            const docId = generateDocumentId('faith');
            await setDoc(doc(db, 'faith_articles', docId), {
              title: demo.title,
              questionPrompt: demo.questionPrompt,
              topic: demo.topic,
              scriptureRef: demo.scriptureRef,
              excerpt: demo.excerpt,
              content: demo.content,
              coverImage: demo.coverImage || '',
              readTimeMinutes: demo.readTimeMinutes,
              viewCount: demo.viewCount ?? 0,
              isPublished: demo.isPublished,
              authorId: user.uid,
              authorName: demo.authorName || 'Evangelist Shepherd',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          await persistDemoFlag('hideDemoArticles', true);
          setArticleFeedback('Demo article removed.');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'faith_articles');
      } finally {
        setSavingArticle(false);
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'faith_articles', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `faith_articles/${id}`);
    }
  };

  // --- PROGRAMS CRUD ---
  const resetProgramForm = () => {
    setEditingProgramId(null);
    setProgTitle('');
    setProgSchedule('');
    setProgFormat('');
    setProgDesc('');
    setProgLocation('');
    setProgOrder(programs.length + 1);
    setProgActive(true);
    setProgramFeedback('');
  };

  const startEditProgram = (p: MinistryProgram) => {
    setEditingProgramId(p.id);
    setProgTitle(p.title);
    setProgSchedule(p.schedule);
    setProgFormat(p.format);
    setProgDesc(p.description);
    setProgLocation(p.locationOrLink);
    setProgOrder(p.orderIndex);
    setProgActive(p.isActive);
    setProgramFeedback('');
    setShowProgramForm(true);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setProgramFeedback('');

    const cleanTitle = truncateText(progTitle, VALIDATION_LIMITS.program.titleMax);
    const cleanSchedule = truncateText(progSchedule, VALIDATION_LIMITS.program.scheduleMax);
    const cleanFormat = truncateText(progFormat, VALIDATION_LIMITS.program.formatMax);
    const cleanDesc = truncateText(progDesc, VALIDATION_LIMITS.program.descriptionMax);
    const cleanLoc = truncateText(progLocation, VALIDATION_LIMITS.program.locationOrLinkMax);
    const cleanOrder = Math.min(1000, Math.max(0, Math.round(Number(progOrder) || 1)));

    if (cleanTitle.length < 3 || cleanSchedule.length < 2 || cleanFormat.length < 2 || cleanDesc.length < 10) {
      setProgramFeedback('Please fill in program title, schedule, format, and description.');
      return;
    }

    setSavingProgram(true);
    const isEditingDemo = Boolean(editingProgramId?.startsWith('starter-'));
    const targetId =
      editingProgramId && !isEditingDemo
        ? editingProgramId
        : generateDocumentId('prog');
    try {
      if (useNeonDb) {
        await postNeonAction(
          'upsert_program',
          {
            id: targetId,
            title: cleanTitle,
            schedule: cleanSchedule,
            format: cleanFormat,
            description: cleanDesc,
            locationOrLink: cleanLoc,
            isActive: progActive,
            orderIndex: cleanOrder,
          },
          user
        );
        onNeonDataChanged?.();
      } else if (editingProgramId && !isEditingDemo) {
        await updateDoc(doc(db, 'programs', targetId), {
          title: cleanTitle,
          schedule: cleanSchedule,
          format: cleanFormat,
          description: cleanDesc,
          locationOrLink: cleanLoc,
          isActive: progActive,
          orderIndex: cleanOrder,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'programs', targetId), {
          title: cleanTitle,
          schedule: cleanSchedule,
          format: cleanFormat,
          description: cleanDesc,
          locationOrLink: cleanLoc,
          isActive: progActive,
          orderIndex: cleanOrder,
          authorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (isEditingDemo) {
          const otherDemos = programs.filter((p) => p.id !== editingProgramId);
          for (const demo of otherDemos) {
            const demoId = generateDocumentId('prog');
            await setDoc(doc(db, 'programs', demoId), {
              title: demo.title,
              schedule: demo.schedule,
              format: demo.format,
              description: demo.description,
              locationOrLink: demo.locationOrLink,
              isActive: demo.isActive,
              orderIndex: demo.orderIndex,
              authorId: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          await persistDemoFlag('hideDemoPrograms', true);
        }
      }
      setShowProgramForm(false);
      resetProgramForm();
      setProgramFeedback('Ministry program saved.');
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(
          error,
          editingProgramId && !isEditingDemo ? OperationType.UPDATE : OperationType.CREATE,
          `programs/${targetId}`
        );
      } else {
        setProgramFeedback(
          error instanceof Error ? error.message : 'Unable to save program.'
        );
      }
    } finally {
      setSavingProgram(false);
    }
  };

  const handleSeedStarterPrograms = async () => {
    if (!user || !isAdmin) return;
    setSavingProgram(true);
    try {
      if (useNeonDb) {
        for (const starter of STARTER_PROGRAMS) {
          await postNeonAction(
            'upsert_program',
            { id: generateDocumentId('prog'), ...starter },
            user
          );
        }
        onNeonDataChanged?.();
      } else {
        for (const starter of STARTER_PROGRAMS) {
          const docId = generateDocumentId('prog');
          await setDoc(doc(db, 'programs', docId), {
            ...starter,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await persistDemoFlag('hideDemoPrograms', true);
      }
      setProgramFeedback('Starter programs imported into your database.');
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(error, OperationType.CREATE, 'programs');
      }
    } finally {
      setSavingProgram(false);
    }
  };

  const handleToggleDemoPrograms = async (hide: boolean) => {
    if (!user || !isAdmin) return;
    setSavingProgram(true);
    setProgramFeedback('');
    try {
      await persistDemoFlag('hideDemoPrograms', hide);
      setProgramFeedback(
        hide ? 'All demo programs removed.' : 'Starter demo programs restored.'
      );
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(error, OperationType.WRITE, 'ministry_settings/main');
      }
    } finally {
      setSavingProgram(false);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!user || !isAdmin) return;
    if (useNeonDb) {
      try {
        await postNeonAction('delete_program', { id }, user);
        onNeonDataChanged?.();
      } catch (err) {
        setProgramFeedback(err instanceof Error ? err.message : 'Failed to delete program.');
      }
      return;
    }

    if (id.startsWith('starter-')) {
      setSavingProgram(true);
      try {
        const remaining = programs.filter((p) => p.id !== id);
        if (remaining.length === 0) {
          await persistDemoFlag('hideDemoPrograms', true);
          setProgramFeedback('Demo program removed.');
        } else {
          for (const demo of remaining) {
            const docId = generateDocumentId('prog');
            await setDoc(doc(db, 'programs', docId), {
              title: demo.title,
              schedule: demo.schedule,
              format: demo.format,
              description: demo.description,
              locationOrLink: demo.locationOrLink,
              isActive: demo.isActive,
              orderIndex: demo.orderIndex,
              authorId: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          await persistDemoFlag('hideDemoPrograms', true);
          setProgramFeedback('Demo program removed.');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'programs');
      } finally {
        setSavingProgram(false);
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'programs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `programs/${id}`);
    }
  };

  // --- INBOX ---
  const handleUpdateRequestStatus = async (
    req: PrayerRequest,
    nextStatus: PrayerRequestStatus,
    noteText?: string
  ) => {
    if (!isAdmin || !user) return;
    setSavingNote(true);
    const cleanNote = truncateText(
      noteText !== undefined ? noteText : req.adminNote,
      VALIDATION_LIMITS.prayer.adminNoteMax
    );
    try {
      if (useNeonDb) {
        await postNeonAction(
          'update_prayer_request',
          { id: req.id, status: nextStatus, adminNote: cleanNote },
          user
        );
        setPrayerRequests((prev) =>
          prev.map((item) =>
            item.id === req.id
              ? { ...item, status: nextStatus, adminNote: cleanNote }
              : item
          )
        );
      } else {
        await updateDoc(doc(db, 'prayer_requests', req.id), {
          status: nextStatus,
          adminNote: cleanNote,
          updatedAt: serverTimestamp(),
        });
      }
      if (selectedRequest?.id === req.id) {
        setSelectedRequest({ ...req, status: nextStatus, adminNote: cleanNote });
      }
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(error, OperationType.UPDATE, `prayer_requests/${req.id}`);
      }
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!isAdmin || !user) return;
    try {
      if (useNeonDb) {
        await postNeonAction('delete_prayer_request', { id }, user);
        setPrayerRequests((prev) => prev.filter((item) => item.id !== id));
      } else {
        await deleteDoc(doc(db, 'prayer_requests', id));
      }
      if (selectedRequest?.id === id) setSelectedRequest(null);
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(error, OperationType.DELETE, `prayer_requests/${id}`);
      }
    }
  };

  // --- SETTINGS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setSettingsFeedback('');
    setSavingSettings(true);

    const payload = buildSettingsPayload(settingsForm, user.uid);

    try {
      if (useNeonDb) {
        await postNeonAction(
          'save_settings',
          settingsForm as unknown as Record<string, unknown>,
          user
        );
        onNeonDataChanged?.();
      } else {
        await setDoc(doc(db, 'ministry_settings', 'main'), payload);
      }
      setSettingsFeedback('Hero section, profile, footer & social links saved.');
    } catch (error) {
      if (!useNeonDb) {
        handleFirestoreError(error, OperationType.WRITE, 'ministry_settings/main');
      } else {
        setSettingsFeedback(
          error instanceof Error ? error.message : 'Unable to save settings.'
        );
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredRequests =
    inboxFilter === 'all'
      ? prayerRequests
      : prayerRequests.filter((r) => r.status === inboxFilter);

  const unreadCount = prayerRequests.filter((r) => r.status === 'unread').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-[#E4E4E7]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
                Evangelist Portal
              </p>
              <h2
                id="studio-modal-title"
                className="text-xl sm:text-2xl font-semibold text-[#0B0B0D]"
              >
                Ministry Content &amp; Prayer Studio
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {isAdmin && (
              confirmReplaceAll ? (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={replacingAll}
                    onClick={() => void handleReplaceAllOldData()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#991B1B] text-white hover:bg-[#7F1D1D] cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{replacingAll ? 'Replacing...' : 'Confirm Reset Data'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={replacingAll}
                    onClick={() => setConfirmReplaceAll(false)}
                    className="px-2.5 py-2 rounded-lg text-xs font-medium border border-[#E4E4E7] bg-white text-[#0B0B0D] hover:bg-[#F4F4F5] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={replacingAll}
                  onClick={() => setConfirmReplaceAll(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#E4E4E7] bg-white text-[#0B0B0D] hover:bg-[#F4F4F5] cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Replace Old Data</span>
                </button>
              )
            )}
            {user && (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#E4E4E7] bg-[#FAFAFA] text-[#0B0B0D] hover:bg-[#F4F4F5] cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close portal"
              className="inline-flex items-center justify-center w-10 h-10 text-[#0B0B0D] hover:bg-[#F4F4F5] rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isAdmin ? (
          <div className="p-8 sm:p-12 max-w-md w-full mx-auto space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#2563EB] flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-semibold text-[#0B0B0D]">
                Admin Login
              </h3>
              <p className="text-sm text-[#52525B] leading-relaxed">
                {user
                  ? `Signed in as ${user.email || 'another account'}. Please sign in with the authorized administrator Google account to manage content and view private prayer requests.`
                  : 'Sign in with your authorized administrator Google account to manage sermons, blog posts, programs, and prayer inbox across all deployments.'}
              </p>
            </div>

            {authError && (
              <p className="p-3 rounded-lg text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] leading-relaxed">
                {authError}
              </p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={signingIn}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] transition-colors cursor-pointer disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {signingIn
                    ? 'Connecting...'
                    : user
                    ? 'Switch Google Account'
                    : 'Sign in with Google'}
                </span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-white text-[#0B0B0D] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 px-6 pt-3 bg-white border-b border-[#E4E4E7] overflow-x-auto">
              {(
                [
                  { id: 'sermons', label: 'Sermons & Videos', icon: BookOpen },
                  { id: 'blog', label: 'Blog Posts', icon: FileText },
                  { id: 'programs', label: 'Programs', icon: Calendar },
                  {
                    id: 'inbox',
                    label: unreadCount > 0 ? `Inbox (${unreadCount})` : 'Inbox',
                    icon: Inbox,
                  },
                  { id: 'social', label: 'Hero, Footer & Social', icon: Share2 },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === t.id
                        ? 'border-[#2563EB] text-[#2563EB]'
                        : 'border-transparent text-[#52525B] hover:text-[#0B0B0D]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* TAB 1: SERMONS & MIDWEEK VIDEOS ONLY */}
              {activeTab === 'sermons' && (() => {
                const videoSermons = sermons.filter(
                  (s) => s.category !== 'Word of Encouragement'
                );
                return (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-[#0B0B0D]">
                          Sermon Videos &amp; Midweek Videos
                        </h3>
                        <p className="text-xs text-[#52525B]">
                          &ldquo;Short Sermon&rdquo; appears on Sermons; &ldquo;Midweek Message&rdquo; plays from the Midweek Message card in Programs. (Blog posts are managed separately under Blog Posts.)
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {!hasFirestoreSermons && settingsForm.hideDemoSermons && (
                          <button
                            type="button"
                            onClick={() => void handleToggleDemoSermons(false)}
                            disabled={savingSermon || !isAdmin}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>Restore Demo Videos</span>
                          </button>
                        )}
                        {!hasFirestoreSermons && !settingsForm.hideDemoSermons && (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleToggleDemoSermons(true)}
                              disabled={savingSermon || !isAdmin}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#FECACA] text-[#991B1B] bg-[#FEF2F2] hover:bg-[#FEE2E2] cursor-pointer disabled:opacity-50"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Remove All Demo</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSeedStarterSermons}
                              disabled={savingSermon || !isAdmin}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] cursor-pointer disabled:opacity-50"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                              <span>Import All to Database</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            resetSermonForm();
                            setShowSermonForm((prev) => !prev);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{showSermonForm ? 'Hide Editor' : 'New Sermon Video'}</span>
                        </button>
                      </div>
                    </div>

                    {sermonFeedback && (
                      <div className="p-3 rounded-lg text-sm bg-white border border-[#E4E4E7] text-[#0B0B0D]">
                        {sermonFeedback}
                      </div>
                    )}

                    {showSermonForm && (
                      <form
                        onSubmit={handleSaveSermon}
                        className="bg-white border border-[#E4E4E7] rounded-2xl p-6 space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#52525B] mb-1">
                              Video Title *
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={VALIDATION_LIMITS.sermon.titleMax}
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#52525B] mb-1">
                              Video Category *
                            </label>
                            <select
                              value={category === 'Midweek Message' ? 'Midweek Message' : 'Short Sermon'}
                              onChange={(e) => setCategory(e.target.value as SermonCategory)}
                              className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                            >
                              <option value="Short Sermon">Short Sermon (Sermons Page)</option>
                              <option value="Midweek Message">
                                Midweek Message (Home Midweek Program Only)
                              </option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#52525B] mb-1">
                              Scripture Reference *
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={VALIDATION_LIMITS.sermon.scriptureRefMax}
                              value={scriptureRef}
                              onChange={(e) => setScriptureRef(e.target.value)}
                              placeholder="e.g., Psalm 23:1-3"
                              className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#52525B] mb-1">
                              Notes Read Time (min)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={60}
                              value={readTimeMinutes}
                              onChange={(e) => setReadTimeMinutes(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                            />
                          </div>
                        </div>

                        <ImageUploadField
                          label="Video Thumbnail Image"
                          value={coverImage}
                          onChange={setCoverImage}
                          user={user}
                          presets={COVER_IMAGE_PRESETS}
                          helperText="Upload a video thumbnail image from your device or choose starter artwork."
                        />

                        <div>
                          <label className="block text-xs font-semibold text-[#52525B] mb-1">
                            YouTube Video Link * (Plays inside site pop-up player)
                          </label>
                          <input
                            type="url"
                            required
                            maxLength={VALIDATION_LIMITS.sermon.videoUrlMax}
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#52525B] mb-1">
                            Key Scripture Quote (Optional)
                          </label>
                          <input
                            type="text"
                            maxLength={VALIDATION_LIMITS.sermon.scriptureQuoteMax}
                            value={scriptureQuote}
                            onChange={(e) => setScriptureQuote(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#52525B] mb-1">
                            Short Summary *
                          </label>
                          <textarea
                            rows={2}
                            required
                            maxLength={VALIDATION_LIMITS.sermon.summaryMax}
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#52525B] mb-1">
                            Full Sermon Notes *
                          </label>
                          <textarea
                            rows={5}
                            required
                            maxLength={VALIDATION_LIMITS.sermon.contentMax}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isFeatured}
                              onChange={(e) => setIsFeatured(e.target.checked)}
                              className="w-4 h-4 accent-[#2563EB]"
                            />
                            <span>Feature at top</span>
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isPublished}
                              onChange={(e) => setIsPublished(e.target.checked)}
                              className="w-4 h-4 accent-[#2563EB]"
                            />
                            <span>Published</span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={savingSermon || !isAdmin}
                          className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50"
                        >
                          {savingSermon ? 'Saving...' : 'Save Sermon Video'}
                        </button>
                      </form>
                    )}

                    <div className="bg-white border border-[#E4E4E7] rounded-2xl divide-y divide-[#E4E4E7]">
                      {!hasFirestoreSermons && !settingsForm.hideDemoSermons && (
                        <div className="px-4 py-3 bg-[#FFFBEB] text-xs text-[#92400E]">
                          Viewing starter demo videos currently shown on your site. Edit or delete any demo item below, or remove them all.
                        </div>
                      )}
                      {videoSermons.length === 0 ? (
                        <div className="p-6 text-sm text-[#52525B]">
                          {settingsForm.hideDemoSermons
                            ? 'Demo videos are hidden and no saved sermon videos exist yet. Click "New Sermon Video" or "Restore Demo Videos" above.'
                            : 'No sermon videos yet. Click "New Sermon Video" above to add one.'}
                        </div>
                      ) : (
                        videoSermons.map((s) => {
                          const isDemo = s.id.startsWith('starter-');
                          return (
                            <div
                              key={s.id}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <p className="text-xs text-[#52525B] flex flex-wrap items-center gap-1.5">
                                  <span className="font-semibold text-[#2563EB]">{s.category}</span>
                                  <span>· {s.scriptureRef}</span>
                                  <span>· {s.viewCount} views</span>
                                  {isDemo && (
                                    <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[10px] font-semibold uppercase tracking-wider">
                                      Demo
                                    </span>
                                  )}
                                </p>
                                <p className="font-semibold text-[#0B0B0D] truncate mt-0.5">
                                  {s.title}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startEditSermon(s)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E4E4E7] hover:bg-[#F4F4F5] cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={savingSermon || !isAdmin}
                                  onClick={() => void handleDeleteSermon(s.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#FECACA] text-[#991B1B] bg-[#FEF2F2] cursor-pointer disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* TAB 2: BLOG POSTS (Words of Encouragement & Faith Q&A — Images Only, No Video) */}
              {activeTab === 'blog' && (() => {
                const encouragementPosts = sermons.filter(
                  (s) => s.category === 'Word of Encouragement'
                );
                return (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-[#0B0B0D]">
                          Blog Posts (Images &amp; Writing Only)
                        </h3>
                        <p className="text-xs text-[#52525B]">
                          Publish Words of Encouragement (shown on Home &amp; Blog) and Faith Q&amp;A articles with uploaded images—separate from Sermon videos.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-[#E4E4E7]">
                        <button
                          type="button"
                          onClick={() => setBlogSubTab('encouragement')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                            blogSubTab === 'encouragement'
                              ? 'bg-[#2563EB] text-white'
                              : 'text-[#52525B] hover:text-[#0B0B0D]'
                          }`}
                        >
                          Words of Encouragement ({encouragementPosts.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setBlogSubTab('faith')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                            blogSubTab === 'faith'
                              ? 'bg-[#2563EB] text-white'
                              : 'text-[#52525B] hover:text-[#0B0B0D]'
                          }`}
                        >
                          Faith Q&amp;A Articles ({articles.length})
                        </button>
                      </div>
                    </div>

                    {blogSubTab === 'encouragement' ? (
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-[#52525B]">
                            Daily Words of Encouragement with cover image and visitor reactions (Amen / Praying / Encouraged). No video links.
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {!hasFirestoreSermons && settingsForm.hideDemoSermons && (
                              <button
                                type="button"
                                onClick={() => void handleToggleDemoSermons(false)}
                                disabled={savingSermon || !isAdmin}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] cursor-pointer disabled:opacity-50"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-[#2563EB]" />
                                <span>Restore Demo Posts</span>
                              </button>
                            )}
                            {!hasFirestoreSermons && !settingsForm.hideDemoSermons && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleToggleDemoSermons(true)}
                                  disabled={savingSermon || !isAdmin}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#FECACA] text-[#991B1B] bg-[#FEF2F2] hover:bg-[#FEE2E2] cursor-pointer disabled:opacity-50"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Remove Demo Posts</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSeedStarterSermons}
                                  disabled={savingSermon || !isAdmin}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] cursor-pointer disabled:opacity-50"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                                  <span>Import All to Database</span>
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                resetEncForm();
                                setShowEncForm((prev) => !prev);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{showEncForm ? 'Hide Editor' : 'New Encouragement Post'}</span>
                            </button>
                          </div>
                        </div>

                        {encFeedback && (
                          <div className="p-3 rounded-lg text-sm bg-white border border-[#E4E4E7]">
                            {encFeedback}
                          </div>
                        )}

                        {showEncForm && (
                          <form
                            onSubmit={handleSaveEnc}
                            className="bg-white border border-[#E4E4E7] rounded-2xl p-6 space-y-4"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                  Blog Post Title *
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={VALIDATION_LIMITS.sermon.titleMax}
                                  value={encTitle}
                                  onChange={(e) => setEncTitle(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                  Read Time (min)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  value={encReadTime}
                                  onChange={(e) => setEncReadTime(Number(e.target.value))}
                                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                  Scripture Reference *
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={VALIDATION_LIMITS.sermon.scriptureRefMax}
                                  value={encScriptureRef}
                                  onChange={(e) => setEncScriptureRef(e.target.value)}
                                  placeholder="e.g., Galatians 6:9"
                                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                  Key Scripture Quote (Optional)
                                </label>
                                <input
                                  type="text"
                                  maxLength={VALIDATION_LIMITS.sermon.scriptureQuoteMax}
                                  value={encScriptureQuote}
                                  onChange={(e) => setEncScriptureQuote(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                                />
                              </div>
                            </div>

                            <ImageUploadField
                              label="Blog Post Image"
                              value={encCoverImage}
                              onChange={setEncCoverImage}
                              user={user}
                              presets={COVER_IMAGE_PRESETS}
                              helperText="Upload an image file for this encouragement post (displayed on Home & Blog)."
                            />

                            <div>
                              <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                Short Summary *
                              </label>
                              <textarea
                                rows={2}
                                required
                                maxLength={VALIDATION_LIMITS.sermon.summaryMax}
                                value={encSummary}
                                onChange={(e) => setEncSummary(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                Full Word of Encouragement *
                              </label>
                              <textarea
                                rows={6}
                                required
                                maxLength={VALIDATION_LIMITS.sermon.contentMax}
                                value={encContent}
                                onChange={(e) => setEncContent(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                              />
                            </div>

                            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={encPublished}
                                onChange={(e) => setEncPublished(e.target.checked)}
                                className="w-4 h-4 accent-[#2563EB]"
                              />
                              <span>Published</span>
                            </label>

                            <div>
                              <button
                                type="submit"
                                disabled={savingEnc || !isAdmin}
                                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50"
                              >
                                {savingEnc ? 'Saving...' : 'Save Encouragement Post'}
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="bg-white border border-[#E4E4E7] rounded-2xl divide-y divide-[#E4E4E7]">
                          {!hasFirestoreSermons && !settingsForm.hideDemoSermons && (
                            <div className="px-4 py-3 bg-[#FFFBEB] text-xs text-[#92400E]">
                              Viewing starter demo encouragement posts currently shown on Home &amp; Blog. Edit or delete any item below.
                            </div>
                          )}
                          {encouragementPosts.length === 0 ? (
                            <div className="p-6 text-sm text-[#52525B]">
                              No encouragement blog posts yet. Click &ldquo;New Encouragement Post&rdquo; above to write one.
                            </div>
                          ) : (
                            encouragementPosts.map((s) => {
                              const isDemo = s.id.startsWith('starter-');
                              return (
                                <div
                                  key={s.id}
                                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs text-[#52525B] flex flex-wrap items-center gap-1.5">
                                      <span className="font-semibold text-[#2563EB]">Word of Encouragement</span>
                                      <span>· {s.scriptureRef}</span>
                                      <span>· {s.viewCount} views · Amen {s.amenCount} · Love {s.loveCount}</span>
                                      {isDemo && (
                                        <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[10px] font-semibold uppercase tracking-wider">
                                          Demo
                                        </span>
                                      )}
                                    </p>
                                    <p className="font-semibold text-[#0B0B0D] truncate mt-0.5">
                                      {s.title}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => startEditEnc(s)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E4E4E7] hover:bg-[#F4F4F5] cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={savingSermon || savingEnc || !isAdmin}
                                      onClick={() => void handleDeleteSermon(s.id)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#FECACA] text-[#991B1B] bg-[#FEF2F2] cursor-pointer disabled:opacity-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-[#52525B]">
                            Biblical Q&amp;A blog articles with uploaded cover images.
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {!hasFirestoreArticles && settingsForm.hideDemoArticles && (
                              <button
                                type="button"
                                onClick={() => void handleToggleDemoArticles(false)}
                                disabled={savingArticle || !isAdmin}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] cursor-pointer disabled:opacity-50"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-[#2563EB]" />
                                <span>Restore Demo Articles</span>
                              </button>
                            )}
                            {!hasFirestoreArticles && !settingsForm.hideDemoArticles && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleToggleDemoArticles(true)}
                                  disabled={savingArticle || !isAdmin}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#FECACA] text-[#991B1B] bg-[#FEF2F2] hover:bg-[#FEE2E2] cursor-pointer disabled:opacity-50"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Remove All Demo Articles</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSeedStarterArticles}
                                  disabled={savingArticle || !isAdmin}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] cursor-pointer disabled:opacity-50"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                                  <span>Import All to Database</span>
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                resetArticleForm();
                                setShowArticleForm((prev) => !prev);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{showArticleForm ? 'Hide Editor' : 'New Faith Article'}</span>
                            </button>
                          </div>
                        </div>

                        {articleFeedback && (
                          <div className="p-3 rounded-lg text-sm bg-white border border-[#E4E4E7]">
                            {articleFeedback}
                          </div>
                        )}

                        {showArticleForm && (
                          <form
                            onSubmit={handleSaveArticle}
                            className="bg-white border border-[#E4E4E7] rounded-2xl p-6 space-y-4"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                  Article Title *
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={VALIDATION_LIMITS.article.titleMax}
                                  value={artTitle}
                                  onChange={(e) => setArtTitle(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                  Question Addressed *
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={VALIDATION_LIMITS.article.questionPromptMax}
                                  value={artQuestion}
                                  onChange={(e) => setArtQuestion(e.target.value)}
                                  placeholder="e.g., How do I know God hears my prayer?"
                                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                  Topic *
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={VALIDATION_LIMITS.article.topicMax}
                                  value={artTopic}
                                  onChange={(e) => setArtTopic(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                  Scripture Reference *
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={VALIDATION_LIMITS.article.scriptureRefMax}
                                  value={artRef}
                                  onChange={(e) => setArtRef(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                  Read Time (min)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  value={artReadTime}
                                  onChange={(e) => setArtReadTime(Number(e.target.value))}
                                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                                />
                              </div>
                            </div>

                            <ImageUploadField
                              label="Article Cover Image"
                              value={artCoverImage}
                              onChange={setArtCoverImage}
                              user={user}
                              presets={COVER_IMAGE_PRESETS}
                              helperText="Upload an image file for this faith blog article."
                            />

                            <div>
                              <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                Short Answer Excerpt *
                              </label>
                              <textarea
                                rows={2}
                                required
                                maxLength={VALIDATION_LIMITS.article.excerptMax}
                                value={artExcerpt}
                                onChange={(e) => setArtExcerpt(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#52525B] mb-1">
                                Full Biblical Answer *
                              </label>
                              <textarea
                                rows={6}
                                required
                                maxLength={VALIDATION_LIMITS.article.contentMax}
                                value={artContent}
                                onChange={(e) => setArtContent(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                              />
                            </div>

                            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={artPublished}
                                onChange={(e) => setArtPublished(e.target.checked)}
                                className="w-4 h-4 accent-[#2563EB]"
                              />
                              <span>Published</span>
                            </label>

                            <div>
                              <button
                                type="submit"
                                disabled={savingArticle || !isAdmin}
                                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50"
                              >
                                {savingArticle ? 'Saving...' : 'Save Article'}
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="bg-white border border-[#E4E4E7] rounded-2xl divide-y divide-[#E4E4E7]">
                          {!hasFirestoreArticles && !settingsForm.hideDemoArticles && (
                            <div className="px-4 py-3 bg-[#FFFBEB] text-xs text-[#92400E]">
                              Viewing starter demo articles currently shown on your site. Edit or delete any demo item below, or remove them all.
                            </div>
                          )}
                          {articles.length === 0 ? (
                            <div className="p-6 text-sm text-[#52525B]">
                              {settingsForm.hideDemoArticles
                                ? 'Demo articles are hidden and no saved articles exist yet. Click "New Faith Article" or "Restore Demo Articles" above.'
                                : 'No faith articles yet. Click "New Faith Article" above to publish one.'}
                            </div>
                          ) : (
                            articles.map((a) => {
                              const isDemo = a.id.startsWith('starter-');
                              return (
                                <div
                                  key={a.id}
                                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs text-[#52525B] flex flex-wrap items-center gap-1.5">
                                      <span className="font-semibold text-[#2563EB]">{a.topic}</span>
                                      <span>· {a.scriptureRef}</span>
                                      <span>· {a.viewCount} views</span>
                                      {isDemo && (
                                        <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[10px] font-semibold uppercase tracking-wider">
                                          Demo
                                        </span>
                                      )}
                                    </p>
                                    <p className="font-semibold text-[#0B0B0D] truncate mt-0.5">
                                      {a.title}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => startEditArticle(a)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E4E4E7] hover:bg-[#F4F4F5] cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={savingArticle || !isAdmin}
                                      onClick={() => void handleDeleteArticle(a.id)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#FECACA] text-[#991B1B] bg-[#FEF2F2] cursor-pointer disabled:opacity-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TAB 3: PROGRAMS */}
              {activeTab === 'programs' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[#0B0B0D]">
                        Ministry Programs
                      </h3>
                      <p className="text-xs text-[#52525B]">
                        Manage fellowships, live Q&amp;As, prayer watches, and outreach schedules.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!hasFirestorePrograms && settingsForm.hideDemoPrograms && (
                        <button
                          type="button"
                          onClick={() => void handleToggleDemoPrograms(false)}
                          disabled={savingProgram || !isAdmin}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>Restore Demo Programs</span>
                        </button>
                      )}
                      {!hasFirestorePrograms && !settingsForm.hideDemoPrograms && (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleToggleDemoPrograms(true)}
                            disabled={savingProgram || !isAdmin}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#FECACA] text-[#991B1B] bg-[#FEF2F2] hover:bg-[#FEE2E2] cursor-pointer disabled:opacity-50"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Remove All Demo Programs</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSeedStarterPrograms}
                            disabled={savingProgram || !isAdmin}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>Import All to Database</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          resetProgramForm();
                          setShowProgramForm((prev) => !prev);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{showProgramForm ? 'Hide Editor' : 'New Program'}</span>
                      </button>
                    </div>
                  </div>

                  {programFeedback && (
                    <div className="p-3 rounded-lg text-sm bg-white border border-[#E4E4E7]">
                      {programFeedback}
                    </div>
                  )}

                  {showProgramForm && (
                    <form
                      onSubmit={handleSaveProgram}
                      className="bg-white border border-[#E4E4E7] rounded-2xl p-6 space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#52525B] mb-1">
                            Program Title *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={VALIDATION_LIMITS.program.titleMax}
                            value={progTitle}
                            onChange={(e) => setProgTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#52525B] mb-1">
                            Schedule *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={VALIDATION_LIMITS.program.scheduleMax}
                            value={progSchedule}
                            onChange={(e) => setProgSchedule(e.target.value)}
                            placeholder="e.g., Wednesdays · 7:00 PM"
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#52525B] mb-1">
                            Format *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={VALIDATION_LIMITS.program.formatMax}
                            value={progFormat}
                            onChange={(e) => setProgFormat(e.target.value)}
                            placeholder="e.g., YouTube Live"
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#52525B] mb-1">
                            Location or Link Note
                          </label>
                          <input
                            type="text"
                            maxLength={VALIDATION_LIMITS.program.locationOrLinkMax}
                            value={progLocation}
                            onChange={(e) => setProgLocation(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#52525B] mb-1">
                            Display Order
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={1000}
                            value={progOrder}
                            onChange={(e) => setProgOrder(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#52525B] mb-1">
                          Description *
                        </label>
                        <textarea
                          rows={3}
                          required
                          maxLength={VALIDATION_LIMITS.program.descriptionMax}
                          value={progDesc}
                          onChange={(e) => setProgDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                        />
                      </div>

                      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={progActive}
                          onChange={(e) => setProgActive(e.target.checked)}
                          className="w-4 h-4 accent-[#2563EB]"
                        />
                        <span>Active</span>
                      </label>

                      <div>
                        <button
                          type="submit"
                          disabled={savingProgram || !isAdmin}
                          className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50"
                        >
                          {savingProgram ? 'Saving...' : 'Save Program'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="bg-white border border-[#E4E4E7] rounded-2xl divide-y divide-[#E4E4E7]">
                    {!hasFirestorePrograms && !settingsForm.hideDemoPrograms && (
                      <div className="px-4 py-3 bg-[#FFFBEB] text-xs text-[#92400E]">
                        Viewing starter demo programs currently shown on your site. Edit or delete any demo item below, or remove them all.
                      </div>
                    )}
                    {programs.length === 0 ? (
                      <div className="p-6 text-sm text-[#52525B]">
                        {settingsForm.hideDemoPrograms
                          ? 'Demo programs are hidden and no saved programs exist yet. Click "New Program" or "Restore Demo Programs" above.'
                          : 'No programs yet. Click "New Program" above to add one.'}
                      </div>
                    ) : (
                      programs.map((p) => {
                        const isDemo = p.id.startsWith('starter-');
                        return (
                          <div
                            key={p.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs text-[#52525B] flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-[#2563EB]">{p.format}</span>
                                <span>· {p.schedule}</span>
                                {isDemo && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[10px] font-semibold uppercase tracking-wider">
                                    Demo
                                  </span>
                                )}
                              </p>
                              <p className="font-semibold text-[#0B0B0D] truncate mt-0.5">
                                {p.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditProgram(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E4E4E7] hover:bg-[#F4F4F5] cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                disabled={savingProgram || !isAdmin}
                                onClick={() => void handleDeleteProgram(p.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#FECACA] text-[#991B1B] bg-[#FEF2F2] cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: INBOX */}
              {activeTab === 'inbox' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[#0B0B0D]">
                        Prayer Requests, Faith Questions &amp; Inquiries
                      </h3>
                      <p className="text-xs text-[#52525B]">
                        Private inbox visible exclusively to {ADMIN_EMAIL}.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#E4E4E7]">
                      {(
                        [
                          { id: 'all', label: 'All' },
                          { id: 'unread', label: 'Unread' },
                          { id: 'prayed_over', label: 'Prayed Over' },
                          { id: 'replied', label: 'Replied' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setInboxFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            inboxFilter === tab.id
                              ? 'bg-[#2563EB] text-white'
                              : 'text-[#52525B] hover:text-[#0B0B0D]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!isAdmin ? (
                    <div className="bg-white border border-[#E4E4E7] rounded-2xl p-10 text-center text-sm text-[#52525B]">
                      Connect your Google account ({ADMIN_EMAIL}) above to view private prayer requests and inquiries.
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="bg-white border border-[#E4E4E7] rounded-2xl p-10 text-center text-sm text-[#52525B]">
                      No messages in this filter.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      <div className="lg:col-span-5 bg-white border border-[#E4E4E7] rounded-2xl divide-y divide-[#E4E4E7] max-h-[55vh] overflow-y-auto">
                        {filteredRequests.map((req) => (
                          <button
                            key={req.id}
                            type="button"
                            onClick={() => {
                              setSelectedRequest(req);
                              setAdminNoteDraft(req.adminNote || '');
                            }}
                            className={`w-full text-left p-4 transition-colors cursor-pointer ${
                              selectedRequest?.id === req.id
                                ? 'bg-[#EEF2FF]'
                                : 'hover:bg-[#FAFAFA]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-xs text-[#52525B]">
                              <span className="font-semibold text-[#2563EB]">
                                {req.requestType}
                              </span>
                              <span>
                                {req.status === 'unread'
                                  ? 'Unread'
                                  : req.status === 'prayed_over'
                                  ? 'Prayed Over'
                                  : req.status === 'replied'
                                  ? 'Replied'
                                  : 'Archived'}
                              </span>
                            </div>
                            <p className="mt-1 font-semibold text-[#0B0B0D] truncate">
                              {req.subject}
                            </p>
                            <p className="mt-0.5 text-xs text-[#52525B]">
                              From {req.senderName} · {formatDateValue(req.createdAt)}
                            </p>
                          </button>
                        ))}
                      </div>

                      <div className="lg:col-span-7 bg-white border border-[#E4E4E7] rounded-2xl p-6">
                        {selectedRequest ? (
                          <div className="space-y-5">
                            <div className="border-b border-[#E4E4E7] pb-4 flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs text-[#2563EB] font-semibold">
                                  {selectedRequest.requestType} ·{' '}
                                  {formatDateValue(selectedRequest.createdAt)}
                                </p>
                                <h4 className="text-xl font-semibold text-[#0B0B0D] mt-1">
                                  {selectedRequest.subject}
                                </h4>
                                <p className="text-sm text-[#52525B] mt-1">
                                  From{' '}
                                  <strong className="text-[#0B0B0D]">
                                    {selectedRequest.senderName}
                                  </strong>
                                  {selectedRequest.senderEmail
                                    ? ` · ${selectedRequest.senderEmail}`
                                    : ''}
                                  {selectedRequest.senderPhone
                                    ? ` · ${selectedRequest.senderPhone}`
                                    : ''}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeleteRequest(selectedRequest.id)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#991B1B] border border-[#FECACA] bg-[#FEF2F2] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>

                            <p className="text-sm text-[#27272A] leading-relaxed whitespace-pre-wrap">
                              {selectedRequest.message}
                            </p>

                            <div className="pt-4 border-t border-[#E4E4E7] space-y-3">
                              <label className="block text-xs font-semibold text-[#52525B]">
                                Private Pastoral Note
                              </label>
                              <textarea
                                rows={3}
                                maxLength={VALIDATION_LIMITS.prayer.adminNoteMax}
                                value={adminNoteDraft}
                                onChange={(e) => setAdminNoteDraft(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  disabled={savingNote}
                                  onClick={() =>
                                    void handleUpdateRequestStatus(
                                      selectedRequest,
                                      'prayed_over',
                                      adminNoteDraft
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mark Prayed Over</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={savingNote}
                                  onClick={() =>
                                    void handleUpdateRequestStatus(
                                      selectedRequest,
                                      'replied',
                                      adminNoteDraft
                                    )
                                  }
                                  className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-[#FAFAFA] cursor-pointer"
                                >
                                  Mark Replied
                                </button>
                                <button
                                  type="button"
                                  disabled={savingNote}
                                  onClick={() =>
                                    void handleUpdateRequestStatus(
                                      selectedRequest,
                                      'archived',
                                      adminNoteDraft
                                    )
                                  }
                                  className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E4E4E7] bg-white cursor-pointer"
                                >
                                  Archive
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-[#52525B] py-12 text-center">
                            Select a message from the left to read and respond.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: HERO, PROFILE & SOCIAL */}
              {activeTab === 'social' && (
                <form
                  onSubmit={handleSaveSettings}
                  className="bg-white border border-[#E4E4E7] rounded-2xl p-6 space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-[#0B0B0D]">
                      Hero Section, Profile, Footer &amp; Social Links
                    </h3>
                    <p className="text-xs text-[#52525B]">
                      Customize the Home Hero headline, portrait, weekly scripture, footer text &amp; credit, and social media portals.
                    </p>
                  </div>

                  {settingsFeedback && (
                    <div className="p-3 rounded-lg text-sm bg-[#EEF2FF] text-[#2563EB]">
                      {settingsFeedback}
                    </div>
                  )}

                  {/* HERO SECTION CUSTOMIZATION */}
                  <div className="p-5 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] space-y-4">
                    <p className="text-xs uppercase tracking-wider font-semibold text-[#2563EB]">
                      Hero Section Content
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#52525B] mb-1">
                          Hero Eyebrow Label *
                        </label>
                        <input
                          type="text"
                          required
                          minLength={VALIDATION_LIMITS.settings.heroEyebrowMin}
                          maxLength={VALIDATION_LIMITS.settings.heroEyebrowMax}
                          value={settingsForm.heroEyebrow}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              heroEyebrow: e.target.value,
                            })
                          }
                          placeholder="Gospel Ministry · Faith Portfolio · Daily Grace"
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#52525B] mb-1">
                          Hero Main Title *
                        </label>
                        <input
                          type="text"
                          required
                          minLength={VALIDATION_LIMITS.settings.evangelistNameMin}
                          maxLength={VALIDATION_LIMITS.settings.evangelistNameMax}
                          value={settingsForm.evangelistName}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              evangelistName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#52525B] mb-1">
                        Hero Description / Tagline *
                      </label>
                      <textarea
                        rows={2}
                        required
                        minLength={VALIDATION_LIMITS.settings.ministryTaglineMin}
                        maxLength={VALIDATION_LIMITS.settings.ministryTaglineMax}
                        value={settingsForm.ministryTagline}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            ministryTagline: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#52525B] mb-1">
                          Primary Button Label (Sermons) *
                        </label>
                        <input
                          type="text"
                          required
                          minLength={VALIDATION_LIMITS.settings.heroCtaMin}
                          maxLength={VALIDATION_LIMITS.settings.heroCtaMax}
                          value={settingsForm.heroPrimaryCtaLabel}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              heroPrimaryCtaLabel: e.target.value,
                            })
                          }
                          placeholder="Watch Sermons"
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#52525B] mb-1">
                          Secondary Button Label (Blog Q&amp;A) *
                        </label>
                        <input
                          type="text"
                          required
                          minLength={VALIDATION_LIMITS.settings.heroCtaMin}
                          maxLength={VALIDATION_LIMITS.settings.heroCtaMax}
                          value={settingsForm.heroSecondaryCtaLabel}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              heroSecondaryCtaLabel: e.target.value,
                            })
                          }
                          placeholder="Answers About Faith"
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7]"
                        />
                      </div>
                    </div>

                    <ImageUploadField
                      label="Hero Portrait Image"
                      value={settingsForm.portraitUrl}
                      onChange={(nextUrl) =>
                        setSettingsForm({
                          ...settingsForm,
                          portraitUrl: nextUrl,
                        })
                      }
                      user={user}
                      presets={COVER_IMAGE_PRESETS}
                      helperText="Upload a portrait image from your device or select starter artwork."
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#52525B] mb-1">
                          Hero Weekly Scripture *
                        </label>
                        <input
                          type="text"
                          required
                          minLength={VALIDATION_LIMITS.settings.weeklyVerseMin}
                          maxLength={VALIDATION_LIMITS.settings.weeklyVerseMax}
                          value={settingsForm.weeklyVerse}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              weeklyVerse: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#52525B] mb-1">
                          Scripture Reference *
                        </label>
                        <input
                          type="text"
                          required
                          minLength={VALIDATION_LIMITS.settings.weeklyVerseRefMin}
                          maxLength={VALIDATION_LIMITS.settings.weeklyVerseRefMax}
                          value={settingsForm.weeklyVerseRef}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              weeklyVerseRef: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ABOUT & CONTACT DETAILS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#52525B] mb-1">
                        Public Email
                      </label>
                      <input
                        type="email"
                        maxLength={VALIDATION_LIMITS.settings.contactEmailMax}
                        value={settingsForm.contactEmail}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            contactEmail: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#52525B] mb-1">
                        Location / Ministry Base
                      </label>
                      <input
                        type="text"
                        maxLength={VALIDATION_LIMITS.settings.locationMax}
                        value={settingsForm.location}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            location: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#52525B] mb-1">
                      About Bio
                    </label>
                    <textarea
                      rows={3}
                      required
                      maxLength={VALIDATION_LIMITS.settings.aboutBioMax}
                      value={settingsForm.aboutBio}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          aboutBio: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                    />
                  </div>

                  {/* FOOTER CONTENT CUSTOMIZATION */}
                  <div className="p-5 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] space-y-4">
                    <p className="text-xs uppercase tracking-wider font-semibold text-[#2563EB]">
                      Footer Content
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#52525B] mb-1">
                          Footer Heading *
                        </label>
                        <input
                          type="text"
                          required
                          minLength={VALIDATION_LIMITS.settings.footerHeadingMin}
                          maxLength={VALIDATION_LIMITS.settings.footerHeadingMax}
                          value={settingsForm.footerHeading}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              footerHeading: e.target.value,
                            })
                          }
                          placeholder="EVANGELIST SHEPHERD"
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#52525B] mb-1">
                          Footer Credit Line
                        </label>
                        <input
                          type="text"
                          maxLength={VALIDATION_LIMITS.settings.footerCreditMax}
                          value={settingsForm.footerCredit}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              footerCredit: e.target.value,
                            })
                          }
                          placeholder="Developed by Shepherd Zisper Phiri"
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#52525B] mb-1">
                        Footer Bio / Description
                      </label>
                      <textarea
                        rows={2}
                        maxLength={VALIDATION_LIMITS.settings.footerBioMax}
                        value={settingsForm.footerBio}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            footerBio: e.target.value,
                          })
                        }
                        placeholder="Short sermons, honest answers about Christian faith, and daily words of encouragement."
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#52525B] mb-1">
                        Footer Copyright Text
                      </label>
                      <input
                        type="text"
                        maxLength={VALIDATION_LIMITS.settings.footerCopyrightMax}
                        value={settingsForm.footerCopyright}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            footerCopyright: e.target.value,
                          })
                        }
                        placeholder="© 2026 Evangelist Shepherd. All rights reserved."
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-[#E4E4E7]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E4E4E7]">
                    <p className="text-xs uppercase tracking-wider font-semibold text-[#2563EB] mb-3">
                      Social Media Portals
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(
                        [
                          { key: 'youtubeUrl', label: 'YouTube URL' },
                          { key: 'facebookUrl', label: 'Facebook URL' },
                          { key: 'instagramUrl', label: 'Instagram URL' },
                          { key: 'tiktokUrl', label: 'TikTok URL' },
                          { key: 'xUrl', label: 'X (Twitter) URL' },
                          { key: 'whatsappUrl', label: 'WhatsApp URL' },
                          { key: 'podcastUrl', label: 'Audio Podcast URL' },
                        ] as const
                      ).map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs font-semibold text-[#52525B] mb-1">
                            {field.label}
                          </label>
                          <input
                            type="url"
                            maxLength={VALIDATION_LIMITS.settings.socialUrlMax}
                            value={settingsForm[field.key]}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                [field.key]: e.target.value,
                              })
                            }
                            placeholder="https://..."
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings || !isAdmin}
                    className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-[#0B0B0D] text-white hover:bg-[#2563EB] cursor-pointer disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
