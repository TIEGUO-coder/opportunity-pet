const pet = document.getElementById('pet');
const petWrap = document.getElementById('petWrap');
const fallbackPet = document.getElementById('fallbackPet');
const leadToast = document.getElementById('leadToast');
const leadCard = document.getElementById('leadCard');
const petSetup = document.getElementById('petSetup');
const petPhotoInput = document.getElementById('petPhotoInput');
const petPhotoPreview = document.getElementById('petPhotoPreview');
const photoPrompt = document.getElementById('photoPrompt');
const petNameInput = document.getElementById('petNameInput');
const assetNote = document.getElementById('assetNote');
const copyIdentityPrompt = document.getElementById('copyIdentityPrompt');
const copySpritePrompt = document.getElementById('copySpritePrompt');
const identitySheetInput = document.getElementById('identitySheetInput');
const spriteSheetInput = document.getElementById('spriteSheetInput');
const identityPreview = document.getElementById('identityPreview');
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
  happy: ['../assets/teiguo/happy/happy_001.png', '../assets/teiguo/happy/happy_002.png', '../assets/teiguo/happy/happy_003.png', '../assets/teiguo/happy/happy_004.png']
};
let actions = loadImportedActions() || defaultActions;

let currentAction = 'idle';
let frameIndex = 0;
let animationTimer = null;
let settleTimer = null;
let scoutingTimer = null;
let currentLeadIndex = -1;
let currentLead = null;
let pinned = true;
let dragging = null;
let lastCursor = null;
let manualModeUntil = 0;
let petProfile = loadPetProfile();
let selectedPhotoDataUrls = [];
let importedIdentitySheet = localStorage.getItem('opportunityPet.identitySheet') || '';
let importedSpriteSheet = localStorage.getItem('opportunityPet.spriteSheet') || '';

function setVisualClass(action, moving = false) {
  pet.className = petProfile && petProfile.photoDataUrl && petProfile.assetMode !== 'generated' ? 'photo-pet' : '';
  fallbackPet.className = fallbackPet.className.replace(/\b(bob|happy|scouting)\b/g, '').trim();
  const target = pet.complete && pet.naturalWidth > 0 ? pet : fallbackPet;
  if (moving && action === 'walk') target.classList.add('bob');
  if (action === 'happy') target.classList.add('happy');
  if (action === 'walk' && leadToast.classList.contains('visible')) target.classList.add('scouting');
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

function stopAnimationOnFirstFrame(action = 'idle') {
  clearInterval(animationTimer);
  animationTimer = null;
  currentAction = action;
  frameIndex = 0;
  showFrame();
  setVisualClass(action, false);
}

function animateWhileCursorMoves() {
  if (Date.now() < manualModeUntil || leadCard.classList.contains('visible')) return;
  if (currentAction !== 'walk' || !animationTimer) startAnimation('walk', 300, true);
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    if (Date.now() >= manualModeUntil) stopAnimationOnFirstFrame('idle');
  }, 850);
}

function setLeadText(lead) {
  const petName = petProfile?.name || 'Your pet';
  document.getElementById('toastText').textContent = `Ding! ${petName} found a money lead.`;
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
    leadToast.classList.remove('visible');
    bridge.setMode('lead');
    return;
  }

  petSetup.classList.remove('visible');
  document.body.dataset.hasPet = 'true';
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

async function showLeadToast() {
  if (!opportunities.length || leadCard.classList.contains('visible')) return;
  nextLead();
  leadToast.classList.add('visible');
  startAnimation('walk', 260, true);
  manualModeUntil = Date.now() + 1800;
  await bridge.setMode('pet');
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => stopAnimationOnFirstFrame('idle'), 1600);
}

async function openLeadCard() {
  if (!currentLead) nextLead();
  leadToast.classList.remove('visible');
  leadCard.classList.add('visible');
  briefPanel.classList.remove('visible');
  document.getElementById('leadStatus').textContent = 'Waiting for owner approval';
  startAnimation('happy', 320, false);
  manualModeUntil = Date.now() + 1600;
  await bridge.setMode('lead');
}

async function closeLeadCardView() {
  leadCard.classList.remove('visible');
  briefPanel.classList.remove('visible');
  await bridge.setMode('pet');
  stopAnimationOnFirstFrame('idle');
  scheduleScouting();
}

function scheduleScouting() {
  clearTimeout(scoutingTimer);
  if (!petProfile) return;
  scoutingTimer = setTimeout(showLeadToast, 7000);
}

function approveCurrentLead() {
  document.getElementById('leadStatus').textContent = 'Marked actionable. Ready for grilling.';
  leadCard.dataset.approved = 'true';
  startAnimation('happy', 260, false);
}

function skipCurrentLead() {
  leadCard.dataset.approved = 'false';
  briefPanel.classList.remove('visible');
  nextLead();
  document.getElementById('leadStatus').textContent = 'Still scouting. Fresh lead queued.';
  startAnimation('walk', 280, true);
}

function reviewCurrentPlan() {
  document.getElementById('leadStatus').textContent = 'Grilling brief prepared.';
  leadCard.dataset.approved = 'true';
  briefPanel.classList.add('visible');
  startAnimation('happy', 320, false);
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
      ? 'Photo set received. Next step: infer an identity sheet from these angles, then generate transparent action frames.'
      : 'Add at least 3 photos so the generator can infer the whole pet instead of guessing from one angle.';
  });
});

function petName() {
  return petNameInput.value.trim() || petProfile?.name || 'My pet';
}

function identityPrompt() {
  return `Create a multi-view character identity sheet for a desktop scout pet named ${petName()}.

Use the 3-5 attached pet photos as identity references. Infer the whole animal from all photos.

Output:
- Front view
- Side body view
- Back view
- 45-degree view
- Sleeping/resting pose
- One detail callout for distinctive markings, ears, tail, face shape, or scars

Style:
- polished cute 2D desktop pet character
- recognizable as the source pet, not a generic cat or dog
- full body visible in every view
- clean light background or transparent background

Preserve:
- body shape and proportions
- face shape
- fur colors and markings
- ears, tail, paws, and distinctive traits

Avoid:
- using the photo as a flat sticker
- changing species
- inventing generic markings
- props, text labels, watermark, cropped paws or tail`;
}

function spritePrompt() {
  return `Create a transparent 2D desktop pet sprite sheet from the approved identity sheet for ${petName()}.

Input: the approved identity sheet.

Output format:
- 4 rows, 4 frames per row
- Row 1: idle, calm sitting or standing loop
- Row 2: scout/walk/searching loop
- Row 3: sleep/rest loop
- Row 4: celebrate/click approval loop

Requirements:
- transparent background
- same character identity, markings, body shape, ears, tail, and face across all frames
- full body visible in every frame
- consistent scale and ground alignment
- no text, no labels, no watermark

Avoid:
- changing markings between frames
- cropped paws or tail
- extra animals
- props unless a tiny neutral sparkle is needed for scouting`;
}

async function copyText(text, label) {
  await navigator.clipboard.writeText(text);
  assetNote.textContent = `${label} copied. Paste it into your AI image tool, attach the required image inputs, then import the result here.`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(file);
  });
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

copyIdentityPrompt.addEventListener('click', () => {
  if (selectedPhotoDataUrls.length < 3) {
    assetNote.textContent = 'Choose 3-5 pet photos first, then copy the identity prompt.';
    return;
  }
  copyText(identityPrompt(), 'Identity prompt');
});

copySpritePrompt.addEventListener('click', () => {
  if (!importedIdentitySheet) {
    assetNote.textContent = 'Import the AI-generated identity sheet first, then copy the sprite prompt.';
    return;
  }
  copyText(spritePrompt(), 'Sprite prompt');
});

identitySheetInput.addEventListener('change', async () => {
  const file = identitySheetInput.files && identitySheetInput.files[0];
  if (!file) return;
  importedIdentitySheet = await readFileAsDataUrl(file);
  localStorage.setItem('opportunityPet.identitySheet', importedIdentitySheet);
  identityPreview.src = importedIdentitySheet;
  identityPreview.classList.add('visible');
  updatePipeline('identity');
  assetNote.textContent = 'Identity sheet imported. If it looks right, copy the sprite prompt and generate the 4x4 transparent sprite sheet in your AI tool.';
});

spriteSheetInput.addEventListener('change', async () => {
  const file = spriteSheetInput.files && spriteSheetInput.files[0];
  if (!file) return;
  importedSpriteSheet = await readFileAsDataUrl(file);
  localStorage.setItem('opportunityPet.spriteSheet', importedSpriteSheet);
  spritePreview.src = importedSpriteSheet;
  spritePreview.classList.add('visible');
  actions = await extractSpriteSheet(importedSpriteSheet);
  localStorage.setItem('opportunityPet.importedActions', JSON.stringify(actions));
  updatePipeline('ready');
  stopAnimationOnFirstFrame('idle');
  assetNote.textContent = 'Sprite sheet imported and sliced into 16 frames. You can now start scouting with this pet.';
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
  await showLeadToast();
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
  await showLeadToast();
});
leadToast.addEventListener('click', openLeadCard);
closeCard.addEventListener('click', closeLeadCardView);
approveLead.addEventListener('click', approveCurrentLead);
skipLead.addEventListener('click', skipCurrentLead);
reviewPlan.addEventListener('click', reviewCurrentPlan);
scoutNow.addEventListener('click', showLeadToast);

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
  if (dragging && !dragging.moved) showLeadToast();
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
if (importedIdentitySheet) {
  identityPreview.src = importedIdentitySheet;
  identityPreview.classList.add('visible');
}
if (importedSpriteSheet) {
  spritePreview.src = importedSpriteSheet;
  spritePreview.classList.add('visible');
  updatePipeline('ready');
}
stopAnimationOnFirstFrame('idle');
scheduleScouting();
setInterval(watchGlobalCursor, 180);
