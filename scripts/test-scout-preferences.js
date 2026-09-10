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
assert.match(preferenceSetupFlow, /playActionOnce\(['"]catch['"],\s*300,\s*['"]idle['"],/);
assert.doesNotMatch(preferenceSetupFlow, /startAnimation\(['"]catch['"]/, 'Butterfly-catching cue must not loop');
assert.match(preferenceSetupFlow, /},\s*450\);/, 'Butterfly-catching cue should wait until the page is visible');
assert.match(renderer, /catch:\s*chaseFrames\.length > 1 \? chaseFrames\.slice\(1\) : chaseFrames/);
assert.match(renderer, /setPreferenceStep\(['"]interests['"]\);\s*stopAnimationOnFirstFrame\(['"]idle['"]\)/);
assert.match(renderer, /function animateWhileCursorMoves\(\)[\s\S]*?preferenceSetup\.classList\.contains\(['"]visible['"]\)/);
assert.match(renderer, /async function scoutForLead\(\) \{\s*if \(!canBeginScouting\(\)/);
assert.match(renderer, /function scheduleScouting\(\)[\s\S]*?if \(!canBeginScouting\(\)\) return;/);
assert.match(renderer, /function scheduleAmbient\(\)[\s\S]*?if \(!canBeginScouting\(\)/);
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
