const WORD_FREQ = {
  stream: 24,
  feed: 22,
  scroll: 20,
  pixel: 18,
  cache: 16,
  cloud: 15,
  signal: 14,
  noise: 13,
  rhythm: 12,
  loop: 11,
  frame: 10,
  data: 10,
  light: 9,
  echo: 9,
  drift: 8,
  mirror: 8,
  glass: 7,
  wire: 7,
  pulse: 6,
  static: 6,
  bloom: 5,
  shard: 5,
  tide: 5,
  node: 5,
  trace: 4,
  field: 4,
  wave: 4,
  tone: 4,
  depth: 3,
  edge: 3,
  flow: 3,
  silk: 3,
  ink: 3,
  dust: 2,
  salt: 2,
  amber: 2,
  void: 2,
  hum: 2,
};

/** Fallback if layout runs before any import (should not happen once flow is complete). */
const DEFAULT_TILE_WORDS = WORD_FREQ;

const NOISE_WORDS = new Set([
  "www",
  "http",
  "https",
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "io",
  "co",
  "uk",
  "html",
  "htm",
  "php",
  "asp",
  "js",
  "css",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "pdf",
  "the",
  "and",
  "for",
  "with",
  "you",
  "your",
  "this",
  "that",
  "from",
  "have",
  "has",
  "was",
  "were",
  "are",
  "but",
  "not",
  "will",
  "can",
  "may",
  "into",
  "out",
  "about",
  "like",
  "its",
  "our",
  "all",
  "any",
  "get",
  "got",
  "one",
  "two",
  "new",
  "use",
  "using",
  "used",
  "also",
  "more",
  "than",
  "then",
  "what",
  "when",
  "where",
  "which",
  "who",
  "how",
  "amp",
]);

/**
 * Track / album metadata noise (not artist identity).
 * Separate from {@link NOISE_WORDS} (general English + URL-ish stoplist).
 */
const MUSIC_METADATA_NOISE = new Set([
  "feat",
  "featuring",
  "ft",
  "remix",
  "rmx",
  "mix",
  "edit",
  "radio",
  "explicit",
  "clean",
  "version",
  "original",
  "extended",
  "club",
  "instrumental",
  "acoustic",
  "karaoke",
  "tribute",
  "cover",
  "live",
  "remaster",
  "remastered",
  "deluxe",
  "bonus",
  "interlude",
  "intro",
  "outro",
  "skit",
  "reprise",
]);

/** Letters treated as vowels for gibberish heuristics (includes y for rhythm, glyph, etc.). */
const VOWEL_CHARS = new Set("aeiouy");

/**
 * High-frequency English digraphs + common affix pairs (loans: ps, pn, gn, rh, yc, …).
 * Kept tight so random URL tokens score low on coverage; do not add rare letter pairs here.
 */
const EN_COMMON_BIGRAMS = new Set(
  (
    "th he in er an re ed on es en at ou it is ea ti as st io le ve ha se ar ng al de ra et co ro me om " +
    "ur ld li sa ne wa ge ch tr be sh wh ma fo gh pl pr bl br cl cr dr fl fr gl gr ph sc sk sl sm sn sp sw " +
    "tw kn wr nt na ni no ns nu ny ob oc od of og oh oi ol om on oo op ot ov ow ox oy pa pe pi po pu py qu " +
    "ra re rh ri rm rn ro ru ry sa sc se si so ss su sw ta te th ti to tr ts tu ty ub uc ud ue uf ug uh ui " +
    "ul um un up ur us ut va ve vi vo vu wa we wh wi wo wr xa xe xi ya ye yi yo yu za ze zi zo zy ck ll ss " +
    "nn oo ee tt mm rr ff pp cc gg ng nd mp ld rd ps pn gn ae oe ce ci cu ac il ep ex ey fe fi fl fo fr fu " +
    "ga ge gi go gu ha he hi ho hu hy id ie if ig ik im in io ip ir is ix ja je ji jo ju ka ke ki ko ku ky " +
    "la le li lo lu ma me mi mo mu my na ne ni no nu od oe of og oh oi ol os ou pa ph pl pr pt ic yc ys yn " +
    "yl ym yr yp hm hn ho hp hr hs ht hu hv hw hy ly ri rl rp rs rt rv rz im iv iy iz ly mi mo ry sk sl sm " +
    "sn sp sq sr st su sy ub um un ux va we xa xn xp xt ye yl ym yn yo yp yc yt yd yf yg yh yj yk yq yr ys " +
    "yu yv yw yx zy zz ac ad ag ak am ap aw ay ba bi bn bs bu ca ce ci ck cm cn co cs ct cu da de di " +
    "do du dy ec ee ef eg ei el em en eo eq er es eu ev ew fa fb fe fg fi fj fl fm fn fo fp fq fr fs ft fu " +
    "fy ga gb gd gf gg gj gm gp gq gs gt gv gw gy gz he hf hh hj hl hm hn ho hq hs hu hv hx ia ib ic id ie " +
    "if ih ii ij ik il im iq ir it iv iw ix iy iz ja jb jd je jf jg jh ji jj jl jm jn jo jp jr js jt ju ka " +
    "kb kd ke kf kg kh ki kj kl km kn ko kp kr ks kt ku kv kw ky la lb lc lf lg lh lj lk ll lm ln lo lp lq " +
    "ls lu lv lw lx mb md mg mh mj mk mm mn mp mq mr ms mt mu mx my oa oe oi os ox oz po pp pw px py ua ud " +
    "uf ug uk uq uv uy vt vy wa wb wc wd wf wg wn wp wt wu wv ww wx wy zk zl zm zn zp zr zs zt zw zx"
  )
    .trim()
    .split(/\s+/)
    .filter((s) => s.length === 2)
);

/** Bigrams that almost never occur in English (IDs, slugs); kills leftover junk without a huge whitelist. */
const EN_RARE_BIGRAMS = new Set([
  "bq",
  "bk",
  "bx",
  "bz",
  "cq",
  "cx",
  "cz",
  "dq",
  "dx",
  "fq",
  "fv",
  "fx",
  "fz",
  "gq",
  "gx",
  "gz",
  "hx",
  "hz",
  "jb",
  "jc",
  "jd",
  "jf",
  "jg",
  "jh",
  "jj",
  "jk",
  "jw",
  "jq",
  "jv",
  "jx",
  "jz",
  "kq",
  "kx",
  "kz",
  "lq",
  "lx",
  "lz",
  "mq",
  "mx",
  "mz",
  "pq",
  "pv",
  "px",
  "qb",
  "qc",
  "qd",
  "qf",
  "qg",
  "qh",
  "qj",
  "qk",
  "ql",
  "qm",
  "qn",
  "qo",
  "qp",
  "qq",
  "qr",
  "qs",
  "qt",
  "qv",
  "qx",
  "qz",
  "vb",
  "vc",
  "vd",
  "vf",
  "vg",
  "vj",
  "vk",
  "vq",
  "vx",
  "vz",
  "wj",
  "wk",
  "wq",
  "wv",
  "wz",
  "xj",
  "xq",
  "xz",
  "yq",
  "zb",
  "zc",
  "zd",
  "zf",
  "zg",
  "zj",
  "zq",
  "zx",
]);

function englishBigramCoverage(w) {
  if (w.length < 2) return 1;
  let hits = 0;
  for (let i = 0; i < w.length - 1; i++) {
    const bg = w.slice(i, i + 2);
    if (EN_COMMON_BIGRAMS.has(bg)) hits++;
  }
  return hits / (w.length - 1);
}

function maxConsonantRun(w) {
  let run = 0;
  let maxRun = 0;
  for (let i = 0; i < w.length; i++) {
    if (VOWEL_CHARS.has(w[i])) {
      run = 0;
    } else {
      run++;
      if (run > maxRun) maxRun = run;
    }
  }
  return maxRun;
}

function leadingConsonantsBeforeFirstVowel(w) {
  let n = 0;
  for (let i = 0; i < w.length; i++) {
    if (VOWEL_CHARS.has(w[i])) break;
    n++;
  }
  return n;
}

function trailingConsonantsAfterLastVowel(w) {
  let n = 0;
  for (let i = w.length - 1; i >= 0; i--) {
    if (VOWEL_CHARS.has(w[i])) break;
    n++;
  }
  return n;
}

function hasRareEnglishBigram(w) {
  for (let i = 0; i < w.length - 1; i++) {
    if (EN_RARE_BIGRAMS.has(w.slice(i, i + 2))) return true;
  }
  return false;
}

/** j, q, x, z are rare in normal prose; long tokens with many look like hashes or slugs. */
function rareLetterBurden(w) {
  let n = 0;
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    if (c === "j" || c === "q" || c === "x" || c === "z") n++;
  }
  return n;
}

/**
 * Drop URL-ish / keyboard-mash tokens: vowel counts, English-like bigrams, consonant shape, etc.
 * @param {string} w lowercased a–z only
 */
function isAcceptableWordToken(w) {
  if (!w || w.length < 3 || w.length > 20) return false;
  if (!/^[a-z]+$/.test(w)) return false;
  if (NOISE_WORDS.has(w)) return false;
  if (MUSIC_METADATA_NOISE.has(w)) return false;

  let vowels = 0;
  for (let i = 0; i < w.length; i++) {
    if (VOWEL_CHARS.has(w[i])) vowels++;
  }
  if (vowels < 1) return false;

  if (w.length >= 10 && vowels < 2) return false;
  if (w.length >= 12 && vowels < 3) return false;
  if (w.length >= 16 && vowels < 4) return false;

  const ratio = vowels / w.length;
  if (w.length >= 13 && ratio < 0.28) return false;
  if (w.length >= 10 && w.length < 13 && ratio < 0.22) return false;
  if (w.length >= 7 && w.length < 10 && ratio < 0.12) return false;
  if (w.length >= 5 && w.length < 7 && ratio < 0.14) return false;
  if (w.length === 4 && ratio < 0.2) return false;

  if (maxConsonantRun(w) > 4) return false;

  if (leadingConsonantsBeforeFirstVowel(w) > 4) return false;
  if (trailingConsonantsAfterLastVowel(w) > 4) return false;

  if (/(.)\1\1/.test(w)) return false;

  if (w.length >= 9) {
    const distinct = new Set(w).size;
    if (distinct / w.length < 0.42) return false;
  }

  const jqxz = rareLetterBurden(w);
  if (w.length >= 7 && jqxz >= 3) return false;
  if (w.length >= 10 && jqxz >= 2) return false;

  if (hasRareEnglishBigram(w)) return false;

  const cov = englishBigramCoverage(w);
  if (w.length >= 9 && cov < 0.52) return false;
  if (w.length >= 7 && w.length < 9 && cov < 0.45) return false;
  if (w.length >= 5 && w.length < 7 && cov < 0.34) return false;

  return true;
}

/** @type {Record<string, number> | null} */
let tileWordFreq = null;

/** When true, word order is randomized on each layout rebuild and periodically in draw() while live. */
let continuousShuffleOn = false;
/** millis() timestamp of last periodic shuffle (or when toggle was turned on). */
let lastContinuousShuffleAtMs = 0;
const CONTINUOUS_SHUFFLE_INTERVAL_MS = 500;

/** When false, tiles show where the person mask is strong; when true, only where the mask is weak (background). */
let invertPersonTileMask = false;

/** Brightness multiplier after mapping from slider (see `tileBrightnessMultFromSlider`). */
let tileBrightnessMult = 1;
/** Brightness slider max (%). */
const TILE_BRIGHTNESS_UI_MAX = 200;
/** Multiplier at slider 0% — keeps tiles dim but not pure black. */
const TILE_BRIGHTNESS_MULT_MIN = 0.28;
/** Chroma vs luminance: 0 = gray, 1 = source color, >1 oversaturated (see TILE_SATURATION_UI_MAX). */
let tileFillSaturation = 1.5;
/** Saturation slider max (%); 100% = true color, above = extra punch. */
const TILE_SATURATION_UI_MAX = 220;

const TILE_FONT_SIZE_MIN = 8;
const TILE_FONT_SIZE_MAX = 28;
/** Mosaic tile font size (px); synced with #tile-text-size. */
let tileFontSizePx = 12;

function setHistoryStatus(message, kind) {
  const el = document.getElementById("history-status");
  if (!el) return;
  el.textContent = message || "";
  el.classList.remove("ok", "err");
  if (kind === "ok") el.classList.add("ok");
  if (kind === "err") el.classList.add("err");
}

function updateStartCameraEnabled() {
  const btn = document.getElementById("start-camera");
  if (!btn) return;
  const ok = !!(tileWordFreq && Object.keys(tileWordFreq).length);
  btn.disabled = !ok;
}

function tokenizeWords(text) {
  const out = [];
  const s = String(text || "").toLowerCase();
  const re = /[a-z]{3,}/g;
  let m;
  while ((m = re.exec(s))) {
    const w = m[0];
    if (!isAcceptableWordToken(w)) continue;
    out.push(w);
  }
  return out;
}

/** Cap text length sent to Compromise so very large imports stay responsive. */
const COMPROMISE_TEXT_MAX_CHARS = 400000;

/**
 * Meaningful lexical tokens for frequency counting using Compromise.js (POS filter + lemma),
 * then {@link isAcceptableWordToken}. Falls back to {@link tokenizeWords} if `nlp` is missing or yields nothing.
 * @param {string} text
 * @returns {string[]}
 */
function meaningfulTokensFromText(text) {
  const raw = String(text || "");
  if (typeof nlp !== "function") {
    return tokenizeWords(raw);
  }

  let slice = raw;
  if (slice.length > COMPROMISE_TEXT_MAX_CHARS) {
    slice = slice.slice(-COMPROMISE_TEXT_MAX_CHARS);
  }

  let doc;
  try {
    doc = nlp(slice);
  } catch (e) {
    return tokenizeWords(raw);
  }

  const out = [];
  doc.terms().forEach((term) => {
    if (term.has("#Pronoun")) return;
    if (term.has("#Determiner")) return;
    if (term.has("#Conjunction")) return;
    if (term.has("#Preposition")) return;
    if (term.has("#Copula")) return;
    if (term.has("#Modal")) return;
    if (term.has("#Possessive")) return;
    if (term.has("#QuestionWord")) return;

    if (!term.has("#Noun") && !term.has("#Verb") && !term.has("#Adjective") && !term.has("#Adverb")) return;

    let w = "";
    try {
      w = String(term.text("root") || "").toLowerCase().replace(/[^a-z]/g, "");
    } catch (e) {
      w = "";
    }
    if (!w || w.length < 3) {
      try {
        w = String(term.text("normal") || "").toLowerCase().replace(/[^a-z]/g, "");
      } catch (e2) {
        w = String(term.text() || "")
          .toLowerCase()
          .replace(/[^a-z]/g, "");
      }
    }
    if (!w || w.length < 3) return;
    if (!isAcceptableWordToken(w)) return;
    out.push(w);
  });

  if (out.length === 0 && raw.replace(/\s/g, "").length > 0) {
    return tokenizeWords(raw);
  }
  return out;
}

function freqFromTokens(tokens) {
  /** @type {Record<string, number>} */
  const f = Object.create(null);
  for (const w of tokens) {
    if (!isAcceptableWordToken(w)) continue;
    f[w] = (f[w] || 0) + 1;
  }
  return f;
}

function mergeFreq(a, b) {
  const o = Object.assign(Object.create(null), a);
  for (const k of Object.keys(b)) {
    o[k] = (o[k] || 0) + b[k];
  }
  return o;
}

function wordFreqFromPlainText(text) {
  return freqFromTokens(meaningfulTokensFromText(text));
}

function applyImportedWordFreq(freq, label) {
  if (!freq || !Object.keys(freq).length) {
    setHistoryStatus(
      "No words found from your listening history — try reloading or reconnecting Spotify.",
      "err",
    );
    return false;
  }
  tileWordFreq = freq;
  const n = Object.keys(freq).length;
  const top = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w)
    .join(", ");
  setHistoryStatus(`${label}: ${n} unique words (e.g. ${top}…). Ready when you are.`, "ok");
  updateStartCameraEnabled();
  if (live) {
    updateTopicStatsPanel();
    buildLayout();
  }
  return true;
}

const HAVE_METADATA = typeof HTMLMediaElement !== "undefined" ? HTMLMediaElement.HAVE_METADATA : 1;

/** Flush mosaic: no gutter between tiles; inset keeps type off tile edges. */
const BLOCK_GAP = 0;
/** Padding inside each colored tile (text sits inset from the sampled region). */
const TEXT_INSET = 6;
const BLOCK_RADIUS = 3;
const TILE_STROKE_RGB = [22, 22, 26];
const TILE_STROKE_ALPHA = 72;
const LETTERBOX_LUM_SKIP = 10;
/** Min. fraction of subsampled tile pixels classified as “person” to draw that tile. */
const PERSON_TILE_THRESHOLD = 0.06;
/** Run segmentation every N frames (MediaPipe is lighter than full BodyPix TF). */
const SEGMENT_EVERY_N_FRAMES = 1;

const MEDIAPIPE_TASKS_VER = "0.10.21";
const MEDIAPIPE_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VER}/wasm`;
const MEDIAPIPE_SELFIE_TFLITE =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";
/**
 * Category mask for this selfie model: 0 = person, non-zero = background.
 * Set to true if you switch to a model where person classes are > 0.
 */
const SELFIE_PERSON_CATEGORY_NONZERO = false;

/** Coarse listening-mix buckets from Spotify artist genres (sidebar). Mosaic tiles use OTHER (camera colors). */
const TOPIC_IDS = {
  ELECTRONIC: "electronic",
  HIP_HOP: "hip_hop",
  POP: "pop",
  ROCK_ALT: "rock_alt",
  RNB_SOUL: "rnb_soul",
  COUNTRY_FOLK: "country_folk",
  JAZZ_CLASSICAL: "jazz_classical",
  LATIN: "latin",
  METAL_PUNK: "metal_punk",
  PODCASTS: "podcasts",
  OTHER: "other",
};

/** Default RGB fills (editable copy lives in `topicRgbById`). */
const TOPIC_RGB = {
  [TOPIC_IDS.ELECTRONIC]: [0, 188, 212],
  [TOPIC_IDS.HIP_HOP]: [232, 149, 71],
  [TOPIC_IDS.POP]: [240, 126, 156],
  [TOPIC_IDS.ROCK_ALT]: [168, 112, 226],
  [TOPIC_IDS.RNB_SOUL]: [214, 120, 180],
  [TOPIC_IDS.COUNTRY_FOLK]: [180, 150, 98],
  [TOPIC_IDS.JAZZ_CLASSICAL]: [120, 150, 220],
  [TOPIC_IDS.LATIN]: [56, 200, 130],
  [TOPIC_IDS.METAL_PUNK]: [196, 62, 88],
  [TOPIC_IDS.PODCASTS]: [200, 200, 100],
  [TOPIC_IDS.OTHER]: [96, 94, 90],
};

/** @type {Record<string, [number, number, number]>} */
let topicRgbById = Object.fromEntries(
  Object.keys(TOPIC_RGB).map((k) => /** @type {[string, [number, number, number]]} */ ([k, TOPIC_RGB[k].slice()])),
);

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */
function rgbToHex(r, g, b) {
  const h = (n) => constrain(round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * @param {string} hex
 * @returns {[number, number, number] | null}
 */
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex).trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/**
 * @param {string} id
 * @returns {[number, number, number]}
 */
function rgbForTopic(id) {
  const c = topicRgbById[id];
  return c ? c.slice() : topicRgbById[TOPIC_IDS.OTHER].slice();
}

/** Sidebar width (px); must match `.topic-stats-panel` in `index.html`. */
const TOPIC_STATS_PANEL_W = 220;
/** Gap between panel and viewport edge (match `.topic-stats-panel` top/right/bottom in `index.html`). */
const TOPIC_STATS_PANEL_EDGE_INSET = 16;
/** Width reserved on each side for floating panels + margin (match `index.html`). */
const LIVE_SIDE_PANEL_RESERVE = TOPIC_STATS_PANEL_W + TOPIC_STATS_PANEL_EDGE_INSET;

/** Stacked controls under the camera; must match `index.html` `(max-width: …px)`. */
const PORTRAIT_STACKED_MAX_CSS_PX = 900;

function isPortraitStackedLayout() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(`(max-width: ${PORTRAIT_STACKED_MAX_CSS_PX}px)`).matches;
}

function getLiveSideInsets() {
  if (!live) return { left: 0, right: 0 };
  if (isPortraitStackedLayout()) return { left: 0, right: 0 };
  return { left: LIVE_SIDE_PANEL_RESERVE, right: LIVE_SIDE_PANEL_RESERVE };
}

function liveCanvasWidthHeight() {
  if (!live) return [Math.max(320, windowWidth), Math.max(240, windowHeight)];
  if (!isPortraitStackedLayout()) return [Math.max(320, windowWidth), Math.max(240, windowHeight)];
  const wInner = window.innerWidth > 0 ? window.innerWidth : windowWidth;
  const wpx = Math.floor(Math.max(280, wInner));
  const innerH = window.innerHeight > 0 ? window.innerHeight : windowHeight;
  const cap = capture && capture.elt;
  let hpx;
  if (cap && cap.videoWidth > 0 && cap.videoHeight > 0) {
    const vw = cap.videoWidth;
    const vh = cap.videoHeight;
    const byAspect = Math.floor((wpx * vh) / vw);
    const maxCh = Math.floor(innerH * 0.58);
    hpx = Math.min(byAspect, maxCh);
    hpx = Math.max(hpx, Math.min(220, Math.floor(innerH * 0.28)));
  } else {
    hpx = Math.floor(innerH * 0.42);
  }
  return [wpx, Math.max(200, hpx)];
}

function applyLiveCanvasSize() {
  pixelDensity(1);
  const wh = liveCanvasWidthHeight();
  resizeCanvas(wh[0], wh[1]);
}

/** Lets the document scroll on narrow stacked layout (`overflow` on `html` is unlocked in CSS). */
function syncPortraitDocumentScrollClass() {
  const rootEl = document.documentElement;
  if (!rootEl) return;
  if (!live) {
    rootEl.classList.remove("portrait-stacked-scroll");
    return;
  }
  if (isPortraitStackedLayout()) rootEl.classList.add("portrait-stacked-scroll");
  else rootEl.classList.remove("portrait-stacked-scroll");
}

const TOPIC_STATS_ORDER = [
  TOPIC_IDS.ELECTRONIC,
  TOPIC_IDS.HIP_HOP,
  TOPIC_IDS.POP,
  TOPIC_IDS.ROCK_ALT,
  TOPIC_IDS.RNB_SOUL,
  TOPIC_IDS.COUNTRY_FOLK,
  TOPIC_IDS.JAZZ_CLASSICAL,
  TOPIC_IDS.LATIN,
  TOPIC_IDS.METAL_PUNK,
  TOPIC_IDS.PODCASTS,
  TOPIC_IDS.OTHER,
];

const TOPIC_LABELS = {
  [TOPIC_IDS.ELECTRONIC]: "Electronic",
  [TOPIC_IDS.HIP_HOP]: "Hip-hop",
  [TOPIC_IDS.POP]: "Pop",
  [TOPIC_IDS.ROCK_ALT]: "Rock & alt",
  [TOPIC_IDS.RNB_SOUL]: "R&B & soul",
  [TOPIC_IDS.COUNTRY_FOLK]: "Country & folk",
  [TOPIC_IDS.JAZZ_CLASSICAL]: "Jazz & classical",
  [TOPIC_IDS.LATIN]: "Latin",
  [TOPIC_IDS.METAL_PUNK]: "Metal & punk",
  [TOPIC_IDS.PODCASTS]: "Podcasts & speech",
  [TOPIC_IDS.OTHER]: "Unclassified",
};

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function updateTopicStatsPanel() {
  const panel = document.getElementById("topic-stats-panel");
  const host = document.getElementById("topic-stats-rows");
  if (!panel || !host) return;
  if (!live || !tileWordFreq || !Object.keys(tileWordFreq).length) {
    panel.hidden = true;
    host.innerHTML = "";
    return;
  }
  panel.hidden = false;
  const counts = aggregateListeningGenreCounts();
  /** @type {{ id: string; n: number }[]} */
  const ranked = [];
  for (let i = 0; i < TOPIC_STATS_ORDER.length; i++) {
    const id = TOPIC_STATS_ORDER[i];
    if (id === TOPIC_IDS.OTHER) continue;
    const n = counts[id] != null ? counts[id] : 0;
    ranked.push({ id, n });
  }
  ranked.sort((a, b) => {
    if (b.n !== a.n) return b.n - a.n;
    const la = TOPIC_LABELS[a.id] || a.id;
    const lb = TOPIC_LABELS[b.id] || b.id;
    return la.localeCompare(lb);
  });
  ranked.push({ id: TOPIC_IDS.OTHER, n: counts[TOPIC_IDS.OTHER] != null ? counts[TOPIC_IDS.OTHER] : 0 });

  const parts = [];
  for (let j = 0; j < ranked.length; j++) {
    const { id, n } = ranked[j];
    const label = TOPIC_LABELS[id] || id;
    const [r, g, b] = rgbForTopic(id);
    const safeId = escapeHtml(id);
    const nameInner =
      id === TOPIC_IDS.OTHER
        ? `<span class="topic-stats-swatch" style="background:rgb(${r},${g},${b})" aria-hidden="true" title="Tiles in this bucket use the camera colors, not this swatch"></span><span class="topic-stats-label">${escapeHtml(
            label,
          )}</span>`
        : `<input type="color" class="topic-stats-color" data-topic-id="${safeId}" value="${rgbToHex(
            r,
            g,
            b,
          )}" title="Color for ${escapeHtml(label)}" aria-label="Color for ${escapeHtml(label)}" /><span class="topic-stats-label">${escapeHtml(
            label,
          )}</span>`;
    parts.push(
      `<div class="topic-stats-row"><span class="topic-stats-name">${nameInner}</span><span class="topic-stats-count">${n}</span></div>`,
    );
  }
  host.innerHTML = parts.join("");
}

function wireTopicColorInputs() {
  const host = document.getElementById("topic-stats-rows");
  if (!host || host.dataset.topicColorWired === "1") return;
  host.dataset.topicColorWired = "1";
  const apply = (ev) => {
    const el = ev.target;
    if (!(el instanceof HTMLInputElement) || el.type !== "color" || !el.classList.contains("topic-stats-color")) return;
    const id = el.dataset.topicId;
    if (!id) return;
    const rgb = hexToRgb(el.value);
    if (!rgb) return;
    topicRgbById[id] = rgb;
  };
  host.addEventListener("input", apply);
  host.addEventListener("change", apply);
}



/** Spotify-derived genre totals (sidebar); mosaic tiles use camera sampling (OTHER). */
function initListeningGenreBuckets() {
  const o = Object.create(null);
  for (const id of TOPIC_STATS_ORDER) o[id] = 0;
  return o;
}

let listeningGenreBucketCounts = initListeningGenreBuckets();

/**
 * Spotify returns lowercase hyphenated genres (e.g. "urban contemporary").
 * @param {string} genreRaw
 * @returns {string}
 */
function genreStringToBucketId(genreRaw) {
  const g = String(genreRaw || "")
    .toLowerCase()
    .replace(/-/g, " ");
  if (!g.trim()) return TOPIC_IDS.OTHER;
  if (
    /podcast|audiobook|spoken word|stand[\s-]?up|speech|comedy show|talk radio/.test(g)
  )
    return TOPIC_IDS.PODCASTS;

  /** @type {[string, RegExp][]} */
  const tests = [
    [TOPIC_IDS.HIP_HOP, /\b(hip hop|trap|gangsta rap|boom bap|rap|grime|drill)\b/],
    [TOPIC_IDS.RNB_SOUL, /\b(r&b|neo soul|soul|funk|gospel|motown)\b/],
    [TOPIC_IDS.LATIN, /\b(reggaeton|latin|bachata|cumbia|salsa|dembow|corrido)\b/],
    [TOPIC_IDS.COUNTRY_FOLK, /\b(country|americana|folk|bluegrass)\b/],
    [TOPIC_IDS.JAZZ_CLASSICAL, /\b(jazz|bebop|swing|classical|baroque|opera)\b/],
    [TOPIC_IDS.METAL_PUNK, /\b(metalcore|death metal|heavy metal|black metal|metal| punk|hardcore)\b/],
    [
      TOPIC_IDS.ELECTRONIC,
      /\b(edm|house|techno|trance|dubstep|dnb|electronic|idm|ambient|drum ?and ?bass|breakbeat)\b/,
    ],
    [TOPIC_IDS.ROCK_ALT, /\b(rock|indie rock|alternative rock|grunge|emo|garage)\b/],
    [TOPIC_IDS.POP, /\bpop\b|dance pop|k-pop|\btrap pop\b/],
  ];

  for (const [bid, re] of tests) {
    if (re.test(g)) return bid;
  }

  // Broader umbrellas
  if (g.includes("indie")) return TOPIC_IDS.ROCK_ALT;
  if (g.includes("electronic")) return TOPIC_IDS.ELECTRONIC;

  return TOPIC_IDS.OTHER;
}

/**
 * @returns {Record<string, number>}
 */
function aggregateListeningGenreCounts() {
  const out = Object.create(null);
  for (const id of TOPIC_STATS_ORDER) {
    const n = listeningGenreBucketCounts[id];
    out[id] = typeof n === "number" && n >= 0 ? n : 0;
  }
  return out;
}

/** Spotify Web API — authorization code + PKCE; tokens only in sessionStorage. */
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_SCOPE = "user-read-recently-played";
const SPOTIFY_RECENT_MAX_PAGES = 8;
const SPOTIFY_GENRES_PER_PLAY_CAP = 12;

const SPOTIFY_STORE = {
  verifier: "spotify_pkce_verifier",
  state: "spotify_oauth_state",
  access: "spotify_access_token",
  refresh: "spotify_refresh_token",
  expiresAt: "spotify_token_expires_at",
};

function getSpotifyClientId() {
  return String((typeof window !== "undefined" && window.SPOTIFY_CLIENT_ID) || "").trim();
}

function getSpotifyRedirectUri() {
  if (typeof window === "undefined") return "";
  const custom = String(window.SPOTIFY_REDIRECT_URI || "").trim();
  if (custom) return custom;
  return window.location.href.split("#")[0].split("?")[0];
}

function spotifyRandomString(length) {
  const u = new Uint8Array(length);
  crypto.getRandomValues(u);
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < length; i++) {
    s += alphabet[u[i] % alphabet.length];
  }
  return s;
}

/**
 * @param {string} plain
 * @returns {Promise<string>}
 */
async function spotifySha256Base64Url(plain) {
  const enc = new TextEncoder().encode(plain);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * @param {string} access
 * @param {string} refresh
 * @param {number} expiresInSec
 */
function persistSpotifySession(access, refresh, expiresInSec) {
  sessionStorage.setItem(SPOTIFY_STORE.access, access);
  if (refresh) sessionStorage.setItem(SPOTIFY_STORE.refresh, refresh);
  const at = Math.floor(Date.now() / 1000) + (expiresInSec || 3600);
  sessionStorage.setItem(SPOTIFY_STORE.expiresAt, String(at));
}

/**
 * @param {string} code
 * @param {string} verifier
 */
async function exchangeSpotifyCode(code, verifier) {
  const cid = getSpotifyClientId();
  const redirect = getSpotifyRedirectUri();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirect,
    client_id: cid,
    code_verifier: verifier,
  });
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const js = await res.json();
  if (!res.ok) {
    const msg = js.error_description || js.error || `token_${res.status}`;
    throw new Error(msg);
  }
  persistSpotifySession(js.access_token, js.refresh_token, Number(js.expires_in || 3600));
}

async function refreshSpotifyAccessToken() {
  const cid = getSpotifyClientId();
  const refreshTok = sessionStorage.getItem(SPOTIFY_STORE.refresh);
  if (!cid || !refreshTok) throw new Error("missing_refresh");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshTok,
    client_id: cid,
  });
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`token_refresh_${res.status}`);
  const js = await res.json();
  const newRefresh = js.refresh_token || refreshTok;
  persistSpotifySession(js.access_token, newRefresh, Number(js.expires_in || 3600));
  return js.access_token;
}

async function getValidSpotifyAccessToken() {
  const cid = getSpotifyClientId();
  if (!cid) throw new Error("missing_client_id");
  const access = sessionStorage.getItem(SPOTIFY_STORE.access);
  const exp = Number(sessionStorage.getItem(SPOTIFY_STORE.expiresAt) || "0");
  const now = Math.floor(Date.now() / 1000);
  if (access && exp > now + 60) return access;
  return refreshSpotifyAccessToken();
}

function beginSpotifyLogin() {
  const cid = getSpotifyClientId();
  if (!cid) {
    setHistoryStatus("Set your Spotify Client ID in spotify-config.js (see README).", "err");
    return;
  }
  void (async () => {
    try {
      const verifier = spotifyRandomString(64);
      sessionStorage.setItem(SPOTIFY_STORE.verifier, verifier);
      const state = spotifyRandomString(16);
      sessionStorage.setItem(SPOTIFY_STORE.state, state);
      const challenge = await spotifySha256Base64Url(verifier);
      const u = new URL(SPOTIFY_AUTH_URL);
      u.searchParams.set("client_id", cid);
      u.searchParams.set("response_type", "code");
      u.searchParams.set("redirect_uri", getSpotifyRedirectUri());
      u.searchParams.set("scope", SPOTIFY_SCOPE);
      u.searchParams.set("code_challenge_method", "S256");
      u.searchParams.set("code_challenge", challenge);
      u.searchParams.set("state", state);
      window.location.assign(u.toString());
    } catch (e) {
      setHistoryStatus("Could not start Spotify login.", "err");
    }
  })();
}

/**
 * Completes OAuth redirect if `?code=` is present.
 * @returns {Promise<boolean>} true after a successful exchange
 */
async function tryCompleteSpotifyOAuthFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const code = p.get("code");
  const errCode = p.get("error");

  const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;

  if (errCode) {
    sessionStorage.removeItem(SPOTIFY_STORE.verifier);
    sessionStorage.removeItem(SPOTIFY_STORE.state);
    setHistoryStatus(`Spotify authorization failed: ${errCode}`, "err");
    window.history.replaceState({}, "", cleanUrl);
    return false;
  }
  if (!code) return false;

  const state = p.get("state");
  const want = sessionStorage.getItem(SPOTIFY_STORE.state);
  const verifier = sessionStorage.getItem(SPOTIFY_STORE.verifier);
  if (!verifier || !want || state !== want) {
    setHistoryStatus("OAuth state mismatch. Click Connect Spotify and try again.", "err");
    window.history.replaceState({}, "", cleanUrl);
    return false;
  }

  try {
    await exchangeSpotifyCode(code, verifier);
  } catch (e) {
    setHistoryStatus("Could not complete Spotify sign-in (check redirect URI in the developer dashboard).", "err");
    window.history.replaceState({}, "", cleanUrl);
    return false;
  } finally {
    sessionStorage.removeItem(SPOTIFY_STORE.verifier);
    sessionStorage.removeItem(SPOTIFY_STORE.state);
    window.history.replaceState({}, "", cleanUrl);
  }

  setHistoryStatus("Signed in with Spotify.", "ok");
  return true;
}

/**
 * @param {string} access
 * @returns {Promise<object[]>}
 */
async function fetchSpotifyRecentlyPlayed(access) {
  const out = [];
  let before = null;
  let pages = 0;
  while (pages < SPOTIFY_RECENT_MAX_PAGES) {
    const url = new URL(`${SPOTIFY_API_BASE}/me/player/recently-played`);
    url.searchParams.set("limit", "50");
    if (before) url.searchParams.set("before", before);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (!res.ok) throw new Error(`recent_${res.status}`);
    const js = await res.json();
    const items = js.items || [];
    for (let i = 0; i < items.length; i++) out.push(items[i]);
    if (!js.cursors || !js.cursors.before || items.length === 0) break;
    before = js.cursors.before;
    pages++;
    if (items.length < 50) break;
  }
  return out;
}

/**
 * @param {string} access
 * @param {string[]} ids
 * @returns {Promise<Map<string, string[]>>}
 */
async function fetchSpotifyArtistGenreMap(access, ids) {
  /** @type {Map<string, string[]>} */
  const m = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50).filter(Boolean);
    if (!chunk.length) continue;
    const url = `${SPOTIFY_API_BASE}/artists?ids=${encodeURIComponent(chunk.join(","))}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
    if (!res.ok) throw new Error(`artists_${res.status}`);
    const js = await res.json();
    const arts = js.artists || [];
    for (let a = 0; a < arts.length; a++) {
      const ar = arts[a];
      if (ar && ar.id) {
        m.set(ar.id, Array.isArray(ar.genres) ? ar.genres.slice() : []);
      }
    }
  }
  return m;
}

/**
 * @param {*} playItem
 * @param {Map<string, string[]>} artistGenres
 */
function addGenreBucketsForPlay(playItem, artistGenres) {
  const track = playItem && playItem.track;
  if (!track) return;

  if (track.type === "episode") {
    listeningGenreBucketCounts[TOPIC_IDS.PODCASTS] =
      (listeningGenreBucketCounts[TOPIC_IDS.PODCASTS] || 0) + 1;
    return;
  }

  /** @type {Set<string>} */
  const bucketsInPlay = new Set();
  let genreSlot = 0;
  const artists = track.artists || [];
  for (let ai = 0; ai < artists.length; ai++) {
    const aid = artists[ai].id;
    if (!aid) continue;
    const genres = artistGenres.get(aid) || [];
    for (let gi = 0; gi < genres.length && genreSlot < SPOTIFY_GENRES_PER_PLAY_CAP; gi++) {
      const bid = genreStringToBucketId(genres[gi]);
      bucketsInPlay.add(bid);
      genreSlot++;
    }
  }
  if (!bucketsInPlay.size) bucketsInPlay.add(TOPIC_IDS.OTHER);
  bucketsInPlay.forEach((bid) => {
    listeningGenreBucketCounts[bid] = (listeningGenreBucketCounts[bid] || 0) + 1;
  });
}

/**
 * @param {object[]} plays
 * @returns {Record<string, number>}
 */
function computeWordFreqFromSpotifyPlays(plays) {
  /** @type {Record<string, number>} */
  let freq = Object.create(null);
  for (let i = 0; i < plays.length; i++) {
    const t = plays[i].track;
    if (!t) continue;
    const parts = [];
    if (t.name) parts.push(String(t.name));
    if (t.album && t.album.name) parts.push(String(t.album.name));
    if (t.type === "episode" && t.show && t.show.name) parts.push(String(t.show.name));
    const arts = t.artists || [];
    for (let j = 0; j < arts.length; j++) {
      if (arts[j].name) parts.push(String(arts[j].name));
    }
    freq = mergeFreq(freq, wordFreqFromPlainText(parts.join(" ")));
  }
  return freq;
}

/**
 * @returns {Promise<boolean>}
 */
async function loadSpotifyListeningData() {
  try {
    const access = await getValidSpotifyAccessToken();
    setHistoryStatus("Fetching your Spotify history…", "");
    const plays = await fetchSpotifyRecentlyPlayed(access);
    if (!plays.length) {
      setHistoryStatus("No recent plays returned (private session or empty history?).", "err");
      listeningGenreBucketCounts = initListeningGenreBuckets();
      return false;
    }

    const idList = [];
    const seen = new Set();
    for (let i = 0; i < plays.length; i++) {
      const t = plays[i].track;
      if (!t || t.type === "episode") continue;
      const aa = t.artists || [];
      for (let j = 0; j < aa.length; j++) {
        const id = aa[j].id;
        if (id && !seen.has(id)) {
          seen.add(id);
          idList.push(id);
        }
      }
    }

    const artistGenres = idList.length ? await fetchSpotifyArtistGenreMap(access, idList) : new Map();

    listeningGenreBucketCounts = initListeningGenreBuckets();
    for (let i = 0; i < plays.length; i++) addGenreBucketsForPlay(plays[i], artistGenres);

    const freq = computeWordFreqFromSpotifyPlays(plays);
    applyImportedWordFreq(freq, `Spotify · ${plays.length} plays`);
    return true;
  } catch (e) {
    const msg = e && e.message ? String(e.message) : "unknown_error";
    if (msg === "missing_client_id") {
      setHistoryStatus("Set SPOTIFY_CLIENT_ID in spotify-config.js.", "err");
    } else if (msg === "missing_refresh" || msg.startsWith("token_refresh")) {
      setHistoryStatus("Session expired. Connect Spotify again.", "err");
    } else {
      setHistoryStatus("Could not load Spotify data. Check network and try again.", "err");
    }
    return false;
  }
}

function wireHistoryLanding() {
  void tryCompleteSpotifyOAuthFromUrl().then((signedIn) => {
    if (signedIn) void loadSpotifyListeningData();
  });

  const connect = document.getElementById("connect-spotify");
  if (connect) connect.addEventListener("click", () => beginSpotifyLogin());

  const reload = document.getElementById("reload-spotify");
  if (reload) {
    reload.addEventListener("click", () => {
      if (!sessionStorage.getItem(SPOTIFY_STORE.access)) {
        setHistoryStatus("Connect Spotify first.", "err");
        return;
      }
      void loadSpotifyListeningData();
    });
  }

  const logout = document.getElementById("logout-spotify");
  if (logout) {
    logout.addEventListener("click", () => {
      sessionStorage.removeItem(SPOTIFY_STORE.access);
      sessionStorage.removeItem(SPOTIFY_STORE.refresh);
      sessionStorage.removeItem(SPOTIFY_STORE.expiresAt);
      tileWordFreq = null;
      listeningGenreBucketCounts = initListeningGenreBuckets();
      updateStartCameraEnabled();
      setHistoryStatus("Signed out of Spotify.", "ok");
      if (live) {
        updateTopicStatsPanel();
        buildLayout();
      }
    });
  }

  updateStartCameraEnabled();
}


/** Mosaic tile font weight. */
const LAYOUT_TEXT_WEIGHT = 500;

let live = false;
let capture;
/** @type {p5.Renderer | null} */
let portraitP5Renderer = null;
let comp;
let layout = [];
let lastVw = 0;
let lastVh = 0;

/** @type {"idle"|"loading"|"ready"|"error"} */
let segModelState = "idle";
let imageSegmenter = null;
/** @type {{ width: number; height: number; data: Uint8Array } | null} */
let lastPersonSegmentation = null;
let segmentInFlight = false;
/** Plain 2D canvas — same pixels as `comp` for segmentation input. */
let segWorkCanvas = null;
let segVideoTimestamp = 0;

function letterboxRect(vw, vh, cw, ch) {
  const s = min(cw / vw, ch / vh);
  const dw = vw * s;
  const dh = vh * s;
  const ox = (cw - dw) * 0.5;
  const oy = (ch - dh) * 0.5;
  return { ox, oy, dw, dh };
}

/**
 * Letterbox video to fit inside (cw − leftInset − rightInset) × ch, then center
 * horizontally in the full canvas (symmetric insets keep the frame visually centered).
 * @param {number} leftInset
 * @param {number} rightInset
 */
function letterboxRectWithSideInsets(vw, vh, cw, ch, leftInset, rightInset) {
  const L = max(0, leftInset || 0);
  const R = max(0, rightInset || 0);
  const innerW = max(1, cw - L - R);
  const { oy, dw, dh } = letterboxRect(vw, vh, innerW, ch);
  const ox = (cw - dw) * 0.5;
  return { ox, oy, dw, dh };
}

function ensureSegWorkCanvas(w, h) {
  if (!segWorkCanvas || segWorkCanvas.width !== w || segWorkCanvas.height !== h) {
    segWorkCanvas = document.createElement("canvas");
    segWorkCanvas.width = w;
    segWorkCanvas.height = h;
  }
  return segWorkCanvas;
}

/** Black bars + mirrored video (same pixels as on-screen comp). */
function drawLetterboxedMirrorVideoToCtx(ctx, videoEl, cw, ch, leftInset, rightInset) {
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  if (!vw || !vh) return;
  const { ox, oy, dw, dh } = letterboxRectWithSideInsets(vw, vh, cw, ch, leftInset || 0, rightInset || 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cw, ch);
  ctx.save();
  ctx.translate(ox + dw, oy);
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, 0, 0, dw, dh);
  ctx.restore();
}

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} sat 0 = grayscale, 1 = original chroma, >1 extrapolates saturation (RGB clamped).
 * @returns {[number, number, number]}
 */
function rgbWithSaturation(r, g, b, sat) {
  const lum = luminance(r, g, b);
  const s = max(0, sat);
  return [
    constrain(lum + (r - lum) * s, 0, 255),
    constrain(lum + (g - lum) * s, 0, 255),
    constrain(lum + (b - lum) * s, 0, 255),
  ];
}

/**
 * @param {number} mult >= 0; 1 leaves RGB unchanged.
 * @returns {[number, number, number]}
 */
function rgbWithBrightness(r, g, b, mult) {
  const m = max(0, mult);
  return [constrain(r * m, 0, 255), constrain(g * m, 0, 255), constrain(b * m, 0, 255)];
}

/**
 * Maps slider 0…200 (%) to multiplier: 0% → TILE_BRIGHTNESS_MULT_MIN, 100% → 1, 200% → 2.
 * @param {number} sliderRaw
 */
function tileBrightnessMultFromSlider(sliderRaw) {
  const p = constrain(Number(sliderRaw) / 100, 0, TILE_BRIGHTNESS_UI_MAX / 100);
  if (p <= 1) {
    return TILE_BRIGHTNESS_MULT_MIN + p * (1 - TILE_BRIGHTNESS_MULT_MIN);
  }
  return p;
}

/**
 * @param {number} sat
 * @param {number} bright
 */
function tileSurfaceRgb(r, g, b, sat, bright) {
  const [a, b0, c] = rgbWithSaturation(r, g, b, sat);
  return rgbWithBrightness(a, b0, c, bright);
}

function ensureComp() {
  if (!comp || comp.width !== width || comp.height !== height) {
    comp = createGraphics(width, height);
    // Match logical coords to pixels[] stride (defaults to 2 on HiDPI and breaks manual sampling).
    comp.pixelDensity(1);
  }
}

/** Average RGB + luminance under a rect (mirrored feed already in `px`). */
function avgSampleInRect(px, pw, ph, ax0, ay0, ax1, ay1) {
  const rx0 = min(ax0, ax1);
  const rx1 = max(ax0, ax1);
  const ry0 = min(ay0, ay1);
  const ry1 = max(ay0, ay1);
  const x0 = constrain(floor(rx0), 0, pw - 1);
  const x1 = constrain(ceil(rx1), 0, pw - 1);
  const y0 = constrain(floor(ry0), 0, ph - 1);
  const y1 = constrain(ceil(ry1), 0, ph - 1);
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumL = 0;
  let n = 0;
  const area = (x1 - x0 + 1) * (y1 - y0 + 1);
  const step = max(1, floor(area / 140));
  for (let y = y0; y <= y1; y += step) {
    for (let x = x0; x <= x1; x += step) {
      const i = 4 * (y * pw + x);
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      sumR += r;
      sumG += g;
      sumB += b;
      sumL += luminance(r, g, b);
      n++;
    }
  }
  if (!n) return { r: 0, g: 0, b: 0, lum: 0 };
  return { r: sumR / n, g: sumG / n, b: sumB / n, lum: sumL / n };
}

function segMaskCountsAsPerson(m) {
  if (m == null || m !== m) return false;
  const v = Number(m);
  return SELFIE_PERSON_CATEGORY_NONZERO ? v > 0 : v === 0;
}

/**
 * Person mask at canvas pixel (mask matches letterboxed mirrored `segWorkCanvas`).
 */
function personMaskAtCanvasPixel(seg, xx, yy, cw, ch) {
  if (!seg || !seg.data) return false;
  const sw = seg.width;
  const sh = seg.height;
  if (sw < 2 || sh < 2) return false;
  const xc = constrain(xx, 0, cw - 1);
  const yc = constrain(yy, 0, ch - 1);
  const sx = constrain(floor((xc / max(cw - 1, 1)) * (sw - 1)), 0, sw - 1);
  const sy = constrain(floor((yc / max(ch - 1, 1)) * (sh - 1)), 0, sh - 1);
  const idx = sy * sw + sx;
  if (idx < 0 || idx >= seg.data.length) return false;
  return segMaskCountsAsPerson(seg.data[idx]);
}

/**
 * Fraction of samples in a canvas rect that fall on person/foreground in the mask.
 */
function personMaskRatioInCanvasRect(seg, cx0, cy0, cx1, cy1, cw, ch) {
  if (!seg || !seg.data) return 0;
  const rx0 = constrain(floor(min(cx0, cx1)), 0, cw - 1);
  const rx1 = constrain(ceil(max(cx0, cx1)), 0, cw - 1);
  const ry0 = constrain(floor(min(cy0, cy1)), 0, ch - 1);
  const ry1 = constrain(ceil(max(cy0, cy1)), 0, ch - 1);
  let hits = 0;
  let total = 0;
  const wpx = rx1 - rx0 + 1;
  const hpx = ry1 - ry0 + 1;
  const area = wpx * hpx;
  const targetSamples = 36;
  const step = max(1, min(floor(sqrt(area / targetSamples)), min(wpx, hpx)));
  for (let yy = ry0; yy <= ry1; yy += step) {
    for (let xx = rx0; xx <= rx1; xx += step) {
      if (personMaskAtCanvasPixel(seg, xx, yy, cw, ch)) hits++;
      total++;
    }
  }
  return total ? hits / total : 0;
}

async function loadMediaPipeSegmenter() {
  segModelState = "loading";
  try {
    const mod = await import(
      `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VER}/+esm`
    );
    const FilesetResolver = mod.FilesetResolver ?? mod.default?.FilesetResolver;
    const ImageSegmenter = mod.ImageSegmenter ?? mod.default?.ImageSegmenter;
    if (!FilesetResolver || !ImageSegmenter) {
      throw new Error("tasks-vision ESM exports not found");
    }
    const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
    imageSegmenter = await ImageSegmenter.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MEDIAPIPE_SELFIE_TFLITE,
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });
    segVideoTimestamp = 0;
    segModelState = "ready";
  } catch (e) {
    imageSegmenter = null;
    segModelState = "error";
  }
}

function maybeRequestSegmentation() {
  if (segModelState !== "ready" || !imageSegmenter || !videoCanDraw() || segmentInFlight) return;
  if (frameCount % SEGMENT_EVERY_N_FRAMES !== 0) return;
  const sc = ensureSegWorkCanvas(width, height);
  const ctx = sc.getContext("2d");
  const segInsets = getLiveSideInsets();
  drawLetterboxedMirrorVideoToCtx(ctx, capture.elt, width, height, segInsets.left, segInsets.right);
  segmentInFlight = true;
  segVideoTimestamp += 1;
  Promise.resolve()
    .then(() => imageSegmenter.segmentForVideo(sc, segVideoTimestamp))
    .then((result) => {
      if (!result) {
        lastPersonSegmentation = null;
        return;
      }
      const cm = result.categoryMask;
      if (cm && typeof cm.getAsUint8Array === "function") {
        const raw = cm.getAsUint8Array();
        lastPersonSegmentation = {
          width: cm.width,
          height: cm.height,
          data: new Uint8Array(raw),
        };
      } else {
        lastPersonSegmentation = null;
      }
      if (typeof result.close === "function") {
        result.close();
      }
    })
    .catch(() => {
      lastPersonSegmentation = null;
    })
    .finally(() => {
      segmentInFlight = false;
    });
}

function applyGeistWeight(gfx, weight, sizePx) {
  gfx.textFont(textFont());
  gfx.textSize(sizePx);
  gfx.drawingContext.font = `${weight} ${sizePx}px "Geist Mono", monospace`;
}

/** Called from draw() so shuffles stay on p5's redraw loop (more reliable than setInterval). */
function maybeContinuousShuffleFromDraw() {
  if (!continuousShuffleOn || !live) return;
  const now = millis();
  if (now - lastContinuousShuffleAtMs < CONTINUOUS_SHUFFLE_INTERVAL_MS) return;
  lastContinuousShuffleAtMs = now;
  buildLayout();
}

function wireContinuousShuffleToggle() {
  const el = document.getElementById("continuous-shuffle");
  if (!el) return;
  el.addEventListener("change", () => {
    continuousShuffleOn = !!el.checked;
    if (continuousShuffleOn) {
      lastContinuousShuffleAtMs = millis();
      if (live) buildLayout();
    } else if (live) {
      buildLayout();
    }
  });
  if (el.checked) {
    continuousShuffleOn = true;
    lastContinuousShuffleAtMs = millis();
  }
}

function wireInvertPersonTileToggle() {
  const el = document.getElementById("invert-person-tiles");
  if (!el) return;
  el.addEventListener("change", () => {
    invertPersonTileMask = !!el.checked;
  });
  invertPersonTileMask = !!el.checked;
}

function getPortraitCanvasElement() {
  if (typeof canvas !== "undefined" && canvas && canvas.elt) return canvas.elt;
  const el = document.querySelector("canvas");
  return el || null;
}

function escapeXmlAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function triggerDownloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function setDownloadButtonsEnabled(on) {
  const pngBtn = document.getElementById("download-png");
  const svgBtn = document.getElementById("download-svg");
  if (pngBtn) pngBtn.disabled = !on;
  if (svgBtn) svgBtn.disabled = !on;
}

function downloadPortraitPng() {
  if (!live) return;
  const elt = getPortraitCanvasElement();
  if (!elt) return;
  const name = "digital-diet-portrait.png";
  if (typeof elt.toBlob === "function") {
    elt.toBlob((blob) => {
      if (blob) triggerDownloadBlob(blob, name);
    }, "image/png");
    return;
  }
  const a = document.createElement("a");
  a.href = elt.toDataURL("image/png");
  a.download = name;
  a.click();
}

function downloadPortraitSvg() {
  if (!live) return;
  const elt = getPortraitCanvasElement();
  if (!elt) return;
  const dataUrl = elt.toDataURL("image/png");
  const w = elt.width;
  const h = elt.height;
  const hrefEsc = escapeXmlAttr(dataUrl);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <image width="${w}" height="${h}" xlink:href="${hrefEsc}" href="${hrefEsc}"/>
</svg>
`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  triggerDownloadBlob(blob, "digital-diet-portrait.svg");
}

function syncTileSliderLabels() {
  const bEl = document.getElementById("tile-brightness-value");
  const sEl = document.getElementById("tile-saturation-value");
  const zEl = document.getElementById("tile-text-size-value");
  const bIn = document.getElementById("tile-brightness");
  const sIn = document.getElementById("tile-saturation");
  const zIn = document.getElementById("tile-text-size");
  if (bEl && bIn) bEl.textContent = `${Math.round(Number(bIn.value))}%`;
  if (sEl && sIn) sEl.textContent = `${Math.round(Number(sIn.value))}%`;
  if (zEl && zIn) zEl.textContent = `${Math.round(Number(zIn.value))}px`;
}

function wireTileAppearanceSliders() {
  const bIn = document.getElementById("tile-brightness");
  const sIn = document.getElementById("tile-saturation");
  const zIn = document.getElementById("tile-text-size");
  if (bIn) {
    bIn.addEventListener("input", () => {
      tileBrightnessMult = tileBrightnessMultFromSlider(Number(bIn.value));
      syncTileSliderLabels();
    });
  }
  if (sIn) {
    sIn.addEventListener("input", () => {
      tileFillSaturation = constrain(Number(sIn.value) / 100, 0, TILE_SATURATION_UI_MAX / 100);
      syncTileSliderLabels();
    });
  }
  if (zIn) {
    zIn.addEventListener("input", () => {
      tileFontSizePx = constrain(Math.round(Number(zIn.value)), TILE_FONT_SIZE_MIN, TILE_FONT_SIZE_MAX);
      syncTileSliderLabels();
      if (live) buildLayout();
    });
  }
  tileBrightnessMult = bIn ? tileBrightnessMultFromSlider(Number(bIn.value)) : 1;
  tileFillSaturation = sIn ? constrain(Number(sIn.value) / 100, 0, TILE_SATURATION_UI_MAX / 100) : 1.5;
  tileFontSizePx = zIn
    ? constrain(Math.round(Number(zIn.value)), TILE_FONT_SIZE_MIN, TILE_FONT_SIZE_MAX)
    : 12;
  syncTileSliderLabels();
}

/**
 * Fisher–Yates shuffle of `[word, count]` rows (returns a new array).
 * @param {[string, number][]} rows
 * @returns {[string, number][]}
 */
function shuffleWordEntryPairs(rows) {
  const out = rows.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return out;
}

function buildLayout() {
  layout = [];
  if (!live || !capture || !capture.elt) return;
  const vw = capture.elt.videoWidth;
  const vh = capture.elt.videoHeight;
  if (!vw || !vh || width < 32) return;

  ensureComp();
  const g = comp;
  g.textAlign(LEFT, BASELINE);

  const layoutInsets = getLiveSideInsets();
  const { ox, oy, dw, dh } = letterboxRectWithSideInsets(vw, vh, width, height, layoutInsets.left, layoutInsets.right);
  const box = {
    minX: ox + TEXT_INSET,
    minY: oy + TEXT_INSET,
    maxX: ox + dw - TEXT_INSET,
    maxY: oy + dh - TEXT_INSET,
  };
  if (box.maxX - box.minX < 40 || box.maxY - box.minY < 40) return;

  const left0 = box.minX;
  const top0 = box.minY;

  const wordMap =
    tileWordFreq && Object.keys(tileWordFreq).length ? tileWordFreq : DEFAULT_TILE_WORDS;
  /** Random order (never A–Z); shuffle toggle only adds periodic re-layout in {@link maybeContinuousShuffleFromDraw}. */
  const entries = shuffleWordEntryPairs(Object.entries(wordMap));

  applyGeistWeight(g, LAYOUT_TEXT_WEIGHT, tileFontSizePx);

  let rowTop = top0;
  let rowMaxTh = 0;
  let x = left0;
  let wi = 0;
  let placed = 0;
  let safety = 0;

  while (rowTop < box.maxY && placed < 8000 && safety < 90000) {
    safety++;
    const [word] = entries[wi % entries.length];
    const topicId = TOPIC_IDS.OTHER;
    const tw = max(g.textWidth(word), 4);
    const ascent = g.textAscent();
    const th = ascent + g.textDescent();

    if (x + tw + TEXT_INSET > box.maxX) {
      if (x > left0) {
        rowTop += rowMaxTh + 2 * TEXT_INSET + BLOCK_GAP;
        rowMaxTh = 0;
        x = left0;
        if (rowTop >= box.maxY) break;
        continue;
      }
    }

    const baselineY = rowTop + ascent;
    layout.push({
      word,
      x,
      y: baselineY,
      w: tw,
      h: th,
      ascent,
      weight: LAYOUT_TEXT_WEIGHT,
      topicId,
    });
    rowMaxTh = max(rowMaxTh, th);
    placed++;
    wi++;
    x += tw + 2 * TEXT_INSET + BLOCK_GAP;
  }

  lastVw = vw;
  lastVh = vh;
}

function videoCanDraw() {
  const v = capture && capture.elt;
  return !!(v && v.srcObject && v.readyState >= HAVE_METADATA && v.videoWidth > 0);
}

function startLive() {
  if (live) return;
  if (!tileWordFreq || !Object.keys(tileWordFreq).length) {
    setHistoryStatus("Load your Spotify listening data first — connect and fetch, then start the camera.", "err");
    return;
  }
  live = true;

  const landing = document.getElementById("landing");
  if (landing) landing.style.display = "none";
  document.body.classList.add("portrait-mode");

  const dietPanel = document.getElementById("diet-title-panel");
  if (dietPanel) dietPanel.hidden = false;
  const dlAside = document.getElementById("diet-download-aside");
  if (dlAside) dlAside.hidden = false;
  const portraitRoot = document.getElementById("portrait-root");
  if (portraitRoot) portraitRoot.hidden = false;
  const host = document.getElementById("portrait-canvas-host");
  if (portraitP5Renderer && host) portraitP5Renderer.parent(host);
  setDownloadButtonsEnabled(true);

  applyLiveCanvasSize();
  syncPortraitDocumentScrollClass();
  textFont("monospace");
  textAlign(LEFT, BASELINE);
  updateTopicStatsPanel();
  if (continuousShuffleOn) lastContinuousShuffleAtMs = millis();

  try {
    capture = createCapture(VIDEO);
    capture.hide();
    const v = capture.elt;
    v.muted = true;
    v.setAttribute("playsinline", "true");
    v.playsInline = true;
    const play = () => v.play().catch(() => {});
    const rebuild = () => {
      applyLiveCanvasSize();
      buildLayout();
    };
    v.addEventListener("loadeddata", play, { once: true });
    v.addEventListener("canplay", play, { once: true });
    v.addEventListener("loadeddata", rebuild, { once: true });
    play();
  } catch (e) {
    /* camera blocked */
  }

  setTimeout(() => {
    applyLiveCanvasSize();
    buildLayout();
  }, 400);

  loadMediaPipeSegmenter();

  void (async () => {
    try {
      await Promise.race([
        document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
      if (document.fonts && document.fonts.load) {
        const px = `${tileFontSizePx}px`;
        for (const w of [400, 500, 600, 700]) {
          await document.fonts.load(`${w} ${px} "Geist Mono"`);
        }
      }
      textFont("Geist Mono");
    } catch (e) {
      textFont("monospace");
    }
    applyLiveCanvasSize();
    buildLayout();
    syncPortraitDocumentScrollClass();
  })();
}

function setup() {
  pixelDensity(1);
  portraitP5Renderer = createCanvas(windowWidth, windowHeight);
  wireHistoryLanding();
  const btn = document.getElementById("start-camera");
  if (btn) btn.addEventListener("click", startLive);
  wireContinuousShuffleToggle();
  wireInvertPersonTileToggle();
  wireTopicColorInputs();
  const dlPng = document.getElementById("download-png");
  const dlSvg = document.getElementById("download-svg");
  if (dlPng) dlPng.addEventListener("click", downloadPortraitPng);
  if (dlSvg) dlSvg.addEventListener("click", downloadPortraitSvg);
  wireTileAppearanceSliders();
  if (typeof window !== "undefined" && window.matchMedia) {
    const mq = window.matchMedia(`(max-width: ${PORTRAIT_STACKED_MAX_CSS_PX}px)`);
    const onStackedMq = () => {
      if (!live) return;
      syncPortraitDocumentScrollClass();
      applyLiveCanvasSize();
      buildLayout();
    };
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", onStackedMq);
    else if (typeof mq.addListener === "function") mq.addListener(onStackedMq);
  }
}

function windowResized() {
  pixelDensity(1);
  if (live) {
    syncPortraitDocumentScrollClass();
    applyLiveCanvasSize();
    buildLayout();
  } else {
    resizeCanvas(windowWidth, windowHeight);
  }
}

function draw() {
  if (!live) {
    background(10, 10, 10);
    return;
  }

  if (!videoCanDraw()) {
    background(22, 22, 22);
    fill(160);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("waiting for camera…", width * 0.5, height * 0.5);
    return;
  }

  const vw = capture.elt.videoWidth;
  const vh = capture.elt.videoHeight;
  if (vw !== lastVw || vh !== lastVh) {
    lastPersonSegmentation = null;
    applyLiveCanvasSize();
    buildLayout();
  }
  if (layout.length === 0) buildLayout();

  maybeContinuousShuffleFromDraw();

  ensureComp();

  const drawInsets = getLiveSideInsets();
  const { ox, oy, dw, dh } = letterboxRectWithSideInsets(vw, vh, width, height, drawInsets.left, drawInsets.right);
  comp.background(0);
  comp.push();
  comp.translate(ox + dw, oy);
  comp.scale(-1, 1);
  comp.image(capture, 0, 0, dw, dh);
  comp.pop();

  maybeRequestSegmentation();

  comp.loadPixels();
  const px = comp.pixels;
  const pw = comp.width;
  const ph = comp.height;

  const samples = [];
  for (let i = 0; i < layout.length; i++) {
    const it = layout[i];
    const x0 = it.x - TEXT_INSET;
    const y0 = it.y - it.ascent - TEXT_INSET;
    const x1 = it.x + it.w + TEXT_INSET;
    const y1 = it.y - it.ascent + it.h + TEXT_INSET;
    samples.push(avgSampleInRect(px, pw, ph, x0, y0, x1, y1));
  }

  comp.push();
  comp.colorMode(RGB, 255, 255, 255, 255);
  comp.rectMode(CORNER);
  comp.textAlign(LEFT, BASELINE);
  comp.strokeWeight(1);

  const bright = constrain(tileBrightnessMult, TILE_BRIGHTNESS_MULT_MIN, TILE_BRIGHTNESS_UI_MAX / 100);
  const sat = constrain(tileFillSaturation, 0, TILE_SATURATION_UI_MAX / 100);
  const strokeA = TILE_STROKE_ALPHA;

  for (let i = 0; i < layout.length; i++) {
    const it = layout[i];
    const s = samples[i];
    if (s.lum <= LETTERBOX_LUM_SKIP) continue;

    if (segModelState === "loading" || segModelState === "idle") {
      continue;
    }
    if (segModelState === "ready") {
      if (!lastPersonSegmentation) continue;
      const x0 = it.x - TEXT_INSET;
      const y0 = it.y - it.ascent - TEXT_INSET;
      const x1 = it.x + it.w + TEXT_INSET;
      const y1 = it.y - it.ascent + it.h + TEXT_INSET;
      const pr = personMaskRatioInCanvasRect(lastPersonSegmentation, x0, y0, x1, y1, width, height);
      const onPerson = pr >= PERSON_TILE_THRESHOLD;
      if (!invertPersonTileMask && !onPerson) continue;
      if (invertPersonTileMask && onPerson) continue;
    }
    // "error": no segmenter — draw full mosaic (letterbox still hides black bars via lum).

    const useTopicColor = it.topicId != null && it.topicId !== TOPIC_IDS.OTHER;
    if (useTopicColor) {
      const [r0, g0, b0] = rgbForTopic(it.topicId);
      const [tr, tg, tb] = tileSurfaceRgb(r0, g0, b0, sat, bright);
      comp.fill(tr, tg, tb);
      const strokeR = constrain(round(tr * 0.42), 0, 80);
      const strokeG = constrain(round(tg * 0.42), 0, 80);
      const strokeB = constrain(round(tb * 0.42), 0, 80);
      comp.stroke(strokeR, strokeG, strokeB, strokeA);
    } else {
      const [tr, tg, tb] = tileSurfaceRgb(s.r, s.g, s.b, sat, bright);
      comp.fill(tr, tg, tb);
      const [sr0, sg0, sb0] = tileSurfaceRgb(
        TILE_STROKE_RGB[0],
        TILE_STROKE_RGB[1],
        TILE_STROKE_RGB[2],
        sat,
        bright,
      );
      comp.stroke(sr0, sg0, sb0, strokeA);
    }
    comp.rect(it.x - TEXT_INSET, it.y - it.ascent - TEXT_INSET, it.w + 2 * TEXT_INSET, it.h + 2 * TEXT_INSET, BLOCK_RADIUS);

    comp.noStroke();
    if (useTopicColor) {
      const [r0, g0, b0] = rgbForTopic(it.topicId);
      const [tr, tg, tb] = tileSurfaceRgb(r0, g0, b0, sat, bright);
      const tileLum = luminance(tr, tg, tb);
      if (tileLum > 138) {
        comp.fill(...rgbWithBrightness(22, 22, 24, bright));
      } else {
        comp.fill(...rgbWithBrightness(244, 242, 238, bright));
      }
    } else {
      const [tr, tg, tb] = tileSurfaceRgb(s.r, s.g, s.b, sat, bright);
      const tileLum = luminance(tr, tg, tb);
      if (tileLum > 138) {
        comp.fill(...rgbWithBrightness(22, 22, 24, bright));
      } else {
        comp.fill(...rgbWithBrightness(244, 242, 238, bright));
      }
    }
    applyGeistWeight(comp, it.weight != null ? it.weight : LAYOUT_TEXT_WEIGHT, tileFontSizePx);
    comp.text(it.word, it.x, it.y);
  }

  comp.pop();

  image(comp, 0, 0);

  if (segModelState === "loading") {
    push();
    noStroke();
    fill(0, 130);
    rect(10, 10, 300, 26, 5);
    fill(235);
    textAlign(LEFT, CENTER);
    textSize(11);
    text("Loading MediaPipe selfie model…", 20, 23);
    pop();
  }
}
