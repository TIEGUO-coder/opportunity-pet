const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { findMahProjectRoot } = require('../src/mah-project');

const LABEL = 'com.tieguocoder.opportunitypet.mah-bridge';
function xml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function launchAgentPlist(command, logPath) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${LABEL}</string>
<key>ProgramArguments</key><array>${command.map((value) => `<string>${xml(value)}</string>`).join('')}</array>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
<key>LimitLoadToSessionType</key><string>Aqua</string>
<key>ThrottleInterval</key><integer>10</integer>
<key>StandardOutPath</key><string>${xml(logPath)}</string>
<key>StandardErrorPath</key><string>${xml(logPath)}</string>
</dict></plist>\n`;
}

function main() {
  if (process.platform !== 'darwin') throw new Error('This MAH startup bridge currently supports macOS only.');
  const agentPath = path.join(os.homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`);
  const domain = `gui/${process.getuid()}`;
  const service = `${domain}/${LABEL}`;
  const mode = process.argv[2] || 'status';
  const run = (file, args) => execFileSync(file, args, { stdio: 'pipe', timeout: 60000 });
  const loaded = () => { try { run('/bin/launchctl', ['print', service]); return true; } catch { return false; } };
  if (mode === 'status') {
    console.log(JSON.stringify({ enabled: fs.existsSync(agentPath), running: loaded(), agentPath }));
    return;
  }
  if (mode === 'disable') {
    if (loaded()) run('/bin/launchctl', ['bootout', service]);
    if (fs.existsSync(agentPath)) fs.renameSync(agentPath, `${agentPath}.disabled`);
    console.log('Disabled automatic pet launch when MAH opens. The pet and manual MAH entry are unchanged.');
    return;
  }
  if (mode !== 'enable') throw new Error('Use enable, disable, or status.');
  const appRoot = path.resolve(__dirname, '..');
  const projectRoot = findMahProjectRoot(appRoot);
  if (!projectRoot) throw new Error('Enable this from the pet component inside your MAH project.');
  const directory = path.join(os.homedir(), 'Library', 'Application Support', 'opportunity-pet', 'mah-autostart');
  const helper = path.join(directory, 'MahPetBridge');
  fs.mkdirSync(directory, { recursive: true });
  fs.mkdirSync(path.dirname(agentPath), { recursive: true });
  // Compilation is a local development setup step; no MAH installation files are changed.
  run('/usr/bin/swiftc', ['-O', path.join(__dirname, 'mah-pet-bridge.swift'), '-o', `${helper}.next`]);
  if (loaded()) run('/bin/launchctl', ['bootout', service]);
  fs.renameSync(`${helper}.next`, helper);
  fs.writeFileSync(agentPath, launchAgentPlist([helper, require('electron'), appRoot, projectRoot], path.join(directory, 'bridge.log')), { mode: 0o600 });
  run('/usr/bin/plutil', ['-lint', agentPath]);
  run('/bin/launchctl', ['bootstrap', domain, agentPath]);
  console.log('Enabled: opening MAH now automatically starts the pet for this managed project.');
  console.log('To turn it off: npm run mah:autostart -- disable');
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.stderr?.toString().trim() || error.message); process.exitCode = 1; }
}
module.exports = { LABEL, launchAgentPlist };
