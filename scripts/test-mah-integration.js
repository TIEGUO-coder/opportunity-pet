const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PreviewAdapter, normalizeOpportunity } = require('../src/mah-integration');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opportunity-pet-mah-'));

try {
  const adapter = new PreviewAdapter(path.join(tempRoot, 'projects.json'));
  const status = adapter.getStatus();
  assert.equal(status.connected, false);
  assert.equal(status.mode, 'preview');

  const entry = adapter.registerProjectEntry();
  assert.equal(entry.isLive, false);
  assert.deepEqual(entry.launchSurfaces, ['mah-project', 'desktop']);

  const snapshot = adapter.createOpportunityRoutemap({
    opportunity: {
      id: 'creator-store-launch-kit',
      title: 'Creator Store Launch Kit',
      recommendedDirection: ['Build one narrow paid asset']
    }
  });
  assert.match(snapshot.project.id, /^preview-project-/);
  assert.match(snapshot.routemap.id, /^preview-route-/);
  assert.equal(snapshot.isLive, false);
  assert.equal(snapshot.result.isIllustrative, true);
  assert.equal(snapshot.routemap.phases[0].state, 'active');
  assert.equal(snapshot.tasks.length, 3);
  assert.equal(snapshot.schedules.length, 2);
  assert.equal(snapshot.checkpoints.length, 1);

  const restored = adapter.getProjectSnapshot(snapshot.project.id);
  assert.equal(restored.routemap.opportunity.title, 'Creator Store Launch Kit');
  assert.equal(restored.routemap.phases.length, 6);

  const duplicate = adapter.createOpportunityRoutemap({
    idempotencyKey: 'opportunity:creator-store-launch-kit',
    opportunity: { id: 'creator-store-launch-kit', title: 'Duplicate submission' }
  });
  assert.equal(duplicate.project.id, snapshot.project.id, 'Repeated approval should recover the existing MAH project instead of creating a duplicate.');

  const storePath = path.join(tempRoot, 'projects.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  store.projects[snapshot.project.id].createdAt = new Date(Date.now() - 20000).toISOString();
  fs.writeFileSync(storePath, JSON.stringify(store));
  const completed = adapter.getProjectSnapshot(snapshot.project.id);
  assert.equal(completed.routemap.status, 'route_running');
  assert.equal(completed.routemap.phases.every((phase) => phase.state === 'complete' || phase.key === 'route_running'), true);
  assert.equal(completed.tasks.every((task) => task.state === 'complete'), true);

  const decision = adapter.submitCheckpointDecision({
    projectId: snapshot.project.id,
    checkpointId: completed.checkpoints[0].id,
    decision: 'approve'
  });
  assert.equal(decision.accepted, false);
  assert.equal(decision.isLive, false);

  const normalized = normalizeOpportunity({ title: '  Lead  ', recommendedDirection: ['  One  '] });
  assert.equal(normalized.title, 'Lead');
  assert.deepEqual(normalized.recommendedDirection, ['One']);

  console.log('Verified explicit MAH project entry, routemap, task, schedule, checkpoint, event, duplicate protection, and durable preview recovery.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
