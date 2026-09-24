const pet = document.getElementById('pet');
const petContext = pet.getContext('2d', { alpha: true, desynchronized: true });
const animationTiming = window.PET_ANIMATION_TIMING;
const stage = document.getElementById('stage');
const petWrap = document.getElementById('petWrap');
const scoutButterfly = document.getElementById('scoutButterfly');
const fallbackPet = document.getElementById('fallbackPet');
const leadCard = document.getElementById('leadCard');
const resultCard = document.getElementById('resultCard');
const petSetup = document.getElementById('petSetup');
const preferenceSetup = document.getElementById('preferenceSetup');
const roleChoices = document.getElementById('roleChoices');
const interestChoices = document.getElementById('interestChoices');
const savePreferences = document.getElementById('savePreferences');
const skipPreferences = document.getElementById('skipPreferences');
const backPreference = document.getElementById('backPreference');
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
const resetPet = document.getElementById('resetPet');
const resetPetLead = document.getElementById('resetPetLead');
const minimize = document.getElementById('minimize');
const quit = document.getElementById('quit');
const approveLead = document.getElementById('approveLead');
const skipLead = document.getElementById('skipLead');
const skipFeedback = document.getElementById('skipFeedback');
const feedbackChoices = document.getElementById('feedbackChoices');
const skipWithoutFeedback = document.getElementById('skipWithoutFeedback');
const reviewPlan = document.getElementById('reviewPlan');
const showResult = document.getElementById('showResult');
const closeResult = document.getElementById('closeResult');
const backToLead = document.getElementById('backToLead');
const briefPanel = document.getElementById('briefPanel');
const closeBrief = document.getElementById('closeBrief');

const bridge = window.teiguoWindow || {
  moveBy: () => Promise.resolve(),
  setAlwaysOnTop: (enabled) => Promise.resolve(Boolean(enabled)),
  setMode: () => Promise.resolve(),
  minimize: () => Promise.resolve(),
  getCursorPosition: () => Promise.resolve(null),
  getCodexStatus: () => Promise.resolve({ available: false }),
  generatePetWithCodex: () => Promise.resolve({ ok: false, error: 'Codex integration is unavailable.' }),
  onGenerationProgress: () => () => {},
  getMahStatus: () => Promise.resolve({ connected: false, mode: 'preview', label: 'MAH preview adapter' }),
  openMahOpportunity: () => Promise.resolve({ opened: false, target: 'unconfigured' }),
  registerMahProjectEntry: () => Promise.resolve({ id: 'preview-entry:opportunity-pet', isLive: false }),
  createOpportunityRoutemap: () => Promise.reject(new Error('MAH integration is unavailable.')),
  getMahProjectSnapshot: () => Promise.reject(new Error('MAH integration is unavailable.')),
  submitMahCheckpointDecision: () => Promise.reject(new Error('MAH integration is unavailable.')),
  quit: () => window.close()
};

const preferenceApi = window.SCOUT_PREFERENCE_API;
const sourceOpportunities = window.OPPORTUNITIES || [];
const SCOUT_PREFERENCES_KEY = 'opportunityPet.scoutPreferences';
const SCOUT_FEEDBACK_KEY = 'opportunityPet.scoutFeedback';
let scoutPreferences = loadScoutPreferences();
let scoutFeedback = loadScoutFeedback();
let pendingRole = scoutPreferences?.role || '';
let pendingInterests = new Set(scoutPreferences?.interests || []);
let opportunities = preferenceApi.rankOpportunities(sourceOpportunities, scoutPreferences || {}, scoutFeedback);
const defaultActions = {
  // Keep the resting camera angle consistent with the side-view scout walk.
  idle: ['../assets/teiguo/settle/settle_003.png'],
  walk: [
    '../assets/teiguo/walk-v2/walk_001.png',
    '../assets/teiguo/walk-v2/walk_002.png',
    '../assets/teiguo/walk-v2/walk_003.png',
    '../assets/teiguo/walk-v2/walk_004.png',
    '../assets/teiguo/walk-v2/walk_005.png',
    '../assets/teiguo/walk-v2/walk_006.png',
    '../assets/teiguo/walk-v2/walk_007.png',
    '../assets/teiguo/walk-v2/walk_008.png'
  ],
  settle: [
    '../assets/teiguo/walk-v2/walk_008.png',
    '../assets/teiguo/settle/settle_002.png',
    '../assets/teiguo/settle/settle_003.png'
  ],
  // The approved seated gaze set: each frame changes only Iron's attention,
  // so pointer tracking never rotates or crops the pet layer.
  gaze: [
    '../assets/animations/gaze-up-left-v1.png',
    '../assets/animations/gaze-intermediate-v1/frame-00.png',
    '../assets/animations/gaze-up-v1.png',
    '../assets/animations/gaze-intermediate-v1/frame-01.png',
    '../assets/animations/gaze-up-right-v1.png',
    '../assets/animations/gaze-intermediate-v1/frame-02.png',
    '../assets/animations/gaze-right-v1.png',
    '../assets/animations/gaze-intermediate-v1/frame-03.png',
    '../assets/animations/gaze-down-right-v2.png',
    '../assets/animations/gaze-intermediate-v1/frame-04.png',
    '../assets/animations/gaze-down-v2.png',
    '../assets/animations/gaze-intermediate-v1/frame-05.png',
    '../assets/animations/gaze-down-left-v2.png',
    '../assets/animations/gaze-intermediate-v1/frame-06.png',
    '../assets/animations/gaze-left-v2.png',
    '../assets/animations/gaze-intermediate-v1/frame-07.png'
  ],
  sleep: ['../assets/teiguo/sleep/side-curl.png'],
  happy: ['../assets/teiguo/happy/happy_001.png', '../assets/teiguo/happy/happy_002.png', '../assets/teiguo/happy/happy_003.png', '../assets/teiguo/happy/happy_004.png'],
  chase: ['../assets/teiguo/chase/chase_001.png', '../assets/teiguo/chase/chase_002.png', '../assets/teiguo/chase/chase_003.png', '../assets/teiguo/chase/chase_004.png'],
  catch: ['../assets/teiguo/catch/catch_001.png', '../assets/teiguo/catch/catch_002.png', '../assets/teiguo/catch/catch_003.png', '../assets/teiguo/catch/catch_004.png', '../assets/teiguo/catch/catch_005.png'],
  yawn: ['../assets/teiguo/yawn/yawn_001.png', '../assets/teiguo/yawn/yawn_002.png', '../assets/teiguo/yawn/yawn_003.png', '../assets/teiguo/yawn/yawn_004.png']
};
const ACTION_PACK_POLICY_VERSION = 6;
const DEFAULT_IRON_ASSET_VERSION = 2;

function defaultIronProfile(name = 'Iron') {
  return {
    name: name && name !== 'Your pet' ? name : 'Iron',
    photoDataUrl: '',
    assetMode: 'generated',
    sourcePhotoCount: 0,
    generatedFrom: 'default-iron',
    defaultAssetVersion: DEFAULT_IRON_ASSET_VERSION,
    createdAt: new Date().toISOString()
  };
}

function withActionFallbacks(imported) {
  if (!imported) return defaultActions;
  const samePetIdle = imported.idle?.length
    ? imported.idle
    : imported.walk?.length
      ? [imported.walk[0]]
      : imported.sleep?.length
        ? [imported.sleep[0]]
        : null;
  if (!samePetIdle) return defaultActions;
  return {
    idle: samePetIdle,
    walk: imported.walk || samePetIdle,
    settle: imported.settle || samePetIdle,
    gaze: imported.gaze || samePetIdle,
    sleep: imported.sleep || samePetIdle,
    happy: imported.happy || samePetIdle,
    chase: imported.chase || imported.walk || samePetIdle,
    catch: imported.catch || imported.happy || samePetIdle,
    yawn: imported.yawn || samePetIdle
  };
}

let currentAction = 'idle';
let frameIndex = 0;
let animationFrameRequest = null;
let animationState = { running: false, loop: false, frameDuration: 260, startedAt: null, onComplete: null, onCancel: null };
const PET_RENDER_BOTTOM_PADDING = 24;
// Keep active motions above the stutter threshold while leaving quiet states gentle.
const actionFrameDurations = Object.freeze({
  walk: 130,
  settle: 260,
  sleep: 300,
  chase: 100,
  yawn: 150
});
let renderedActionFrames = {};
let actionPackLoadToken = 0;
let settleTimer = null;
let scoutingTimer = null;
let ambientTimer = null;
let currentLeadIndex = -1;
let currentLead = null;
let pinned = false;
let dragging = null;
let lastCursor = null;
let manualModeUntil = 0;
let petProfile = loadPetProfile();
// Iron is the built-in sample: never let an old imported sheet override its shipped actions.
let actions = petProfile?.generatedFrom === 'default-iron'
  ? defaultActions
  : withActionFallbacks(loadImportedActions());
let actionMetadata = petProfile?.generatedFrom === 'default-iron' ? {} : loadImportedActionMetadata();
let selectedPhotoDataUrls = [];
let photoValidationIssue = '';
let importedSpriteSheet = localStorage.getItem('opportunityPet.spriteSheet') || '';
let petMotionTimer = null;
let isScouting = false;
let scoutingRunToken = 0;
let codexAvailable = false;
let generationBusy = false;
let generationStatusTimer = null;
let preferenceCueTimer = null;
let lastButterflyPoint = null;
let preferenceButterflyTarget = null;
let preferenceButterflyFrame = null;
let preferenceGazeFrame = 6;
let mahStatus = null;
let currentMahSnapshot = null;
let workflowPollingTimer = null;
let workflowRestoreToken = 0;
const PROJECT_INDEX_KEY = 'opportunityPet.mahProjectIndex';

pin.style.opacity = '0.48';

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function canBeginScouting() {
  return preferenceApi.canBeginScouting({
    hasPet: Boolean(petProfile),
    hasPreferences: Boolean(scoutPreferences),
    setupVisible: petSetup.classList.contains('visible'),
    preferencesVisible: preferenceSetup.classList.contains('visible')
  });
}

function cancelAutonomousPetActivity() {
  scoutingRunToken += 1;
  isScouting = false;
  manualModeUntil = 0;
  clearTimeout(scoutingTimer);
  clearTimeout(ambientTimer);
  clearTimeout(settleTimer);
  setPetMotion('');
}

function updateGeneratePetButton() {
  if (generationBusy) {
    generatePet.disabled = true;
    generatePet.textContent = 'Generating with Codex...';
    return;
  }
  if (!codexAvailable) {
    generatePet.disabled = true;
    generatePet.textContent = 'Codex not detected';
    return;
  }
  if (selectedPhotoDataUrls.length < 3) {
    const needed = 3 - selectedPhotoDataUrls.length;
    generatePet.disabled = true;
    generatePet.textContent = selectedPhotoDataUrls.length
      ? `Add ${needed} more photo${needed > 1 ? 's' : ''}`
      : 'Add 3-5 photos first';
    return;
  }
  if (photoValidationIssue) {
    generatePet.disabled = true;
    generatePet.textContent = 'Replace unusable photos';
    return;
  }
  generatePet.disabled = false;
  generatePet.textContent = 'Generate with Codex';
}

function setPetMotion(motion, duration = 0) {
  clearTimeout(petMotionTimer);
  petWrap.classList.remove('pacing', 'found', 'chasing', 'resting', 'settling', 'pouncing');
  if (motion) petWrap.classList.add(motion);
  if (motion && duration > 0) {
    petMotionTimer = setTimeout(() => {
      petWrap.classList.remove(motion);
      if (motion === 'chasing') petWrap.classList.add('found');
    }, duration);
  }
}

function settleToIdle(onComplete) {
  clearTimeout(settleTimer);
  setPetMotion('');
  playActionOnce('settle', undefined, 'idle', onComplete, false, onComplete);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function renderPreferenceButterfly(timestamp) {
  if (!preferenceButterflyTarget || !scoutButterfly.classList.contains('visible')) {
    preferenceButterflyFrame = null;
    return;
  }
  if (!lastButterflyPoint) lastButterflyPoint = { ...preferenceButterflyTarget };
  lastButterflyPoint.x += (preferenceButterflyTarget.x - lastButterflyPoint.x) * 0.24;
  lastButterflyPoint.y += (preferenceButterflyTarget.y - lastButterflyPoint.y) * 0.24;
  scoutButterfly.style.setProperty('--butterfly-x', `${(lastButterflyPoint.x - 13).toFixed(2)}px`);
  scoutButterfly.style.setProperty('--butterfly-y', `${(lastButterflyPoint.y - 11).toFixed(2)}px`);
  scoutButterfly.style.setProperty('--flutter-x', `${(Math.sin(timestamp / 360) * 4).toFixed(2)}px`);
  scoutButterfly.style.setProperty('--flutter-y', `${(Math.cos(timestamp / 420) * 5).toFixed(2)}px`);
  updatePreferenceGaze(lastButterflyPoint);
  preferenceButterflyFrame = requestAnimationFrame(renderPreferenceButterfly);
}

function setPreferenceButterflyPoint(x, y, immediate = false) {
  const stageRect = stage.getBoundingClientRect();
  const targetX = clamp(x - stageRect.left, 18, Math.max(18, stageRect.width - 32));
  const targetY = clamp(y - stageRect.top, 60, Math.max(60, stageRect.height - 28));
  preferenceButterflyTarget = { x: targetX, y: targetY };
  if (immediate || !lastButterflyPoint) lastButterflyPoint = { ...preferenceButterflyTarget };
  if (preferenceButterflyFrame === null) preferenceButterflyFrame = requestAnimationFrame(renderPreferenceButterfly);
}

function placeDefaultPreferenceButterfly() {
  const stageRect = stage.getBoundingClientRect();
  const petRect = petWrap.getBoundingClientRect();
  setPreferenceButterflyPoint(
    petRect.left + petRect.width * 0.76,
    Math.min(stageRect.bottom - 160, petRect.top + petRect.height * 0.18),
    true
  );
}

function hidePreferenceButterfly() {
  clearTimeout(preferenceCueTimer);
  if (preferenceButterflyFrame !== null) cancelAnimationFrame(preferenceButterflyFrame);
  preferenceCueTimer = null;
  preferenceButterflyFrame = null;
  preferenceButterflyTarget = null;
  lastButterflyPoint = null;
  scoutButterfly.classList.remove('visible');
  drawCurrentFrame();
}

function startPreferenceButterflyCue() {
  hidePreferenceButterfly();
  if (document.body.dataset.view !== 'preferences' || preferenceSetup.dataset.step !== 'role') return;
  setPreferenceGazeFrame(6);
  scoutButterfly.classList.add('visible');
  placeDefaultPreferenceButterfly();
}

function setPreferenceGazeFrame(index) {
  cancelCurrentAnimation();
  currentAction = 'gaze';
  const frameCount = Math.max(1, renderedActionFrames.gaze?.length || actions.gaze.length);
  frameIndex = ((index % frameCount) + frameCount) % frameCount;
  drawCurrentFrame();
  setVisualClass('gaze', false);
}

function updatePreferenceGaze(point) {
  if (!point) return;
  const petRect = petWrap.getBoundingClientRect();
  const x = clamp((point.x - (petRect.left + petRect.width / 2)) / Math.max(1, petRect.width), -1, 1);
  const y = clamp((point.y - (petRect.top + petRect.height / 2)) / Math.max(1, petRect.height), -1, 1);
  const frameCount = Math.max(1, renderedActionFrames.gaze?.length || actions.gaze.length);
  const rightFrame = Math.round(frameCount * 3 / 8);
  const framePosition = ((Math.atan2(y, x) / (Math.PI * 2 / frameCount) + rightFrame) % frameCount + frameCount) % frameCount;
  const nextFrame = Math.round(framePosition) % frameCount;
  if (nextFrame === preferenceGazeFrame) return;
  preferenceGazeFrame = nextFrame;
  setPreferenceGazeFrame(preferenceGazeFrame);
}

function followPreferenceButterfly(event) {
  if (
    document.body.dataset.view !== 'preferences' ||
    preferenceSetup.dataset.step !== 'role' ||
    !scoutButterfly.classList.contains('visible')
  ) {
    return;
  }
  setPreferenceButterflyPoint(event.clientX, event.clientY);
}

function setVisualClass(action, moving = false) {
  pet.className = petProfile && petProfile.photoDataUrl && petProfile.assetMode !== 'generated' ? 'photo-pet' : '';
  fallbackPet.className = fallbackPet.className.replace(/\b(bob|happy|scouting)\b/g, '').trim();
  const target = renderedActionFrames[action]?.length ? pet : fallbackPet;
  if (moving && action === 'walk' && !petWrap.classList.contains('pacing')) target.classList.add('bob');
  if (action === 'happy') target.classList.add('happy');
  if (action === 'walk' && leadCard.classList.contains('visible')) target.classList.add('scouting');
}

function loadCanvasFrame(source) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', () => resolve(null), { once: true });
    image.src = source;
  });
}

async function preloadActionFrames(nextActions) {
  const token = ++actionPackLoadToken;
  const entries = await Promise.all(Object.entries(nextActions).map(async ([action, sources]) => {
    const frames = await Promise.all((sources || []).map(loadCanvasFrame));
    return [action, frames.filter(Boolean)];
  }));
  if (token !== actionPackLoadToken) return false;
  renderedActionFrames = Object.fromEntries(entries);
  drawCurrentFrame();
  return true;
}

function drawCanvasFrame(image) {
  const scale = Math.min(pet.width / image.naturalWidth, (pet.height - PET_RENDER_BOTTOM_PADDING) / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  petContext.imageSmoothingEnabled = true;
  petContext.imageSmoothingQuality = 'high';
  petContext.drawImage(image, (pet.width - width) / 2, pet.height - height - PET_RENDER_BOTTOM_PADDING / 2, width, height);
}

function showCanvasPet() {
  pet.style.display = '';
  fallbackPet.classList.remove('visible');
}

function drawCurrentFrame() {
  const frames = renderedActionFrames[currentAction] || [];
  const image = frames[frameIndex % Math.max(1, frames.length)];
  petContext.clearRect(0, 0, pet.width, pet.height);
  if (!image) {
    pet.style.display = 'none';
    fallbackPet.classList.add('visible');
    return;
  }
  drawCanvasFrame(image);
  showCanvasPet();
}

function isAnimationRunning() {
  return animationState.running;
}

function requestNextAnimationFrame() {
  if (animationFrameRequest === null) animationFrameRequest = requestAnimationFrame(runAnimationFrame);
}

function cancelCurrentAnimation() {
  if (animationFrameRequest !== null) cancelAnimationFrame(animationFrameRequest);
  animationFrameRequest = null;
  const onCancel = animationState.onCancel;
  animationState = { running: false, loop: false, frameDuration: 260, startedAt: null, onComplete: null, onCancel: null };
  if (onCancel) onCancel();
}

function runAnimationFrame(timestamp) {
  animationFrameRequest = null;
  if (!animationState.running) return;
  if (animationState.startedAt === null) animationState.startedAt = timestamp;

  const frameCount = Math.max(1, (actions[currentAction] || []).length);
  const elapsed = timestamp - animationState.startedAt;
  const duration = animationTiming.actionDuration(animationState.frameDuration, frameCount);
  if (!animationState.loop && elapsed >= duration) {
    const onComplete = animationState.onComplete;
    const nextAction = animationState.nextAction || 'idle';
    animationState.onCancel = null;
    if (animationState.holdLast) stopAnimationOnFrame(currentAction, frameCount - 1);
    else stopAnimationOnFirstFrame(nextAction);
    if (onComplete) onComplete();
    return;
  }

  const nextFrameIndex = animationTiming.frameIndexAtElapsed(
    elapsed,
    animationState.frameDuration,
    frameCount,
    animationState.loop
  );
  if (nextFrameIndex !== frameIndex) {
    frameIndex = nextFrameIndex;
    drawCurrentFrame();
  }
  requestNextAnimationFrame();
}

function loadImportedActions() {
  try {
    return JSON.parse(localStorage.getItem('opportunityPet.importedActions')) || null;
  } catch {
    return null;
  }
}

function loadImportedActionMetadata() {
  try {
    return JSON.parse(localStorage.getItem('opportunityPet.actionMetadata')) || {};
  } catch {
    return {};
  }
}

function frameDurationFor(action, fallback) {
  const fps = Number(actionMetadata[action]?.fps);
  return fps >= 1 && fps <= 30 ? 1000 / fps : actionFrameDurations[action] || fallback;
}

function startAnimation(action, speed, moving = false) {
  // The generated idle stills are separate poses, not a seamless loop.
  // Keep one calm pose on screen instead of looping between separate idle stills.
  if (action === 'idle') {
    stopAnimationOnFirstFrame('idle');
    return;
  }
  cancelCurrentAnimation();
  currentAction = action;
  frameIndex = 0;
  animationState = {
    running: true,
    loop: actionMetadata[action]?.loop !== false,
    frameDuration: speed ?? frameDurationFor(action, 220),
    startedAt: null,
    onComplete: null,
    onCancel: null
  };
  drawCurrentFrame();
  setVisualClass(action, moving);
  requestNextAnimationFrame();
}

function playActionOnce(action, speed, nextAction = 'idle', onComplete, holdLast = false, onCancel = null) {
  const frames = actions[action];
  if (!frames || !frames.length) {
    stopAnimationOnFirstFrame(nextAction);
    if (onComplete) onComplete();
    return;
  }

  cancelCurrentAnimation();
  currentAction = action;
  frameIndex = 0;
  animationState = {
    running: true,
    loop: false,
    frameDuration: speed ?? frameDurationFor(action, 180),
    startedAt: null,
    nextAction,
    onComplete,
    onCancel,
    holdLast
  };
  drawCurrentFrame();
  setVisualClass(action, true);
  requestNextAnimationFrame();
}

function stopAnimationOnFirstFrame(action = 'idle') {
  stopAnimationOnFrame(action, 0);
}

function stopAnimationOnFrame(action, index) {
  cancelCurrentAnimation();
  currentAction = action;
  const frameCount = Math.max(1, (actions[action] || []).length);
  frameIndex = Math.min(Math.max(0, index), frameCount - 1);
  drawCurrentFrame();
  setVisualClass(action, false);
}

function animateWhileCursorMoves() {
  // Cursor movement must never interrupt a guided scout sequence or the lead card.
  if (document.body.dataset.view !== 'pet' || Date.now() < manualModeUntil || isScouting) return;
  clearTimeout(ambientTimer);
  petWrap.classList.remove('settling');
  if (currentAction !== 'walk' || !isAnimationRunning()) startAnimation('walk', undefined, true);
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    if (Date.now() >= manualModeUntil) {
      settleToIdle(scheduleAmbient);
    }
  }, 850);
}

function setLeadText(lead) {
  const petName = petProfile?.name || 'Your pet';
  document.getElementById('cardEyebrow').textContent = `${petName.toUpperCase()} FOUND A LEAD`;
  document.getElementById('leadTitle').textContent = lead.title;
  document.getElementById('leadMatch').textContent = preferenceApi.explainOpportunityFit(lead, scoutPreferences || { skipped: true });
  document.getElementById('leadSummary').textContent = lead.summary;
  document.getElementById('leadType').textContent = lead.type;
  document.getElementById('leadEvidence').textContent = lead.evidence;
  document.getElementById('leadRisk').textContent = lead.risk;
  document.getElementById('briefOpportunity').textContent = `${lead.title} (${lead.type}): ${lead.summary}`;
  document.getElementById('briefV1').textContent = 'Waiting for the opportunity to be accepted.';
  document.getElementById('briefQuestions').innerHTML = '';
  setResultText(lead.result);
}

function setResultText(result = {}) {
  const isIllustrative = result.isIllustrative !== false;
  document.getElementById('resultProvenance').textContent = isIllustrative ? 'ILLUSTRATIVE TARGET' : 'LIVE CONNECTED RESULT';
  document.getElementById('resultProvenance').classList.toggle('live', !isIllustrative);
  document.getElementById('resultTitle').textContent = result.title || 'Pilot result';
  document.getElementById('resultSubtitle').textContent = result.subtitle || '';
  document.getElementById('resultRevenue').textContent = result.revenue || '$0';
  document.getElementById('resultCustomer').textContent = result.customer || 'Sample customer';
  document.getElementById('resultNote').textContent = result.note || '';
  document.getElementById('resultStats').innerHTML = (result.stats || []).map(([label, value]) => `
    <article>
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join('');
  document.getElementById('resultLedger').innerHTML = (result.ledger || []).map(([time, label, amount]) => `
    <div>
      <span>${time}</span>
      <strong>${label}</strong>
      <em>${amount}</em>
    </div>
  `).join('');
}

function loadPetProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem('opportunityPet.profile')) || null;
    const staleGeneratedPack = profile &&
      profile.generatedFrom === 'codex-action-pack' &&
      profile.actionPackPolicyVersion !== ACTION_PACK_POLICY_VERSION;
    const staleIronSample = profile &&
      profile.generatedFrom === 'default-iron' &&
      profile.defaultAssetVersion !== DEFAULT_IRON_ASSET_VERSION;
    const stalePhotoProfile = profile && profile.photoDataUrl;
    if (stalePhotoProfile) {
      const migratedProfile = defaultIronProfile(profile.name);
      localStorage.setItem('opportunityPet.profile', JSON.stringify(migratedProfile));
      localStorage.removeItem('opportunityPet.spriteSheet');
      localStorage.removeItem('opportunityPet.importedActions');
      localStorage.removeItem('opportunityPet.actionMetadata');
      return migratedProfile;
    }
    if (staleGeneratedPack || staleIronSample) {
      localStorage.removeItem('opportunityPet.profile');
      localStorage.removeItem('opportunityPet.importedActions');
      localStorage.removeItem('opportunityPet.actionMetadata');
      return null;
    }
    return profile;
  } catch {
    return null;
  }
}

function savePetProfile(profile) {
  localStorage.setItem('opportunityPet.profile', JSON.stringify(profile));
  petProfile = profile;
}

function loadScoutPreferences() {
  try {
    const preferences = JSON.parse(localStorage.getItem(SCOUT_PREFERENCES_KEY)) || null;
    return preferences?.version === preferenceApi.SCOUT_PREFERENCES.version ? preferences : null;
  } catch {
    return null;
  }
}

function loadScoutFeedback() {
  try {
    const feedback = JSON.parse(localStorage.getItem(SCOUT_FEEDBACK_KEY));
    return Array.isArray(feedback) ? feedback : [];
  } catch {
    return [];
  }
}

function hideSkipFeedback() {
  skipFeedback.parentElement.classList.remove('feedback-open');
}

function showSkipFeedback() {
  skipFeedback.parentElement.classList.add('feedback-open');
}

function recordLeadFeedback(reason) {
  if (!currentLead) return;
  scoutFeedback.push({
    opportunityId: currentLead.id,
    reason,
    roles: currentLead.roles || [],
    interests: currentLead.interests || [],
    effortLevel: currentLead.effortLevel || 2,
    riskLevel: currentLead.riskLevel || 2,
    createdAt: new Date().toISOString()
  });
  scoutFeedback = scoutFeedback.slice(-50);
  localStorage.setItem(SCOUT_FEEDBACK_KEY, JSON.stringify(scoutFeedback));
  opportunities = preferenceApi.rankOpportunities(sourceOpportunities, scoutPreferences || {}, scoutFeedback);
  currentLeadIndex = opportunities.findIndex((opportunity) => opportunity.id === currentLead.id);
}

function renderFeedbackChoices() {
  feedbackChoices.replaceChildren();
  preferenceApi.SCOUT_PREFERENCES.feedbackReasons.forEach((reason) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'feedback-reason';
    button.dataset.feedbackReason = reason.id;
    button.textContent = reason.label;
    button.addEventListener('click', async () => {
      recordLeadFeedback(reason.id);
      await skipCurrentLead();
    });
    feedbackChoices.appendChild(button);
  });
}

function hidePreferencePanel() {
  hidePreferenceButterfly();
  preferenceSetup.classList.remove('visible');
  preferenceSetup.setAttribute('aria-hidden', 'true');
  preferenceSetup.inert = true;
}

function updatePreferenceActions() {
  const ready = Boolean(pendingRole && pendingInterests.size);
  savePreferences.disabled = !ready;
  if (preferenceSetup.dataset.step === 'role') {
    document.getElementById('preferenceHint').textContent = 'Choose one to continue.';
    return;
  }
  document.getElementById('preferenceHint').textContent = ready
    ? 'That is enough. I can learn the rest from what you choose.'
    : 'Choose at least one. You can change this later.';
}

function setPreferenceStep(step) {
  preferenceSetup.dataset.step = step;
  const isRole = step === 'role';
  const petName = (petProfile?.name || 'YOUR PET').toUpperCase();
  document.getElementById('preferenceEyebrow').textContent = `${petName} · ${isRole ? '1' : '2'} OF 2`;
  document.getElementById('preferenceTitle').textContent = isRole ? 'What are you good at?' : 'What should I look for?';
  document.getElementById('preferenceSummary').textContent = isRole
    ? 'Pick the role that feels closest. I will learn the details later.'
    : 'Choose one or more. I will bring the promising ones back to you.';
  updatePreferenceActions();
}

function renderPreferenceChoices() {
  roleChoices.replaceChildren();
  interestChoices.replaceChildren();

  preferenceApi.SCOUT_PREFERENCES.roles.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-chip';
    button.dataset.roleId = option.id;
    button.textContent = option.label;
    button.setAttribute('aria-pressed', String(pendingRole === option.id));
    button.addEventListener('click', () => {
      pendingRole = option.id;
      roleChoices.querySelectorAll('.choice-chip').forEach((chip) => {
        chip.setAttribute('aria-pressed', String(chip === button));
      });
      clearTimeout(preferenceCueTimer);
      preferenceCueTimer = null;
      setPreferenceStep('interests');
      hidePreferenceButterfly();
      stopAnimationOnFirstFrame('idle');
    });
    roleChoices.appendChild(button);
  });

  preferenceApi.SCOUT_PREFERENCES.interests.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-chip';
    button.dataset.interestId = option.id;
    button.textContent = option.label;
    button.setAttribute('aria-pressed', String(pendingInterests.has(option.id)));
    button.addEventListener('click', () => {
      if (option.id === 'open') {
        pendingInterests = pendingInterests.has('open') ? new Set() : new Set(['open']);
      } else {
        pendingInterests.delete('open');
        if (pendingInterests.has(option.id)) pendingInterests.delete(option.id);
        else pendingInterests.add(option.id);
      }
      interestChoices.querySelectorAll('.choice-chip').forEach((chip) => {
        chip.setAttribute('aria-pressed', String(pendingInterests.has(chip.dataset.interestId)));
      });
      updatePreferenceActions();
    });
    interestChoices.appendChild(button);
  });
  setPreferenceStep('role');
}

async function showPreferenceSetup() {
  cancelAutonomousPetActivity();
  hideSetupPanel();
  leadCard.classList.remove('visible');
  resultCard.classList.remove('visible');
  preferenceSetup.classList.add('visible');
  preferenceSetup.removeAttribute('aria-hidden');
  preferenceSetup.inert = false;
  setPreferenceStep('role');
  document.body.dataset.view = 'preferences';
  stopAnimationOnFirstFrame('idle');
  await bridge.setMode('preferences');
  if (document.body.dataset.view !== 'preferences' || preferenceSetup.dataset.step !== 'role') return;
  startPreferenceButterflyCue();
}

async function finishPreferenceSetup(preferences) {
  scoutPreferences = preferences;
  localStorage.setItem(SCOUT_PREFERENCES_KEY, JSON.stringify(preferences));
  opportunities = preferenceApi.rankOpportunities(sourceOpportunities, preferences, scoutFeedback);
  currentLeadIndex = -1;
  hidePreferencePanel();
  await scoutForLead();
}

function hideSetupPanel() {
  petSetup.classList.remove('visible');
  petSetup.setAttribute('aria-hidden', 'true');
  petSetup.inert = true;
}

function setBriefOpen(open) {
  document.body.classList.toggle('brief-open', Boolean(open));
  if (!open && reviewPlan) reviewPlan.textContent = 'View managed workflow';
}

function applyPetProfile() {
  if (!petProfile) {
    cancelAutonomousPetActivity();
    hidePreferencePanel();
    petSetup.classList.add('visible');
    petSetup.removeAttribute('aria-hidden');
    petSetup.inert = false;
    petSetup.scrollTop = 0;
    document.body.dataset.view = 'setup';
    bridge.setMode('setup');
    requestAnimationFrame(() => {
      petSetup.scrollTop = 0;
    });
    return;
  }

  hideSetupPanel();
  pet.setAttribute('aria-label', petProfile.name || 'Opportunity Pet');
  document.body.dataset.hasPet = 'true';
  if (petProfile.photoDataUrl) {
    pet.classList.toggle('photo-pet', petProfile.assetMode !== 'generated');
    if (petProfile.assetMode !== 'generated') {
      const staticActions = Object.fromEntries(Object.keys(defaultActions).map((action) => [action, [petProfile.photoDataUrl]]));
      preloadActionFrames(staticActions);
    }
  } else {
    pet.classList.remove('photo-pet');
  }
  if (!scoutPreferences) {
    showPreferenceSetup();
    return;
  }
  hidePreferencePanel();
  document.body.dataset.view = 'pet';
  bridge.setMode('pet');
}

function nextLead() {
  stopWorkflowPolling();
  hideSkipFeedback();
  currentMahSnapshot = null;
  workflowRestoreToken += 1;
  currentLeadIndex = (currentLeadIndex + 1) % opportunities.length;
  currentLead = opportunities[currentLeadIndex];
  setLeadText(currentLead);
  reviewPlan.disabled = true;
  skipLead.disabled = false;
  approveLead.disabled = false;
  approveLead.textContent = 'Make this happen →';
  showResult.textContent = 'Preview target outcome';
}

function loadProjectIndex() {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_INDEX_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProjectForLead(lead, snapshot) {
  if (!lead?.id || !snapshot?.project?.id) return;
  const index = loadProjectIndex();
  index[lead.id] = snapshot.project.id;
  localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(index));
}

async function restoreProjectForLead(lead) {
  const projectId = lead?.id ? loadProjectIndex()[lead.id] : '';
  if (!projectId) return;
  const token = ++workflowRestoreToken;
  document.getElementById('leadStatus').textContent = 'Restoring MAH project...';
  approveLead.disabled = true;
  approveLead.textContent = 'Restoring project...';
  try {
    const snapshot = await bridge.getMahProjectSnapshot(projectId);
    if (token !== workflowRestoreToken || currentLead?.id !== lead.id) return;
    renderMahSnapshot(snapshot);
    if (snapshot.routemap?.status !== 'route_running') startWorkflowPolling();
  } catch (error) {
    if (token !== workflowRestoreToken || currentLead?.id !== lead.id) return;
    document.getElementById('leadStatus').textContent = `Saved MAH project unavailable: ${error.message || error}`;
    approveLead.textContent = 'Reconnect MAH to resume';
    approveLead.disabled = true;
  }
}

async function showLeadCard() {
  if (!opportunities.length || leadCard.classList.contains('visible')) return;
  nextLead();
  hideSetupPanel();
  hidePreferencePanel();
  resultCard.classList.remove('visible');
  leadCard.classList.add('visible');
  leadCard.scrollTop = 0;
  document.body.dataset.view = 'lead';
  setBriefOpen(false);
  briefPanel.classList.remove('visible');
  document.getElementById('leadStatus').textContent = 'Waiting for owner approval';
  // Finish curling down before the one-minute resting hold begins.
  playActionOnce('sleep', undefined, 'sleep', () => {
    if (document.body.dataset.view !== 'lead') return;
    clearTimeout(ambientTimer);
    ambientTimer = setTimeout(() => {
      if (document.body.dataset.view !== 'lead') return;
      setPetMotion('found');
      stopAnimationOnFirstFrame('idle');
    }, 60000);
  }, true);
  setPetMotion('resting');
  await bridge.setMode('lead');
}

async function scoutForLead() {
  if (!canBeginScouting() || isScouting || leadCard.classList.contains('visible') || resultCard.classList.contains('visible')) return false;
  const runToken = ++scoutingRunToken;
  isScouting = true;
  clearTimeout(scoutingTimer);
  clearTimeout(ambientTimer);
  clearTimeout(settleTimer);
  try {
    hideSetupPanel();
    hidePreferencePanel();
    document.body.dataset.view = 'scout';
    setPetMotion('pacing');
    startAnimation('walk', undefined, true);
    await bridge.setMode('scout');
    // Walking is a loop, so this is an intentional scouting dwell—not a guessed action duration.
    await wait(2500);
    if (runToken !== scoutingRunToken || !canBeginScouting()) return false;
    await new Promise((resolve) => settleToIdle(resolve));
    if (runToken !== scoutingRunToken || !canBeginScouting()) return false;
    await showLeadCard();
    return true;
  } finally {
    if (runToken === scoutingRunToken) isScouting = false;
  }
}

async function closeLeadCardView() {
  hideSetupPanel();
  hidePreferencePanel();
  leadCard.classList.remove('visible');
  resultCard.classList.remove('visible');
  briefPanel.classList.remove('visible');
  setBriefOpen(false);
  hideSkipFeedback();
  document.body.dataset.view = 'pet';
  setPetMotion('');
  await bridge.setMode('pet');
  stopAnimationOnFirstFrame('idle');
  scheduleAmbient();
  scheduleScouting();
}

function scheduleScouting() {
  clearTimeout(scoutingTimer);
  if (!canBeginScouting() || document.body.dataset.view !== 'pet') return;
  scoutingTimer = setTimeout(scoutForLead, 18000);
}

function scheduleAmbient() {
  clearTimeout(ambientTimer);
  const view = document.body.dataset.view;
  if (!canBeginScouting() || isScouting || resultCard.classList.contains('visible') || (view !== 'pet' && view !== 'lead')) return;
  // A lead stays quiet long enough to read; it may only rest, never resume scouting.
  const delay = view === 'lead' ? 6000 : 8500 + Math.round(Math.random() * 5000);
  ambientTimer = setTimeout(runAmbientAction, delay);
}

function runAmbientAction() {
  const view = document.body.dataset.view;
  if (!canBeginScouting() || isScouting || resultCard.classList.contains('visible') || (view !== 'pet' && view !== 'lead') || Date.now() < manualModeUntil) {
    scheduleAmbient();
    return;
  }

  if (view === 'lead') return;

  manualModeUntil = Number.POSITIVE_INFINITY;
  if (Math.random() < 0.52) {
    setPetMotion('resting');
    playActionOnce('yawn', undefined, 'idle', () => {
      manualModeUntil = 0;
      setPetMotion('');
      scheduleAmbient();
    });
    return;
  }

  setPetMotion('resting');
  playActionOnce('sleep', undefined, 'sleep', () => {
    ambientTimer = setTimeout(() => {
      manualModeUntil = 0;
      setPetMotion('');
      stopAnimationOnFirstFrame('idle');
      scheduleAmbient();
    }, 4600);
  }, true);
}

function opportunityRoutemapPayload() {
  if (!currentLead) return null;
  return {
    idempotencyKey: `opportunity:${currentLead.id || currentLead.title}`,
    opportunity: {
      id: currentLead.id,
      title: currentLead.title,
      type: currentLead.type,
      summary: currentLead.summary,
      evidence: currentLead.evidence,
      risk: currentLead.risk,
      smallestExperiment: currentLead.v1,
      recommendedDirection: currentLead.recommendedDirection,
      checks: currentLead.routemapChecks,
      salesChannel: 'Gumroad'
    },
    scoutingPreferences: scoutPreferences
  };
}

function routemapStatusText(snapshot) {
  const prefix = snapshot.isLive ? 'MAH' : 'Preview';
  const status = snapshot.routemap?.status;
  const labels = {
    accepted: `${prefix}: opportunity accepted`,
    route_created: `${prefix}: routemap created`,
    product_build: `${prefix}: product tasks delegated`,
    listing_preparation: `${prefix}: store listing prepared`,
    store_monitoring: `${prefix}: store monitor scheduled`,
    route_running: `${prefix}: routemap running`
  };
  return labels[status] || `${prefix}: ${snapshot.routemap?.statusLabel || status}`;
}

function renderMahSnapshot(snapshot) {
  currentMahSnapshot = snapshot;
  const routemap = snapshot.routemap || {};
  document.getElementById('leadStatus').textContent = routemapStatusText(snapshot);
  document.getElementById('briefV1').textContent = routemap.statusLabel || routemap.status;
  const phaseList = document.getElementById('briefQuestions');
  phaseList.replaceChildren();
  (routemap.phases || []).forEach((phase) => {
    const row = document.createElement('span');
    row.className = `workflow-phase ${phase.state || 'pending'}`;
    const marker = phase.state === 'complete' ? '✓' : phase.state === 'active' ? '●' : '○';
    row.textContent = `${marker} ${phase.label || phase.key || 'Workflow step'}`;
    phaseList.appendChild(row);
  });
  document.getElementById('mahConnection').textContent = snapshot.isLive
    ? `MAH project ${snapshot.project?.id} · Routemap ${routemap.id}`
    : `Local preview ${snapshot.project?.id}. No live MAH routemap, task, schedule, listing, order, or revenue has been created.`;
  reviewPlan.disabled = false;
  approveLead.disabled = true;
  approveLead.textContent = 'Workflow started';
  skipLead.disabled = true;
  if (!briefPanel.classList.contains('visible')) reviewPlan.textContent = 'View managed workflow';
  if (snapshot.result && currentLead?.result) {
    const livePresentation = snapshot.isLive && snapshot.result.isIllustrative === false
      ? (snapshot.result.presentation || snapshot.result)
      : null;
    setResultText(livePresentation || {
      ...currentLead.result,
      isIllustrative: true,
      note: snapshot.result.note || currentLead.result.note
    });
    showResult.textContent = livePresentation ? 'View live result' : 'Preview target outcome';
  }
  if (routemap.status === 'route_running') {
    setPetMotion('found');
    if (currentAction !== 'chase' && currentAction !== 'idle') startAnimation('idle');
  }
}

function stopWorkflowPolling() {
  clearInterval(workflowPollingTimer);
  workflowPollingTimer = null;
}

function startWorkflowPolling() {
  stopWorkflowPolling();
  if (!currentMahSnapshot?.project?.id) return;
  workflowPollingTimer = setInterval(async () => {
    try {
      const snapshot = await bridge.getMahProjectSnapshot(currentMahSnapshot.project.id);
      renderMahSnapshot(snapshot);
      if (snapshot.routemap?.status === 'route_running') stopWorkflowPolling();
    } catch (error) {
      document.getElementById('leadStatus').textContent = `MAH status unavailable: ${error.message || error}`;
    }
  }, 2000);
}

async function approveCurrentLead() {
  if (!currentLead || approveLead.disabled) return;
  approveLead.disabled = true;
  approveLead.textContent = 'Opening MAH...';
  document.getElementById('leadStatus').textContent = 'Sending this opportunity to MAH...';
  try {
    const launch = await bridge.openMahOpportunity(opportunityRoutemapPayload());
    if (!launch?.opened) {
      leadCard.dataset.approved = 'false';
      document.getElementById('leadStatus').textContent = launch?.message || 'MAH download page is not configured yet.';
      approveLead.disabled = false;
      approveLead.textContent = 'Make this happen →';
      return;
    }
    leadCard.dataset.approved = 'true';
    leadCard.dataset.mahLaunchTarget = launch.target || '';
    document.getElementById('leadStatus').textContent = {
      desktop: 'Opening this opportunity in MAH...',
      web: 'Opening MAH web with this opportunity attached...',
      download: 'MAH is not installed yet. Opening the official download page...'
    }[launch.target] || 'Opening MAH...';
    setPetMotion('chasing');
    playActionOnce('chase', undefined, 'idle', () => {
      setPetMotion('found');
      startAnimation('idle');
    });
  } catch (error) {
    leadCard.dataset.approved = 'false';
    leadCard.dataset.mahLaunchTarget = '';
    document.getElementById('leadStatus').textContent = `Could not open MAH: ${error.message || error}`;
    approveLead.disabled = false;
    approveLead.textContent = 'Make this happen →';
  } finally {
    if (leadCard.dataset.approved === 'true') {
      approveLead.textContent = launchTargetLabel(leadCard.dataset.mahLaunchTarget);
    }
  }
}

function launchTargetLabel(target) {
  return target === 'download' ? 'Download MAH to continue' : 'Opened in MAH';
}

async function skipCurrentLead() {
  hideSetupPanel();
  hideSkipFeedback();
  leadCard.dataset.approved = 'false';
  leadCard.classList.remove('visible');
  briefPanel.classList.remove('visible');
  setBriefOpen(false);
  setPetMotion('');
  await scoutForLead();
}

function closePlanPanel() {
  briefPanel.classList.remove('visible');
  setBriefOpen(false);
  if (currentMahSnapshot) renderMahSnapshot(currentMahSnapshot);
  reviewPlan.textContent = 'View managed workflow';
  setPetMotion('found');
  stopAnimationOnFirstFrame('idle');
  leadCard.scrollTop = 0;
}

async function reviewCurrentPlan() {
  if (!currentMahSnapshot) return;
  if (briefPanel.classList.contains('visible')) {
    closePlanPanel();
    return;
  }
  leadCard.dataset.approved = 'true';
  setBriefOpen(true);
  briefPanel.classList.add('visible');
  reviewPlan.textContent = 'Back to lead';
  requestAnimationFrame(() => {
    briefPanel.scrollIntoView({ block: 'nearest' });
  });
  renderMahSnapshot(currentMahSnapshot);
  reviewPlan.textContent = 'Back to lead';
}

async function showResultPage() {
  if (!currentLead) return;
  hideSetupPanel();
  hidePreferencePanel();
  leadCard.classList.remove('visible');
  briefPanel.classList.remove('visible');
  setBriefOpen(false);
  resultCard.classList.add('visible');
  document.body.dataset.view = 'result';
  setPetMotion('found');
  stopAnimationOnFirstFrame('idle');
  await bridge.setMode('result');
}

async function closeResultPage() {
  hideSetupPanel();
  resultCard.classList.remove('visible');
  leadCard.classList.add('visible');
  document.body.dataset.view = 'lead';
  await bridge.setMode('lead');
}

async function resetPetProfile() {
  if (!window.confirm('Change pet and return to setup?')) return;
  stopWorkflowPolling();
  currentMahSnapshot = null;
  clearTimeout(scoutingTimer);
  clearTimeout(ambientTimer);
  clearTimeout(settleTimer);
  clearTimeout(petMotionTimer);
  localStorage.removeItem('opportunityPet.profile');
  localStorage.removeItem('opportunityPet.importedActions');
  localStorage.removeItem('opportunityPet.actionMetadata');
  localStorage.removeItem('opportunityPet.spriteSheet');
  localStorage.removeItem(SCOUT_PREFERENCES_KEY);
  scoutPreferences = null;
  pendingRole = '';
  pendingInterests = new Set();
  opportunities = preferenceApi.rankOpportunities(sourceOpportunities, {}, scoutFeedback);
  renderPreferenceChoices();
  selectedPhotoDataUrls = [];
  photoValidationIssue = '';
  importedSpriteSheet = '';
  petProfile = null;
  actions = defaultActions;
  actionMetadata = {};
  await preloadActionFrames(actions);
  petPhotoInput.value = '';
  spriteSheetInput.value = '';
  petPhotoPreview.innerHTML = '';
  petPhotoPreview.classList.remove('visible');
  spritePreview.removeAttribute('src');
  spritePreview.classList.remove('visible');
  photoPrompt.textContent = 'Choose 3-5 pet photos';
  assetNote.textContent = 'Best order: front view, side full-body view, standing view, then sleeping or curled-up view. Distinct markings should be visible in more than one photo.';
  updatePipeline('photos');
  updateGeneratePetButton();
  stopAnimationOnFirstFrame('idle');
  await closeLeadCardView();
  applyPetProfile();
}

petPhotoInput.addEventListener('change', () => {
  const files = Array.from(petPhotoInput.files || []).slice(0, 5);
  if (!files.length) return;
  selectedPhotoDataUrls = [];
  photoValidationIssue = '';
  petPhotoPreview.innerHTML = '';

  Promise.all(files.map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(file);
  }))).then(async (images) => {
    selectedPhotoDataUrls = images;
    petPhotoPreview.classList.add('visible');
    images.forEach((src, index) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Pet source ${index + 1}`;
      petPhotoPreview.appendChild(img);
    });
    const loadedImages = await Promise.all(images.map(loadImage));
    const duplicateCount = images.length - new Set(images).size;
    const smallPhoto = loadedImages.findIndex((image) => Math.min(image.naturalWidth, image.naturalHeight) < 480);
    if (duplicateCount) {
      photoValidationIssue = `Replace ${duplicateCount} duplicate photo${duplicateCount > 1 ? 's' : ''}. Three copies of one view still count as one useful view.`;
    } else if (smallPhoto >= 0) {
      const image = loadedImages[smallPhoto];
      photoValidationIssue = `Photo ${smallPhoto + 1} is only ${image.naturalWidth}×${image.naturalHeight}. Use at least 480 px on the shortest side.`;
    }
    photoPrompt.textContent = `${images.length} photo${images.length > 1 ? 's' : ''} selected${photoValidationIssue ? ' · needs attention' : ''}`;
    const enough = images.length >= 3;
    assetNote.textContent = photoValidationIssue || (enough
      ? 'Basic checks passed. Use different front, side full-body, standing, and resting views so the identity step can verify the whole pet.'
      : 'Add at least 3 photos so the generator can infer the whole pet instead of guessing from one angle.');
    updateGeneratePetButton();
  }).catch(() => {
    photoValidationIssue = 'One selected file could not be read as an image. Replace it with a PNG, JPEG, or WebP file.';
    assetNote.textContent = photoValidationIssue;
    updateGeneratePetButton();
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

function setGenerationBusy(busy) {
  generationBusy = busy;
  updateGeneratePetButton();
  petPhotoInput.disabled = busy;
  if (busy) {
    createPet.textContent = 'Use Iron while Codex works';
  } else {
    clearInterval(generationStatusTimer);
    generationStatusTimer = null;
    createPet.textContent = 'Use Iron sample';
  }
}

function startGenerationStatusTimer(logPath = '') {
  const startedAt = Date.now();
  clearInterval(generationStatusTimer);
  generationStatusTimer = setInterval(() => {
    if (!generationBusy) return;
    const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const logHint = logPath ? ` Log: ${logPath}` : '';
    assetNote.textContent = `Codex is still generating the action pack in the background (${elapsed} min). Image generation can take several minutes; you can use the Iron sample while it works.${logHint}`;
  }, 30000);
}

async function activateGeneratedPet(nextActions, generatedFrom, extraProfile = {}, nextActionMetadata = {}) {
  actions = withActionFallbacks(nextActions);
  actionMetadata = nextActionMetadata;
  localStorage.setItem('opportunityPet.importedActions', JSON.stringify(actions));
  localStorage.setItem('opportunityPet.actionMetadata', JSON.stringify(actionMetadata));
  await preloadActionFrames(actions);
  updatePipeline('ready');
  const name = petName();
  savePetProfile({
    name,
    photoDataUrl: '',
    assetMode: 'generated',
    sourcePhotoCount: selectedPhotoDataUrls.length,
    generatedFrom,
    actionPackPolicyVersion: ACTION_PACK_POLICY_VERSION,
    createdAt: new Date().toISOString(),
    ...extraProfile
  });
  applyPetProfile();
  if (scoutPreferences) await scoutForLead();
}

generatePet.addEventListener('click', async () => {
  if (selectedPhotoDataUrls.length < 3 || photoValidationIssue) {
    assetNote.textContent = photoValidationIssue || 'Choose 3-5 pet photos first. This helps the pet feel like your actual pet, not a one-photo sticker.';
    return;
  }
  setGenerationBusy(true);
  updatePipeline('identity');
  assetNote.textContent = 'Starting Codex. It will build one locked pet identity, then generate the complete standardized action pack. This can take 10-15 minutes.';
  startGenerationStatusTimer();
  try {
    const result = await bridge.generatePetWithCodex({
      petName: petName(),
      photos: selectedPhotoDataUrls
    });
    if (!result.ok) {
      const detail = result.logPath ? ` Log: ${result.logPath}` : '';
      assetNote.textContent = `${result.error || 'Codex could not generate a complete pet action pack.'}${detail} Nothing partial was imported. Improve the photo set or try again; Iron remains available only as a separate sample.`;
      updatePipeline('photos');
      return;
    }
    await activateGeneratedPet(result.actions, 'codex-action-pack', { generationJobId: result.jobId }, result.actionMetadata);
    assetNote.textContent = 'Standard pet action pack ready: the locked identity, transitions, 16-direction gaze, and complete behavior set were generated and imported.';
  } catch (error) {
    assetNote.textContent = `Codex generation failed, so no partial or recolored substitute was imported: ${error.message || error}`;
    updatePipeline('photos');
  } finally {
    setGenerationBusy(false);
  }
});

spriteSheetInput.addEventListener('change', async () => {
  const file = spriteSheetInput.files && spriteSheetInput.files[0];
  if (!file) return;
  importedSpriteSheet = await readFileAsDataUrl(file);
  localStorage.setItem('opportunityPet.spriteSheet', importedSpriteSheet);
  spritePreview.src = importedSpriteSheet;
  spritePreview.classList.add('visible');
  actions = withActionFallbacks(await extractSpriteSheet(importedSpriteSheet));
  actionMetadata = {};
  localStorage.setItem('opportunityPet.importedActions', JSON.stringify(actions));
  localStorage.removeItem('opportunityPet.actionMetadata');
  await preloadActionFrames(actions);
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
  if (scoutPreferences) await scoutForLead();
});

createPet.addEventListener('click', async () => {
  actions = defaultActions;
  actionMetadata = {};
  localStorage.removeItem('opportunityPet.actionMetadata');
  await preloadActionFrames(actions);
  const name = petNameInput.value.trim() || 'Iron';
  savePetProfile({ ...defaultIronProfile(name), sourcePhotoCount: selectedPhotoDataUrls.length });
  applyPetProfile();
  if (scoutPreferences) await scoutForLead();
});
savePreferences.addEventListener('click', async () => {
  if (!pendingRole || !pendingInterests.size) return;
  await finishPreferenceSetup({
    version: preferenceApi.SCOUT_PREFERENCES.version,
    role: pendingRole,
    interests: Array.from(pendingInterests),
    skipped: false,
    updatedAt: new Date().toISOString()
  });
});
skipPreferences.addEventListener('click', async () => {
  await finishPreferenceSetup({
    version: preferenceApi.SCOUT_PREFERENCES.version,
    role: '',
    interests: [],
    skipped: true,
    updatedAt: new Date().toISOString()
  });
});
backPreference.addEventListener('click', () => setPreferenceStep('role'));
closeCard.addEventListener('click', closeLeadCardView);
approveLead.addEventListener('click', approveCurrentLead);
skipLead.addEventListener('click', showSkipFeedback);
skipWithoutFeedback.addEventListener('click', skipCurrentLead);
reviewPlan.addEventListener('click', reviewCurrentPlan);
closeBrief.addEventListener('click', closePlanPanel);
showResult.addEventListener('click', showResultPage);
closeResult.addEventListener('click', closeResultPage);
backToLead.addEventListener('click', closeResultPage);
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

window.addEventListener('pointermove', (event) => {
  followPreferenceButterfly(event);
  animateWhileCursorMoves();
});

pin.addEventListener('click', async (event) => {
  event.stopPropagation();
  pinned = await bridge.setAlwaysOnTop(!pinned);
  pin.style.opacity = pinned ? '1' : '0.48';
});

resetPet.addEventListener('click', (event) => {
  event.stopPropagation();
  resetPetProfile();
});

resetPetLead.addEventListener('click', (event) => {
  event.stopPropagation();
  resetPetProfile();
});

minimize.addEventListener('click', (event) => {
  event.stopPropagation();
  bridge.minimize();
});

quit.addEventListener('click', (event) => {
  event.stopPropagation();
  if (!window.confirm('Quit Opportunity Pet?')) return;
  bridge.quit();
});

async function watchGlobalCursor() {
  const point = await bridge.getCursorPosition();
  if (
    point &&
    Number.isFinite(point.clientX) &&
    Number.isFinite(point.clientY) &&
    document.body.dataset.view === 'preferences' &&
    preferenceSetup.dataset.step === 'role' &&
    scoutButterfly.classList.contains('visible')
  ) {
    setPreferenceButterflyPoint(point.clientX, point.clientY);
  }
  if (point && lastCursor && (Math.abs(point.x - lastCursor.x) > 1 || Math.abs(point.y - lastCursor.y) > 1)) {
    animateWhileCursorMoves();
  }
  if (point) lastCursor = point;
}

renderPreferenceChoices();
renderFeedbackChoices();
applyPetProfile();
bridge.onGenerationProgress((message) => {
  const logMatch = /Log: (.+)$/.exec(message);
  if (logMatch) startGenerationStatusTimer(logMatch[1]);
  assetNote.textContent = /generating|started|still running|studying/i.test(message)
    ? `${message} This can take 10-15 minutes because Codex is creating one locked identity and 80 standardized animation frames.`
    : message;
  if (/action sheet|generating|checking/i.test(message)) updatePipeline('sprite');
});
bridge.getCodexStatus().then((status) => {
  codexAvailable = Boolean(status && status.available);
  generatePet.disabled = !codexAvailable;
  if (codexAvailable && !petProfile) {
    assetNote.textContent = `Codex detected at ${status.path}. Model: ${status.model || 'default'}. Choose 3-5 photos, then click Generate with Codex.`;
  } else if (!codexAvailable && !petProfile) {
    assetNote.textContent = 'Codex CLI was not found. Install and sign in to Codex to reconstruct your own pet, or use Iron as the clearly separate sample.';
  }
  updateGeneratePetButton();
}).catch(() => {
  codexAvailable = false;
  updateGeneratePetButton();
});
bridge.getMahStatus().then((status) => {
  mahStatus = status;
  approveLead.textContent = 'Make this happen →';
  document.getElementById('mahConnection').textContent = status.message || status.label || 'MAH status available.';
}).catch((error) => {
  mahStatus = { connected: false, mode: 'unavailable' };
  approveLead.textContent = 'Make this happen →';
  approveLead.disabled = false;
  document.getElementById('mahConnection').textContent = `MAH connection unavailable: ${error.message || error}`;
});
bridge.registerMahProjectEntry({
  key: 'opportunity-pet',
  title: 'Opportunity Pet',
  launchSurfaces: ['mah-project', 'desktop']
}).catch(() => {
  // Status messaging already explains whether the production MAH connection is available.
});
if (importedSpriteSheet) {
  spritePreview.src = importedSpriteSheet;
  spritePreview.classList.add('visible');
  updatePipeline('ready');
}
preloadActionFrames(actions).then((loaded) => {
  if (!loaded) return;
  const watchingButterfly = document.body.dataset.view === 'preferences' && scoutButterfly.classList.contains('visible');
  if (watchingButterfly) setPreferenceGazeFrame(preferenceGazeFrame);
  else stopAnimationOnFirstFrame('idle');
  scheduleAmbient();
  scheduleScouting();
});
setInterval(watchGlobalCursor, 33);
