const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { compactHandoff } = require('./mah-launch');

function findMahProjectRoot(start) {
  let directory = path.resolve(start);
  while (true) {
    const descriptor = path.join(directory, '.mah-project', 'project.json');
    if (fs.existsSync(descriptor)) {
      const project = JSON.parse(fs.readFileSync(descriptor, 'utf8'));
      if (project.schema_version !== 1 || !project.project_id) throw new Error('Invalid MAH project.');
      return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) return '';
    directory = parent;
  }
}

function saveMahOpportunity(payload, { projectRoot = '', userDataPath }) {
  const handoff = compactHandoff(payload);
  const directory = projectRoot
    ? path.join(projectRoot, '.mah', 'opportunity-pet')
    : path.join(userDataPath, 'mah-opportunities');
  fs.mkdirSync(directory, { recursive: true });
  const key = createHash('sha256').update(handoff.idempotencyKey).digest('hex').slice(0, 24);
  const recordPath = path.join(directory, `${key}.json`);
  fs.writeFileSync(recordPath, `${JSON.stringify({ ...handoff, savedAt: new Date().toISOString() }, null, 2)}\n`, { mode: 0o600 });
  return { projectSaved: Boolean(projectRoot), recordPath };
}

module.exports = { findMahProjectRoot, saveMahOpportunity };
