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

const BLOCK_GRAY_DARK = 32;
const BLOCK_GRAY_LIGHT = 86;
const TEXT_GRAY = 228;
const OVERLAY_ALPHA = 120;

const HAVE_METADATA = typeof HTMLMediaElement !== "undefined" ? HTMLMediaElement.HAVE_METADATA : 1;

let live = false;
let capture;
let layout = [];
let box = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

const BLOCK_RADIUS = 6;
const WORD_GAP_X = 10;
const LINE_GAP_Y = 8;
const MARGIN = 40;

function blockGray(t) {
  const u = constrain(t, 0, 1);
  return lerpColor(color(BLOCK_GRAY_DARK), color(BLOCK_GRAY_LIGHT), u);
}

function normFreq(count, minC, maxC) {
  if (maxC <= minC) return 1;
  return (count - minC) / (maxC - minC);
}

function buildLayout() {
  layout = [];
  if (!live || width < 32) return;

  box = {
    minX: MARGIN,
    minY: MARGIN,
    maxX: width - MARGIN,
    maxY: height - MARGIN,
  };

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

  while (y < box.maxY && placed < 6000 && safety < 70000) {
    safety++;
    const [word, count] = entries[wi % entries.length];
    wi++;
    const t = normFreq(count, minC, maxC);
    const fontSize = lerp(10, 22, t);
    textSize(fontSize);
    const tw = max(textWidth(word), 4);
    const th = textAscent() + textDescent();
    const ascent = textAscent();
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
    v.addEventListener("loadeddata", play, { once: true });
    v.addEventListener("canplay", play, { once: true });
    v.addEventListener("loadeddata", () => buildLayout(), { once: true });
    play();
  } catch (e) {
    /* camera blocked */
  }

  buildLayout();

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
    if (live) buildLayout();
  })();

  setTimeout(() => {
    if (live) buildLayout();
  }, 400);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  const btn = document.getElementById("start-camera");
  if (btn) btn.addEventListener("click", startLive);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (live) buildLayout();
}

function draw() {
  if (!live) {
    background(10, 10, 10);
    return;
  }

  if (videoCanDraw()) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(capture, 0, 0, width, height);
    pop();
  } else {
    background(18, 18, 18);
  }

  fill(8, 8, 8, OVERLAY_ALPHA);
  noStroke();
  rect(0, 0, width, height);

  textAlign(LEFT, BASELINE);

  for (const item of layout) {
    textSize(lerp(10, 22, item.t));
    const yDraw = item.y;
    const pad = 2;
    fill(blockGray(item.t));
    noStroke();
    rect(
      item.x - pad,
      yDraw - item.ascent - pad,
      item.w + pad * 2,
      item.h + pad * 2,
      BLOCK_RADIUS,
      BLOCK_RADIUS,
      BLOCK_RADIUS,
      BLOCK_RADIUS
    );
    fill(TEXT_GRAY);
    text(item.word, item.x, yDraw);
  }
}
