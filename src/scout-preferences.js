const SCOUT_PREFERENCES = {
  version: 1,
  roles: [
    { id: 'developer', label: 'Tech / dev' },
    { id: 'creator', label: 'Content creator' },
    { id: 'designer', label: 'Designer' },
    { id: 'operator', label: 'Ops / marketing' },
    { id: 'expert', label: 'Industry expert' },
    { id: 'exploring', label: 'Still exploring' }
  ],
  interests: [
    { id: 'digital-products', label: 'Digital products' },
    { id: 'content-ip', label: 'Content / IP' },
    { id: 'tools-apps', label: 'Tools / apps' },
    { id: 'services', label: 'Services' },
    { id: 'open', label: 'Show me anything' }
  ],
  feedbackReasons: [
    { id: 'not_interested', label: 'Not interested' },
    { id: 'not_skilled', label: 'Not my skill set' },
    { id: 'too_much_work', label: 'Too much work' },
    { id: 'too_risky', label: 'Too risky' }
  ]
};

function optionLabel(group, id) {
  return SCOUT_PREFERENCES[group].find((option) => option.id === id)?.label || id;
}

function feedbackPenalty(opportunity, feedback = []) {
  return feedback.reduce((penalty, item) => {
    const exactLeadPenalty = item.opportunityId === opportunity.id ? 8 : 0;
    if (item.reason === 'not_interested') {
      const overlap = (item.interests || []).some((interest) => opportunity.interests?.includes(interest));
      return penalty + exactLeadPenalty + (overlap ? 3 : 0);
    }
    if (item.reason === 'not_skilled') {
      const overlap = (item.roles || []).some((role) => opportunity.roles?.includes(role));
      return penalty + exactLeadPenalty + (overlap ? 2 : 0);
    }
    if (item.reason === 'too_much_work') {
      return penalty + exactLeadPenalty + Math.max(1, opportunity.effortLevel || 2);
    }
    if (item.reason === 'too_risky') {
      return penalty + exactLeadPenalty + Math.max(1, opportunity.riskLevel || 2);
    }
    return penalty;
  }, 0);
}

function scoreOpportunity(opportunity, preferences = {}, feedback = []) {
  const roleMatch = Boolean(preferences.role && opportunity.roles?.includes(preferences.role));
  const selectedInterests = preferences.interests || [];
  const open = selectedInterests.includes('open');
  const interestMatches = open
    ? []
    : selectedInterests.filter((interest) => opportunity.interests?.includes(interest));
  return (roleMatch ? 3 : 0) + (interestMatches.length * 2) - feedbackPenalty(opportunity, feedback);
}

function rankOpportunities(opportunities, preferences = {}, feedback = []) {
  return opportunities
    .map((opportunity, index) => ({ opportunity, index, score: scoreOpportunity(opportunity, preferences, feedback) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ opportunity }) => opportunity);
}

function explainOpportunityFit(opportunity, preferences = {}) {
  if (preferences.skipped) return 'Exploration pick · learning your taste';
  const reasons = [];
  if (preferences.role && opportunity.roles?.includes(preferences.role)) {
    reasons.push(optionLabel('roles', preferences.role));
  }
  const interests = (preferences.interests || [])
    .filter((interest) => interest !== 'open' && opportunity.interests?.includes(interest))
    .map((interest) => optionLabel('interests', interest).toLowerCase());
  if (interests.length) reasons.push(interests.join(' + '));
  if (!reasons.length) return 'Adjacent pick · exploring your fit';
  return `Matched: ${reasons.join(' · ')}`;
}

const api = { SCOUT_PREFERENCES, feedbackPenalty, scoreOpportunity, rankOpportunities, explainOpportunityFit };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.SCOUT_PREFERENCE_API = api;
