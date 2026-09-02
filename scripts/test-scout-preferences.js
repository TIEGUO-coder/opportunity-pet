const assert = require('assert');
const {
  SCOUT_PREFERENCES,
  feedbackPenalty,
  scoreOpportunity,
  rankOpportunities,
  explainOpportunityFit
} = require('../src/scout-preferences');

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

const rejected = {
  opportunityId: 'best',
  roles: ['creator'],
  interests: ['digital-products']
};
assert.deepEqual(
  rankOpportunities(leads, preferences, [{ ...rejected, reason: 'not_interested' }]).map((lead) => lead.id),
  ['broad', 'interest-only', 'best']
);
assert.ok(feedbackPenalty({ id: 'another', roles: ['creator'] }, [{ ...rejected, reason: 'not_skilled' }]) > 0);
assert.ok(
  feedbackPenalty({ id: 'heavy', effortLevel: 3 }, [{ ...rejected, reason: 'too_much_work' }])
  > feedbackPenalty({ id: 'light', effortLevel: 1 }, [{ ...rejected, reason: 'too_much_work' }])
);
assert.ok(
  feedbackPenalty({ id: 'risky', riskLevel: 3 }, [{ ...rejected, reason: 'too_risky' }])
  > feedbackPenalty({ id: 'safe', riskLevel: 1 }, [{ ...rejected, reason: 'too_risky' }])
);

console.log('Verified two-click scout preferences, optional rejection learning, stable ranking, and plain-language fit reasons.');
