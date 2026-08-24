---
name: pet-action-pack
description: Generate a consistent six-action Opportunity Pet sprite pack from 3-5 reference photos. Use when a user or the Opportunity Pet app needs a personalized desktop-pet character sheet and action strips; do not use for ordinary photo editing or unrelated illustration work.
---

# Pet Action Pack

Create a personalized action pack in the current job workspace. This workflow is commonly called non-interactively by the Opportunity Pet app, so do not ask follow-up questions when `job.json` and `inputs/` are present.

## Inputs And Output

- Read `job.json` for the pet name and expected output directory.
- Use every supported image in `inputs/` as an identity reference. Inspect them before generating.
- Write generated files only under `output/`; do not modify application source code.
- Use the built-in image generation tool. If image generation is unavailable, write `output/error.json` with a concise reason and stop.
- The image generation tool accepts at most 5 referenced images per call. Never pass more than 5 paths. For the character sheet, use up to 5 original photos. For each action strip, use either the character sheet plus up to 4 original photos, or up to 5 original photos without the character sheet.

Produce these files:

```text
output/character-sheet.png
output/idle.png
output/walk.png
output/sleep.png
output/happy.png
output/chase.png
output/yawn.png
output/manifest.json
```

## Identity Pass

First infer durable identity traits from all photos: species, body proportions, coat colors and markings, face shape, ears, tail, paws, scars, and other distinctive features. Generate `character-sheet.png` as a consistent 2-by-2 multi-view reference showing front, strict side, rear three-quarter, and a natural curled or resting pose. Preserve the real animal's identity rather than idealizing it or changing breed characteristics.

Use a genuinely transparent background when reliable. If there is any uncertainty, use one perfectly flat saturated `#00FF00` background with no shadows, gradient, floor, texture, or green spill; the app removes it locally. Never use white, off-white, gray, cream, studio, paper, floor, or room backgrounds, because pale fur cannot be separated safely from a pale matte.

## Action Strips

Generate each action as a separate raster strip with exactly four equal columns and one row. Use the character sheet and original photos as references for every strip. Keep the complete animal uncropped, at a consistent scale and ground line within that strip. Leave visible padding around ears, tail, paws, whiskers, and belly. No text, borders, grid lines, watermark, extra animals, duplicated limbs, white matte, gray matte, decorative scene, or partial body cropping.

- `idle.png`: front-facing calm pose; subtle blink, ear movement, or breathing; no walking.
- `walk.png`: strict side profile; four-beat grounded walk; alert posture and tail held high when anatomically appropriate.
- `sleep.png`: natural curled or compact resting pose; only subtle breathing; stable horizontal placement.
- `happy.png`: front or three-quarter positive response; one brief, grounded reaction without spinning the image plane.
- `chase.png`: side-view sequence noticing, stalking, pouncing toward, and gently catching one small golden butterfly.
- `yawn.png`: front-facing sequence from calm to open-mouth yawn, eyes closing, then settling.

Adapt motion naturally for the animal's species. Do not force cat anatomy or behavior onto dogs, rabbits, birds, or other pets.

## Completion Contract

Inspect every output. Regenerate an action if identity drifts, the animal changes species or markings, a body part is clipped, pale fur blends into a pale background, cells contain multiple animals, or the background is not transparent/flat green.

Write `manifest.json` only after all seven images are ready:

```json
{
  "version": 1,
  "petName": "name from job.json",
  "sourcePhotoCount": 3,
  "background": "transparent-or-chroma-green",
  "actions": {
    "idle": "idle.png",
    "walk": "walk.png",
    "sleep": "sleep.png",
    "happy": "happy.png",
    "chase": "chase.png",
    "yawn": "yawn.png"
  }
}
```

Finish with a short result stating that the pack is ready and naming any unavoidable identity uncertainty. Do not return implementation code or merely describe prompts instead of generating the files.
