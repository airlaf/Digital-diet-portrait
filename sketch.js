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

/** Flush mosaic: no gutter between tiles; inset keeps type off tile edges. */
const BLOCK_GAP = 0;
/** Padding inside each colored tile (text sits inset from the sampled region). */
const TEXT_INSET = 6;
const BLOCK_RADIUS = 3;
const TILE_STROKE_RGB = [22, 22, 26];
const TILE_STROKE_ALPHA = 72;
const LETTERBOX_LUM_SKIP = 10;

const FONT_SIZE = 14;
const WEIGHT_MIN = 400;
const WEIGHT_MAX = 700;

let live = false;
let capture;
let comp;
let layout = [];
let lastVw = 0;
let lastVh = 0;

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
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

/** Map frequency 0..1 → CSS font weight (higher count = bolder). */
function weightFromT(t) {
  return round(lerp(WEIGHT_MIN, WEIGHT_MAX, constrain(t, 0, 1)));
}

function applyGeistWeight(gfx, weight, sizePx) {
  gfx.textFont(textFont());
  gfx.textSize(sizePx);
  gfx.drawingContext.font = `${weight} ${sizePx}px "Geist Mono", monospace`;
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

  const box = { minX: 0, minY: 0, maxX: width, maxY: height };
  if (box.maxX < 40 || box.maxY < 40) return;

  const left0 = box.minX + TEXT_INSET;
  const top0 = box.minY + TEXT_INSET;

  const entries = Object.entries(WORD_FREQ).sort((a, b) => b[1] - a[1]);
  const counts = entries.map((e) => e[1]);
  const minC = min(...counts);
  const maxC = max(...counts);

  let rowTop = top0;
  let rowMaxTh = 0;
  let x = left0;
  let wi = 0;
  let placed = 0;
  let safety = 0;

  while (rowTop < box.maxY && placed < 8000 && safety < 90000) {
    safety++;
    const [word, count] = entries[wi % entries.length];
    const t = normFreq(count, minC, maxC);
    const weight = weightFromT(t);
    applyGeistWeight(g, weight, FONT_SIZE);
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
    layout.push({ word, x, y: baselineY, w: tw, h: th, ascent, t, weight });
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
        const px = `${FONT_SIZE}px`;
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
  const btn = document.getElementById("start-camera");
  if (btn) btn.addEventListener("click", startLive);
}

function windowResized() {
  pixelDensity(1);
  resizeCanvas(windowWidth, windowHeight);
  if (live) buildLayout();
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

  comp.background(0);
  // Stretch + mirror the feed to the full canvas (aspect distortion); text stays unmirrored.
  comp.push();
  comp.translate(width, 0);
  comp.scale(-1, 1);
  comp.image(capture, 0, 0, width, height);
  comp.pop();
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

  for (let i = 0; i < layout.length; i++) {
    const it = layout[i];
    const s = samples[i];
    if (s.lum <= LETTERBOX_LUM_SKIP) continue;

    comp.fill(s.r, s.g, s.b);
    comp.stroke(TILE_STROKE_RGB[0], TILE_STROKE_RGB[1], TILE_STROKE_RGB[2], TILE_STROKE_ALPHA);
    comp.rect(it.x - TEXT_INSET, it.y - it.ascent - TEXT_INSET, it.w + 2 * TEXT_INSET, it.h + 2 * TEXT_INSET, BLOCK_RADIUS);

    comp.noStroke();
    if (s.lum > 138) {
      comp.fill(22, 22, 24);
    } else {
      comp.fill(244, 242, 238);
    }
    applyGeistWeight(comp, it.weight, FONT_SIZE);
    comp.text(it.word, it.x, it.y);
  }

  comp.pop();

  image(comp, 0, 0);
}
