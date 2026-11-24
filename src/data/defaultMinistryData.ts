import {
  FaithArticle,
  MinistryProgram,
  MinistrySettings,
  Sermon,
} from '../types/ministry';

export const PORTRAIT_IMAGE_PATH =
  '/src/assets/images/hero_evangelist_portrait_1795509039824.jpg';
export const ABSTRACT_ART_PATH =
  '/src/assets/images/abstract_faith_geometry_1795509039152.jpg';
export const SERMON_STUDIO_PATH =
  '/src/assets/images/sermon_studio_mic_1795509039156.jpg';
export const PRAYER_IMAGE_PATH =
  '/src/assets/images/prayer_sanctuary_light_1795507302282.jpg';

export const COVER_IMAGE_PRESETS = [
  {
    label: 'Evangelist Portrait (Default)',
    path: '/src/assets/images/hero_evangelist_portrait_1795509039824.jpg',
  },
  {
    label: 'Abstract Light Architecture',
    path: '/src/assets/images/abstract_faith_geometry_1795509039152.jpg',
  },
  {
    label: 'Ministry Broadcast Studio',
    path: '/src/assets/images/sermon_studio_mic_1795509039156.jpg',
  },
  {
    label: 'Morning Sunrise Over Hills',
    path: '/src/assets/images/sermon_morning_grace_1795507301464.jpg',
  },
  {
    label: 'Open Study Bible',
    path: '/src/assets/images/sermon_open_scripture_1795507302615.jpg',
  },
  {
    label: 'Quiet Prayer Sanctuary',
    path: '/src/assets/images/prayer_sanctuary_light_1795507302282.jpg',
  },
];

export const DEFAULT_MINISTRY_SETTINGS: MinistrySettings = {
  evangelistName: 'EVANGELIST SHEPHERD',
  heroEyebrow: 'Gospel Ministry · Faith Portfolio · Daily Grace',
  ministryTagline:
    'A living portfolio of Gospel truth, short YouTube sermons, honest answers about Christian faith, and daily encouragement.',
  heroPrimaryCtaLabel: 'Watch Sermons',
  heroSecondaryCtaLabel: 'Answers About Faith',
  aboutBio:
    'Evangelist Shepherd (Shepherd Zisper Phiri) is a Gospel preacher, teacher of Scripture, and pastoral mentor committed to making biblical truth clear, accessible, and deeply practical for seekers and believers alike. Through short video sermons, interactive encouragement notes, and faith-centered Q&A articles, this ministry equips people to walk with Christ in everyday life.',
  portraitUrl: PORTRAIT_IMAGE_PATH,
  weeklyVerse:
    'Your word is a lamp to my feet and a light to my path.',
  weeklyVerseRef: 'Psalm 119:105',
  contactEmail: 'sheperdphiri88@gmail.com',
  location: 'Global Gospel Outreach & Online Discipleship',
  footerHeading: 'EVANGELIST SHEPHERD',
  footerBio:
    'A living portfolio of Gospel truth, short video sermons, honest answers about Christian faith, and daily encouragement.',
  footerCopyright: `© ${new Date().getFullYear()} EVANGELIST SHEPHERD. All rights reserved.`,
  footerCredit: 'Developed by Shepherd Zisper Phiri',
  hideDemoSermons: false,
  hideDemoArticles: false,
  hideDemoPrograms: false,
  youtubeUrl: 'https://www.youtube.com',
  facebookUrl: 'https://www.facebook.com',
  instagramUrl: 'https://www.instagram.com',
  tiktokUrl: 'https://www.tiktok.com',
  xUrl: 'https://x.com',
  whatsappUrl: '',
  podcastUrl: '',
};

export const STARTER_SERMONS: Omit<
  Sermon,
  'id' | 'authorId' | 'createdAt' | 'updatedAt'
>[] = [
  {
    title: 'How to Hear God Clearly in a Noisy World',
    category: 'Short Sermon',
    scriptureRef: '1 Kings 19:11–13',
    scriptureQuote:
      'And after the fire the sound of a low whisper. And when Elijah heard it, he wrapped his face in his cloak and went out.',
    summary:
      'A 4-minute sermon unpacking why God often speaks through stillness, Scripture, and quiet conviction rather than spectacle.',
    content: `We live in an age of constant noise, notifications, and urgent opinions. Many sincere believers wonder why they struggle to sense God's direction when life accelerates.

In 1 Kings 19, Elijah expected God in the wind, the earthquake, and the fire—yet the Lord met him in a gentle whisper. God was teaching His prophet that spiritual clarity rarely competes with volume; it invites stillness.

Three simple practices cultivate an attentive heart:
1. Begin the morning with ten unhurried minutes in Scripture before opening social feeds.
2. Measure every impression against the unchanging character of Jesus in the Gospels.
3. Obey the small promptings of love, integrity, and prayer you already know today.`,
    readTimeMinutes: 3,
    coverImage: SERMON_STUDIO_PATH,
    videoUrl: 'https://www.youtube.com/@YouTube',
    isFeatured: true,
    isPublished: true,
    amenCount: 24,
    prayCount: 11,
    loveCount: 18,
    viewCount: 148,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'Strength for Today: God Sees What You Plant in Secret',
    category: 'Word of Encouragement',
    scriptureRef: 'Galatians 6:9',
    scriptureQuote:
      'Let us not grow weary of doing good, for in due season we will reap, if we do not give up.',
    summary:
      'An encouragement for anyone praying quietly for family, serving faithfully without recognition, or waiting on God’s timing.',
    content: `Much of the deepest spiritual fruit grows beneath the surface long before anyone sees green shoots. Do not despise quiet seasons of faithfulness.

Whether you are interceding for someone you love, choosing honesty in a difficult workplace, or rebuilding after disappointment, heaven records every act of endurance. Keep sowing hope today—the harvest belongs to God.`,
    readTimeMinutes: 2,
    coverImage: ABSTRACT_ART_PATH,
    videoUrl: '',
    isFeatured: false,
    isPublished: true,
    amenCount: 31,
    prayCount: 14,
    loveCount: 27,
    viewCount: 215,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'Anchored in Peace When Tomorrow Feels Uncertain',
    category: 'Short Sermon',
    scriptureRef: 'Isaiah 26:3',
    scriptureQuote:
      'You keep him in perfect peace whose mind is stayed on you, because he trusts in you.',
    summary:
      'Short YouTube teaching on trading circular anxiety for Christ-centered steadiness through daily surrender and prayer.',
    content: `Peace in Scripture is never denial of hardship—it is confidence in who holds the future. Isaiah promises doubled wholeness ("shalom, shalom") to the mind that chooses to stay anchored on God.

Whenever anxious thoughts spiral, turn them into direct conversation with Christ. Name the fear, place it in His hands, and recall His past faithfulness.`,
    readTimeMinutes: 3,
    coverImage: '/src/assets/images/sermon_morning_grace_1795507301464.jpg',
    videoUrl: 'https://www.youtube.com',
    isFeatured: false,
    isPublished: true,
    amenCount: 19,
    prayCount: 9,
    loveCount: 15,
    viewCount: 119,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'You Are Never Beyond the Reach of Grace',
    category: 'Word of Encouragement',
    scriptureRef: 'Romans 8:38–39',
    scriptureQuote:
      'For I am sure that neither death nor life... will be able to separate us from the love of God in Christ Jesus our Lord.',
    summary:
      'A reminder that regret and past mistakes never outlast the mercy of Jesus Christ.',
    content: `Shame tells you to hide from God; the Gospel invites you to run toward Him. Nothing in your past surprises Jesus, and nothing in your present can disqualify you from His grace when you turn to Him in humility.`,
    readTimeMinutes: 2,
    coverImage: '/src/assets/images/sermon_open_scripture_1795507302615.jpg',
    videoUrl: '',
    isFeatured: false,
    isPublished: true,
    amenCount: 42,
    prayCount: 16,
    loveCount: 34,
    viewCount: 284,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'Wednesday Word: Standing Firm in Prayer & Faith',
    category: 'Midweek Message',
    scriptureRef: 'James 5:16 · Psalm 27:14',
    scriptureQuote:
      'Wait for the Lord; be strong, and let your heart take courage; wait for the Lord!',
    summary:
      'Midweek encouragement and biblical teaching for every Wednesday—strengthening believers to keep praying and trusting God midweek.',
    content: `Midweek is often where Monday's energy fades and weekend encouragement feels far away. Yet Wednesday is an appointed moment to pause, refocus on Christ, and draw fresh strength from Scripture.

When you paste a YouTube video link for any Midweek Message in the Ministry Studio, the embedded video player will automatically appear here and on the Home page under Midweek Message.`,
    readTimeMinutes: 4,
    coverImage: SERMON_STUDIO_PATH,
    videoUrl: 'https://www.youtube.com',
    isFeatured: true,
    isPublished: true,
    amenCount: 17,
    prayCount: 12,
    loveCount: 14,
    viewCount: 96,
    authorName: 'Evangelist Shepherd',
  },
];

export const STARTER_FAITH_ARTICLES: Omit<
  FaithArticle,
  'id' | 'authorId' | 'createdAt' | 'updatedAt'
>[] = [
  {
    title: 'What Does It Really Mean to Have Faith in Jesus?',
    questionPrompt: 'How is biblical faith different from blind optimism?',
    topic: 'Foundations of Faith',
    scriptureRef: 'Hebrews 11:1 · Ephesians 2:8–9',
    excerpt:
      'Faith is not pretending difficulties do not exist—it is relational trust in the proven character, death, and resurrection of Jesus Christ.',
    content: `Many people assume faith means closing your eyes to reality and hoping for the best. In Scripture, however, faith is grounded trust—confidence placed in a trustworthy Person.

Biblical faith rests on three pillars:
1. Knowledge of Truth: Understanding who Jesus is and what He accomplished through His life, cross, and resurrection.
2. Personal Trust: Relying on Christ rather than our own moral performance to make us right with God.
3. Living Obedience: Allowing that trust to reshape how we love God, treat neighbors, forgive enemies, and endure trials.

You do not need perfect, doubt-free certainty to begin. Even a mustard seed of honest trust placed in a great Savior is enough to start walking with God today.`,
    coverImage: '/src/assets/images/sermon_open_scripture_1795507302615.jpg',
    readTimeMinutes: 4,
    viewCount: 134,
    isPublished: true,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'Why Does God Allow Difficult Seasons If He Loves Us?',
    questionPrompt: 'Where is God when prayers feel unanswered?',
    topic: 'Doubt & Suffering',
    scriptureRef: 'Romans 8:28 · John 16:33',
    excerpt:
      'Jesus never promised a trouble-free life—He promised His unbreakable presence inside every storm and eternal redemption beyond it.',
    content: `One of the most honest questions anyone can ask about Christianity is why suffering persists in a world made by a loving God.

Scripture never trivializes pain. Jesus Himself wept at the tomb of Lazarus, and the Psalms are filled with raw cries of lament. The Christian answer is not a cold formula—it is a Savior who entered human suffering personally on the cross.

While we do not always see the full purpose behind every hardship right now, God uses trials to refine character, deepen compassion, and remind us that this broken present is not the final chapter.`,
    coverImage: PRAYER_IMAGE_PATH,
    readTimeMinutes: 5,
    viewCount: 162,
    isPublished: true,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'How Do I Start Praying and Reading the Bible Consistently?',
    questionPrompt: 'What is a practical daily rhythm for a new believer?',
    topic: 'Prayer & Scripture',
    scriptureRef: 'Matthew 6:6–13 · Psalm 1:1–3',
    excerpt:
      'Start small, pray honestly in plain language, and read one chapter of the Gospels each day rather than aiming for perfection.',
    content: `Prayer does not require religious eloquence. God welcomes honest, everyday conversation—gratitude, confession, requests for wisdom, and intercession for others.

To build a sustainable rhythm:
- Choose one consistent 10-minute window each morning or evening.
- Begin in the Gospel of John or Mark, reading one short section slowly.
- Ask three questions: What does this show about God? What does it reveal about humanity? What is one step I can live out today?`,
    coverImage: '/src/assets/images/sermon_morning_grace_1795507301464.jpg',
    readTimeMinutes: 3,
    viewCount: 108,
    isPublished: true,
    authorName: 'Evangelist Shepherd',
  },
];

export const STARTER_PROGRAMS: Omit<
  MinistryProgram,
  'id' | 'authorId' | 'createdAt' | 'updatedAt'
>[] = [
  {
    title: 'Word of the Day',
    schedule: 'Daily',
    format: 'Daily Encouragement',
    description:
      'A fresh daily word of encouragement and scripture meditation shared to uplift your walk with God.',
    locationOrLink: 'Published daily on Home & Blog',
    isActive: true,
    orderIndex: 1,
  },
  {
    title: 'Midweek Message',
    schedule: 'Every Wednesday',
    format: 'Weekly Midweek Video',
    description:
      'Midweek biblical teaching encouraging believers in truth, prayer, and steady faith.',
    locationOrLink: 'Every Wednesday · Watch right on the site',
    isActive: true,
    orderIndex: 2,
  },
];
