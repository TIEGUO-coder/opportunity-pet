const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
  SCOUT_PREFERENCES,
  feedbackPenalty,
  scoreOpportunity,
  rankOpportunities,
  explainOpportunityFit,
  canBeginScouting
} = require('../src/scout-preferences');

assert.equal(SCOUT_PREFERENCES.version, 2);
assert.equal(SCOUT_PREFERENCES.roles.length, 6);
assert.equal(SCOUT_PREFERENCES.interests.length, 5);
assert.equal(SCOUT_PREFERENCES.feedbackReasons.length, 4);

const leads = [
  { id: 'broad', roles: ['operator'], interests: ['services'] },
  { id: 'best', roles: ['creator'], interests: ['digital-products'] },
  { id: 'interest-only', roles: ['developer'], interests: ['digital-products'] }
];
const preferences = { role: 'creator', interests: ['digital-products'] };

assert.equal(scoreOpportunity(leads[1], preferences), 5);
assert.deepEqual(rankOpportunities(leads, preferences).map((lead) => lead.id), ['best', 'interest-only', 'broad']);
assert.match(explainOpportunityFit(leads[1], preferences), /content creator/i);
assert.match(explainOpportunityFit(leads[1], preferences), /digital products/i);
assert.match(explainOpportunityFit(leads[0], { skipped: true }), /learning your taste/i);
assert.equal(canBeginScouting({ hasPet: true, hasPreferences: true }), true);
assert.equal(canBeginScouting({ hasPet: true, hasPreferences: false }), false);
assert.equal(canBeginScouting({ hasPet: true, hasPreferences: true, setupVisible: true }), false);
assert.equal(canBeginScouting({ hasPet: true, hasPreferences: true, preferencesVisible: true }), false);

const rejected = {
  opportunityId: 'best',
  roles: ['creator'],
  interests: ['digital-products']
};
assert.deepEqual(
  rankOpportunities(leads, preferences, [{ ...rejected, reason: 'not_interested' }]).map((lead) => lead.id),
  ['broad', 'interest-only', 'best']
);

const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '..', 'src', 'styles.css'), 'utf8');
const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');
const opportunityContext = { window: { CREATOR_STORE_BLUEPRINT: { id: 'creator-store-launch-kit-v1' } } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'opportunities.js'), 'utf8'), opportunityContext);
const opportunityCopy = JSON.stringify(opportunityContext.window.OPPORTUNITIES);
assert.doesNotMatch(opportunityCopy, /included messy freelance-client sample/i);
assert.equal(
  opportunityContext.window.OPPORTUNITIES.every((opportunity) => opportunity.result?.isIllustrative === true),
  true,
  'Every scout opportunity should have its own illustrative result preview.'
);
const preferenceSetupFlow = renderer.match(/async function showPreferenceSetup\(\)[\s\S]*?\n}\n\nasync function finishPreferenceSetup/)?.[0] || '';
assert.match(preferenceSetupFlow, /startPreferenceButterflyCue\(\)/);
assert.doesNotMatch(preferenceSetupFlow, /playActionOnce\(['"]catch['"]/, 'The preference butterfly cue should not reuse cropped chase/catch frames.');
assert.doesNotMatch(preferenceSetupFlow, /startAnimation\(['"]catch['"]/, 'Butterfly-catching cue must not loop');
assert.doesNotMatch(preferenceSetupFlow, /setPetMotion\(['"]chasing['"]/, 'The preference cue must not reuse the MAH launch movement.');
assert.match(renderer, /const scoutButterfly = document\.getElementById\(['"]scoutButterfly['"]\)/);
assert.match(renderer, /function followPreferenceButterfly\(event\)/);
assert.match(renderer, /setPreferenceButterflyPoint\(event\.clientX,\s*event\.clientY\)/, 'Butterfly should follow pointer movement.');
assert.match(renderer, /requestAnimationFrame\(renderPreferenceButterfly\)/, 'Butterfly tracking should render on animation frames.');
assert.match(renderer, /lastButterflyPoint\.x \+= \(preferenceButterflyTarget\.x - lastButterflyPoint\.x\) \* 0\.24/);
assert.doesNotMatch(styles, /\.scout-butterfly\s*\{[\s\S]*?transition:\s*transform/, 'Do not stack CSS transition lag on top of pointer interpolation.');
assert.match(main, /clientX:\s*point\.x - windowX/);
assert.match(main, /clientY:\s*point\.y - windowY/);
assert.match(renderer, /setPreferenceButterflyPoint\(point\.clientX,\s*point\.clientY\)/, 'Global cursor sampling must drive the butterfly even outside the window.');
assert.match(renderer, /setInterval\(watchGlobalCursor,\s*33\)/);
assert.match(renderer, /const targetY = clamp\(y - stageRect\.top, 60, Math\.max\(60, stageRect\.height - 28\)\)/);
assert.match(renderer, /gaze:\s*\[[\s\S]*?gaze-up-left-v1\.png[\s\S]*?gaze-intermediate-v1\/frame-00\.png[\s\S]*?gaze-up-v1\.png[\s\S]*?gaze-intermediate-v1\/frame-01\.png[\s\S]*?gaze-up-right-v1\.png[\s\S]*?gaze-intermediate-v1\/frame-02\.png[\s\S]*?gaze-right-v1\.png[\s\S]*?gaze-intermediate-v1\/frame-03\.png[\s\S]*?gaze-down-right-v2\.png[\s\S]*?gaze-intermediate-v1\/frame-04\.png[\s\S]*?gaze-down-v2\.png[\s\S]*?gaze-intermediate-v1\/frame-05\.png[\s\S]*?gaze-down-left-v2\.png[\s\S]*?gaze-intermediate-v1\/frame-06\.png[\s\S]*?gaze-left-v2\.png[\s\S]*?gaze-intermediate-v1\/frame-07\.png[\s\S]*?\]/);
assert.match(renderer, /function updatePreferenceGaze\(point\)/);
assert.match(renderer, /updatePreferenceGaze\(lastButterflyPoint\)/);
assert.match(renderer, /Math\.atan2\(y, x\)/);
assert.match(renderer, /const frameCount = Math\.max\(1, renderedActionFrames\.gaze\?\.length \|\| actions\.gaze\.length\)/);
assert.match(renderer, /const nextFrame = Math\.round\(framePosition\) % frameCount/);
assert.match(renderer, /setPreferenceGazeFrame\(preferenceGazeFrame\)/);
assert.doesNotMatch(renderer, /drawPreferenceGazeBlend/, 'Gaze frames must stay crisp instead of being alpha-blended.');
assert.doesNotMatch(renderer, /setTimeout\(step, 70\)/, 'Pointer gaze should render continuously instead of stepping through eight stills.');
assert.match(renderer, /const watchingButterfly = document\.body\.dataset\.view === 'preferences' && scoutButterfly\.classList\.contains\('visible'\);\s*if \(watchingButterfly\) setPreferenceGazeFrame\(preferenceGazeFrame\)/);
const butterflyCue = renderer.match(/function startPreferenceButterflyCue\(\)[\s\S]*?\n}\n\nfunction followPreferenceButterfly/)?.[0] || '';
assert.doesNotMatch(butterflyCue, /catch/, 'The preference cue must not reuse the old cropped catch frames.');
assert.doesNotMatch(butterflyCue, /schedulePreferencePounce/, 'Do not use unapproved pounce frames that distort Iron’s body.');
assert.doesNotMatch(renderer, /function drawPreferenceHeadFocus/, 'Do not simulate gaze by cutting and shaking part of the sprite.');
assert.doesNotMatch(renderer + styles, /pet-watch|watching-butterfly|butterfly-ready|butterfly-pouncing/, 'Remove unused CSS-driven pounce state.');
assert.match(renderer, /sleep:\s*\['\.\.\/assets\/teiguo\/sleep\/side-curl\.png'\]/);
assert.match(renderer, /async function showLeadCard\(\)[\s\S]*?playActionOnce\('sleep', undefined, 'sleep', \(\) => \{[\s\S]*?ambientTimer = setTimeout\([\s\S]*?60000[\s\S]*?\}, true\);\s*setPetMotion\('resting'\)/);
assert.match(renderer, /if \(view === 'lead'\) return;/);
const actionFallbacks = renderer.match(/function withActionFallbacks\(imported\)[\s\S]*?\n}/)?.[0] || '';
assert.match(actionFallbacks, /gaze:\s*imported\.gaze \|\| samePetIdle/);
assert.match(actionFallbacks, /catch:\s*imported\.catch \|\| imported\.happy \|\| samePetIdle/);
assert.doesNotMatch(actionFallbacks, /imported\.gaze \|\| defaultActions/, 'A personalized pet must never turn into Iron during gaze tracking.');
assert.match(renderer, /setPreferenceStep\(['"]interests['"]\);\s*hidePreferenceButterfly\(\);\s*stopAnimationOnFirstFrame\(['"]idle['"]\)/);
assert.match(renderer, /const stalePhotoProfile = profile && profile\.photoDataUrl/);
assert.match(renderer, /defaultIronProfile\(profile\.name\)/);
assert.match(
  renderer,
  /let petProfile = loadPetProfile\(\);\s*\/\/ Iron is the built-in sample:[\s\S]*?petProfile\?\.generatedFrom === 'default-iron'[\s\S]*?withActionFallbacks\(loadImportedActions\(\)\)/,
  'Iron must load shipped actions after profile migration instead of a stale imported sheet.'
);
assert.match(renderer, /localStorage\.removeItem\(['"]opportunityPet\.spriteSheet['"]\);/);
assert.match(renderer, /function animateWhileCursorMoves\(\) \{\s*\/\/ Cursor movement must never interrupt a guided scout sequence or the lead card\.\s*if \(document\.body\.dataset\.view !== 'pet'/);
assert.match(renderer, /async function scoutForLead\(\) \{\s*if \(!canBeginScouting\(\)/);
assert.match(renderer, /function scheduleScouting\(\)[\s\S]*?if \(!canBeginScouting\(\) \|\| document\.body\.dataset\.view !== 'pet'\) return;/);
assert.match(renderer, /function scheduleAmbient\(\)[\s\S]*?const view = document\.body\.dataset\.view/);
assert.match(renderer, /async function showPreferenceSetup\(\) \{\s*cancelAutonomousPetActivity\(\);/);
assert.match(renderer, /runToken !== scoutingRunToken \|\| !canBeginScouting\(\)/);
assert.match(renderer, /preferences\?\.version === preferenceApi\.SCOUT_PREFERENCES\.version/);
assert.match(renderer, /localStorage\.removeItem\(SCOUT_PREFERENCES_KEY\);[\s\S]*?pendingRole = '';[\s\S]*?pendingInterests = new Set\(\)/);
assert.ok(feedbackPenalty({ id: 'another', roles: ['creator'] }, [{ ...rejected, reason: 'not_skilled' }]) > 0);
assert.ok(
  feedbackPenalty({ id: 'heavy', effortLevel: 3 }, [{ ...rejected, reason: 'too_much_work' }])
  > feedbackPenalty({ id: 'light', effortLevel: 1 }, [{ ...rejected, reason: 'too_much_work' }])
);
assert.ok(
  feedbackPenalty({ id: 'risky', riskLevel: 3 }, [{ ...rejected, reason: 'too_risky' }])
  > feedbackPenalty({ id: 'safe', riskLevel: 1 }, [{ ...rejected, reason: 'too_risky' }])
);

console.log('Verified two-click scout preferences, onboarding guards, optional rejection learning, stable ranking, and plain-language fit reasons.');
