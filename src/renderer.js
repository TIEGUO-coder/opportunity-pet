const pet = document.getElementById('pet');
const petContext = pet.getContext('2d', { alpha: true, desynchronized: true });
const animationTiming = window.PET_ANIMATION_TIMING;
const petWrap = document.getElementById('petWrap');
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
const generateLocalPet = document.getElementById('generateLocalPet');
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
  idle: ['../assets/teiguo/idle/idle_001.png', '../assets/teiguo/idle/idle_002.png', '../assets/teiguo/idle/idle_003.png', '../assets/teiguo/idle/idle_004.png'],
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
  sleep: ['../assets/teiguo/sleep/sleep_001.png', '../assets/teiguo/sleep/sleep_002.png', '../assets/teiguo/sleep/sleep_003.png', '../assets/teiguo/sleep/sleep_004.png'],
  happy: ['../assets/teiguo/happy/happy_001.png', '../assets/teiguo/happy/happy_002.png', '../assets/teiguo/happy/happy_003.png', '../assets/teiguo/happy/happy_004.png'],
  chase: ['../assets/teiguo/chase/chase_001.png', '../assets/teiguo/chase/chase_002.png', '../assets/teiguo/chase/chase_003.png', '../assets/teiguo/chase/chase_004.png'],
  yawn: ['../assets/teiguo/yawn/yawn_001.png', '../assets/teiguo/yawn/yawn_002.png', '../assets/teiguo/yawn/yawn_003.png', '../assets/teiguo/yawn/yawn_004.png']
};
const ACTION_PACK_POLICY_VERSION = 2;

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
let animationFrameRequest = null;
let animationState = { running: false, loop: false, frameDuration: 260, startedAt: null, onComplete: null };
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
let selectedPhotoDataUrls = [];
let importedSpriteSheet = localStorage.getItem('opportunityPet.spriteSheet') || '';
let petMotionTimer = null;
let isScouting = false;
let codexAvailable = false;
let generationBusy = false;
let generationStatusTimer = null;
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
  generatePet.disabled = false;
  generatePet.textContent = 'Generate with Codex';
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

function drawCurrentFrame() {
  const frames = renderedActionFrames[currentAction] || [];
  const image = frames[frameIndex % Math.max(1, frames.length)];
  petContext.clearRect(0, 0, pet.width, pet.height);
  if (!image) {
    pet.style.display = 'none';
    fallbackPet.classList.add('visible');
    return;
  }
  const scale = Math.min(pet.width / image.naturalWidth, pet.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  petContext.imageSmoothingEnabled = true;
  petContext.imageSmoothingQuality = 'high';
  petContext.drawImage(image, (pet.width - width) / 2, pet.height - height, width, height);
  pet.style.display = '';
  fallbackPet.classList.remove('visible');
}

function isAnimationRunning() {
  return animationState.running;
}

function requestNextAnimationFrame() {
  if (animationFrameRequest === null) animationFrameRequest = requestAnimationFrame(runAnimationFrame);
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
    stopAnimationOnFirstFrame(nextAction);
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

function startAnimation(action, speed = 260, moving = false) {
  currentAction = action;
  frameIndex = 0;
  if (animationFrameRequest !== null) cancelAnimationFrame(animationFrameRequest);
  animationFrameRequest = null;
  animationState = { running: true, loop: true, frameDuration: speed, startedAt: null, onComplete: null };
  drawCurrentFrame();
  setVisualClass(action, moving);
  requestNextAnimationFrame();
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
  if (animationFrameRequest !== null) cancelAnimationFrame(animationFrameRequest);
  animationFrameRequest = null;
  animationState = {
    running: true,
    loop: false,
    frameDuration: speed,
    startedAt: null,
    nextAction,
    onComplete
  };
  drawCurrentFrame();
  setVisualClass(action, true);
  requestNextAnimationFrame();
}

function stopAnimationOnFirstFrame(action = 'idle') {
  if (animationFrameRequest !== null) cancelAnimationFrame(animationFrameRequest);
  animationFrameRequest = null;
  animationState = { running: false, loop: false, frameDuration: 260, startedAt: null, onComplete: null };
  currentAction = action;
  frameIndex = 0;
  drawCurrentFrame();
  setVisualClass(action, false);
}

function animateWhileCursorMoves() {
  if (Date.now() < manualModeUntil || leadCard.classList.contains('visible') || resultCard.classList.contains('visible') || isScouting) return;
  clearTimeout(ambientTimer);
  if (currentAction !== 'walk' || !isAnimationRunning()) startAnimation('walk', 140, true);
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
    if (
      profile &&
      profile.generatedFrom === 'codex-action-pack' &&
      profile.actionPackPolicyVersion !== ACTION_PACK_POLICY_VERSION
    ) {
      localStorage.removeItem('opportunityPet.profile');
      localStorage.removeItem('opportunityPet.importedActions');
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
    return JSON.parse(localStorage.getItem(SCOUT_PREFERENCES_KEY)) || null;
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
      setPreferenceStep('interests');
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
  approveLead.textContent = mahStatus?.connected ? 'Accept and start in MAH' : 'Accept and preview handoff';
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
  stopAnimationOnFirstFrame('idle');
  setPetMotion('found');
  manualModeUntil = Date.now() + 1600;
  clearTimeout(ambientTimer);
  await bridge.setMode('lead');
  await restoreProjectForLead(currentLead);
}

async function scoutForLead() {
  if (isScouting || leadCard.classList.contains('visible') || resultCard.classList.contains('visible')) return;
  isScouting = true;
  clearTimeout(scoutingTimer);
  clearTimeout(ambientTimer);
  hideSetupPanel();
  hidePreferencePanel();
  document.body.dataset.view = 'scout';
  setPetMotion('pacing');
  startAnimation('walk', 140, true);
  manualModeUntil = Date.now() + 2600;
  await bridge.setMode('scout');
  await wait(2240);
  setPetMotion('');
  await showLeadCard();
  isScouting = false;
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
  if (!petProfile) return;
  scoutingTimer = setTimeout(scoutForLead, 18000);
}

function scheduleAmbient() {
  clearTimeout(ambientTimer);
  if (!petProfile || isScouting || leadCard.classList.contains('visible') || resultCard.classList.contains('visible')) return;
  const delay = 8500 + Math.round(Math.random() * 5000);
  ambientTimer = setTimeout(runAmbientAction, delay);
}

function runAmbientAction() {
  if (!petProfile || isScouting || leadCard.classList.contains('visible') || resultCard.classList.contains('visible') || Date.now() < manualModeUntil) {
    scheduleAmbient();
    return;
  }

  manualModeUntil = Date.now() + 5200;
  if (Math.random() < 0.52) {
    setPetMotion('resting');
    playActionOnce('yawn', 180, 'idle', () => {
      setPetMotion('');
      scheduleAmbient();
    });
    return;
  }

  setPetMotion('resting');
  startAnimation('sleep', 420, false);
  ambientTimer = setTimeout(() => {
    setPetMotion('');
    stopAnimationOnFirstFrame('idle');
    scheduleAmbient();
  }, 4600);
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
    stopAnimationOnFirstFrame('happy');
    setPetMotion('found');
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
  approveLead.textContent = mahStatus?.connected ? 'Starting in MAH...' : 'Starting handoff preview...';
  document.getElementById('leadStatus').textContent = mahStatus?.connected
    ? 'Sending opportunity directly to MAH...'
    : 'Preparing a local MAH handoff preview...';
  try {
    const snapshot = await bridge.createOpportunityRoutemap(opportunityRoutemapPayload());
    leadCard.dataset.approved = 'true';
    saveProjectForLead(currentLead, snapshot);
    renderMahSnapshot(snapshot);
    startWorkflowPolling();
    setPetMotion('chasing', 1500);
    playActionOnce('chase', 125, 'idle', () => setPetMotion('found'));
  } catch (error) {
    leadCard.dataset.approved = 'false';
    document.getElementById('leadStatus').textContent = `Could not start MAH workflow: ${error.message || error}`;
  } finally {
    approveLead.disabled = Boolean(currentMahSnapshot);
    approveLead.textContent = currentMahSnapshot ? 'Routemap started' : (mahStatus?.connected ? 'Accept and start in MAH' : 'Accept and preview handoff');
  }
}

async function skipCurrentLead() {
  hideSetupPanel();
  hideSkipFeedback();
  leadCard.dataset.approved = 'false';
  leadCard.classList.remove('visible');
  briefPanel.classList.remove('visible');
  setBriefOpen(false);
  setPetMotion('');
  document.body.dataset.view = 'pet';
  await bridge.setMode('pet');
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
  localStorage.removeItem('opportunityPet.spriteSheet');
  selectedPhotoDataUrls = [];
  importedSpriteSheet = '';
  petProfile = null;
  actions = defaultActions;
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

function rgbToCss(rgb) {
  return `rgb(${rgb.map((value) => Math.round(value)).join(', ')})`;
}

function averageSamples(samples, fallback) {
  if (!samples.length) return fallback;
  return samples.reduce((sum, color) => [
    sum[0] + color[0],
    sum[1] + color[1],
    sum[2] + color[2]
  ], [0, 0, 0]).map((value) => value / samples.length);
}

function extractPaletteFromImages(images) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = 64;
  canvas.height = 64;

  const orange = [];
  const dark = [];
  const light = [];

  images.forEach((img) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawImageCover(context, img, 0, 0, canvas.width, canvas.height);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const average = (r + g + b) / 3;
      if (r > 110 && r > g * 1.06 && r > b * 1.18 && g > 45) orange.push([r, g, b]);
      if (average < 92 && Math.max(r, g, b) - Math.min(r, g, b) < 90) dark.push([r, g, b]);
      if (r > 165 && g > 150 && b > 130) light.push([r, g, b]);
    }
  });

  return {
    creamRgb: averageSamples(light, [248, 237, 218]),
    orangeRgb: averageSamples(orange, [181, 102, 43]),
    darkRgb: averageSamples(dark, [48, 39, 31]),
    cream: rgbToCss(averageSamples(light, [248, 237, 218])),
    orange: rgbToCss(averageSamples(orange, [181, 102, 43])),
    dark: rgbToCss(averageSamples(dark, [48, 39, 31])),
    outline: '#2f2822',
    eye: '#b88d39',
    nose: '#d28c7d'
  };
}

function drawEllipse(context, x, y, rx, ry, rotation, fill, stroke = null, lineWidth = 4) {
  context.beginPath();
  context.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }
}

function drawEar(context, x, y, side, palette) {
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + side * 22, y - 46);
  context.lineTo(x + side * 42, y + 4);
  context.closePath();
  context.fillStyle = palette.cream;
  context.fill();
  context.strokeStyle = palette.outline;
  context.lineWidth = 4;
  context.stroke();
  context.beginPath();
  context.moveTo(x + side * 10, y - 4);
  context.lineTo(x + side * 22, y - 28);
  context.lineTo(x + side * 31, y + 2);
  context.closePath();
  context.fillStyle = '#e8b4a4';
  context.fill();
}

function drawFace(context, x, y, scale, palette, mood = 'idle') {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  drawEar(context, -38, -30, -1, palette);
  drawEar(context, 38, -30, 1, palette);
  drawEllipse(context, 0, 2, 58, 52, 0, palette.cream, palette.outline);
  drawEllipse(context, -22, 0, 23, 40, -0.28, palette.orange);
  drawEllipse(context, 24, -6, 20, 34, 0.34, palette.dark);
  drawEllipse(context, -18, 6, 7, 10, 0, palette.eye, palette.outline, 2);
  drawEllipse(context, 18, 6, 7, 10, 0, palette.eye, palette.outline, 2);
  context.fillStyle = '#211b18';
  context.beginPath();
  context.arc(-18, 7, 3, 0, Math.PI * 2);
  context.arc(18, 7, 3, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.moveTo(-5, 22);
  context.quadraticCurveTo(0, 27, 5, 22);
  context.quadraticCurveTo(0, 18, -5, 22);
  context.fillStyle = palette.nose;
  context.fill();
  context.strokeStyle = palette.outline;
  context.lineWidth = 2;
  [-1, 1].forEach((side) => {
    context.beginPath();
    context.moveTo(side * 8, 26);
    context.lineTo(side * 42, 19);
    context.moveTo(side * 7, 31);
    context.lineTo(side * 43, 33);
    context.stroke();
  });
  if (mood === 'yawn') {
    drawEllipse(context, 0, 37, 14, 18, 0, '#3a2420');
  } else {
    context.beginPath();
    context.arc(-6, 29, 7, 0, Math.PI * 0.9);
    context.arc(6, 29, 7, Math.PI * 0.1, Math.PI);
    context.stroke();
  }
  context.restore();
}

function drawFrontCat(context, action, frame, palette) {
  const bob = Math.sin((frame / 4) * Math.PI * 2);
  const yawnScale = action === 'yawn' ? 1 + Math.sin((frame / 3) * Math.PI) * 0.05 : 1;
  context.save();
  context.translate(140, 132 + (action === 'idle' ? bob * 2 : 0));
  context.rotate(action === 'happy' ? (frame % 2 ? 0.05 : -0.05) : 0);
  drawEllipse(context, 0, 45, 46, 68 * yawnScale, 0, palette.cream, palette.outline);
  drawEllipse(context, -23, 28, 20, 46, -0.35, palette.orange);
  drawEllipse(context, 26, 38, 18, 44, 0.25, palette.dark);
  drawEllipse(context, 42, 64, 13, 58, -0.45, palette.dark, palette.outline, 3);
  drawEllipse(context, -20, 104, 12, 28, -0.05, palette.cream, palette.outline, 3);
  drawEllipse(context, 20, 104, 12, 28, 0.05, palette.cream, palette.outline, 3);
  drawFace(context, 0, -40, 1, palette, action);
  if (action === 'happy') {
    drawButterfly(context, -62 + frame * 8, -84 + bob * 6, frame % 2 ? 2 : -2);
  }
  context.restore();
}

function drawSideCat(context, action, frame, palette) {
  const step = frame % 2 === 0 ? -1 : 1;
  const chase = action === 'chase';
  context.save();
  context.translate(chase ? 132 + frame * 8 : 145 + step * 5, chase ? 146 - Math.sin((frame / 3) * Math.PI) * 18 : 145);
  drawEllipse(context, 0, 28, 78, 43, -0.04, palette.cream, palette.outline);
  drawEllipse(context, -26, 18, 35, 35, -0.2, palette.orange);
  drawEllipse(context, 20, 28, 30, 38, 0.18, palette.dark);
  for (let i = 0; i < 4; i += 1) {
    context.strokeStyle = i % 2 ? palette.orange : palette.dark;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(22 + i * 9, -1);
    context.lineTo(10 + i * 8, 28);
    context.stroke();
  }
  drawEllipse(context, -44 + step * 4, 72, 10, 31, 0.08, palette.cream, palette.outline, 3);
  drawEllipse(context, -4 - step * 3, 73, 10, 31, -0.08, palette.cream, palette.outline, 3);
  drawEllipse(context, 34 + step * 3, 72, 10, 29, 0.08, palette.dark, palette.outline, 3);
  context.save();
  context.translate(63, 8);
  context.rotate(-0.9 + step * 0.08);
  drawEllipse(context, 0, 0, 13, 76, 0, palette.dark, palette.outline, 3);
  context.strokeStyle = palette.orange;
  context.lineWidth = 5;
  [ -32, -12, 8, 28 ].forEach((y) => {
    context.beginPath();
    context.moveTo(-9, y);
    context.lineTo(9, y + 2);
    context.stroke();
  });
  context.restore();
  context.save();
  context.translate(-58, -6);
  context.scale(0.8, 0.8);
  drawFace(context, 0, 0, 1, palette, 'idle');
  context.restore();
  context.restore();
  if (chase) drawButterfly(context, 202 - frame * 5, 72 + Math.sin(frame) * 12, frame % 2 ? 3 : -2);
}

function drawSleepCat(context, frame, palette) {
  const breath = Math.sin((frame / 4) * Math.PI * 2) * 2;
  context.save();
  context.translate(140, 142 + breath);
  drawEllipse(context, 0, 22, 76, 56, -0.12, palette.cream, palette.outline);
  drawEllipse(context, -28, 15, 35, 45, -0.4, palette.orange);
  drawEllipse(context, 22, 20, 32, 43, 0.4, palette.dark);
  context.save();
  context.translate(35, 30);
  context.rotate(1.15);
  drawEllipse(context, 0, 0, 13, 76, 0, palette.dark, palette.outline, 3);
  context.restore();
  context.save();
  context.translate(-46, -12);
  context.scale(0.76, 0.76);
  drawFace(context, 0, 0, 1, palette, 'sleep');
  context.strokeStyle = palette.outline;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-25, 6);
  context.quadraticCurveTo(-18, 12, -11, 6);
  context.moveTo(12, 6);
  context.quadraticCurveTo(19, 12, 26, 6);
  context.stroke();
  context.restore();
  context.restore();
}

function makePetFrame(palette, action, frame) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 280;
  canvas.height = 280;

  if (action === 'sleep') {
    drawSleepCat(context, frame, palette);
  } else if (action === 'walk') {
    drawSideCat(context, action, frame, palette);
  } else if (action === 'chase') {
    drawSideCat(context, action, frame, palette);
  } else {
    drawFrontCat(context, action, frame, palette);
  }

  return canvas.toDataURL('image/png');
}

function blendChannel(source, target, amount) {
  return source + (target - source) * amount;
}

function tintPixel(data, index, target, amount) {
  data[index] = blendChannel(data[index], target[0], amount);
  data[index + 1] = blendChannel(data[index + 1], target[1], amount);
  data[index + 2] = blendChannel(data[index + 2], target[2], amount);
}

function recolorTemplateImageData(imageData, palette) {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 24) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    const spread = Math.max(r, g, b) - Math.min(r, g, b);

    if (brightness > 170 && spread < 65) {
      tintPixel(data, i, palette.creamRgb, 0.18);
    } else if (r > 112 && g > 55 && r > b * 1.08 && brightness > 82) {
      tintPixel(data, i, palette.orangeRgb, 0.22);
    } else if (brightness < 116) {
      tintPixel(data, i, palette.darkRgb, 0.16);
    }
  }
  return imageData;
}

function makeTemplatePetFrame(template, palette) {
  const source = document.createElement('canvas');
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  source.width = template.naturalWidth;
  source.height = template.naturalHeight;
  sourceContext.drawImage(template, 0, 0);
  const imageData = sourceContext.getImageData(0, 0, source.width, source.height);
  sourceContext.putImageData(recolorTemplateImageData(imageData, palette), 0, 0);

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 280;
  canvas.height = 280;
  const maxWidth = 258;
  const maxHeight = 258;
  const scale = Math.min(maxWidth / source.width, maxHeight / source.height, 1);
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);
  const x = Math.round((canvas.width - width) / 2);
  const y = Math.round(canvas.height - height - 10);
  context.drawImage(source, x, y, width, height);
  return canvas.toDataURL('image/png');
}

async function generateActionsFromPhotos(images) {
  const loaded = await Promise.all(images.map(loadImage));
  const palette = extractPaletteFromImages(loaded);
  const sources = ['idle', 'walk', 'sleep', 'happy', 'chase', 'yawn'];

  const generated = {};
  for (const action of sources) {
    generated[action] = [];
    for (let frame = 0; frame < 4; frame += 1) {
      const template = await loadImage(defaultActions[action][frame]);
      generated[action].push(makeTemplatePetFrame(template, palette));
    }
  }
  return generated;
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
  generateLocalPet.disabled = busy;
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

async function activateGeneratedPet(nextActions, generatedFrom, extraProfile = {}) {
  actions = withActionFallbacks(nextActions);
  localStorage.setItem('opportunityPet.importedActions', JSON.stringify(actions));
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

function shouldUseLocalStylizedFallback(error) {
  return Boolean(String(error || '').trim());
}

async function activateLocalStylizedFallback(reason = '', extraProfile = {}) {
  updatePipeline('sprite');
  assetNote.textContent = 'Codex could not finish a full action pack, so I am building a transparent animated scout from your pet photos now.';
  const localActions = await generateActionsFromPhotos(selectedPhotoDataUrls);
  const generatedFrom = extraProfile.generationJobId ? 'codex-assisted-local-render' : 'local-stylized-fallback';
  await activateGeneratedPet(localActions, generatedFrom, { codexError: reason, ...extraProfile });
  assetNote.textContent = extraProfile.generationJobId
    ? 'Codex handed off to the local action renderer. Your animated scout is ready.'
    : 'Local animated scout ready. It uses colors inferred from your photos and includes every action state.';
}

generatePet.addEventListener('click', async () => {
  if (selectedPhotoDataUrls.length < 3) {
    assetNote.textContent = 'Choose 3-5 pet photos first. This helps the pet feel like your actual pet, not a one-photo sticker.';
    return;
  }
  setGenerationBusy(true);
  updatePipeline('identity');
  assetNote.textContent = 'Starting Codex. It will infer the pet identity, generate a character sheet, then six action strips. This can take several minutes.';
  startGenerationStatusTimer();
  try {
    const result = await bridge.generatePetWithCodex({
      petName: petName(),
      photos: selectedPhotoDataUrls
    });
    if (!result.ok) {
      const detail = result.logPath ? ` Log: ${result.logPath}` : '';
      if (shouldUseLocalStylizedFallback(result.error)) {
        await activateLocalStylizedFallback(`${result.error || 'Codex image generation failed.'}${detail}`, {
          generationJobId: result.jobId || '',
          codexLogPath: result.logPath || '',
          codexModel: result.codexModel || ''
        });
        return;
      }
      assetNote.textContent = `${result.error || 'Codex could not generate the cartoon action pack.'}${detail} You can use the Iron sample now, or regenerate after Codex is ready.`;
      updatePipeline('photos');
      return;
    }
    await activateGeneratedPet(result.actions, 'codex-action-pack', { generationJobId: result.jobId });
    assetNote.textContent = 'Codex action pack ready: six identity-consistent actions were generated and imported.';
  } catch (error) {
    if (shouldUseLocalStylizedFallback(error.message || String(error))) {
      await activateLocalStylizedFallback(error.message || String(error));
      return;
    }
    assetNote.textContent = `Codex generation failed: ${error.message || error}`;
    updatePipeline('photos');
  } finally {
    setGenerationBusy(false);
  }
});

generateLocalPet.addEventListener('click', async () => {
  if (selectedPhotoDataUrls.length < 3) {
    assetNote.textContent = 'Choose 3-5 pet photos first.';
    return;
  }
  const confirmed = window.confirm('Generate a local transparent cartoon scout from your uploaded photo colors. It is less faithful than AI image generation, but it creates the full action pack now. Continue?');
  if (!confirmed) return;
  setGenerationBusy(true);
  assetNote.textContent = 'Building a local stylized cartoon action pack from the supplied views.';
  try {
    const localActions = await generateActionsFromPhotos(selectedPhotoDataUrls);
    await activateGeneratedPet(localActions, 'local-stylized-fallback');
    assetNote.textContent = 'Local cartoon action pack ready. Use Generate with Codex later for a more identity-faithful version.';
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
  localStorage.setItem('opportunityPet.importedActions', JSON.stringify(actions));
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
  await preloadActionFrames(actions);
  const name = petNameInput.value.trim() || 'Iron';
  savePetProfile({
    name,
    photoDataUrl: '',
    assetMode: 'generated',
    sourcePhotoCount: selectedPhotoDataUrls.length,
    generatedFrom: 'default-iron',
    createdAt: new Date().toISOString()
  });
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

window.addEventListener('pointermove', animateWhileCursorMoves);

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
  bridge.quit();
});

async function watchGlobalCursor() {
  const point = await bridge.getCursorPosition();
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
    ? `${message} This can take several minutes because Codex is creating 7 images and 24 animation frames.`
    : message;
  if (/six action|generating|checking/i.test(message)) updatePipeline('sprite');
});
bridge.getCodexStatus().then((status) => {
  codexAvailable = Boolean(status && status.available);
  generatePet.disabled = !codexAvailable;
  if (codexAvailable && !petProfile) {
    assetNote.textContent = `Codex detected at ${status.path}. Model: ${status.model || 'default'}. Choose 3-5 photos, then click Generate with Codex.`;
  } else if (!codexAvailable && !petProfile) {
    assetNote.textContent = 'Codex CLI was not found. Install and sign in to Codex for AI character generation, or use the local cartoon fallback under Advanced.';
  }
  updateGeneratePetButton();
}).catch(() => {
  codexAvailable = false;
  updateGeneratePetButton();
});
bridge.getMahStatus().then((status) => {
  mahStatus = status;
  approveLead.textContent = status.connected ? 'Accept and start in MAH' : 'Accept and preview handoff';
  document.getElementById('mahConnection').textContent = status.message || status.label || 'MAH status available.';
}).catch((error) => {
  mahStatus = { connected: false, mode: 'unavailable' };
  approveLead.textContent = 'MAH unavailable';
  approveLead.disabled = true;
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
  stopAnimationOnFirstFrame('idle');
  scheduleAmbient();
  scheduleScouting();
});
setInterval(watchGlobalCursor, 180);
