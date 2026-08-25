const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');
const GIFEncoder = require('gif-encoder-2');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'demo');
const OUT_FILE = path.join(OUT_DIR, 'pet-finds-lead.gif');
const WIDTH = 460;
const HEIGHT = 560;
const FRAME_COUNT = 44;
const FRAME_DELAY_CS = 8;
const petFrameDataUrls = new Map();

function imageDataUrl(filePath) {
  if (!petFrameDataUrls.has(filePath)) {
    const data = fs.readFileSync(filePath).toString('base64');
    petFrameDataUrls.set(filePath, `data:image/png;base64,${data}`);
  }
  return petFrameDataUrls.get(filePath);
}

function makeGif(frames) {
  const encoder = new GIFEncoder(WIDTH, HEIGHT, 'neuquant', true);
  encoder.setRepeat(0);
  encoder.setDelay(FRAME_DELAY_CS * 10);
  encoder.setQuality(12);
  encoder.start();
  frames.forEach((frame) => encoder.addFrame(frame));
  encoder.finish();
  return encoder.out.getData();
}

function frameHtml(index) {
  const t = index / (FRAME_COUNT - 1);
  const intro = Math.min(1, Math.max(0, (t - 0.45) / 0.22));
  const cardY = Math.round(92 - (1 - intro) * 34);
  const cardOpacity = intro.toFixed(3);
  const noticeOpacity = Math.min(1, Math.max(0, (t - 0.34) / 0.16)).toFixed(3);
  const petPhase = index % 4;
  const petFrame = `assets/teiguo/walk/walk_${String(petPhase + 1).padStart(3, '0')}.png`;
  const petUrl = imageDataUrl(path.join(ROOT, petFrame));
  const x = t < 0.44
    ? 54 + Math.sin(t * Math.PI * 2.1) * 78
    : 214 + Math.sin(t * Math.PI * 3) * 8;
  const flip = t < 0.22 || (t > 0.34 && t < 0.44) ? 'scaleX(-1)' : 'scaleX(1)';
  const petScale = t < 0.45 ? 0.72 : 0.78;
  const petY = t < 0.45 ? 400 : 438;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    background: #0e1319;
    font-family: Arial, Helvetica, sans-serif;
  }
  .stage {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    background:
      radial-gradient(circle at 50% 80%, rgba(239, 223, 196, .16), transparent 34%),
      #0e1319;
  }
  .notice {
    position: absolute;
    left: 30px;
    top: 40px;
    width: 400px;
    padding: 11px 18px;
    border: 2px solid #b47a13;
    border-radius: 999px;
    background: #fff4d6;
    color: #986004;
    font-size: 19px;
    line-height: 1.16;
    font-weight: 800;
    text-align: center;
    opacity: ${noticeOpacity};
  }
  .card {
    position: absolute;
    left: 32px;
    top: ${cardY}px;
    width: 396px;
    padding: 20px 24px 22px;
    border: 2px solid #d2c8b8;
    border-radius: 24px;
    background: #f1eee7;
    color: #2b2924;
    opacity: ${cardOpacity};
    box-shadow: 0 18px 36px rgba(0,0,0,.28);
  }
  .eyebrow {
    color: #7f7a70;
    font-size: 16px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: .8px;
    text-transform: uppercase;
  }
  h1 {
    margin: 24px 0 12px;
    font-size: 30px;
    line-height: 1.02;
    letter-spacing: 0;
  }
  p {
    margin: 0 0 18px;
    color: #5d574f;
    font-size: 17px;
    line-height: 1.27;
    font-weight: 700;
  }
  .pill {
    display: inline-block;
    padding: 10px 18px;
    border-radius: 999px;
    background: #dfe9df;
    color: #5b7568;
    font-size: 16px;
    font-weight: 800;
  }
  .pet {
    position: absolute;
    left: ${Math.round(x)}px;
    top: ${Math.round(petY)}px;
    width: 150px;
    height: 150px;
    object-fit: contain;
    transform: translate(-50%, -50%) ${flip} scale(${petScale});
    transform-origin: 50% 80%;
    filter: drop-shadow(0 14px 13px rgba(0,0,0,.32));
  }
  .floor {
    position: absolute;
    left: 56px;
    right: 56px;
    bottom: 58px;
    height: 1px;
    background: rgba(239, 223, 196, .24);
  }
</style>
</head>
<body>
<div class="stage">
  <div class="notice">Ding! I brought back something you can sell.</div>
  <section class="card">
    <div class="eyebrow">Your pet found a lead</div>
    <h1>Creator Store Launch Kit</h1>
    <p>Turn one messy template, guide, or prompt pack into a product page, delivery file, FAQ, launch copy, and proof dashboard.</p>
    <div class="pill">Waiting for owner approval</div>
  </section>
  <div class="floor"></div>
  <img class="pet" src="${petUrl}">
</div>
</body>
</html>`;
}

async function captureFrames() {
  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    show: false,
    transparent: false,
    webPreferences: { offscreen: true }
  });
  const frames = [];
  for (let i = 0; i < FRAME_COUNT; i += 1) {
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(frameHtml(i))}`);
    await win.webContents.executeJavaScript('Promise.all(Array.from(document.images).map((img) => img.complete ? true : img.decode().catch(() => true)))');
    await new Promise((resolve) => setTimeout(resolve, 35));
    const image = await win.webContents.capturePage();
    if (process.env.OPPORTUNITY_PET_DEMO_PREVIEW === '1' && (i === 0 || i === Math.floor(FRAME_COUNT * 0.68))) {
      fs.writeFileSync(path.join('/tmp', `opportunity-pet-demo-frame-${i}.png`), image.toPNG());
    }
    frames.push(image.toBitmap());
  }
  win.destroy();
  return frames;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await app.whenReady();
  const frames = await captureFrames();
  fs.writeFileSync(OUT_FILE, makeGif(frames));
  const sizeKb = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`Wrote ${OUT_FILE} (${sizeKb} KB, ${FRAME_COUNT} frames)`);
  app.quit();
}

main().catch((error) => {
  console.error(error);
  app.quit();
  process.exit(1);
});
