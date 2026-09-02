const assert = require('assert');
const blueprint = require('../src/creator-store-blueprint');

assert.equal(blueprint.id, 'creator-store-launch-kit-v1');
assert.equal(blueprint.product.id, 'freelance-client-portal-kit');
assert.equal(blueprint.inputModes.sample.id, 'freelance-client-portal-source');
assert.equal(blueprint.inputModes.ownAsset.id, 'user-owned-digital-asset');

const requiredInputs = blueprint.requiredInputs.filter((input) => input.required);
assert.ok(requiredInputs.some((input) => input.id === 'source_asset'));
assert.ok(requiredInputs.some((input) => input.id === 'asset_ownership'));

assert.ok(blueprint.evidencePolicy.minimumSignals >= 2);
assert.equal(blueprint.evidencePolicy.requiresSourceUrl, true);
assert.equal(blueprint.evidencePolicy.requiresObservedAt, true);
assert.equal(blueprint.evidencePolicy.requiresUserFitReason, true);

const deliverables = new Set(blueprint.product.deliverables);
[
  'Client intake questionnaire',
  'Project progress template',
  'Quick-start guide PDF',
  'Storefront FAQ',
  'Downloadable ZIP package'
].forEach((deliverable) => assert.ok(deliverables.has(deliverable), `Missing deliverable: ${deliverable}`));

const stageIds = blueprint.stages.map((stage) => stage.id);
assert.deepEqual(stageIds, [
  'inspect_asset',
  'validate_demand',
  'package_product',
  'quality_review',
  'prepare_listing',
  'approve_publish',
  'publish_listing',
  'monitor_results'
]);
assert.equal(blueprint.stages.find((stage) => stage.id === 'approve_publish').requiresOwnerApproval, true);

const scheduledIntentIds = blueprint.scheduledIntents.map((intent) => intent.id);
assert.deepEqual(scheduledIntentIds, ['opportunity_scout', 'storefront_monitor']);
assert.ok(blueprint.successCriteria.some((criterion) => /public product URL/i.test(criterion)));
assert.ok(blueprint.successCriteria.some((criterion) => /Illustrative revenue/i.test(criterion)));
assert.ok(blueprint.stopConditions.some((condition) => /permission to sell/i.test(condition)));

console.log('Verified the Creator Store blueprint inputs, evidence gate, deliverables, eight business stages, approval boundary, scheduled intents, and stop conditions.');
