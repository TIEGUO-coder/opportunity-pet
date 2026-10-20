const path = require('path');
const { spawn } = require('child_process');
const { findMahProjectRoot } = require('../src/mah-project');

const appRoot = path.resolve(__dirname, '..');
const projectRoot = findMahProjectRoot(appRoot);
if (!projectRoot) throw new Error('Launch this entry from the Opportunity Pet component inside a MAH project.');
const env = { ...process.env, OPPORTUNITY_PET_MAH_PROJECT_ROOT: projectRoot };
// MAH itself uses Electron as Node; its runtime mode must not leak into the pet.
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(require('electron'), [appRoot, '--from-mah'], {
  cwd: appRoot, env, detached: true, stdio: 'ignore'
});
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.unref();
