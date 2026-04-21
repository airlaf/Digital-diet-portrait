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

const HAVE_METADATA = typeof HTMLMediaElement !== "undefined" ? HTMLMediaElement.HAVE_METADATA : 1;

const WORD_GAP_X = 10;
const LINE_GAP_Y = 8;
const INNER_PAD = 6;
const BLOCK_PAD = 2;
const BLOCK_RADIUS = 6;
const LETTERBOX_LUM_SKIP = 10;

let live = false;
let capture;
let comp;
let layout = [];
let lastVw = 0;
let lastVh = 0;

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function letterboxRect(vw, vh, cw, ch) {
  const s = min(cw / vw, ch / vh);
  const dw = vw * s;
  const dh = vh * s;
  const ox = (cw - dw) * 0.5;
  const oy = (ch - dh) * 0.5;
  return { ox, oy, dw, dh };
}

function normFreq(count, minC, maxC) {
  if (maxC <= minC) return 1;
  return (count - minC) / (maxC - minC);
}

function ensureComp() {
  if (!comp || comp.width !== width || comp.height !== height) {
    comp = createGraphics(width, height);
    // Match logical coords to pixels[] stride (defaults to 2 on HiDPI and breaks manual sampling).
    comp.pixelDensity(1);
  }
}

function avgLumInRect(px, pw, ph, ax0, ay0, ax1, ay1) {
  const rx0 = min(ax0, ax1);
  const rx1 = max(ax0, ax1);
  const ry0 = min(ay0, ay1);
  const ry1 = max(ay0, ay1);
  const x0 = constrain(floor(rx0), 0, pw - 1);
  const x1 = constrain(ceil(rx1), 0, pw - 1);
  const y0 = constrain(floor(ry0), 0, ph - 1);
  const y1 = constrain(ceil(ry1), 0, ph - 1);
  let sum = 0;
  let n = 0;
  const area = (x1 - x0 + 1) * (y1 - y0 + 1);
  const step = max(1, floor(area / 140));
  for (let y = y0; y <= y1; y += step) {
    for (let x = x0; x <= x1; x += step) {
      const i = 4 * (y * pw + x);
      sum += luminance(px[i], px[i + 1], px[i + 2]);
      n++;
    }
  }
  return n ? sum / n : 0;
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
  g.textFont(textFont());

  const { ox, oy, dw, dh } = letterboxRect(vw, vh, width, height);
  const box = {
    minX: ox + INNER_PAD,
    minY: oy + INNER_PAD,
    maxX: ox + dw - INNER_PAD,
    maxY: oy + dh - INNER_PAD,
  };
  if (box.maxX - box.minX < 40 || box.maxY - box.minY < 40) return;

  const entries = Object.entries(WORD_FREQ).sort((a, b) => b[1] - a[1]);
  const counts = entries.map((e) => e[1]);
  const minC = min(...counts);
  const maxC = max(...counts);

  let rowH = 14;
  let x = box.minX;
  let y = box.minY;
  let wi = 0;
  let placed = 0;
  let safety = 0;

  while (y < box.maxY && placed < 8000 && safety < 90000) {
    safety++;
    const [word, count] = entries[wi % entries.length];
    wi++;
    const t = normFreq(count, minC, maxC);
    const fontSize = lerp(10, 22, t);
    g.textSize(fontSize);
    const tw = max(g.textWidth(word), 4);
    const th = g.textAscent() + g.textDescent();
    const ascent = g.textAscent();
    rowH = max(rowH, th + LINE_GAP_Y);

    if (x + tw > box.maxX) {
      x = box.minX;
      y += rowH;
      rowH = 14;
      continue;
    }

    layout.push({ word, x, y, w: tw, h: th, ascent, t });
    placed++;
    x += tw + WORD_GAP_X;
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
  live = true;

  const landing = document.getElementById("landing");
  if (landing) landing.style.display = "none";
  document.body.classList.add("portrait-mode");

  pixelDensity(1);
  resizeCanvas(windowWidth, windowHeight);
  textFont("monospace");
  textAlign(LEFT, BASELINE);

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

  void (async () => {
    try {
      await Promise.race([
        document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
      if (document.fonts && document.fonts.load) {
        await document.fonts.load('400 16px "IBM Plex Mono"');
      }
      textFont("IBM Plex Mono");
    } catch (e) {
      textFont("monospace");
    }
    buildLayout();
  })();
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  const btn = document.getElementById("start-camera");
  if (btn) btn.addEventListener("click", startLive);
}

function windowResized() {
  pixelDensity(1);
  resizeCanvas(windowWidth, windowHeight);
  if (live) buildLayout();
}

function syncFontToComp() {
  comp.textFont(textFont());
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
  if (vw !== lastVw || vh !== lastVh) buildLayout();
  if (layout.length === 0) buildLayout();

  ensureComp();
  const { ox, oy, dw, dh } = letterboxRect(vw, vh, width, height);

  comp.background(0);
  comp.image(capture, ox, oy, dw, dh);
  comp.loadPixels();
  const px = comp.pixels;
  const pw = comp.width;
  const ph = comp.height;

  const lums = [];
  for (let i = 0; i < layout.length; i++) {
    const it = layout[i];
    const x0 = it.x - BLOCK_PAD;
    const y0 = it.y - it.ascent - BLOCK_PAD;
    const x1 = it.x + it.w + BLOCK_PAD;
    const y1 = it.y - it.ascent + it.h + BLOCK_PAD;
    lums.push(avgLumInRect(px, pw, ph, x0, y0, x1, y1));
  }

  let lo = 255;
  let hi = 0;
  for (let i = 0; i < lums.length; i++) {
    if (lums[i] <= LETTERBOX_LUM_SKIP) continue;
    lo = min(lo, lums[i]);
    hi = max(hi, lums[i]);
  }
  if (hi - lo < 6) {
    lo = 0;
    hi = 255;
  }

  comp.push();
  comp.colorMode(HSB, 360, 100, 100, 1);
  comp.rectMode(CORNER);
  comp.noStroke();
  comp.textAlign(LEFT, BASELINE);
  syncFontToComp();

  for (let i = 0; i < layout.length; i++) {
    const it = layout[i];
    const lum = lums[i];
    if (lum <= LETTERBOX_LUM_SKIP) continue;

    const n = constrain(tNorm(lum, lo, hi), 0, 1);
    const sat = lerp(6, 42, n);
    const bri = lerp(94, 26, n);
    comp.fill(220, sat, bri);
    comp.rect(it.x - BLOCK_PAD, it.y - it.ascent - BLOCK_PAD, it.w + BLOCK_PAD * 2, it.h + BLOCK_PAD * 2, BLOCK_RADIUS);

    const textB = lerp(98, 22, n);
    comp.fill(0, 0, textB);
    comp.textSize(lerp(10, 22, it.t));
    comp.text(it.word, it.x, it.y);
  }

  comp.pop();
  comp.colorMode(RGB, 255, 255, 255, 1);

  push();
  translate(width, 0);
  scale(-1, 1);
  image(comp, 0, 0);
  pop();
}

function tNorm(v, a, b) {
  if (b <= a) return 0.5;
  return (v - a) / (b - a);
}
