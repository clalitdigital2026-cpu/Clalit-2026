/**
 * NEXUS launch film – central configuration.
 *
 * Everything that is likely to be tweaked lives here: texts, colours, scene
 * lengths, animation speed, effect strength, particle counts, logo files,
 * music and resolution. Scenes read from this file only.
 */
import cues from './cues.json';

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------
export const VIDEO = {
  fps: 60,
  /** Base design resolution. Every scene is authored in this coordinate space. */
  width: 1920,
  height: 1080,
  /** Multiplier used by the "Nexus4K" composition (2 → 3840×2160). */
  scale4K: 2,
};

// ---------------------------------------------------------------------------
// Brand colours (sampled from the supplied NEXUS / Clalit logos)
// ---------------------------------------------------------------------------
export const COLORS = {
  clalitGreen: '#00A44C', // Clalit logo wordmark
  emerald: '#00AB51', // NEXUS symbol – green arm (top)
  emeraldDeep: '#009E54', // NEXUS symbol – green arm (bottom)
  glowGreen: '#25D366',
  mint: '#2EE59D',
  turquoise: '#00B1DF',
  skyBlue: '#0097E8', // NEXUS symbol – blue arm (top)
  deepBlue: '#0079D5', // NEXUS symbol – blue arm (bottom)
  ocean: '#0089D0',
  teal: '#007E88',
  core: '#005852', // NEXUS symbol – overlap
  navy: '#00163C', // NEXUS wordmark
  navyDeep: '#040E22',
  space: '#020814',
  ink: '#09213F',
  white: '#FFFFFF',
  pearl: '#F4F8FB',
  mist: '#E6EEF5',
};

/** The two streams that define the NEXUS motif. */
export const STREAM = {
  green: [COLORS.glowGreen, COLORS.emerald, COLORS.mint],
  blue: [COLORS.turquoise, COLORS.skyBlue, COLORS.deepBlue],
};

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
export const FONTS = {
  hebrew: 'Heebo',
  latin: 'Inter',
  /** CSS stack – Hebrew glyphs come from Heebo, Latin from Inter. */
  stack: "'Heebo', 'Inter', sans-serif",
  latinStack: "'Inter', 'Heebo', sans-serif",
};

// ---------------------------------------------------------------------------
// Animation & effects
// ---------------------------------------------------------------------------
export const FX = {
  /** Global animation speed (1 = as designed). Scene lengths are unchanged. */
  speed: 1,
  /** 0..1.5 – strength of glows and blooms. */
  glow: 1,
  /** Multiplier for every particle system (0.5 for fast drafts). */
  particleDensity: 1,
  /** Max particles a single particle-text can use. */
  textParticles: 5200,
  /** Film grain (0 disables). */
  grain: 0.05,
  /** Vignette strength (0 disables). */
  vignette: 0.55,
  /** Motion-blur-like streak length multiplier for fast particles. */
  streaks: 1,
};

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
export const ASSETS = {
  nexusSymbol: 'logos/nexus-symbol.png',
  nexusWordmark: 'logos/nexus-wordmark.png',
  nexusWordmarkWhite: 'logos/nexus-wordmark-white.png',
  nexusClalitWord: 'logos/nexus-clalit-word.png',
  nexusLockup: 'logos/nexus-lockup.png',
  clalitLogo: 'logos/clalit-logo.png',
  music: 'audio/nexus-score.wav',
  /** Optional, separate narration track (e.g. 'audio/voiceover.wav'); null = none. */
  voiceover: null as string | null,
  musicVolume: 0.9,
  voiceoverVolume: 1,
};

// ---------------------------------------------------------------------------
// Timeline (seconds). The music generator reads the same cue sheet.
// ---------------------------------------------------------------------------
export const CUES = cues;

export type SceneId =
  | 'pulse'
  | 'events'
  | 'challenge'
  | 'reveal'
  | 'architecture'
  | 'eventDriven'
  | 'benefits'
  | 'gameChanger'
  | 'signature';

export const SCENES: {id: SceneId; seconds: number}[] = cues.scenes.map((s) => ({
  id: s.id as SceneId,
  seconds: s.seconds,
}));

export const sceneStart = (id: SceneId) => {
  let acc = 0;
  for (const s of SCENES) {
    if (s.id === id) return acc;
    acc += s.seconds;
  }
  throw new Error(`Unknown scene ${id}`);
};

export const TOTAL_SECONDS = SCENES.reduce((a, s) => a + s.seconds, 0);

// ---------------------------------------------------------------------------
// Texts (Hebrew first; professional terms in English)
// ---------------------------------------------------------------------------
export const TEXT = {
  pulse: {
    lines: ['מיליוני מטופלים.', 'אינספור רגעים רפואיים.', 'עולם שלם של מידע.'],
  },
  events: {
    moments: [
      {label: 'תוצאת בדיקת מעבדה', status: 'התוצאה זמינה', icon: 'tube'},
      {label: 'מרשם דיגיטלי', status: 'המרשם הונפק', icon: 'rx'},
      {label: 'קביעת תור באפליקציה', status: 'התור נקבע', icon: 'calendar'},
      {label: 'שחרור מאשפוז', status: 'המטופל שוחרר', icon: 'bed'},
      {label: 'בדיקת דימות', status: 'הבדיקה הושלמה', icon: 'scan'},
      {label: 'עדכון תיק רפואי', status: 'התיק עודכן', icon: 'record'},
    ],
    headlineLead: 'כל רגע הוא',
    headlineWord: 'אירוע',
    morphTo: 'EVENT',
    closing: 'כל אירוע הוא הזדמנות ליצור ערך.',
  },
  challenge: {
    words: ['מערכות שונות.', 'סביבות שונות.', 'מקורות מידע רבים.', 'מורכבות הולכת וגדלה.'],
    question: 'ומה אם הכול היה יכול להתחבר?',
  },
  reveal: {
    title: 'NEXUS',
    subtitle: 'פלטפורמת הנתונים של כללית',
    era: 'עידן חדש של מידע.',
  },
  architecture: {
    layers: [
      {
        index: '01',
        name: 'מערכות מקור',
        headline: 'אוספים',
        caption: 'מערכות רפואיות ותפעוליות מייצרות אירועים',
        tech: 'Kafka · Event Streaming',
      },
      {
        index: '02',
        name: 'איחוד וטיוב',
        headline: 'מחברים. מאחדים. מטייבים.',
        caption: 'עיבוד, איחוד וטיוב – למבנה עקבי',
        tech: 'Processing · Unification · Data Quality',
      },
      {
        index: '03',
        name: 'אמת ארגונית אחודה',
        headline: 'אמת ארגונית אחת.',
        caption: 'שכבת נתונים אחודה, עשירה ומקושרת',
        tech: 'MongoDB',
      },
      {
        index: '04',
        name: 'מערכות צרכניות',
        headline: 'המידע הנכון. במקום הנכון. בזמן הנכון.',
        caption: 'הזרמה לחוות כללית ולסביבות הענן',
        tech: 'Kafka · Event Streaming',
      },
    ],
    sources: ['בתי חולים', 'מרפאות', 'מעבדות', 'בתי מרקחת', 'דימות', 'תורים', 'אפליקציות', 'מערכות תפעול'],
    destinations: ['Google Cloud', 'Microsoft Azure', 'AWS', 'תשתיות כללית'],
  },
  eventDriven: {
    event: 'LAB RESULT AVAILABLE',
    resultLabel: 'תוצאת בדיקה',
    disclaimer: 'תרחיש עתידי אפשרי · להמחשה',
    targets: [
      {label: 'עדכון התיק הרפואי', icon: 'record'},
      {label: 'עדכון המטופל', sub: 'בהתאם לכללי פרסום התוצאות', icon: 'phone'},
      {label: 'תמיכה בהתראה קלינית', sub: 'בהתאם לכללים הרפואיים', icon: 'bell'},
      {label: 'ניתוח באמצעות כלי AI', icon: 'ai'},
      {label: 'מחקר ו-BI', sub: 'בהתאם להרשאות', icon: 'chart'},
    ],
    beats: ['אירוע אחד.', 'מערכות רבות.', 'אינספור אפשרויות.'],
    title: 'EVENT-DRIVEN',
    tagline: 'מידע בתנועה. ארגון בתנועה.',
  },
  benefits: {
    items: [
      {title: 'מידע בזמן אמת', kind: 'realtime'},
      {title: 'פחות מורכבות', kind: 'simplicity'},
      {title: 'פיתוח מהיר יותר', kind: 'modular'},
      {title: 'תפעול חכם יותר', kind: 'operations'},
      {title: 'רפואה מחוברת יותר', kind: 'clinical'},
      {title: 'מחקר מתקדם', kind: 'research'},
      {title: 'AI ללא גבולות חדשים של מורכבות', kind: 'ai'},
    ],
    aiStrategy: 'אסטרטגיית DATA & AI & BI של כללית',
    aiCapabilities: ['AI Factory', 'BigQuery', 'כלי בינה מלאכותית'],
    aiNote: 'יכולות משלימות',
    keywords: ['REAL-TIME', 'CONNECTED', 'SCALABLE', 'AI-READY'],
  },
  gameChanger: {
    pairs: [
      ['ממערכות נפרדות', 'לארגון מחובר.'],
      ['ממידע', 'לתובנות.'],
      ['מתובנות', 'להשפעה.'],
    ],
    statement: 'אנחנו לא רק משנים את הדרך שבה מידע זורם.',
    finale: 'אנחנו משנים את כללי המשחק.',
  },
  signature: {
    slogan: 'מחברים מידע. יוצרים השפעה.',
    division: 'חטיבת מערכות מידע ודיגיטל',
  },
};
