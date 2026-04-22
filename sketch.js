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
  return freqFromTokens(tokenizeWords(text));
}

function parseCsvLine(line) {
  const cells = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && c === ",") {
      cells.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells.map((s) => s.trim());
}

function parseHistoryCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return Object.create(null);
  const header = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").toLowerCase());
  const idxTitle = header.findIndex((h) => ["title", "page title", "pagetitle"].includes(h));
  const idxUrl = header.findIndex((h) => ["url", "uri", "address", "link"].includes(h));

  /** @type {Record<string, number>} */
  let merged = Object.create(null);
  if (idxTitle < 0 && idxUrl < 0) {
    for (let i = 1; i < lines.length; i++) {
      merged = mergeFreq(merged, wordFreqFromPlainText(parseCsvLine(lines[i]).join(" ")));
    }
    return merged;
  }
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (idxTitle >= 0) {
      const t = row[idxTitle] ?? "";
      merged = mergeFreq(merged, wordFreqFromPlainText(String(t)));
    }
    // URL column is ignored: we only count words from titles / pasted text (what you read), not host/path tokens.
  }
  return merged;
}

function extractJsonRecords(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const k of ["history", "items", "entries", "visits", "data"]) {
    if (Array.isArray(data[k])) return data[k];
  }
  return [];
}

/**
 * Reader-facing text from a history row (no URL parsing — avoids google/mail/calendar host noise).
 * @param {Record<string, unknown>} rec
 */
function readingTextFromHistoryRecord(rec) {
  const title = rec.title ?? rec.name ?? rec.pageTitle ?? rec.page_title ?? "";
  const extra =
    rec.description ??
    rec.snippet ??
    rec.metaDescription ??
    rec.meta_description ??
    rec.summary ??
    "";
  const s = `${String(title)} ${String(extra)}`.trim();
  return s;
}

function wordFreqFromHistoryRecords(records) {
  /** @type {Record<string, number>} */
  let merged = Object.create(null);
  for (const rec of records) {
    if (!rec || typeof rec !== "object") continue;
    const text = readingTextFromHistoryRecord(rec);
    if (!text) continue;
    merged = mergeFreq(merged, wordFreqFromPlainText(text));
  }
  return merged;
}

function parseHistoryJsonText(text) {
  const data = JSON.parse(text);
  if (Array.isArray(data) && data.length && typeof data[0] === "string") {
    return wordFreqFromPlainText(data.join(" "));
  }
  return wordFreqFromHistoryRecords(extractJsonRecords(data));
}

function applyImportedWordFreq(freq, label) {
  if (!freq || !Object.keys(freq).length) {
    setHistoryStatus("No words found in that file. Try JSON from the extension or a different export.", "err");
    return;
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
}

async function handleHistoryFile(file) {
  if (!file) return;
  const name = (file.name || "").toLowerCase();
  const isJson = name.endsWith(".json") || file.type === "application/json";
  const isCsv = name.endsWith(".csv") || file.type === "text/csv" || file.type === "application/vnd.ms-excel";
  if (!isJson && !isCsv) {
    setHistoryStatus("Please upload a .json or .csv export.", "err");
    return;
  }
  try {
    const text = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(r.error);
      r.readAsText(file);
    });
    /** @type {Record<string, number>} */
    let freq;
    if (isJson) {
      freq = parseHistoryJsonText(text);
    } else {
      freq = parseHistoryCsv(text);
    }
    applyImportedWordFreq(freq, `Loaded ${file.name}`);
  } catch (e) {
    setHistoryStatus("Could not read that file. Check that it is valid JSON or CSV.", "err");
  }
}

function wireHistoryLanding() {
  const drop = document.getElementById("history-drop");
  const input = document.getElementById("history-file");
  const pasteBtn = document.getElementById("use-paste");
  const pasteEl = document.getElementById("history-paste");

  if (drop && input) {
    ["dragenter", "dragover"].forEach((ev) => {
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach((ev) => {
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.remove("dragover");
      });
    });
    drop.addEventListener("drop", (e) => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) void handleHistoryFile(f);
    });
    input.addEventListener("change", () => {
      const f = input.files && input.files[0];
      if (f) void handleHistoryFile(f);
      input.value = "";
    });
    drop.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.click();
      }
    });
  }

  if (pasteBtn && pasteEl) {
    pasteBtn.addEventListener("click", () => {
      const freq = wordFreqFromPlainText(pasteEl.value);
      if (!Object.keys(freq).length) {
        setHistoryStatus("Paste some text first, then try again.", "err");
        return;
      }
      applyImportedWordFreq(freq, "Using pasted text");
    });
  }

  updateStartCameraEnabled();
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

/** Topic buckets for browsing vocabulary → tile tint (falls back to OTHER). */
const TOPIC_IDS = {
  POLITICS: "politics",
  CULTURE: "culture",
  TECH: "tech",
  HEALTH: "health",
  MONEY: "money",
  SCIENCE: "science",
  SOCIAL: "social",
  PERSONAL: "personal",
  OTHER: "other",
};

/** Default RGB fills (editable copy lives in `topicRgbById`). */
const TOPIC_RGB = {
  [TOPIC_IDS.POLITICS]: [76, 126, 184],
  [TOPIC_IDS.CULTURE]: [240, 126, 92],
  [TOPIC_IDS.TECH]: [0, 174, 194],
  [TOPIC_IDS.HEALTH]: [112, 168, 132],
  [TOPIC_IDS.MONEY]: [219, 180, 112],
  [TOPIC_IDS.SCIENCE]: [98, 56, 214],
  [TOPIC_IDS.SOCIAL]: [230, 51, 122],
  [TOPIC_IDS.PERSONAL]: [232, 224, 208],
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

const TOPIC_STATS_ORDER = [
  TOPIC_IDS.POLITICS,
  TOPIC_IDS.CULTURE,
  TOPIC_IDS.TECH,
  TOPIC_IDS.HEALTH,
  TOPIC_IDS.MONEY,
  TOPIC_IDS.SCIENCE,
  TOPIC_IDS.SOCIAL,
  TOPIC_IDS.PERSONAL,
  TOPIC_IDS.OTHER,
];

const TOPIC_LABELS = {
  [TOPIC_IDS.POLITICS]: "Politics",
  [TOPIC_IDS.CULTURE]: "Culture",
  [TOPIC_IDS.TECH]: "Tech",
  [TOPIC_IDS.HEALTH]: "Health",
  [TOPIC_IDS.MONEY]: "Money",
  [TOPIC_IDS.SCIENCE]: "Science",
  [TOPIC_IDS.SOCIAL]: "Social",
  [TOPIC_IDS.PERSONAL]: "Personal",
  [TOPIC_IDS.OTHER]: "Miscellaneous",
};

/**
 * @param {Record<string, number>} freq
 * @returns {Record<string, number>}
 */
function aggregateTopicWordCounts(freq) {
  /** @type {Record<string, number>} */
  const out = Object.create(null);
  for (let i = 0; i < TOPIC_STATS_ORDER.length; i++) {
    out[TOPIC_STATS_ORDER[i]] = 0;
  }
  const keys = Object.keys(freq);
  for (let k = 0; k < keys.length; k++) {
    const word = keys[k];
    const n = freq[word];
    if (!n || n < 1) continue;
    const topicId = topicForWord(word);
    out[topicId] = (out[topicId] || 0) + n;
  }
  return out;
}

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
  const counts = aggregateTopicWordCounts(tileWordFreq);
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

/**
 * @param {string[]} exact
 * @param {string[]} stems
 */
function topicRule(id, exact, stems) {
  return { id, exact: new Set(exact.map((w) => w.toLowerCase())), stems: stems.map((s) => s.toLowerCase()) };
}

/** First matching rule wins (order = specificity / your grouping intent). */
const TOPIC_RULES = [
  topicRule(TOPIC_IDS.POLITICS, [
    "senate",
    "congress",
    "parliament",
    "election",
    "ballot",
    "vote",
    "voting",
    "campaign",
    "president",
    "minister",
    "senator",
    "governor",
    "mayor",
    "democrat",
    "republican",
    "tory",
    "labour",
    "referendum",
    "nato",
    "pentagon",
    "diplomat",
    "embassy",
    "sanctions",
    "ukraine",
    "israel",
    "gaza",
    "hamas",
    "kremlin",
    "putin",
    "biden",
    "trump",
    "xi",
    "un",
    "unhcr",
    "refugee",
    "asylum",
    "border",
    "immigration",
    "geopolitics",
    "warfare",
    "military",
    "defense",
    "defence",
    "treaty",
    "summit",
    "whitehouse",
    "capitol",
    "lobbying",
    "politico",
    "brexit",
    "npr",
    "bbc",
    "cnn",
    "aljazeera",
    "reuters",
    "apnews",
    "axios",
    "foreignpolicy",
    "nationalreview",
    "thehill",
    "propublica",
    "intercept",
    "wikileaks",
    "filibuster",
    "impeachment",
    "subpoena",
    "gerrymander",
    "caucus",
    "primaries",
    "politifact",
    "factcheck",
    "factchecker",
    "thinktank",
    "lobbyist",
    "partisan",
    "bipartisan",
    "legislature",
    "judiciary",
    "constituency",
    "ballotpedia",
    "fec",
    "gop",
    "dnc",
    "rnc",
    "nsc",
    "cia",
    "fbi",
    "interpol",
    "icc",
    "unesco",
    "who.int",
  ], [
    "elect",
    "politic",
    "legislat",
    "parliament",
    "geopolit",
    "diplomacy",
    "authoritarian",
    "democracy",
    "nationalism",
    "sanction",
    "terror",
    "insurg",
    "ceasefire",
    "humanitarian",
    "coup",
    "regime",
    "nato",
    "pentagon",
    "bureaucr",
    "authoritar",
    "diplomat",
    "legislature",
    "impeach",
    "gerrymand",
    "thinktank",
    "lobbying",
    "campaign",
    "referendum",
  ]),
  topicRule(TOPIC_IDS.CULTURE, [
    "film",
    "movie",
    "cinema",
    "oscar",
    "netflix",
    "spotify",
    "bandcamp",
    "soundcloud",
    "museum",
    "gallery",
    "fashion",
    "vogue",
    "runway",
    "architecture",
    "literature",
    "novel",
    "author",
    "poetry",
    "theatre",
    "theater",
    "broadway",
    "opera",
    "symphony",
    "orchestra",
    "festival",
    "imdb",
    "letterboxd",
    "rotten",
    "metacritic",
    "pitchfork",
    "behance",
    "dribbble",
    "designer",
    "curator",
    "exhibition",
    "photography",
    "cinematography",
    "screenplay",
    "soundtrack",
    "album",
    "lyrics",
    "remix",
    "vinyl",
    "streaming",
    "documentary",
    "animation",
    "anime",
    "manga",
    "comiccon",
    "drawing",
    "drawings",
    "sketch",
    "sketches",
    "sketching",
    "painting",
    "paintings",
    "painter",
    "illustration",
    "illustrations",
    "illustrator",
    "sculpture",
    "sculptor",
    "mural",
    "murals",
    "watercolor",
    "calligraphy",
    "lettering",
    "printmaking",
    "lithograph",
    "engraving",
    "origami",
    "pottery",
    "ceramics",
    "knitting",
    "crochet",
    "embroidery",
    "tapestry",
    "weaving",
    "collage",
    "papercraft",
    "storyboard",
    "conceptart",
    "characterdesign",
    "figuredrawing",
    "lifedrawing",
    "pleinair",
    "atelier",
    "artwork",
    "artworks",
    "fineart",
    "contemporaryart",
    "modernism",
    "renaissance",
    "baroque",
    "impressionism",
    "calligraffiti",
    "streetart",
    "graffiti",
    "zine",
    "comics",
    "webcomic",
    "graphicnovel",
    "storytelling",
    "choreography",
    "choreographer",
    "dancer",
    "dancers",
    "ballet",
    "hiphop",
    "songwriter",
    "composer",
    "sounddesign",
    "foley",
    "procreate",
    "photoshop",
    "lightroom",
    "indesign",
    "illustrator",
    "clipstudiopaint",
    "artstation",
    "deviantart",
    "skillshare",
    "masterclass",
    "crafts",
    "handmade",
    "etsy",
    "ravelry",
    "letterboxd",
    "goodreads",
    "bookclub",
    "readathon",
    "sonnet",
    "novella",
    "anthology",
    "memoir",
    "biography",
    "autobiography",
    "callsheet",
    "storyboard",
    "costume",
    "costumes",
    "setdesign",
    "productiondesign",
    "artdirection",
    "typography",
    "fontdesign",
    "typeface",
    "kerning",
    "ligature",
    "serif",
    "brutalism",
    "bauhaus",
    "midcentury",
    "industrialdesign",
    "productdesign",
    "uxwriting",
    "jewelry",
    "goldsmith",
    "silversmith",
    "printdesign",
    "editorial",
    "lookbook",
    "runway",
    "couture",
    "sewing",
    "patternmaking",
    "tailoring",
    "millinery",
    "calligrapher",
    "letterpress",
    "risograph",
    "screenprint",
    "linocut",
    "woodcut",
    "etching",
    "aquatint",
    "pastels",
    "gouache",
    "acrylic",
    "oilpaint",
    "charcoal",
    "inkwash",
    "sumi",
    "sketchbook",
    "figurestudy",
    "croquis",
    "maquette",
    "installation",
    "performanceart",
    "videoart",
    "soundart",
    "mixedmedia",
    "assemblage",
    "foundobject",
    "curating",
    "vernissage",
    "retrospective",
    "triennial",
    "biennale",
    "artfair",
    "frieze",
    "artbasel",
    "tate",
    "moma",
    "guggenheim",
    "louvre",
    "rijksmuseum",
    "metmuseum",
    "smithsonian",
    "getty",
    "vam",
    "designmuseum",
    "cooperhewitt",
    "designweek",
    "fashionweek",
    "parisfashion",
    "milanfashion",
    "nyfw",
    "cfda",
    "vogue",
    "harpers",
    "elle",
    "gq",
    "billboard",
    "grammy",
    "tonys",
    "pulitzer",
    "booker",
    "nobelprize",
    "cannes",
    "sundance",
    "tiff",
    "berlinale",
    "venicefilm",
    "sxsw",
    "coachella",
    "lollapalooza",
    "bonnaroo",
    "glastonbury",
    "readingfestival",
    "primaverasound",
    "bandcamp",
    "soundcloud",
    "mixcloud",
    "discogs",
    "rateyourmusic",
    "genius",
    "azlyrics",
    "ultimateguitar",
    "imslp",
    "artsy",
    "saatchi",
    "artsy.net",
    "hyperallergic",
    "artnews",
    "artforum",
    "cacm",
    "cacm.org",
  ], [
    "documentar",
    "cinemat",
    "architect",
    "illustrat",
    "typograph",
    "aesthetic",
    "couture",
    "filmfest",
    "filmography",
    "soundtrack",
    "screenwrit",
    "draw",
    "paint",
    "sketch",
    "sculpt",
    "mural",
    "watercolor",
    "calligraph",
    "lettering",
    "storyboard",
    "choreograph",
    "illustrat",
    "handcraft",
    "papercraft",
    "printmak",
    "lithograph",
    "engrav",
    "embroid",
    "weav",
    "collag",
    "figuredraw",
    "lifedraw",
    "conceptart",
    "characterdesign",
    "streetart",
    "graffiti",
    "webcomic",
    "graphicnovel",
    "songwrit",
    "compos",
    "sounddesign",
    "artdirect",
    "productiondesign",
    "setdesign",
    "costume",
    "typeface",
    "fontdesign",
    "editorial",
    "lookbook",
    "fashionweek",
    "artfair",
    "retrospective",
    "installation",
    "performanceart",
    "mixedmedia",
    "vernissage",
    "triennial",
    "biennale",
    "museum",
    "gallery",
    "curat",
    "exhibit",
    "scenograph",
    "danc",
    "ballet",
    "orchestr",
    "symphon",
    "libretto",
    "overture",
    "remix",
    "masterclass",
    "letterpress",
    "screenprint",
    "risograph",
    "linocut",
    "woodcut",
    "etching",
    "aquatint",
    "gouache",
    "acrylic",
    "charcoal",
    "sketchbook",
    "atelier",
    "fineart",
    "contemporaryart",
    "artwork",
    "jewelry",
    "milliner",
    "tailor",
    "sewing",
    "patternmak",
    "bookclub",
    "readathon",
    "memoir",
    "anthology",
    "novella",
    "sonnet",
    "literary",
    "nonfiction",
    "poetry",
    "stanza",
    "narrative",
    "storytell",
    "filmmak",
    "screenplay",
    "soundtrack",
    "sounddesign",
    "fashion",
    "runway",
    "vogue",
    "broadway",
    "westend",
    "playwright",
    "dramaturg",
    "theatrical",
    "cinematograph",
    "animat",
    "storyboard",
    "characterdesign",
    "conceptdesign",
    "visualdevelop",
    "mattepaint",
    "texturepaint",
    "lightingartist",
    "layoutartist",
    "composit",
    "rotoscop",
    "motiongraphics",
    "titlesequence",
    "albumart",
    "coverart",
    "bandlogo",
    "merchdesign",
    "gigposter",
    "flyerdesign",
    "zine",
    "riso",
    "printshop",
    "bookbind",
    "letterpress",
  ]),
  topicRule(TOPIC_IDS.TECH, [
    "software",
    "hardware",
    "github",
    "gitlab",
    "bitbucket",
    "stackoverflow",
    "hackernews",
    "techcrunch",
    "verge",
    "wired",
    "arstechnica",
    "developer",
    "programmer",
    "kubernetes",
    "docker",
    "aws",
    "azure",
    "gcp",
    "cloudflare",
    "vercel",
    "netlify",
    "react",
    "vue",
    "angular",
    "nodejs",
    "python",
    "typescript",
    "javascript",
    "rustlang",
    "golang",
    "kernel",
    "compiler",
    "debugger",
    "devops",
    "microservice",
    "serverless",
    "database",
    "postgres",
    "mongodb",
    "redis",
    "websocket",
    "api",
    "sdk",
    "opensource",
    "startup",
    "venture",
    "silicon",
    "nvidia",
    "intel",
    "amd",
    "apple",
    "microsoft",
    "google",
    "openai",
    "anthropic",
    "chatgpt",
    "llm",
    "tensor",
    "pytorch",
    "tensorflow",
    "jupyter",
    "npm",
    "pypi",
    "codecademy",
    "leetcode",
    "hackerrank",
    "figma",
    "notion",
    "slack",
    "linear",
    "jira",
    "confluence",
    "hackathon",
    "graphql",
    "postgresql",
    "mysql",
    "sqlite",
    "webpack",
    "vite",
    "svelte",
    "nextjs",
    "nuxt",
    "remix",
    "tailwind",
    "bootstrap",
    "kotlin",
    "swiftlang",
    "swiftui",
    "xcode",
    "androidstudio",
    "gradle",
    "maven",
    "cmake",
    "llvm",
    "wasm",
    "webassembly",
    "oauth",
    "openid",
    "saml",
    "ldap",
    "terraform",
    "ansible",
    "pulumi",
    "pulumi",
    "circleci",
    "githubactions",
    "gitlabci",
    "jenkins",
    "travis",
    "codecov",
    "sentry",
    "datadog",
    "newrelic",
    "splunk",
    "elastic",
    "kibana",
    "grafana",
    "prometheus",
    "kafka",
    "rabbitmq",
    "nginx",
    "apache",
    "caddy",
    "traefik",
    "istio",
    "linkerd",
    "consul",
    "vault",
    "nomad",
    "pulumi",
    "supabase",
    "planetscale",
    "neon.tech",
    "railway",
    "render",
    "fly.io",
    "heroku",
    "digitalocean",
    "linode",
    "hetzner",
    "ovh",
    "cloudfront",
    "fastly",
    "akamai",
    "cloudinary",
    "imgix",
    "twilio",
    "sendgrid",
    "mailgun",
    "stripe",
    "plaid",
    "auth0",
    "okta",
    "clerk",
    "supabase",
    "firebase",
    "appwrite",
    "electron",
    "tauri",
    "qt",
    "gtk",
    "swiftui",
    "jetpack",
    "flutter",
    "dartlang",
    "reactnative",
    "expo",
    "ionic",
    "capacitor",
    "cordova",
    "opencv",
    "ffmpeg",
    "gstreamer",
    "webrtc",
    "socket.io",
    "prisma",
    "drizzle",
    "sequelize",
    "typeorm",
    "mongoose",
    "sqlalchemy",
    "django",
    "flask",
    "fastapi",
    "rails",
    "laravel",
    "symfony",
    "springboot",
    "aspnet",
    "dotnet",
    "csharp",
    "cplusplus",
    "cpp",
    "ziglang",
    "nimlang",
    "haskell",
    "scala",
    "clojure",
    "elixir",
    "erlang",
    "ocaml",
    "fsharp",
    "solidity",
    "hardhat",
    "truffle",
    "foundry",
    "ethers",
    "web3",
    "ipfs",
    "torproject",
    "wireshark",
    "mitmproxy",
    "burpsuite",
    "owasp",
    "cve",
    "cwe",
    "nist",
    "rsa",
    "ecc",
    "tls",
    "ssl",
    "https",
    "http2",
    "http3",
    "quic",
    "grpc",
    "protobuf",
    "capnproto",
    "flatbuffers",
    "msgpack",
    "avro",
    "parquet",
    "arrow",
    "duckdb",
    "snowflake",
    "databricks",
    "bigquery",
    "redshift",
    "synapse",
    "fabric",
    "powerbi",
    "tableau",
    "looker",
    "mode",
    "hex.tech",
    "huggingface",
    "cohere",
    "mistral",
    "ollama",
    "langchain",
    "llamaindex",
    "vector",
    "embedding",
    "tokenizer",
    "transformer",
    "attention",
    "diffusion",
    "stablediffusion",
    "midjourney",
    "dalle",
    "sora",
    "runwayml",
    "replicate",
    "modal",
    "ray.io",
    "spark",
    "flink",
    "beam",
    "airflow",
    "prefect",
    "dagster",
    "dbt",
    "snowplow",
    "segment",
    "amplitude",
    "mixpanel",
    "heap",
    "posthog",
    "launchdarkly",
    "split.io",
    "optimizely",
    "vwo",
    "browserstack",
    "lambdatest",
    "playwright",
    "cypress",
    "selenium",
    "puppeteer",
    "chromedriver",
    "webdriver",
    "jest",
    "mocha",
    "vitest",
    "pytest",
    "unittest",
    "integrationtest",
    "e2e",
    "openapi",
    "swagger",
    "postman",
    "insomnia",
    "hoppscotch",
    "grpcurl",
    "terraform",
    "pulumi",
    "crossplane",
    "argocd",
    "fluxcd",
    "spinnaker",
    "helm",
    "kustomize",
    "skaffold",
    "tilt",
    "devspace",
    "telepresence",
    "mirrord",
    "coder",
    "codespaces",
    "gitpod",
    "replit",
    "glitch",
    "stackblitz",
    "codesandbox",
    "jsfiddle",
    "codepen",
    "leetcode",
    "codewars",
    "exercism",
    "adventofcode",
    "projecteuler",
    "rosalind",
    "kaggle",
    "colab",
    "sagemaker",
    "vertexai",
    "bedrock",
    "azureml",
    "mlflow",
    "wandb",
    "neptune",
    "comet",
    "tensorboard",
    "jupyterhub",
    "voila",
    "streamlit",
    "gradio",
    "dash",
    "panel",
    "bokeh",
    "plotly",
    "matplotlib",
    "seaborn",
    "ggplot",
    "d3js",
    "threejs",
    "babylonjs",
    "pixijs",
    "phaser",
    "unity3d",
    "unrealengine",
    "godotengine",
    "bevyengine",
    "roblox",
    "minecraft",
    "steamdeck",
    "protondb",
    "lutris",
    "winehq",
    "qemu",
    "virtualbox",
    "vmware",
    "parallels",
    "hyperv",
    "xen",
    "proxmox",
    "nutanix",
    "openstack",
    "maas",
    "baremetal",
    "ipxe",
    "pxe",
    "tftp",
    "dhcp",
    "dns",
    "bind9",
    "powerdns",
    "coredns",
    "traefik",
    "envoy",
    "haproxy",
    "varnish",
    "squid",
    "memcached",
    "valkey",
    "hazelcast",
    "cassandra",
    "cockroach",
    "yugabyte",
    "tidb",
    "clickhouse",
    "timescale",
    "influxdb",
    "questdb",
    "prometheus",
    "thanos",
    "victoriametrics",
    "loki",
    "tempo",
    "opentelemetry",
    "opentracing",
    "jaeger",
    "zipkin",
    "skywalking",
    "signoz",
    "highlight",
    "logrocket",
    "fullstory",
    "hotjar",
    "clarity",
    "plausible",
    "fathom",
    "matomo",
    "umami",
    "simpleanalytics",
    "cloudflareworkers",
    "deno",
    "bun.sh",
    "nodejs",
    "iojs",
    "esm",
    "commonjs",
    "vitepress",
    "astro",
    "qwik",
    "solidjs",
    "preact",
    "htmx",
    "alpinejs",
    "lit.dev",
    "stencil",
    "emberjs",
    "backbone",
    "knockout",
    "jquery",
    "lodash",
    "underscore",
    "rxjs",
    "redux",
    "mobx",
    "zustand",
    "recoil",
    "jotai",
    "valtio",
    "xstate",
    "effect",
    "fpts",
    "ramda",
    "immutable",
    "immer",
    "swr",
    "reactquery",
    "tanstack",
    "urql",
    "relay",
    "apollo",
    "graphql",
    "hasura",
    "postgraphile",
    "supabase",
    "appwrite",
    "pocketbase",
    "directus",
    "strapi",
    "sanity",
    "contentful",
    "storyblok",
    "prismic",
    "ghost",
    "wordpress",
    "drupal",
    "joomla",
    "magento",
    "shopify",
    "woocommerce",
    "bigcommerce",
    "medusa",
    "saleor",
    "spree",
    "snipcart",
    "stripe",
    "paddle",
    "chargebee",
    "recurly",
    "braintree",
    "adyen",
    "checkout",
    "klarna",
    "affirm",
    "afterpay",
    "squareup",
    "toasttab",
    "clover",
    "lightspeed",
    "toast",
  ], [
    "javascript",
    "typescript",
    "kubernetes",
    "docker",
    "github",
    "gitlab",
    "frontend",
    "backend",
    "fullstack",
    "machinelearn",
    "deeplearn",
    "neural",
    "algorithm",
    "saas",
    "paas",
    "iaas",
    "devtools",
    "deploy",
    "compiler",
    "runtime",
    "framework",
    "library",
    "repository",
    "commit",
    "pullrequest",
    "opensource",
    "siliconvalley",
    "techcrunch",
    "stackoverflow",
    "microserv",
    "serverless",
    "kubernetes",
    "terraform",
    "ansible",
    "jenkins",
    "gitlab",
    "github",
    "bitbucket",
    "codebuild",
    "codepipeline",
    "circleci",
    "travis",
    "codecov",
    "eslint",
    "prettier",
    "webpack",
    "vite",
    "rollup",
    "esbuild",
    "swc",
    "babel",
    "typescript",
    "javascript",
    "nodejs",
    "deno",
    "bun",
    "graphql",
    "grpc",
    "protobuf",
    "websocket",
    "webrtc",
    "oauth",
    "openid",
    "kubernetes",
    "helm",
    "istio",
    "linkerd",
    "prometheus",
    "grafana",
    "loki",
    "tempo",
    "opentelemetry",
    "vector",
    "embedding",
    "tokenizer",
    "transformer",
    "diffusion",
    "langchain",
    "llamaindex",
    "huggingface",
    "pytorch",
    "tensorflow",
    "keras",
    "jax",
    "cuda",
    "rocblas",
    "webgpu",
    "shader",
    "glsl",
    "hlsl",
    "spirv",
    "vulkan",
    "directx",
    "opengl",
    "ffmpeg",
    "gstreamer",
    "opencv",
    "sqlite",
    "postgres",
    "mongodb",
    "redis",
    "kafka",
    "rabbitmq",
    "nginx",
    "apache",
    "cloudflare",
    "fastly",
    "akamai",
    "datadog",
    "newrelic",
    "splunk",
    "elastic",
    "snowflake",
    "databricks",
    "bigquery",
    "redshift",
    "dbt",
    "airflow",
    "prefect",
    "dagster",
    "streamlit",
    "jupyter",
    "colab",
    "sagemaker",
    "vertex",
    "bedrock",
    "lambda",
    "stepfunctions",
    "eventbridge",
    "sqs",
    "sns",
    "kinesis",
    "pubsub",
    "bigtable",
    "firestore",
    "dynamodb",
    "cosmosdb",
    "cassandra",
    "cockroach",
    "clickhouse",
    "timescale",
    "influxdb",
    "prisma",
    "sequelize",
    "typeorm",
    "mongoose",
    "rails",
    "django",
    "flask",
    "fastapi",
    "springboot",
    "dotnet",
    "aspnet",
    "kubernetes",
    "container",
    "virtualiz",
    "hypervisor",
    "qemu",
    "kubernetes",
    "orchestr",
    "scalability",
    "observability",
    "reliability",
    "chaoseng",
    "loadtest",
    "benchmark",
    "profil",
    "debugg",
    "refactor",
    "lint",
    "typescript",
    "javascript",
    "hackathon",
    "leetcode",
    "stackoverflow",
  ]),
  topicRule(TOPIC_IDS.HEALTH, [
    "health",
    "medical",
    "medicine",
    "doctor",
    "hospital",
    "clinic",
    "pharma",
    "therapy",
    "therapist",
    "psychology",
    "psychiatrist",
    "nutrition",
    "dietitian",
    "fitness",
    "workout",
    "gym",
    "cardio",
    "yoga",
    "meditation",
    "mindfulness",
    "sleep",
    "insomnia",
    "vaccine",
    "immunization",
    "cdc",
    "nih",
    "webmd",
    "mayoclinic",
    "calorie",
    "protein",
    "gluten",
    "vegan",
    "ketogenic",
    "mentalhealth",
    "depression",
    "anxiety",
    "ptsd",
    "addiction",
    "recovery",
    "telehealth",
    "myfitnesspal",
    "strava",
    "peloton",
    "headspace",
    "calm",
    "telemedicine",
    "physiotherapy",
    "physio",
    "acupuncture",
    "chiropractor",
    "orthopedic",
    "dermatitis",
    "allergy",
    "asthma",
    "diabetes",
    "cholesterol",
    "supplement",
    "vitamins",
    "probiotic",
    "fasting",
    "intermittent",
    "hydration",
    "macros",
    "micronutrient",
    "omega",
    "melatonin",
    "ibuprofen",
    "acetaminophen",
    "antibiotic",
    "antiviral",
    "antibody",
    "antigen",
    "pathogen",
    "immunology",
    "endocrinology",
    "gastroenterology",
    "urology",
    "gynecology",
    "obstetrics",
    "pediatrics",
    "geriatrics",
    "hospice",
    "palliative",
    "radiology",
    "mri",
    "ctscan",
    "ultrasound",
    "echocardiogram",
    "ekg",
    "bloodwork",
    "biopsy",
    "chemotherapy",
    "radiotherapy",
    "insulin",
    "metformin",
    "ssri",
    "benzodiazepine",
    "cognitive",
    "cbt",
    "dbt",
    "emdr",
    "mindfulness",
    "breathwork",
    "pilates",
    "barre",
    "crossfit",
    "hiit",
    "spinning",
    "rowing",
    "cycling",
    "running",
    "marathon",
    "halfmarathon",
    "5k",
    "10k",
    "ultra",
    "triathlon",
    "ironman",
    "whoop",
    "oura",
    "fitbit",
    "garmin",
    "applewatch",
    "noom",
    "weightwatchers",
    "whole30",
    "paleo",
    "macrobiotic",
    "plantbased",
    "nutritionist",
    "dietician",
    "sleepcycle",
    "sleeptracker",
    "cpap",
    "apnea",
    "snoring",
    "menopause",
    "testosterone",
    "estrogen",
    "progesterone",
    "thyroid",
    "cortisol",
    "inflammation",
    "autoimmune",
    "fibromyalgia",
    "migraine",
    "vertigo",
    "tinnitus",
    "eczema",
    "psoriasis",
    "rosacea",
    "acne",
    "sunscreen",
    "spf",
    "dermatology",
    "cosmetic",
    "botox",
    "filler",
    "medspa",
    "teletherapy",
    "betterhelp",
    "talkspace",
    "cerebral",
    "springhealth",
    "lyra",
    "ginger",
    "sanvello",
    "happify",
    "wakingup",
    "tenpercent",
    "insighttimer",
    "balance",
    "fabulous",
    "noisli",
    "endel",
  ], [
    "wellness",
    "biometric",
    "pharmaceut",
    "prescript",
    "symptom",
    "diagnos",
    "clinical",
    "patholog",
    "oncolog",
    "cardiolog",
    "dermatolog",
    "psychiatr",
    "therapeut",
    "rehabilitat",
    "nutrition",
    "metabol",
    "immune",
    "longevity",
    "telehealth",
    "telemed",
    "physiotherap",
    "chiropract",
    "orthoped",
    "dermatolog",
    "allerg",
    "asthm",
    "diabet",
    "cholesterol",
    "supplement",
    "probiotic",
    "ketogen",
    "intermittent",
    "hydrat",
    "micronutrient",
    "immuniz",
    "vaccin",
    "antidepress",
    "anxiolyt",
    "psychotherap",
    "cognitive",
    "mindfulness",
    "meditat",
    "breathwork",
    "pilates",
    "crossfit",
    "cardiovasc",
    "endocrin",
    "gastroenter",
    "urolog",
    "gynecolog",
    "obstetric",
    "pediatric",
    "radiolog",
    "biopsy",
    "chemotherap",
    "palliat",
    "insomnia",
    "sleepapnea",
    "menopause",
    "thyroid",
    "inflamm",
    "autoimmune",
    "migrain",
    "dermatitis",
    "eczema",
    "psoriasis",
    "teletherap",
    "mentalhealth",
    "wellbeing",
    "healthspan",
    "longevity",
  ]),
  topicRule(TOPIC_IDS.MONEY, [
    "finance",
    "financial",
    "banking",
    "investment",
    "investor",
    "trading",
    "trader",
    "portfolio",
    "stocks",
    "stock",
    "equity",
    "bond",
    "etf",
    "mutualfund",
    "dividend",
    "mortgage",
    "loan",
    "credit",
    "debit",
    "salary",
    "payroll",
    "invoice",
    "freelance",
    "linkedin",
    "indeed",
    "glassdoor",
    "economy",
    "gdp",
    "inflation",
    "recession",
    "fed",
    "federalreserve",
    "irs",
    "tax",
    "accounting",
    "bookkeeping",
    "ledger",
    "stripe",
    "paypal",
    "venmo",
    "coinbase",
    "binance",
    "crypto",
    "bitcoin",
    "ethereum",
    "realestate",
    "zillow",
    "redfin",
    "realtor",
    "401k",
    "roth",
    "ira",
    "pension",
    "venture",
    "valuation",
    "ipo",
    "earnings",
    "quarterly",
    "productivity",
    "okr",
    "kpi",
    "hiring",
    "recruiter",
    "resume",
    "interview",
    "layoff",
    "burnrate",
    "runway",
    "saas",
    "bloomberg",
    "wsj",
    "ft",
    "economist",
    "investopedia",
    "seekingalpha",
    "robinhood",
    "fidelity",
    "schwab",
    "etrade",
    "turbotax",
    "quickbooks",
    "xero",
    "freshbooks",
    "waveapps",
    "gusto",
    "rippling",
    "deel",
    "remote",
    "upwork",
    "fiverr",
    "toptal",
    "angellist",
    "ycombinator",
    "a16z",
    "sequoia",
    "benchmark",
    "kleiner",
    "greycroft",
    "firstround",
    "techstars",
    "500startups",
    "crowdfunding",
    "kickstarter",
    "indiegogo",
    "patreon",
    "substack",
    "onlyfans",
    "defi",
    "staking",
    "yield",
    "liquidity",
    "amm",
    "dex",
    "cex",
    "nft",
    "opensea",
    "rarible",
    "foundation",
    "manifold",
    "solana",
    "polygon",
    "avalanche",
    "cosmos",
    "chainlink",
    "uniswap",
    "aave",
    "compound",
    "makerdao",
    "sushiswap",
    "curve",
    "yearn",
    "lido",
    "rocketpool",
    "anchor",
    "celsius",
    "nexo",
    "blockfi",
    "grayscale",
    "microstrategy",
    "sp500",
    "nasdaq",
    "dowjones",
    "russell",
    "vanguard",
    "blackrock",
    "ishares",
    "spdr",
    "arkinvest",
    "moodys",
    "spglobal",
    "fitch",
    "dunbradstreet",
    "experian",
    "equifax",
    "transunion",
    "creditkarma",
    "nerdwallet",
    "bankrate",
    "lendingtree",
    "sofi",
    "chime",
    "revolut",
    "wise",
    "n26",
    "monzo",
    "starling",
    "marcus",
    "allybank",
    "capitalone",
    "chase",
    "citi",
    "wellsfargo",
    "bofa",
    "goldmansachs",
    "morganstanley",
    "jpmorgan",
    "ubs",
    "credit",
    "debit",
    "amortization",
    "refinance",
    "underwriting",
    "escrow",
    "appraisal",
    "hoa",
    "condo",
    "townhouse",
    "duplex",
    "foreclosure",
    "shortsale",
    "caprate",
    "noi",
    "irr",
    "npv",
    "dcf",
    "lbo",
    "merger",
    "acquisition",
    "buyout",
    "rollup",
    "spinoff",
    "divestiture",
    "synergy",
    "headcount",
    "riff",
    "downsizing",
    "restructuring",
    "severance",
    "bonus",
    "commission",
    "equitycomp",
    "rsu",
    "espp",
    "vesting",
    "cliff",
    "cfo",
    "coo",
    "ceo",
    "boardroom",
    "shareholder",
    "proxy",
    "10k",
    "10q",
    "8k",
    "s1",
    "prospectus",
    "roadshow",
    "greenshoe",
    "lockup",
    "spac",
    "debt",
    "covenant",
    "leverage",
    "ebitda",
    "capex",
    "opex",
    "burn",
    "runway",
  ], [
    "financ",
    "bankrupt",
    "underwrit",
    "mortgage",
    "refinanc",
    "cryptocurr",
    "blockchain",
    "venturecap",
    "sharehold",
    "quarterly",
    "revenue",
    "profit",
    "cashflow",
    "bookkeep",
    "accountant",
    "payroll",
    "recruit",
    "career",
    "workplace",
    "productivity",
    "invest",
    "trading",
    "portfolio",
    "valuation",
    "liquidity",
    "underwrit",
    "amortiz",
    "refinanc",
    "foreclos",
    "recession",
    "inflation",
    "interestrate",
    "monetary",
    "fiscal",
    "budget",
    "deficit",
    "surplus",
    "treasury",
    "dividend",
    "buyback",
    "merger",
    "acquisit",
    "layoff",
    "severance",
    "vesting",
    "equitycomp",
    "cryptostak",
    "defi",
    "nft",
    "realestate",
    "commercialre",
    "multifamily",
    "proptech",
    "fintech",
    "insurtech",
    "regtech",
    "wealthtech",
    "robo",
    "advisor",
    "brokerage",
    "custodian",
    "clearinghouse",
    "settlement",
    "counterparty",
    "derivative",
    "optionstrad",
    "futurestrad",
    "forex",
    "commodit",
  ]),
  topicRule(TOPIC_IDS.SCIENCE, [
    "science",
    "research",
    "researcher",
    "paper",
    "journal",
    "arxiv",
    "nature",
    "sciencemag",
    "lancet",
    "cell",
    "neuron",
    "physics",
    "chemistry",
    "biology",
    "genetics",
    "genome",
    "climate",
    "warming",
    "carbon",
    "emission",
    "nasa",
    "spacex",
    "telescope",
    "cosmology",
    "philosophy",
    "epistemology",
    "psychology",
    "cognitive",
    "neuroscience",
    "experiment",
    "hypothesis",
    "peerreview",
    "university",
    "academic",
    "scholar",
    "dissertation",
    "thesis",
    "laboratory",
    "mit",
    "stanford",
    "caltech",
    "oxford",
    "cambridge",
    "ieee",
    "acm",
    "plos",
    "biorxiv",
    "medrxiv",
    "pubmed",
    "researchgate",
    "springer",
    "elsevier",
    "wiley",
    "sciencedirect",
    "jstor",
    "ssrn",
    "zenodo",
    "figshare",
    "dryad",
    "protocols",
    "benchling",
    "labarchive",
    "openwetware",
    "igem",
    "crispr",
    "sequencing",
    "proteomics",
    "metabolomics",
    "transcriptomics",
    "bioinformatics",
    "phylogeny",
    "taxonomy",
    "speciation",
    "evolution",
    "naturalselection",
    "paleontology",
    "fossil",
    "geochemistry",
    "petrology",
    "mineralogy",
    "seismology",
    "tectonics",
    "magnetosphere",
    "heliophysics",
    "astrophysics",
    "particle",
    "collider",
    "hadron",
    "boson",
    "fermion",
    "superconductor",
    "cryogenics",
    "thermodynamics",
    "entropy",
    "enthalpy",
    "kinetics",
    "catalysis",
    "reaction",
    "stoichiometry",
    "spectroscopy",
    "chromatography",
    "centrifuge",
    "microscope",
    "electronmicroscopy",
    "cryoem",
    "xray",
    "crystallography",
    "diffraction",
    "topology",
    "manifold",
    "homology",
    "cohomology",
    "categorytheory",
    "logic",
    "proof",
    "theorem",
    "lemma",
    "axiom",
    "ontology",
    "phenomenology",
    "existentialism",
    "utilitarianism",
    "deontology",
    "virtueethics",
    "metaphysics",
    "epistemology",
    "consciousness",
    "qualia",
    "determinism",
    "compatibilism",
    "bayesian",
    "frequentist",
    "pvalue",
    "confidenceinterval",
    "regression",
    "causality",
    "randomized",
    "doubleblind",
    "placebo",
    "metaanalysis",
    "systematicreview",
    "replicationcrisis",
    "openscience",
    "preregister",
    "osf",
    "cogr",
    "datacite",
    "orcid",
    "crossref",
    "doaj",
    "hal",
    "europepmc",
    "inspec",
    "scopus",
    "webofscience",
    "googlescholar",
    "semantic",
    "scholar",
    "planetarium",
    "observatory",
    "hubble",
    "jameswebb",
    "jwst",
    "ligo",
    "virgo",
    "icecube",
    "km3net",
    "darkmatter",
    "darkenergy",
    "inflationary",
    "bigbang",
    "cmb",
    "redshift",
    "exoplanet",
    "habitablezone",
    "biosignature",
    "astrobiology",
    "panspermia",
    "abiogenesis",
    "rna",
    "dna",
    "mrna",
    "trna",
    "rrna",
    "polymerase",
    "ribosome",
    "mitochondria",
    "chloroplast",
    "photosynthesis",
    "respiration",
    "homeostasis",
    "ecology",
    "conservation",
    "rewilding",
    "biodiversity",
    "extinction",
    "invasive",
    "keystone",
    "trophic",
    "biome",
    "wetland",
    "peatland",
    "permafrost",
    "albedo",
    "geoengineering",
    "ipcc",
    "cop",
    "parisagreement",
    "netzero",
    "decarbon",
    "lifecycle",
    "lca",
  ], [
    "scientif",
    "research",
    "hypothes",
    "experiment",
    "empirical",
    "statistic",
    "astro",
    "quantum",
    "molecular",
    "ecosystem",
    "biodivers",
    "anthropocene",
    "philosoph",
    "epistem",
    "metaphys",
    "psycholog",
    "cognition",
    "neurosci",
    "climatology",
    "oceanograph",
    "geology",
    "seism",
    "arxiv",
    "peerreview",
    "dissertat",
    "hypothes",
    "replicat",
    "metaanalys",
    "randomized",
    "doubleblind",
    "placebo",
    "bayesian",
    "regression",
    "causal",
    "astrophys",
    "cosmolog",
    "telescop",
    "spectroscop",
    "crystallograph",
    "sequenc",
    "genom",
    "proteom",
    "transcriptom",
    "bioinformat",
    "phylogen",
    "taxonom",
    "evolution",
    "paleont",
    "geochem",
    "tectonic",
    "seismolog",
    "particlephys",
    "collider",
    "superconduct",
    "thermodynam",
    "catalys",
    "chromatograph",
    "microscop",
    "cryoem",
    "topology",
    "categorytheor",
    "ontology",
    "phenomenolog",
    "conscious",
    "epistemolog",
    "climat",
    "decarbon",
    "lifecycle",
    "biosignatur",
    "exoplanet",
    "darkmatter",
    "darkenergy",
    "astrobiolog",
    "photosynth",
    "mitochond",
    "homeostas",
    "conservation",
    "rewild",
    "invasive",
    "keystone",
    "trophic",
    "geoengineer",
    "netzero",
    "emission",
  ]),
  topicRule(TOPIC_IDS.SOCIAL, [
    "reddit",
    "subreddit",
    "twitter",
    "tweet",
    "xcom",
    "instagram",
    "tiktok",
    "snapchat",
    "pinterest",
    "tumblr",
    "discord",
    "twitch",
    "streamer",
    "influencer",
    "followers",
    "following",
    "viral",
    "meme",
    "drama",
    "threads",
    "mastodon",
    "bluesky",
    "facebook",
    "meta",
    "youtube",
    "youtuber",
    "likes",
    "comments",
    "subscribers",
    "algorithmfeed",
    "doomscroll",
    "timeline",
    "hashtag",
    "tiktokshop",
    "whatsapp",
    "telegram",
    "signal",
    "wechat",
    "lineapp",
    "messenger",
    "snap",
    "beReal",
    "bereal",
    "clubhouse",
    "lemon8",
    "parler",
    "gab",
    "gettr",
    "hive",
    "cohost",
    "repost",
    "reels",
    "shorts",
    "fyp",
    "forupage",
    "duet",
    "stitch",
    "clapback",
    "cancel",
    "canceled",
    "fandom",
    "shipping",
    "headcanon",
    "fanfic",
    "ao3",
    "archiveofourown",
    "tumblr",
    "livejournal",
    "dreamwidth",
    "spacehey",
    "myspace",
    "friendster",
    "hi5",
    "orkut",
    "googleplus",
    "google+",
    "vine",
    "musically",
    "likee",
    "kwai",
    "triller",
    "byte",
    "peach",
    "poparazzi",
    "dispo",
    "locket",
    "bebo",
    "xanga",
    "formspring",
    "askfm",
    "curiouscat",
    "tinder",
    "bumble",
    "hinge",
    "okcupid",
    "match",
    "grindr",
    "scruff",
    "herapp",
    "feeld",
    "raya",
    "clapper",
    "rumble",
    "bitchute",
    "odysee",
    "lbry",
    "mastodon",
    "fediverse",
    "activitypub",
    "nostr",
    "damus",
    "amethyst",
    "irc",
    "zoom",
    "meet",
    "webex",
    "skype",
    "facetime",
    "houseparty",
    "bonfire",
    "yubo",
    "wizz",
    "yik",
    "yikyak",
    "nextdoor",
    "citizen",
    "ring",
    "neighbors",
    "comments",
    "dms",
    "dm",
    "sliding",
    "replyguy",
    "reply",
    "mentions",
    "notifications",
    "mutuals",
    "moots",
    "oomf",
    "main",
    "alt",
    "finsta",
    "spam",
    "spamaccount",
    "priv",
    "private",
    "locked",
    "verified",
    "bluecheck",
    "parody",
    "satire",
    "shitpost",
    "shitposting",
    "copypasta",
    "pasta",
    "greentext",
    "tendies",
    "based",
    "cringe",
    "cursed",
    "blessed",
    "sus",
    "simp",
    "stan",
    "goated",
    "mid",
    "slay",
    "maincharacter",
    "npc",
    "touchgrass",
    "terminally",
    "chronically",
    "online",
    "terminallyonline",
    "chronicallyonline",
    "doomer",
    "doomscrolling",
    "brainrot",
    "corecore",
    "nichetok",
    "tiktokmademebuyit",
    "haul",
    "unboxing",
    "grwm",
    "ootd",
    "fitcheck",
    "thirst",
    "thirsttrap",
    "parasocial",
    "parasocialrelationship",
    "cancelculture",
    "callout",
    "calloutpost",
    "dramaalert",
    "keemstar",
    "tea",
    "spill",
    "spillthetea",
    "gossip",
    "gossipgirl",
    "deuxmoi",
    "blinditem",
    "blinds",
    "paparazzi",
    "papped",
    "leak",
    "leaked",
    "screenshot",
    "screenrecording",
    "crop",
    "screenshots",
    "ratioed",
    "quote",
    "qrt",
    "subtweet",
    "sneak",
    "sneakylink",
    "linkinbio",
    "linktree",
    "carrd",
    "beacons",
    "koji",
  ], [
    "subreddit",
    "redditor",
    "retweet",
    "influencer",
    "follower",
    "virality",
    "memetic",
    "doomscroll",
    "timeline",
    "hashtag",
    "tiktok",
    "instagram",
    "snapchat",
    "discord",
    "twitch",
    "streamer",
    "youtube",
    "mastodon",
    "bluesky",
    "fediverse",
    "activitypub",
    "nostr",
    "shitpost",
    "copypasta",
    "greentext",
    "parasocial",
    "doomscroll",
    "brainrot",
    "fandom",
    "fanfic",
    "unboxing",
    "grwm",
    "thirsttrap",
    "cancelculture",
    "gossip",
    "subtweet",
    "quote",
    "retweet",
    "viral",
    "meme",
    "drama",
    "replyguy",
    "notifications",
    "algorithm",
    "forupage",
    "fyp",
    "reels",
    "shorts",
    "stories",
    "livestream",
    "vlog",
    "clout",
    "engagement",
    "impressions",
    "reach",
    "influencer",
    "contentcreator",
    "creator",
    "ugc",
    "branddeal",
    "sponsorship",
    "affiliate",
    "linkinbio",
    "linktree",
  ]),
  topicRule(TOPIC_IDS.PERSONAL, [
    "restaurant",
    "cafe",
    "coffee",
    "bakery",
    "brewery",
    "bar",
    "bistro",
    "menu",
    "reservation",
    "yelp",
    "opentable",
    "doordash",
    "ubereats",
    "grubhub",
    "instacart",
    "recipe",
    "cooking",
    "neighborhood",
    "local",
    "nearby",
    "parking",
    "metro",
    "subway",
    "transit",
    "airbnb",
    "hotel",
    "flight",
    "airline",
    "itinerary",
    "wedding",
    "birthday",
    "party",
    "eventbrite",
    "ticketmaster",
    "meetup",
    "family",
    "friends",
    "weekend",
    "grocery",
    "farmersmarket",
    "dogpark",
    "zillow",
    "apartment",
    "lease",
    "roommate",
    "moving",
    "neighborhood",
  ], [
    "restaurant",
    "cafeteria",
    "brunch",
    "reservation",
    "delivery",
    "takeout",
    "neighborhood",
    "commute",
    "itinerary",
    "birthday",
    "wedding",
    "anniversary",
    "roommate",
    "landlord",
    "lease",
    "apartment",
    "condo",
    "neighborhood",
    "grocery",
    "farmers",
  ]),
];

/**
 * @param {string} raw
 */
function topicForWord(raw) {
  const w = String(raw || "").toLowerCase();
  if (!w) return TOPIC_IDS.OTHER;
  for (let r = 0; r < TOPIC_RULES.length; r++) {
    const rule = TOPIC_RULES[r];
    if (rule.exact.has(w)) return rule.id;
    for (let s = 0; s < rule.stems.length; s++) {
      const stem = rule.stems[s];
      if (stem.length <= 3) {
        if (w === stem) return rule.id;
      } else if (w.includes(stem)) {
        return rule.id;
      }
    }
  }
  return TOPIC_IDS.OTHER;
}

/** Mosaic tile font weight. */
const LAYOUT_TEXT_WEIGHT = 500;

let live = false;
let capture;
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
  drawLetterboxedMirrorVideoToCtx(ctx, capture.elt, width, height, LIVE_SIDE_PANEL_RESERVE, LIVE_SIDE_PANEL_RESERVE);
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

function buildLayout() {
  layout = [];
  if (!live || !capture || !capture.elt) return;
  const vw = capture.elt.videoWidth;
  const vh = capture.elt.videoHeight;
  if (!vw || !vh || width < 32) return;

  ensureComp();
  const g = comp;
  g.textAlign(LEFT, BASELINE);

  const { ox, oy, dw, dh } = letterboxRectWithSideInsets(
    vw,
    vh,
    width,
    height,
    LIVE_SIDE_PANEL_RESERVE,
    LIVE_SIDE_PANEL_RESERVE,
  );
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
  const sorted = Object.entries(wordMap).sort((a, b) => a[0].localeCompare(b[0]));
  let entries = sorted;
  if (continuousShuffleOn) {
    entries = sorted.slice();
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = entries[i];
      entries[i] = entries[j];
      entries[j] = t;
    }
  }

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
    const topicId = topicForWord(word);
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
    setHistoryStatus("Add a history file or pasted text before starting the camera.", "err");
    return;
  }
  live = true;

  const landing = document.getElementById("landing");
  if (landing) landing.style.display = "none";
  document.body.classList.add("portrait-mode");

  const dietPanel = document.getElementById("diet-title-panel");
  if (dietPanel) dietPanel.hidden = false;
  setDownloadButtonsEnabled(true);

  pixelDensity(1);
  resizeCanvas(windowWidth, windowHeight);
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
    const rebuild = () => buildLayout();
    v.addEventListener("loadeddata", play, { once: true });
    v.addEventListener("canplay", play, { once: true });
    v.addEventListener("loadeddata", rebuild, { once: true });
    play();
  } catch (e) {
    /* camera blocked */
  }

  setTimeout(buildLayout, 400);

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
    buildLayout();
  })();
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
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
}

function windowResized() {
  pixelDensity(1);
  if (live) {
    resizeCanvas(windowWidth, windowHeight);
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
    buildLayout();
  }
  if (layout.length === 0) buildLayout();

  maybeContinuousShuffleFromDraw();

  ensureComp();

  const { ox, oy, dw, dh } = letterboxRectWithSideInsets(
    vw,
    vh,
    width,
    height,
    LIVE_SIDE_PANEL_RESERVE,
    LIVE_SIDE_PANEL_RESERVE,
  );
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
