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
const generatePet = document.getElementById('generatePet');
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
const actions = {
  idle: ['../assets/teiguo/idle/idle_001.png', '../assets/teiguo/idle/idle_002.png', '../assets/teiguo/idle/idle_003.png', '../assets/teiguo/idle/idle_004.png'],
  walk: ['../assets/teiguo/walk/walk_001.png', '../assets/teiguo/walk/walk_002.png', '../assets/teiguo/walk/walk_003.png', '../assets/teiguo/walk/walk_004.png'],
  sleep: ['../assets/teiguo/sleep/sleep_001.png', '../assets/teiguo/sleep/sleep_002.png', '../assets/teiguo/sleep/sleep_003.png', '../assets/teiguo/sleep/sleep_004.png'],
  happy: ['../assets/teiguo/happy/happy_001.png', '../assets/teiguo/happy/happy_002.png', '../assets/teiguo/happy/happy_003.png', '../assets/teiguo/happy/happy_004.png']
};

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
let selectedPhotoDataUrl = '';

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
  const file = petPhotoInput.files && petPhotoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    selectedPhotoDataUrl = reader.result;
    petPhotoPreview.src = selectedPhotoDataUrl;
    petPhotoPreview.classList.add('visible');
    photoPrompt.textContent = 'Photo selected';
    assetNote.textContent = 'Photo received. Next step: generate a full-body animated sprite sheet from this pet, then extract transparent action frames.';
  });
  reader.readAsDataURL(file);
});

generatePet.addEventListener('click', () => {
  if (!selectedPhotoDataUrl && !petPhotoPreview.src) {
    assetNote.textContent = 'Choose a pet photo first. A full-body photo gives the generator enough shape, markings, and posture information.';
    return;
  }
  assetNote.textContent = 'Generation backend is not wired into this local app yet. In the finished product, this button sends the photo to the sprite generator and returns idle/scout/sleep/celebrate transparent frames. For now, use the Tieguo dev sample to test the lead flow.';
});

createPet.addEventListener('click', async () => {
  const photoDataUrl = selectedPhotoDataUrl || petPhotoPreview.src || '';
  const name = petNameInput.value.trim() || 'Your pet';
  savePetProfile({
    name,
    photoDataUrl,
    assetMode: 'generated',
    generatedFrom: photoDataUrl ? 'uploaded-photo-dev-sample' : 'default-teiguo',
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
stopAnimationOnFirstFrame('idle');
scheduleScouting();
setInterval(watchGlobalCursor, 180);
