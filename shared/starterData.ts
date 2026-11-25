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

export const DEFAULT_MINISTRY_SETTINGS_DATA = {
  evangelistName: 'EVANGELIST SHEPHERD',
  heroEyebrow: 'Gospel Ministry · Faith Portfolio · Daily Grace',
  ministryTagline:
    'Proclaiming the Gospel of Jesus Christ through scripture-rooted sermons, daily encouragement, and faithful biblical answers.',
  heroPrimaryCtaLabel: 'Watch Sermons',
  heroSecondaryCtaLabel: 'Answers About Faith',
  aboutBio:
    'Evangelist Shepherd (Shepherd Zisper Phiri) is a Gospel preacher and teacher of Scripture dedicated to sharing the hope, salvation, and everyday grace found in Jesus Christ. Through video sermons, daily devotional notes, and biblical Q&A teachings, this ministry walks alongside believers and seekers across nations.',
  portraitUrl: PORTRAIT_IMAGE_PATH,
  weeklyVerse:
    'Your word is a lamp to my feet and a light to my path.',
  weeklyVerseRef: 'Psalm 119:105',
  contactEmail: 'sheperdphiri88@gmail.com',
  location: 'Global Gospel Outreach & Online Discipleship',
  footerHeading: 'EVANGELIST SHEPHERD',
  footerBio:
    'Proclaiming the Gospel of Jesus Christ through scripture-rooted sermons, daily encouragement, and faithful biblical answers.',
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

export interface StarterSermonSeed {
  title: string;
  category: 'Short Sermon' | 'Midweek Message' | 'Word of Encouragement';
  scriptureRef: string;
  scriptureQuote: string;
  summary: string;
  content: string;
  readTimeMinutes: number;
  coverImage: string;
  videoUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  amenCount: number;
  prayCount: number;
  loveCount: number;
  viewCount: number;
  authorName: string;
}

export const STARTER_SERMONS_DATA: StarterSermonSeed[] = [
  {
    title: 'Walking in the Light of Christ Every Morning',
    category: 'Short Sermon',
    scriptureRef: 'John 8:12',
    scriptureQuote:
      'Again Jesus spoke to them, saying, "I am the light of the world. Whoever follows me will not walk in darkness, but will have the light of life."',
    summary:
      'A focused message on surrendering each morning to Christ’s direction so fear, confusion, and heaviness lose their hold.',
    content: `Every day begins with a choice of what voice will guide your steps. When Jesus declared Himself the Light of the World, He was not offering poetic inspiration—He was promising living guidance for real decisions, real pressures, and real spiritual battles.

To walk in His light means bringing our worries, habits, and plans openly before Him rather than carrying them alone in the dark. Where Christ’s Word shines, clarity replaces confusion.

Three daily rhythms keep your heart anchored in His light:
1. Open the day with Scripture before letting urgent headlines set your mood.
2. Pray honestly about the exact challenges waiting on your schedule today.
3. Choose obedience in the next small step God places right in front of you.`,
    readTimeMinutes: 4,
    coverImage: SERMON_STUDIO_PATH,
    videoUrl: 'https://www.youtube.com/@YouTube',
    isFeatured: true,
    isPublished: true,
    amenCount: 0,
    prayCount: 0,
    loveCount: 0,
    viewCount: 0,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'Grace That Rebuilds Broken Foundations',
    category: 'Word of Encouragement',
    scriptureRef: '2 Corinthians 12:9',
    scriptureQuote:
      'But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness."',
    summary:
      'A fresh word of strength for anyone walking through exhaustion, disappointment, or starting over with God.',
    content: `You do not need to pretend to be strong before God can lift you up. Across Scripture, the Lord consistently meets honest weakness with overwhelming grace.

When plans fall apart or energy runs dry, grace is not merely pardon for yesterday—it is divine strength supplied for today. God is never intimidated by broken pieces; in the hands of Jesus, those very places become foundations for deeper faith and testimony.

Hold steady today. The same Savior who carried the cross is carrying you through this season.`,
    readTimeMinutes: 2,
    coverImage: '/src/assets/images/sermon_morning_grace_1795507301464.jpg',
    videoUrl: '',
    isFeatured: false,
    isPublished: true,
    amenCount: 0,
    prayCount: 0,
    loveCount: 0,
    viewCount: 0,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'Peace Beyond Understanding in Uncertain Days',
    category: 'Short Sermon',
    scriptureRef: 'Philippians 4:6–7',
    scriptureQuote:
      'And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.',
    summary:
      'Biblical teaching on exchanging circular anxiety for thankful prayer and the guarding peace of Jesus Christ.',
    content: `Worry convinces us that replaying worst-case scenarios keeps us in control. Yet Scripture invites us into a far stronger posture: bringing every specific burden to God in prayer with thanksgiving.

Paul describes God's peace as a sentry standing guard over both heart and mind. Peace does not wait until every external problem disappears—it arrives inside the storm when our trust rests in the faithfulness of Christ.

Whenever anxious thoughts return today, turn each concern into a direct prayer and thank God in advance for His steady care.`,
    readTimeMinutes: 3,
    coverImage: PRAYER_IMAGE_PATH,
    videoUrl: 'https://www.youtube.com',
    isFeatured: false,
    isPublished: true,
    amenCount: 0,
    prayCount: 0,
    loveCount: 0,
    viewCount: 0,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'Nothing Can Separate You From God’s Love',
    category: 'Word of Encouragement',
    scriptureRef: 'Romans 8:38–39',
    scriptureQuote:
      'For I am sure that neither death nor life... will be able to separate us from the love of God in Christ Jesus our Lord.',
    summary:
      'An encouraging reminder that neither past failures nor present storms can outlast the mercy of Jesus Christ.',
    content: `Condemnation tries to convince believers that one mistake or a hard season means God has stepped away. The Gospel declares the exact opposite: in Christ, God’s love is anchored by His covenant, not our perfection.

When regret speaks loudly, answer it with Romans 8. Run toward the Father in repentance and worship, knowing His arms are open and His grace is greater than every fear.`,
    readTimeMinutes: 2,
    coverImage: ABSTRACT_ART_PATH,
    videoUrl: '',
    isFeatured: false,
    isPublished: true,
    amenCount: 0,
    prayCount: 0,
    loveCount: 0,
    viewCount: 0,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'Midweek Renewal: Praying With Expectant Faith',
    category: 'Midweek Message',
    scriptureRef: 'Mark 11:24 · Psalm 27:14',
    scriptureQuote:
      'Wait for the Lord; be strong, and let your heart take courage; wait for the Lord!',
    summary:
      'Midweek video teaching and prayer encouragement for every Wednesday—rekindling faith and courage for the rest of the week.',
    content: `By the middle of the week, responsibilities and spiritual weariness can quietly drain our focus. Wednesday is an invitation to pause, open Scripture, and renew our expectation in prayer.

Expectant faith does not dictate timelines to God—it trusts His goodness completely while refusing to quit praying. Watch this midweek message and take a quiet moment to bring your family, calling, and community before the Lord.`,
    readTimeMinutes: 4,
    coverImage: SERMON_STUDIO_PATH,
    videoUrl: 'https://www.youtube.com',
    isFeatured: true,
    isPublished: true,
    amenCount: 0,
    prayCount: 0,
    loveCount: 0,
    viewCount: 0,
    authorName: 'Evangelist Shepherd',
  },
];

export interface StarterArticleSeed {
  title: string;
  questionPrompt: string;
  topic: string;
  scriptureRef: string;
  excerpt: string;
  content: string;
  coverImage: string;
  readTimeMinutes: number;
  viewCount: number;
  isPublished: boolean;
  authorName: string;
}

export const STARTER_FAITH_ARTICLES_DATA: StarterArticleSeed[] = [
  {
    title: 'How Can I Be Sure of My Salvation in Jesus Christ?',
    questionPrompt: 'Is eternal life based on feelings or on the promise of Christ?',
    topic: 'Assurance of Salvation',
    scriptureRef: '1 John 5:11–13 · Romans 8:1',
    excerpt:
      'Salvation rests on the finished cross and resurrection of Jesus Christ rather than fluctuating emotions—and Scripture was written so believers may know they have eternal life.',
    content: `Many sincere believers wrestle with doubt whenever their emotions rise and fall. Yet Scripture never builds assurance on how spiritual we feel on a given Tuesday—it builds assurance on who Jesus is and what He completed at Calvary.

1 John 5:13 states clearly: "I write these things to you who believe in the name of the Son of God, that you may know that you have eternal life."

When doubt whispers, look outward to Christ rather than inward at your perfection:
1. Did Jesus pay the full debt of sin on the cross? Yes—"It is finished" (John 19:30).
2. Have you turned from sin and trusted Him as Lord and Savior? Then Romans 10:9–13 promises He receives you without hesitation.
3. As you grow, the Holy Spirit transforms your desires, teaching you to walk in repentance, love, and obedience out of gratitude.`,
    coverImage: '/src/assets/images/sermon_open_scripture_1795507302615.jpg',
    readTimeMinutes: 4,
    viewCount: 0,
    isPublished: true,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'What Should I Do When Prayer Feels Quiet or Delayed?',
    questionPrompt: 'Does silence mean God is ignoring my prayer?',
    topic: 'Prayer & Trust',
    scriptureRef: 'Psalm 13:1–6 · Luke 18:1',
    excerpt:
      'Waiting seasons are not wasted seasons—God welcomes honest laments in the Psalms and shapes steadfast faith while preparing His answer.',
    content: `Almost every follower of Jesus encounters seasons where heavens feel quiet and answers appear delayed. Far from disqualifying your faith, honest wrestling in prayer fills the Book of Psalms.

David cried out, "How long, O Lord?" before reminding his own soul of God's unfailing love. Jesus taught His disciples to "always pray and not lose heart" (Luke 18:1).

During waiting seasons:
- Keep praying honestly instead of withdrawing in silence.
- Anchor your expectations in God's wisdom and timing rather than panic.
- Look for daily faithfulness in serving, forgiving, and reading Scripture while God works behind the scenes.`,
    coverImage: PRAYER_IMAGE_PATH,
    readTimeMinutes: 4,
    viewCount: 0,
    isPublished: true,
    authorName: 'Evangelist Shepherd',
  },
  {
    title: 'How Do I Grow Spiritually After Accepting Christ?',
    questionPrompt: 'What daily habits help a new believer stay rooted in Jesus?',
    topic: 'New Life in Christ',
    scriptureRef: 'Colossians 2:6–7 · 2 Timothy 3:16',
    excerpt:
      'Just as you received Christ Jesus by faith, walk daily in Him through unhurried Scripture reading, honest prayer, and faithful Christian fellowship.',
    content: `Accepting Jesus as Lord and Savior is the joyful beginning of a lifelong walk with God. Spiritual growth does not happen overnight—it grows steadily through simple, faithful habits.

Start with four foundational steps:
1. Read Scripture Daily: Begin in the Gospel of John or Luke, reading one short passage each day and asking God to speak through His Word.
2. Talk With God Often: Pray naturally throughout your day—sharing gratitude, needs, and confession.
3. Join a Bible-Believing Church: God designed believers to grow in community, worship, and accountability.
4. Share Your Faith With Grace: Tell family and friends what Jesus has done in your life.`,
    coverImage: '/src/assets/images/sermon_morning_grace_1795507301464.jpg',
    readTimeMinutes: 3,
    viewCount: 0,
    isPublished: true,
    authorName: 'Evangelist Shepherd',
  },
];

export interface StarterProgramSeed {
  title: string;
  schedule: string;
  format: string;
  description: string;
  locationOrLink: string;
  isActive: boolean;
  orderIndex: number;
}

export const STARTER_PROGRAMS_DATA: StarterProgramSeed[] = [
  {
    title: 'Word of the Day',
    schedule: 'Daily',
    format: 'Daily Devotional',
    description:
      'A fresh daily Scripture meditation and word of encouragement to strengthen your walk with Jesus Christ.',
    locationOrLink: 'Published daily on Home & Blog',
    isActive: true,
    orderIndex: 1,
  },
  {
    title: 'Midweek Message',
    schedule: 'Every Wednesday',
    format: 'Weekly Gospel Teaching',
    description:
      'Midweek video sermon and prayer focus encouraging believers to stand firm in Scripture and expectant faith.',
    locationOrLink: 'Every Wednesday · Watch on site',
    isActive: true,
    orderIndex: 2,
  },
];
