const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { PNG } = require('pngjs');

const BODY_PLANS = ['quadruped', 'biped', 'flyer', 'serpent', 'blob'];
const CELL = 192;

function pixel(image, x, y, color) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const index = (y * image.width + x) * 4;
  image.data[index] = color[0];
  image.data[index + 1] = color[1];
  image.data[index + 2] = color[2];
  image.data[index + 3] = 255;
}

function disc(image, cx, cy, radius, color) {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) pixel(image, x, y, color);
    }
  }
}

function line(image, x1, y1, x2, y2, color, width = 4) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1)));
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    disc(image, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, color);
  }
}

function ellipse(image, cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) pixel(image, x, y, color);
    }
  }
}

function motion(action, frame, count) {
  const t = count <= 1 ? 0 : frame / (count - 1);
  const cycle = frame / count * Math.PI * 2;
  const state = { x: 0, y: 0, crouch: 0, curl: 0, headX: 0, headY: 0, reach: 0, phase: cycle, mouth: 0 };
  if (action === 'idle') state.y = Math.sin(cycle) * 2;
  if (action === 'walk') state.y = Math.abs(Math.sin(cycle * 2)) * 3;
  if (action === 'settle') state.crouch = t * 28;
  if (action === 'sleep') {
    state.crouch = t * 38;
    state.curl = t;
    state.headY = t * 24;
    state.headX = -t * 18;
  }
  if (action === 'happy') state.y = -Math.sin(Math.PI * t) * 16;
  if (action === 'chase') {
    state.crouch = Math.min(18, t * 24);
    state.reach = t * 16;
  }
  if (action === 'catch') {
    state.y = -Math.sin(Math.PI * t) * 24;
    state.reach = Math.sin(Math.PI * t) * 30;
    state.crouch = (1 - Math.sin(Math.PI * t)) * 8;
  }
  if (action === 'yawn') state.mouth = Math.sin(Math.PI * t);
  if (action === 'gaze') {
    const directions = [
      [-1, -1], [-0.5, -1], [0, -1], [0.5, -1],
      [1, -1], [1, -0.5], [1, 0], [1, 0.5],
      [1, 1], [0.5, 1], [0, 1], [-0.5, 1],
      [-1, 1], [-1, 0.5], [-1, 0], [-1, -0.5]
    ];
    const [dx, dy] = directions[Math.min(directions.length - 1, frame)];
    state.headX = dx * 9;
    state.headY = dy * 9;
  }
  return state;
}

function quadruped(image, ox, oy, action, frame, count) {
  const s = motion(action, frame, count);
  const dark = [65, 71, 80];
  const light = [142, 151, 162];
  const bodyX = ox + 94 + s.x;
  const bodyY = oy + 92 + s.y + s.crouch;
  if (s.curl > 0.72) {
    ellipse(image, bodyX, bodyY + 18, 49, 34, light);
    disc(image, bodyX - 28, bodyY + 11, 20, dark);
    line(image, bodyX + 34, bodyY + 9, bodyX - 2, bodyY + 32, dark, 8);
    return;
  }
  ellipse(image, bodyX, bodyY, 52, 27 - s.crouch * 0.12, light);
  const headX = bodyX + 52 + s.headX + s.reach * 0.35;
  const headY = bodyY - 20 + s.headY;
  line(image, bodyX + 35, bodyY - 8, headX - 8, headY + 8, dark, 10);
  disc(image, headX, headY, 20, dark);
  if (s.mouth) line(image, headX + 12, headY + 8, headX + 19, headY + 8 + s.mouth * 10, [20, 24, 30], 3);
  line(image, bodyX - 48, bodyY - 8, bodyX - 72, bodyY - 36 + Math.sin(s.phase) * 12, dark, 7);
  const ground = oy + 153;
  const stride = action === 'walk' || action === 'chase' ? 17 : 5;
  [-28, -7, 17, 37].forEach((legX, index) => {
    const phase = s.phase + index * Math.PI;
    const pawX = bodyX + legX + Math.sin(phase) * stride + s.reach * (index > 1 ? 0.6 : 0);
    const hipY = bodyY + 16;
    const kneeX = bodyX + legX + Math.sin(phase) * stride * 0.45;
    const kneeY = hipY + 20 - Math.max(0, Math.cos(phase)) * stride * 0.4;
    const pawY = Math.min(ground, ground - Math.max(0, Math.cos(phase)) * stride * 0.35 - s.y);
    line(image, bodyX + legX, hipY, kneeX, kneeY, index % 2 ? dark : light, 6);
    line(image, kneeX, kneeY, pawX, pawY, index % 2 ? dark : light, 6);
  });
}

function biped(image, ox, oy, action, frame, count) {
  const s = motion(action, frame, count);
  const dark = [65, 71, 80];
  const light = [142, 151, 162];
  const x = ox + 96;
  const y = oy + 77 + s.y + s.crouch * 0.45;
  disc(image, x + s.headX, y - 35 + s.headY, 17, dark);
  line(image, x, y - 18, x, y + 30, light, 18);
  const swing = Math.sin(s.phase) * (action === 'walk' ? 25 : 8);
  line(image, x - 7, y - 5, x - 28 - swing, y + 22, dark, 7);
  line(image, x + 7, y - 5, x + 28 + swing + s.reach, y + 22, light, 7);
  line(image, x - 5, y + 26, x - 18 + swing, oy + 153, dark, 8);
  line(image, x + 5, y + 26, x + 18 - swing, oy + 153, light, 8);
}

function flyer(image, ox, oy, action, frame, count) {
  const s = motion(action, frame, count);
  const x = ox + 96 + s.reach;
  const y = oy + 96 + s.y;
  ellipse(image, x, y, 38, 21, [142, 151, 162]);
  disc(image, x + 38 + s.headX, y - 8 + s.headY, 14, [65, 71, 80]);
  const flap = Math.sin(s.phase) * 38;
  line(image, x - 4, y, x - 42, y - 18 - flap, [65, 71, 80], 10);
  line(image, x + 2, y, x + 27, y + 16 + flap, [98, 107, 118], 9);
  line(image, x - 34, y + 2, x - 57, y + 14, [65, 71, 80], 6);
}

function serpent(image, ox, oy, action, frame, count) {
  const s = motion(action, frame, count);
  let previous = null;
  for (let segment = 0; segment <= 16; segment += 1) {
    const t = segment / 16;
    const x = ox + 28 + t * 125 + s.reach * t;
    const curl = action === 'sleep' ? s.curl * 26 : 0;
    const y = oy + 112 + Math.sin(t * Math.PI * 3 + s.phase) * (16 + curl) - curl * t;
    if (previous) line(image, previous[0], previous[1], x, y, [112, 122, 134], 11 - t * 4);
    previous = [x, y];
  }
  disc(image, previous[0] + s.headX, previous[1] + s.headY, 15, [65, 71, 80]);
}

function blob(image, ox, oy, action, frame, count) {
  const s = motion(action, frame, count);
  const squash = Math.abs(Math.sin(s.phase)) * 10 + s.crouch * 0.3;
  ellipse(image, ox + 96 + s.reach, oy + 116 + s.y, 48 + squash, 43 - squash * 0.45, [112, 122, 134]);
  disc(image, ox + 82 + s.reach + s.headX, oy + 105 + s.y + s.headY, 5, [32, 37, 44]);
  disc(image, ox + 110 + s.reach + s.headX, oy + 105 + s.y + s.headY, 5, [32, 37, 44]);
}

function renderGuide(bodyPlan, action, beats, frameOffset = 0) {
  const image = new PNG({ width: CELL * 4, height: CELL * 2 });
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = 244;
    image.data[index + 1] = 246;
    image.data[index + 2] = 249;
    image.data[index + 3] = 255;
  }
  const renderer = { quadruped, biped, flyer, serpent, blob }[bodyPlan];
  for (let localFrame = 0; localFrame < 8; localFrame += 1) {
    const col = localFrame % 4;
    const row = Math.floor(localFrame / 4);
    const ox = col * CELL;
    const oy = row * CELL;
    renderer(image, ox, oy, action, frameOffset + localFrame, beats.length);
  }
  return PNG.sync.write(image);
}

function writePoseGuides(root, actionSpecs, version) {
  fs.mkdirSync(root, { recursive: true });
  const manifest = { version, width: CELL * 4, height: CELL * 2, bodyPlans: {} };
  BODY_PLANS.forEach((bodyPlan) => {
    const planDir = path.join(root, bodyPlan);
    fs.mkdirSync(planDir, { recursive: true });
    manifest.bodyPlans[bodyPlan] = {};
    Object.entries(actionSpecs).forEach(([action, spec]) => {
      spec.files.forEach((file, fileIndex) => {
        const buffer = renderGuide(bodyPlan, action, spec.beats, fileIndex * 8);
        fs.writeFileSync(path.join(planDir, file), buffer);
        manifest.bodyPlans[bodyPlan][file] = createHash('sha256').update(buffer).digest('hex');
      });
    });
  });
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(root, 'manifest.json'), manifestBuffer);
  return createHash('sha256').update(manifestBuffer).digest('hex');
}

module.exports = { BODY_PLANS, writePoseGuides };
