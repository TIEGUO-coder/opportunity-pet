const pet = document.getElementById('pet');
const petWrap = document.getElementById('petWrap');
const fallbackPet = document.getElementById('fallbackPet');
const leadCard = document.getElementById('leadCard');
const petSetup = document.getElementById('petSetup');
const petPhotoInput = document.getElementById('petPhotoInput');
const petPhotoPreview = document.getElementById('petPhotoPreview');
const photoPrompt = document.getElementById('photoPrompt');
const petNameInput = document.getElementById('petNameInput');
const assetNote = document.getElementById('assetNote');
const generatePet = document.getElementById('generatePet');
const spriteSheetInput = document.getElementById('spriteSheetInput');
const spritePreview = document.getElementById('spritePreview');
const startScouting = document.getElementById('startScouting');
const createPet = document.getElementById('createPet');
const closeCard = document.getElementById('closeCard');
const scoutNow = document.getElementById('scoutNow');
const pin = document.getElementById('pin');
const quit = document.getElementById('quit');
const approveLead = document.getElementById('approveLead');
const skipLead = document.getElementById('skipLead');
const reviewPlan = document.getElementById('reviewPlan');
const briefPanel = document.getElementById('briefPanel');

const bridge = window.teiguoWindow || {
  moveBy: () => Promise.resolve(),
  setAlwaysOnTop: (enabled) => Promise.resolve(Boolean(enabled)),
  setMode: () => Promise.resolve(),
  getCursorPosition: () => Promise.resolve(null),
  quit: () => window.close()
};

const opportunities = window.OPPORTUNITIES || [];
const defaultActions = {
  idle: ['../assets/teiguo/idle/idle_001.png', '../assets/teiguo/idle/idle_002.png', '../assets/teiguo/idle/idle_003.png', '../assets/teiguo/idle/idle_004.png'],
  walk: ['../assets/teiguo/walk/walk_001.png', '../assets/teiguo/walk/walk_002.png', '../assets/teiguo/walk/walk_003.png', '../assets/teiguo/walk/walk_004.png'],
  sleep: ['../assets/teiguo/sleep/sleep_001.png', '../assets/teiguo/sleep/sleep_002.png', '../assets/teiguo/sleep/sleep_003.png', '../assets/teiguo/sleep/sleep_004.png'],
  happy: ['../assets/teiguo/happy/happy_001.png', '../assets/teiguo/happy/happy_002.png', '../assets/teiguo/happy/happy_003.png', '../assets/teiguo/happy/happy_004.png'],
  chase: ['../assets/teiguo/chase/chase_001.png', '../assets/teiguo/chase/chase_002.png', '../assets/teiguo/chase/chase_003.png', '../assets/teiguo/chase/chase_004.png'],
  yawn: ['../assets/teiguo/yawn/yawn_001.png', '../assets/teiguo/yawn/yawn_002.png', '../assets/teiguo/yawn/yawn_003.png', '../assets/teiguo/yawn/yawn_004.png']
};

function withActionFallbacks(imported) {
  if (!imported) return defaultActions;
  return {
    ...defaultActions,
    ...imported,
    chase: imported.chase || imported.happy || defaultActions.chase,
    yawn: imported.yawn || imported.idle || defaultActions.yawn
  };
}

let actions = withActionFallbacks(loadImportedActions());

let currentAction = 'idle';
let frameIndex = 0;
let animationTimer = null;
let settleTimer = null;
let scoutingTimer = null;
let ambientTimer = null;
let currentLeadIndex = -1;
let currentLead = null;
let pinned = true;
let dragging = null;
let lastCursor = null;
let manualModeUntil = 0;
let petProfile = loadPetProfile();
let selectedPhotoDataUrls = [];
let importedSpriteSheet = localStorage.getItem('opportunityPet.spriteSheet') || '';
let petMotionTimer = null;
let isScouting = false;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function setPetMotion(motion, duration = 0) {
  clearTimeout(petMotionTimer);
  petWrap.classList.remove('pacing', 'found', 'chasing', 'resting');
  if (motion) petWrap.classList.add(motion);
  if (motion && duration > 0) {
    petMotionTimer = setTimeout(() => {
      petWrap.classList.remove(motion);
      if (motion === 'chasing') petWrap.classList.add('found');
    }, duration);
  }
}

function setVisualClass(action, moving = false) {
  pet.className = petProfile && petProfile.photoDataUrl && petProfile.assetMode !== 'generated' ? 'photo-pet' : '';
  fallbackPet.className = fallbackPet.className.replace(/\b(bob|happy|scouting)\b/g, '').trim();
  const target = pet.complete && pet.naturalWidth > 0 ? pet : fallbackPet;
  if (moving && action === 'walk' && !petWrap.classList.contains('pacing')) target.classList.add('bob');
  if (action === 'happy') target.classList.add('happy');
  if (action === 'walk' && leadCard.classList.contains('visible')) target.classList.add('scouting');
}

function showFrame() {
  const frames = actions[currentAction];
  pet.src = frames[frameIndex % frames.length];
  frameIndex += 1;
}

function loadImportedActions() {
  try {
    return JSON.parse(localStorage.getItem('opportunityPet.importedActions')) || null;
  } catch {
    return null;
  }
}

function startAnimation(action, speed = 260, moving = false) {
  currentAction = action;
  frameIndex = 0;
  clearInterval(animationTimer);
  showFrame();
  setVisualClass(action, moving);
  animationTimer = setInterval(showFrame, speed);
}

function playActionOnce(action, speed = 240, nextAction = 'idle', onComplete) {
  const frames = actions[action];
  if (!frames || !frames.length) {
    stopAnimationOnFirstFrame(nextAction);
    if (onComplete) onComplete();
    return;
  }

  currentAction = action;
  frameIndex = 0;
  clearInterval(animationTimer);
  showFrame();
  setVisualClass(action, true);
  animationTimer = setInterval(() => {
    if (frameIndex >= frames.length) {
      stopAnimationOnFirstFrame(nextAction);
      if (onComplete) onComplete();
      return;
    }
    showFrame();
  }, speed);
}

function stopAnimationOnFirstFrame(action = 'idle') {
  clearInterval(animationTimer);
  animationTimer = null;
  currentAction = action;
  frameIndex = 0;
  showFrame();
  setVisualClass(action, false);
}

function animateWhileCursorMoves() {
  if (Date.now() < manualModeUntil || leadCard.classList.contains('visible') || isScouting) return;
  clearTimeout(ambientTimer);
  if (currentAction !== 'walk' || !animationTimer) startAnimation('walk', 300, true);
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    if (Date.now() >= manualModeUntil) {
      stopAnimationOnFirstFrame('idle');
      scheduleAmbient();
    }
  }, 850);
}

function setLeadText(lead) {
  const petName = petProfile?.name || 'Your pet';
  document.getElementById('cardEyebrow').textContent = `${petName.toUpperCase()} FOUND A LEAD`;
  document.getElementById('leadTitle').textContent = lead.title;
  document.getElementById('leadSummary').textContent = lead.summary;
  document.getElementById('leadType').textContent = lead.type;
  document.getElementById('leadEvidence').textContent = lead.evidence;
  document.getElementById('leadRisk').textContent = lead.risk;
  document.getElementById('briefOpportunity').textContent = `${lead.title} (${lead.type}): ${lead.summary}`;
  document.getElementById('briefV1').textContent = lead.v1;
  document.getElementById('briefQuestions').innerHTML = lead.grillQuestions.map((question) => `<span>${question}</span>`).join('');
}

function loadPetProfile() {
  try {
    return JSON.parse(localStorage.getItem('opportunityPet.profile')) || null;
  } catch {
    return null;
  }
}

function savePetProfile(profile) {
  localStorage.setItem('opportunityPet.profile', JSON.stringify(profile));
  petProfile = profile;
}

function applyPetProfile() {
  if (!petProfile) {
    petSetup.classList.add('visible');
    document.body.dataset.view = 'setup';
    bridge.setMode('setup');
    return;
  }

  petSetup.classList.remove('visible');
  document.body.dataset.hasPet = 'true';
  document.body.dataset.view = 'pet';
  if (petProfile.photoDataUrl) {
    pet.classList.toggle('photo-pet', petProfile.assetMode !== 'generated');
    pet.src = petProfile.assetMode === 'generated' ? actions.idle[0] : petProfile.photoDataUrl;
  } else {
    pet.classList.remove('photo-pet');
  }
  bridge.setMode('pet');
}

function nextLead() {
  currentLeadIndex = (currentLeadIndex + 1) % opportunities.length;
  currentLead = opportunities[currentLeadIndex];
  setLeadText(currentLead);
}

async function showLeadCard() {
  if (!opportunities.length || leadCard.classList.contains('visible')) return;
  nextLead();
  leadCard.classList.add('visible');
  document.body.dataset.view = 'lead';
  briefPanel.classList.remove('visible');
  document.getElementById('leadStatus').textContent = 'Waiting for owner approval';
  stopAnimationOnFirstFrame('idle');
  setPetMotion('found');
  manualModeUntil = Date.now() + 1600;
  clearTimeout(ambientTimer);
  await bridge.setMode('lead');
}

async function scoutForLead() {
  if (isScouting || leadCard.classList.contains('visible')) return;
  isScouting = true;
  clearTimeout(scoutingTimer);
  clearTimeout(ambientTimer);
  document.body.dataset.view = 'pet';
  setPetMotion('pacing');
  startAnimation('walk', 190, true);
  manualModeUntil = Date.now() + 2200;
  await bridge.setMode('pet');
  await wait(1900);
  setPetMotion('');
  await showLeadCard();
  isScouting = false;
}

async function closeLeadCardView() {
  leadCard.classList.remove('visible');
  briefPanel.classList.remove('visible');
  document.body.dataset.view = 'pet';
  setPetMotion('');
  await bridge.setMode('pet');
  stopAnimationOnFirstFrame('idle');
  scheduleAmbient();
  scheduleScouting();
}

function scheduleScouting() {
  clearTimeout(scoutingTimer);
  if (!petProfile) return;
  scoutingTimer = setTimeout(scoutForLead, 18000);
}

function scheduleAmbient() {
  clearTimeout(ambientTimer);
  if (!petProfile || isScouting || leadCard.classList.contains('visible')) return;
  const delay = 8500 + Math.round(Math.random() * 5000);
  ambientTimer = setTimeout(runAmbientAction, delay);
}

function runAmbientAction() {
  if (!petProfile || isScouting || leadCard.classList.contains('visible') || Date.now() < manualModeUntil) {
    scheduleAmbient();
    return;
  }

  manualModeUntil = Date.now() + 5200;
  if (Math.random() < 0.52) {
    setPetMotion('resting');
    playActionOnce('yawn', 360, 'idle', () => {
      setPetMotion('');
      scheduleAmbient();
    });
    return;
  }

  setPetMotion('resting');
  startAnimation('sleep', 620, false);
  ambientTimer = setTimeout(() => {
    setPetMotion('');
    stopAnimationOnFirstFrame('idle');
    scheduleAmbient();
  }, 4600);
}

function approveCurrentLead() {
  document.getElementById('leadStatus').textContent = 'Marked actionable. Ready for grilling.';
  leadCard.dataset.approved = 'true';
  stopAnimationOnFirstFrame('idle');
  setPetMotion('found');
}

function buildGrillingBrief() {
  if (!currentLead) return '';
  return `Use grill-with-docs on this opportunity lead.

Interview me one question at a time. For each question, give your recommended answer first, then wait for my response.

As we resolve terms or durable decisions, use domain-modeling discipline:
- Capture stable vocabulary in CONTEXT.md only when a term is actually resolved.
- Create an ADR only for decisions that are hard to reverse, surprising without context, and based on a real trade-off.

Do not write implementation code during the grilling session.

When we reach shared understanding, produce a routemap-ready brief with these sections:
- Goal
- Target user / situation
- Public signals to inspect
- Key assumptions
- Smallest useful experiment
- Validation tasks
- Build tasks
- Distribution or sharing tasks
- Risks to recheck
- Out of scope

Opportunity: ${currentLead.title}
Type: ${currentLead.type}
Why it might matter: ${currentLead.summary}
Public signals to inspect: ${currentLead.evidence}
Risk: ${currentLead.risk}
Small experiment: ${currentLead.v1}

Questions to start with:
${currentLead.grillQuestions.map((question) => `- ${question}`).join('\n')}`;
}

async function skipCurrentLead() {
  leadCard.dataset.approved = 'false';
  leadCard.classList.remove('visible');
  briefPanel.classList.remove('visible');
  setPetMotion('');
  document.body.dataset.view = 'pet';
  await bridge.setMode('pet');
  await scoutForLead();
}

async function reviewCurrentPlan() {
  document.getElementById('leadStatus').textContent = 'Grill-with-docs brief copied.';
  leadCard.dataset.approved = 'true';
  briefPanel.classList.add('visible');
  setPetMotion('chasing', 1500);
  playActionOnce('chase', 330, 'idle', () => setPetMotion('found'));
  try {
    await navigator.clipboard.writeText(buildGrillingBrief());
  } catch {
    document.getElementById('leadStatus').textContent = 'Grill-with-docs brief prepared.';
  }
}

function handleImageError() {
  pet.style.display = 'none';
  fallbackPet.classList.add('visible');
}

function handleImageLoad() {
  pet.style.display = '';
  fallbackPet.classList.remove('visible');
  setVisualClass(currentAction, Boolean(animationTimer));
}

pet.addEventListener('error', handleImageError);
pet.addEventListener('load', handleImageLoad);
petPhotoInput.addEventListener('change', () => {
  const files = Array.from(petPhotoInput.files || []).slice(0, 5);
  if (!files.length) return;
  selectedPhotoDataUrls = [];
  petPhotoPreview.innerHTML = '';

  Promise.all(files.map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(file);
  }))).then((images) => {
    selectedPhotoDataUrls = images;
    petPhotoPreview.classList.add('visible');
    images.forEach((src, index) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Pet source ${index + 1}`;
      petPhotoPreview.appendChild(img);
    });
    photoPrompt.textContent = `${images.length} photo${images.length > 1 ? 's' : ''} selected`;
    const enough = images.length >= 3;
    assetNote.textContent = enough
      ? 'Photo set received. Front, side, and resting views will drive different task actions.'
      : 'Add at least 3 photos so the generator can infer the whole pet instead of guessing from one angle.';
  });
});

function petName() {
  return petNameInput.value.trim() || petProfile?.name || 'My pet';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(file);
  });
}

function drawImageCover(context, img, x, y, width, height) {
  const sourceRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = width / height;
  let sourceWidth = img.naturalWidth;
  let sourceHeight = img.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = img.naturalHeight * targetRatio;
    sourceX = (img.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = img.naturalWidth / targetRatio;
    sourceY = (img.naturalHeight - sourceHeight) / 2;
  }

  context.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawButterfly(context, x, y, flap) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.16);
  context.fillStyle = '#f2bd35';
  context.strokeStyle = '#6e4a16';
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(-6, 0, 7, 11 - flap, -0.45, 0, Math.PI * 2);
  context.ellipse(6, 0, 7, 11 + flap, 0.45, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = '#4f3515';
  context.fillRect(-1, -5, 2, 12);
  context.restore();
}

function makePetFrame(img, action, frame) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 280;
  canvas.height = 280;

  const bob = Math.sin((frame / 4) * Math.PI * 2);
  const walkShift = action === 'walk' ? (frame % 2 === 0 ? -9 : 9) : 0;
  const happyTilt = action === 'happy' ? (frame % 2 === 0 ? -0.05 : 0.05) : 0;
  const idleLift = action === 'idle' ? bob * 3 : 0;
  const sleepBreath = action === 'sleep' ? bob * 2 : 0;
  const yawnStretch = action === 'yawn' ? 1 + Math.sin((frame / 3) * Math.PI) * 0.045 : 1;

  context.save();
  if (action === 'sleep') {
    context.translate(140, 158 + sleepBreath);
    context.rotate(-0.08);
    drawImageCover(context, img, -116, -72, 232, 160);
  } else if (action === 'walk') {
    context.translate(140 + walkShift, 154 + Math.abs(bob) * -3);
    drawImageCover(context, img, -122, -84, 244, 178);
  } else if (action === 'chase') {
    const progress = frame / 3;
    context.translate(132 + progress * 18, 158 - Math.sin(progress * Math.PI) * 20);
    drawImageCover(context, img, -116, -82, 232, 170);
  } else {
    context.translate(140 + walkShift, 142 + idleLift);
    context.rotate(happyTilt);
    context.scale(1 / yawnStretch, yawnStretch);
    drawImageCover(context, img, -106, -124, 212, 248);
  }
  context.restore();

  if (action === 'chase') {
    drawButterfly(context, 56 + frame * 22, 62 - Math.sin((frame / 3) * Math.PI) * 14, frame % 2 ? 3 : -2);
  }

  if (action === 'happy') {
    context.save();
    context.fillStyle = '#f1cf72';
    [
      [72, 54 + bob * 2],
      [205, 70 - bob * 2],
      [186, 36]
    ].forEach(([x, y]) => {
      context.beginPath();
      context.arc(x, y, 5, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  return canvas.toDataURL('image/png');
}

async function generateActionsFromPhotos(images) {
  const loaded = await Promise.all(images.map(loadImage));
  const choose = (index) => loaded[Math.min(index, loaded.length - 1)];
  const sources = {
    idle: choose(0),
    walk: choose(1),
    sleep: choose(loaded.length - 1),
    happy: choose(2),
    chase: choose(1),
    yawn: choose(0)
  };

  return Object.fromEntries(Object.entries(sources).map(([action, img]) => [
    action,
    [0, 1, 2, 3].map((frame) => makePetFrame(img, action, frame))
  ]));
}

function updatePipeline(step) {
  document.querySelectorAll('.pipeline-steps span').forEach((el) => {
    el.classList.remove('active', 'done');
  });
  document.getElementById('stepPhotos').classList.toggle('done', step !== 'photos');
  document.getElementById('stepIdentity').classList.toggle('done', step === 'sprite' || step === 'ready');
  document.getElementById('stepSprite').classList.toggle('done', step === 'ready');
  document.getElementById(step === 'photos' ? 'stepPhotos' : step === 'identity' ? 'stepIdentity' : 'stepSprite').classList.add('active');
}

function processPixel(data, index) {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const a = data[index + 3];
  const green = g > 115 && g > r * 1.18 && g > b * 1.18;
  if (green || a < 12) {
    data[index] = 0;
    data[index + 1] = 0;
    data[index + 2] = 0;
    data[index + 3] = 0;
    return;
  }
  const greenDominance = g - Math.max(r, b);
  if (g > 100 && greenDominance > 12) {
    data[index + 1] = Math.min(g, Math.max(r, b) + 10);
    data[index + 3] = Math.max(0, Math.min(a, 255 - greenDominance * 10));
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function extractSpriteSheet(src) {
  const img = await loadImage(src);
  const rows = ['idle', 'walk', 'sleep', 'happy'];
  const cellWidth = Math.floor(img.naturalWidth / 4);
  const cellHeight = Math.floor(img.naturalHeight / 4);
  const extracted = {};

  rows.forEach((action, row) => {
    extracted[action] = [];
    for (let col = 0; col < 4; col += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = cellWidth;
      canvas.height = cellHeight;
      const context = canvas.getContext('2d');
      context.drawImage(img, col * cellWidth, row * cellHeight, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);
      const imageData = context.getImageData(0, 0, cellWidth, cellHeight);
      for (let i = 0; i < imageData.data.length; i += 4) processPixel(imageData.data, i);
      context.putImageData(imageData, 0, 0);
      extracted[action].push(canvas.toDataURL('image/png'));
    }
  });

  return extracted;
}

generatePet.addEventListener('click', async () => {
  if (selectedPhotoDataUrls.length < 3) {
    assetNote.textContent = 'Choose 3-5 pet photos first. This helps the pet feel like your actual pet, not a one-photo sticker.';
    return;
  }
  generatePet.disabled = true;
  assetNote.textContent = 'Generating your animated scout locally...';
  actions = withActionFallbacks(await generateActionsFromPhotos(selectedPhotoDataUrls));
  localStorage.setItem('opportunityPet.importedActions', JSON.stringify(actions));
  updatePipeline('ready');
  const name = petName();
  savePetProfile({
    name,
    photoDataUrl: '',
    assetMode: 'generated',
    sourcePhotoCount: selectedPhotoDataUrls.length,
    generatedFrom: 'local-photo-animation',
    createdAt: new Date().toISOString()
  });
  generatePet.disabled = false;
  assetNote.textContent = 'Six-action scout generated: idle, side walk, curled rest, response, butterfly chase, and yawn.';
  applyPetProfile();
  await scoutForLead();
});

spriteSheetInput.addEventListener('change', async () => {
  const file = spriteSheetInput.files && spriteSheetInput.files[0];
  if (!file) return;
  importedSpriteSheet = await readFileAsDataUrl(file);
  localStorage.setItem('opportunityPet.spriteSheet', importedSpriteSheet);
  spritePreview.src = importedSpriteSheet;
  spritePreview.classList.add('visible');
  actions = withActionFallbacks(await extractSpriteSheet(importedSpriteSheet));
  localStorage.setItem('opportunityPet.importedActions', JSON.stringify(actions));
  updatePipeline('ready');
  stopAnimationOnFirstFrame('idle');
  assetNote.textContent = 'Legacy sheet imported. Missing chase and yawn states will use compatible fallback actions.';
});

startScouting.addEventListener('click', async () => {
  if (!loadImportedActions()) {
    assetNote.textContent = 'Import a generated sprite sheet first. The pet should scout only after action frames exist.';
    return;
  }
  const name = petName();
  savePetProfile({
    name,
    photoDataUrl: '',
    assetMode: 'generated',
    sourcePhotoCount: selectedPhotoDataUrls.length,
    generatedFrom: 'imported-sprite-sheet',
    createdAt: new Date().toISOString()
  });
  applyPetProfile();
  await scoutForLead();
});

createPet.addEventListener('click', async () => {
  actions = defaultActions;
  const name = petNameInput.value.trim() || 'Tieguo';
  savePetProfile({
    name,
    photoDataUrl: '',
    assetMode: 'generated',
    sourcePhotoCount: selectedPhotoDataUrls.length,
    generatedFrom: 'default-teiguo',
    createdAt: new Date().toISOString()
  });
  applyPetProfile();
  await scoutForLead();
});
closeCard.addEventListener('click', closeLeadCardView);
approveLead.addEventListener('click', approveCurrentLead);
skipLead.addEventListener('click', skipCurrentLead);
reviewPlan.addEventListener('click', reviewCurrentPlan);
scoutNow.addEventListener('click', scoutForLead);

petWrap.addEventListener('pointerdown', (event) => {
  dragging = { x: event.screenX, y: event.screenY, moved: false };
  petWrap.classList.add('dragging');
  petWrap.setPointerCapture(event.pointerId);
});

petWrap.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const dx = event.screenX - dragging.x;
  const dy = event.screenY - dragging.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) dragging.moved = true;
  dragging.x = event.screenX;
  dragging.y = event.screenY;
  bridge.moveBy(dx, dy);
  animateWhileCursorMoves();
});

petWrap.addEventListener('pointerup', (event) => {
  petWrap.releasePointerCapture(event.pointerId);
  petWrap.classList.remove('dragging');
  if (dragging && !dragging.moved) scoutForLead();
  dragging = null;
});

window.addEventListener('pointermove', animateWhileCursorMoves);

pin.addEventListener('click', async (event) => {
  event.stopPropagation();
  pinned = await bridge.setAlwaysOnTop(!pinned);
  pin.style.opacity = pinned ? '1' : '0.48';
});

quit.addEventListener('click', (event) => {
  event.stopPropagation();
  bridge.quit();
});

async function watchGlobalCursor() {
  const point = await bridge.getCursorPosition();
  if (point && lastCursor && (Math.abs(point.x - lastCursor.x) > 1 || Math.abs(point.y - lastCursor.y) > 1)) {
    animateWhileCursorMoves();
  }
  if (point) lastCursor = point;
}

applyPetProfile();
if (importedSpriteSheet) {
  spritePreview.src = importedSpriteSheet;
  spritePreview.classList.add('visible');
  updatePipeline('ready');
}
stopAnimationOnFirstFrame('idle');
scheduleAmbient();
scheduleScouting();
setInterval(watchGlobalCursor, 180);
