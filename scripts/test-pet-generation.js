const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createHash } = require('crypto');
const { fileURLToPath } = require('url');
const { PNG } = require('pngjs');
const {
  ACTIONS,
  ACTION_SPECS,
  ACTION_PACK_VERSION,
  generatePetIdentityWithCodex,
  generatePetActionsWithCodex,
  preparePetCodexHandoff,
  getPetCodexHandoffStatus,
  advancePetCodexHandoff,
  generatePetWithCodex,
  loadGeneratedActions,
  splitSheet,
  validateMeaningfulMotion
} = require('../src/pet-generation');

function makeSheet(actionIndex, matte = 'green', columns = 4, rows = 2, duplicate = false) {
  const cellWidth = 100;
  const cellHeight = 120;
  const image = new PNG({ width: columns * cellWidth, height: rows * cellHeight });
  const whiteMatte = matte === 'white';
  for (let i = 0; i < image.data.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % image.width;
    const y = Math.floor(pixel / image.width);
    image.data[i] = whiteMatte ? 246 + ((x + y) % 4) : 0;
    image.data[i + 1] = whiteMatte ? 246 + ((x + y) % 4) : 255;
    image.data[i + 2] = whiteMatte ? 245 + ((x + y) % 5) : 0;
    image.data[i + 3] = 255;
  }
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const frameIndex = duplicate ? 0 : row * columns + col;
      const actionScale = 0.78 + (actionIndex % 5) * 0.08;
      const subjectWidth = Math.round([48, 52, 56, 60, 58, 54, 50, 57][frameIndex % 8] * actionScale);
      const subjectHeight = Math.round([72, 78, 84, 88, 82, 76, 74, 86][frameIndex % 8] * actionScale);
      const left = col * cellWidth + Math.floor((cellWidth - subjectWidth) / 2);
      const bottom = row * cellHeight + 104;
      const top = bottom - subjectHeight;
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < left + subjectWidth; x += 1) {
          const index = (y * image.width + x) * 4;
          image.data[index] = 80 + actionIndex * 12;
          image.data[index + 1] = 40;
          image.data[index + 2] = 110 + (duplicate ? 0 : col * 10);
          image.data[index + 3] = 255;
        }
      }
      // A connected green feature simulates a green iris. Edge-connected chroma
      // should be removed without punching this color out of the pet itself.
      for (let y = top + 8; y < top + 12; y += 1) {
        for (let x = left + 8; x < left + 12; x += 1) {
          const index = (y * image.width + x) * 4;
          image.data[index] = 24;
          image.data[index + 1] = 205;
          image.data[index + 2] = 45;
        }
      }
    }
  }
  return PNG.sync.write(image);
}

async function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opportunity-pet-generation-'));
  const fakeSheets = path.join(tempRoot, 'fake-sheets');
  const fakeCodex = path.join(tempRoot, 'fake-codex.js');
  fs.mkdirSync(fakeSheets, { recursive: true });
  Object.entries(ACTION_SPECS).forEach(([action, spec], actionIndex) => {
    spec.files.forEach((file, fileIndex) => fs.writeFileSync(path.join(fakeSheets, file), makeSheet(actionIndex + fileIndex)));
  });
  const characterSheet = makeSheet(0);
  fs.writeFileSync(path.join(fakeSheets, 'character-sheet.png'), characterSheet);
  fs.writeFileSync(path.join(fakeSheets, 'quality-report.json'), JSON.stringify({
    version: ACTION_PACK_VERSION,
    identityAnchor: 'character-sheet.png',
    identityAnchorSha256: createHash('sha256').update(characterSheet).digest('hex'),
    actions: Object.fromEntries(ACTIONS.map((action) => [action, {
      identityLocked: true,
      anatomyComplete: true,
      motionApproved: true,
      attempts: 1
    }]))
  }));
  fs.writeFileSync(path.join(fakeSheets, 'manifest.json'), JSON.stringify({
    version: ACTION_PACK_VERSION,
    petName: 'Test Pet',
    sourcePhotoCount: 3,
    bodyPlan: 'quadruped',
    actions: Object.fromEntries(Object.entries(ACTION_SPECS).map(([action, spec]) => [action, spec.files])),
    playback: Object.fromEntries(Object.entries(ACTION_SPECS).map(([action, spec]) => [action, { fps: spec.fps, loop: spec.loop }]))
  }));

  fs.writeFileSync(fakeCodex, `const fs = require('fs');
const path = require('path');
const prompt = fs.readFileSync(0, 'utf8');
if (!/Read and follow \\.\\/SKILL\\.md/.test(prompt)) throw new Error('generation prompt missing');
if (!process.argv.includes('--ignore-user-config')) throw new Error('generation must not load unrelated user plugins');
const job = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'job.json'), 'utf8'));
if (job.version !== 6) throw new Error('motion contract version missing');
if (job.revisionNote === 'slimmer face' && !job.revisionFeedback.includes('Face / proportions')) throw new Error('identity feedback missing');
for (const [action, spec] of Object.entries(job.requiredActions)) {
  const expected = action === 'gaze' ? 16 : 8;
  if (!Array.isArray(spec.beats) || spec.beats.length !== expected) throw new Error(action + ' motion beats missing');
}
for (const bodyPlan of ['quadruped', 'biped', 'flyer', 'serpent', 'blob']) {
  for (const spec of Object.values(job.requiredActions)) {
    for (const file of spec.files) {
      const guide = fs.readFileSync(path.join(process.cwd(), job.poseGuideDirectory, bodyPlan, file));
      if (guide.readUInt32BE(16) !== 768 || guide.readUInt32BE(20) !== 384) throw new Error('pose guide dimensions invalid');
    }
  }
}
const output = path.join(process.cwd(), 'output');
fs.mkdirSync(output, { recursive: true });
if (job.stage === 'identity') {
  fs.copyFileSync(path.join(process.env.OPPORTUNITY_PET_FAKE_SHEETS, 'character-sheet.png'), path.join(output, 'character-sheet.png'));
  process.exit(0);
}
if (job.stage !== 'actions') throw new Error('generation stage missing');
if (!fs.existsSync(path.join(output, 'character-sheet.png'))) throw new Error('approved identity preview missing');
for (const file of fs.readdirSync(process.env.OPPORTUNITY_PET_FAKE_SHEETS)) {
  if (file === 'character-sheet.png') continue;
  fs.copyFileSync(path.join(process.env.OPPORTUNITY_PET_FAKE_SHEETS, file), path.join(output, file));
}
const qualityReportPath = path.join(output, 'quality-report.json');
const qualityReport = JSON.parse(fs.readFileSync(qualityReportPath, 'utf8'));
qualityReport.poseGuideManifestSha256 = job.poseGuideManifestSha256;
fs.writeFileSync(qualityReportPath, JSON.stringify(qualityReport));
`);

  const previousFixturePath = process.env.OPPORTUNITY_PET_FAKE_SHEETS;
  process.env.OPPORTUNITY_PET_FAKE_SHEETS = fakeSheets;
  try {
    const photo = `data:image/png;base64,${makeSheet(0).toString('base64')}`;
    const photos = [0, 1, 2].map((index) => `data:image/png;base64,${makeSheet(index).toString('base64')}`);
    const duplicatePhotos = await generatePetWithCodex({ photos: [photo, photo, photo], petName: 'Test Pet' }, {
      codexPath: fakeCodex,
      userDataPath: path.join(tempRoot, 'user-data-duplicates'),
      skillPath: path.join(__dirname, '..', 'skills', 'pet-action-pack', 'SKILL.md'),
      onProgress: () => {}
    });
    assert.equal(duplicatePhotos.ok, false);
    assert.match(duplicatePhotos.error, /3 different pet photos/);

    const handoff = preparePetCodexHandoff({ photos, petName: 'Test Pet' }, {
      userDataPath: path.join(tempRoot, 'user-data-handoff'),
      skillPath: path.join(__dirname, '..', 'skills', 'pet-action-pack', 'SKILL.md')
    });
    assert.equal(handoff.ok, true, handoff.error);
    assert.match(path.basename(handoff.jobDir), /^opportunity-pet-test-pet-[a-f0-9]{8}$/);
    assert.match(fs.readFileSync(path.join(handoff.jobDir, 'RUN_IN_CODEX.md'), 'utf8'), /static identity preview/);
    assert.equal(getPetCodexHandoffStatus({ jobId: handoff.jobId }, { userDataPath: path.join(tempRoot, 'user-data-handoff') }).state, 'waiting');
    fs.copyFileSync(path.join(fakeSheets, 'character-sheet.png'), path.join(handoff.jobDir, 'output', 'character-sheet.png'));
    assert.equal(getPetCodexHandoffStatus({ jobId: handoff.jobId }, { userDataPath: path.join(tempRoot, 'user-data-handoff') }).state, 'identity-ready');
    assert.equal(advancePetCodexHandoff({ jobId: handoff.jobId }, { userDataPath: path.join(tempRoot, 'user-data-handoff') }).ok, true);
    const waitingForActions = getPetCodexHandoffStatus({ jobId: handoff.jobId }, { userDataPath: path.join(tempRoot, 'user-data-handoff') });
    assert.deepEqual({ state: waitingForActions.state, stage: waitingForActions.stage, completed: waitingForActions.completed, total: waitingForActions.total }, { state: 'waiting', stage: 'actions', completed: 0, total: 10 });
    fs.copyFileSync(path.join(fakeSheets, 'idle.png'), path.join(handoff.jobDir, 'output', 'idle.png'));
    assert.equal(getPetCodexHandoffStatus({ jobId: handoff.jobId }, { userDataPath: path.join(tempRoot, 'user-data-handoff') }).completed, 1);
    assert.match(fs.readFileSync(path.join(handoff.jobDir, 'RUN_IN_CODEX.md'), 'utf8'), /complete action pack/);

    const preview = await generatePetIdentityWithCodex({ photos, petName: 'Test Pet', feedback: ['Face / proportions'], feedbackNote: 'slimmer face' }, {
      codexPath: fakeCodex,
      userDataPath: path.join(tempRoot, 'user-data-staged'),
      skillPath: path.join(__dirname, '..', 'skills', 'pet-action-pack', 'SKILL.md'),
      onProgress: () => {}
    });
    assert.equal(preview.ok, true, preview.error);
    assert.match(preview.previewDataUrl, /^data:image\/png;base64,/);
    const stagedInputDir = path.join(tempRoot, 'user-data-staged', 'Opportunity Pet Tasks', preview.jobId, 'inputs');
    assert.equal(fs.existsSync(stagedInputDir), true, 'source photos should remain only until the preview is approved');
    const stagedResult = await generatePetActionsWithCodex({ jobId: preview.jobId }, {
      codexPath: fakeCodex,
      userDataPath: path.join(tempRoot, 'user-data-staged'),
      skillPath: path.join(__dirname, '..', 'skills', 'pet-action-pack', 'SKILL.md'),
      onProgress: () => {}
    });
    assert.equal(stagedResult.ok, true, stagedResult.error);
    assert.equal(fs.existsSync(stagedInputDir), false, 'source photos should be deleted after movement generation');

    const progressEvents = [];
    const result = await generatePetWithCodex({ photos, petName: 'Test Pet' }, {
      codexPath: fakeCodex,
      userDataPath: path.join(tempRoot, 'user-data'),
      skillPath: path.join(__dirname, '..', 'skills', 'pet-action-pack', 'SKILL.md'),
      onProgress: (event) => progressEvents.push(event)
    });

    assert.equal(result.ok, true, result.error);
    assert.ok(progressEvents.some((event) => event?.type === 'identity-preview' && event.dataUrl.startsWith('data:image/png;base64,')), 'the identity preview should arrive before the complete action pack is imported');
    assert.ok(progressEvents.some((event) => event?.type === 'action-progress' && event.completed === event.total), 'the complete action-sheet progress should be reported');
    assert.deepEqual(result.actionMetadata.walk, { fps: 8, loop: true });
    assert.deepEqual(result.actionMetadata.sleep, { fps: 4, loop: false });
    const actionMedianDiagonals = [];
    for (const action of ACTIONS) {
      const expectedFrames = action === 'gaze' ? 16 : 8;
      assert.equal(result.actions[action].length, expectedFrames, `${action} should meet the standard frame count`);
      const visibleDiagonals = [];
      let preservedGreenFeature = false;
      result.actions[action].map(fileURLToPath).forEach((file) => {
        const frame = PNG.sync.read(fs.readFileSync(file));
        assert.equal(`${frame.width}x${frame.height}`, '512x512', `${action} should use the standard canvas`);
        assert.equal(frame.data[3], 0, `${action} should have a transparent corner`);
        let bottom = -1;
        let left = frame.width;
        let right = -1;
        let top = frame.height;
        for (let y = 0; y < frame.height; y += 1) {
          for (let x = 0; x < frame.width; x += 1) {
            const index = (y * frame.width + x) * 4;
            if (frame.data[index + 3] > 20) {
              bottom = y;
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
            }
            if (frame.data[index + 3] > 100 && frame.data[index + 1] > 150 && frame.data[index + 1] > frame.data[index] * 1.8 && frame.data[index + 1] > frame.data[index + 2] * 1.5) {
              preservedGreenFeature = true;
            }
          }
        }
        assert.equal(bottom, 461, `${action} should share the standard baseline`);
        visibleDiagonals.push(Math.hypot(right - left + 1, bottom - top + 1));
      });
      assert.ok(Math.max(...visibleDiagonals) / Math.min(...visibleDiagonals) <= 1.035, `${action} should keep a stable apparent scale across frames`);
      assert.equal(preservedGreenFeature, true, `${action} should preserve connected green pet features`);
      visibleDiagonals.sort((a, b) => a - b);
      actionMedianDiagonals.push(visibleDiagonals[Math.floor(visibleDiagonals.length / 2)]);
    }
    assert.ok(Math.max(...actionMedianDiagonals) / Math.min(...actionMedianDiagonals) <= 1.035, 'actions should share one apparent character scale even when source sheets differ');
    const qualityReportPath = path.join(result.jobDir, 'output', 'quality-report.json');
    const externalOutput = path.join(tempRoot, 'codex-native-output');
    fs.cpSync(path.join(result.jobDir, 'output'), externalOutput, { recursive: true });
    const importedExternalActions = loadGeneratedActions(externalOutput, { requireLocalJob: false });
    assert.equal(importedExternalActions.gaze.length, 16, 'a complete Codex-native output folder should import without an app-owned job directory');
    const qualityReport = JSON.parse(fs.readFileSync(qualityReportPath, 'utf8'));
    qualityReport.identityAnchorSha256 = '0'.repeat(64);
    fs.writeFileSync(qualityReportPath, JSON.stringify(qualityReport));
    assert.throws(
      () => loadGeneratedActions(path.join(result.jobDir, 'output')),
      /not bound to the delivered character sheet/,
      'an audit for another identity anchor must be rejected'
    );
    const inputDir = path.join(tempRoot, 'user-data', 'Opportunity Pet Tasks', result.jobId, 'inputs');
    assert.equal(fs.existsSync(inputDir), false, 'temporary input photos should be deleted');
    assert.throws(
      () => splitSheet(makeSheet(0, 'white')),
      /white or gray background/,
      'white mattes must be rejected instead of cutting holes in pale fur'
    );
    assert.throws(
      () => validateMeaningfulMotion('walk', splitSheet(makeSheet(0, 'green', 4, 2, true))),
      /only 1 meaningfully different frames/,
      'duplicate filler frames must not pass as a walk cycle'
    );

    fs.writeFileSync(fakeCodex, `const fs = require('fs');
const path = require('path');
const output = path.join(process.cwd(), 'output');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'error.json'), JSON.stringify({ error: 'Identity could not be locked from the supplied photos.' }));
`);
    const failed = await generatePetWithCodex({ photos, petName: 'Test Pet' }, {
      codexPath: fakeCodex,
      userDataPath: path.join(tempRoot, 'user-data-error'),
      skillPath: path.join(__dirname, '..', 'skills', 'pet-action-pack', 'SKILL.md'),
      onProgress: () => {}
    });
    assert.equal(failed.ok, false);
    assert.match(failed.error, /Identity could not be locked/);
    console.log('Verified distinct-photo input, anchor-and-pose-guide-bound identity audit, code-authored motion, meaningful-frame rejection, 80 normalized frames, cross-action scale, 16-direction gaze, and cleanup.');
  } finally {
    if (previousFixturePath === undefined) delete process.env.OPPORTUNITY_PET_FAKE_SHEETS;
    else process.env.OPPORTUNITY_PET_FAKE_SHEETS = previousFixturePath;
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
