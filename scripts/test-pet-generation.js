const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { fileURLToPath } = require('url');
const { PNG } = require('pngjs');
const { ACTIONS, generatePetWithCodex } = require('../src/pet-generation');

function makeStrip(actionIndex) {
  const image = new PNG({ width: 400, height: 120 });
  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i] = 0;
    image.data[i + 1] = 255;
    image.data[i + 2] = 0;
    image.data[i + 3] = 255;
  }
  for (let col = 0; col < 4; col += 1) {
    const left = col * 100 + 18 + col;
    const top = 22 - (col % 2) * 3;
    for (let y = top; y < 103; y += 1) {
      for (let x = left; x < left + 56; x += 1) {
        const index = (y * image.width + x) * 4;
        image.data[index] = 80 + actionIndex * 18;
        image.data[index + 1] = 40;
        image.data[index + 2] = 110 + col * 12;
        image.data[index + 3] = 255;
      }
    }
  }
  return PNG.sync.write(image);
}

async function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opportunity-pet-generation-'));
  const fakeStrips = path.join(tempRoot, 'fake-strips');
  const fakeCodex = path.join(tempRoot, 'fake-codex');
  fs.mkdirSync(fakeStrips, { recursive: true });
  ACTIONS.forEach((action, index) => fs.writeFileSync(path.join(fakeStrips, `${action}.png`), makeStrip(index)));
  fs.writeFileSync(fakeCodex, `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const output = path.join(process.cwd(), 'output');
fs.mkdirSync(output, { recursive: true });
for (const action of ${JSON.stringify(ACTIONS)}) {
  fs.copyFileSync(path.join(process.env.OPPORTUNITY_PET_FAKE_STRIPS, action + '.png'), path.join(output, action + '.png'));
}
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({ version: 1 }));
`);
  fs.chmodSync(fakeCodex, 0o755);

  const previousFixturePath = process.env.OPPORTUNITY_PET_FAKE_STRIPS;
  process.env.OPPORTUNITY_PET_FAKE_STRIPS = fakeStrips;
  try {
    const photo = `data:image/png;base64,${makeStrip(0).toString('base64')}`;
    const result = await generatePetWithCodex({ photos: [photo, photo, photo], petName: 'Test Pet' }, {
      codexPath: fakeCodex,
      userDataPath: path.join(tempRoot, 'user-data'),
      skillPath: path.join(__dirname, '..', 'skills', 'pet-action-pack', 'SKILL.md'),
      onProgress: () => {}
    });

    assert.equal(result.ok, true, result.error);
    for (const action of ACTIONS) {
      assert.equal(result.actions[action].length, 4);
      const files = result.actions[action].map(fileURLToPath);
      const sizes = files.map((file) => {
        const frame = PNG.sync.read(fs.readFileSync(file));
        assert.equal(frame.data[3], 0, `${action} should have a transparent corner`);
        return `${frame.width}x${frame.height}`;
      });
      assert.equal(new Set(sizes).size, 1, `${action} frames should share one size`);
    }
    const inputDir = path.join(tempRoot, 'user-data', 'pet-generation', result.jobId, 'inputs');
    assert.equal(fs.existsSync(inputDir), false, 'temporary input photos should be deleted');
    console.log('Verified Codex job handoff, six action strips, 24 aligned transparent frames, and input cleanup.');
  } finally {
    if (previousFixturePath === undefined) delete process.env.OPPORTUNITY_PET_FAKE_STRIPS;
    else process.env.OPPORTUNITY_PET_FAKE_STRIPS = previousFixturePath;
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
