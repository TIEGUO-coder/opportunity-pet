---
name: pet-action-pack
description: Generate one identity-locked, standardized Opportunity Pet animation bundle from 3-5 reference photos. Use only for personalized desktop-pet generation.
---

# Standard Opportunity Pet Action Pack

Create a complete personalized desktop-pet bundle in the current job workspace. This skill is called non-interactively by Opportunity Pet. When `job.json` and `inputs/` are present, do not ask questions.

The uploaded photos are identity references only. Never crop, trace, segment, paste, or animate a source photo directly. First reconstruct one clean illustrated pet identity; then derive every action from that immutable identity.

## Inputs and failure behavior

- Read `job.json` for the pet name and output directory.
- Inspect every supported image under `inputs/`.
- Use the built-in image-generation tool for raster assets.
- Use at most five image references in one generation call.
- Write only below `output/`.
- If the photos do not show enough of the animal to lock its face, markings, body proportions, paws, and tail, write `output/error.json` with a concise request for better views and stop.
- If image generation is unavailable, write `output/error.json` and stop.
- Never substitute the bundled Iron sample, a recolored template, or a raw photo cutout.

## Required output

```text
output/character-sheet.png
output/idle.png
output/walk.png
output/settle.png
output/gaze-a.png
output/gaze-b.png
output/sleep.png
output/happy.png
output/chase.png
output/catch.png
output/yawn.png
output/quality-report.json
output/manifest.json
```

Every action image is an exact 4×2, eight-frame, row-major sheet. `gaze-a.png` and `gaze-b.png` form one continuous sixteen-frame gaze set.

## Stage 1: reconstruct and lock identity

Infer only stable features visible across the photos:

- animal species and motion body plan (`quadruped`, `biped`, `flyer`, `serpent`, or `blob`);
- adult/young proportions, body length and build;
- face and muzzle shape, eye spacing and eye color;
- ears, paws, tail shape and tail tip;
- coat colors, markings, scars and other durable features.

Generate `character-sheet.png` first as a polished 2×2 illustrated reference: front, strict side, rear three-quarter, and curled/resting. Use a crisp semi-realistic animation style suitable for a small desktop character. Preserve the real animal instead of beautifying it into another breed or changing its age.

Use genuine transparency when reliable. Otherwise use perfectly flat `#00FF00`, without a floor, shadow, gradient, texture, room, or green spill. Never use white, gray, cream, studio, or photographic backgrounds.

This character sheet is the immutable identity anchor. Attach it first for every later image-generation call, followed by up to four useful original photos. Do not regenerate or redesign the identity between actions.

## Stage 2: generate complete action sheets

Read `requiredActions` in `job.json` before generating. Its `beats` array is the code-authored motion map: cell 1 must depict beat 1, cell 2 beat 2, and so on. For `gaze`, continue all sixteen beats across `gaze-a.png` and then `gaze-b.png`. Do not replace the beats with visually similar filler frames or ask the image model to invent timing.

After choosing `bodyPlan`, use the matching PNGs under `poseGuideDirectory` for every action. Attach `character-sheet.png` first and the matching pose guide second on every image-generation call. The identity anchor controls appearance; the grey mannequin controls the complete body pose in each cell. Never use a guide from another body plan, and never ask the model to invent limb placement without the guide.

For every action sheet:

- exactly four columns by two rows, eight chronological frames, row-major;
- one complete animal per cell;
- identical identity, illustration style, apparent scale, lighting and ground line;
- generous empty gutter around ears, whiskers, belly, paws and complete tail;
- no twins, echoes, duplicate heads, extra limbs, detached pieces, neighbouring-cell fragments, text, borders, grid lines, watermark, or props;
- motion happens in place; the Electron window supplies travel;
- use complete poses, never a rotated/cut-out head layer.

Adapt anatomy to `bodyPlan`. Preserve semantic behavior while allowing a bird to perch/flap or a snake to coil/slither instead of forcing cat anatomy.

Generate:

- `idle.png`: calm breathing, blink and subtle ear/head attention; seamless quiet loop.
- `walk.png`: complete grounded locomotion cycle with clear limb phase changes; no sliding pose duplicates.
- `settle.png`: continue from locomotion, decelerate, plant the feet, lower the body and finish in the exact seated/resting pose used by gaze; one shot.
- `sleep.png`: turn or tuck naturally, curl/rest, breathe subtly; one shot ending in a stable rest.
- `happy.png`: brief grounded positive reaction without rotating or spinning the image plane.
- `chase.png`: notice, orient, stalk and accelerate toward an off-frame target; preserve full paws and tail. Do not draw the butterfly because the app renders and moves it independently.
- `catch.png`: anticipation, grounded pounce/reach toward the same external target, recovery and stable landing; preserve full paws and tail. Do not draw a prop or detached insect.
- `yawn.png`: calm, mouth opening, eyes closing, peak yawn and return to calm.

## Sixteen-frame gaze contract

The body, paws, tail, scale, ground line and lighting must remain locked. Only natural neck/head/chin orientation, ear perspective, and both eyes change. Do not translate, rotate, squash, widen, or shorten the full animal.

Write these frames in this exact order:

`gaze-a.png`:

1. up-left
2. halfway from up-left to up
3. up
4. halfway from up to up-right
5. up-right
6. halfway from up-right to right
7. right
8. halfway from right to down-right

`gaze-b.png`:

1. down-right
2. halfway from down-right to down
3. down
4. halfway from down to down-left
5. down-left
6. halfway from down-left to left
7. left, with the body still facing the original direction
8. halfway from left back to up-left

## Quality gate

Inspect every frame before accepting the pack. Regenerate an entire failing action, keeping the same character sheet, when any of these occurs:

- identity, species, age, proportions, face, markings, tail or rendering style changes;
- body size or foot baseline visibly pulses;
- a paw, ear, whisker or tail is clipped;
- the body contains gaps or detached anatomy;
- a cell contains multiple animals or neighbouring-cell spill;
- two locomotion frames are effectively duplicates;
- an eight-frame action contains fewer than six meaningfully different poses, or the sixteen-frame gaze set contains fewer than twelve;
- the matte is not transparent or flat green;
- gaze moves the entire body instead of attention/head direction.

Allow at most two redraws per action. If a third pass still fails, write `output/error.json` naming the action and defect; do not deliver a partial pack.

After every action passes, calculate the SHA-256 hash of the final `character-sheet.png` and write `quality-report.json`. This report must bind every audit to that exact identity anchor:

```json
{
  "version": 6,
  "identityAnchor": "character-sheet.png",
  "identityAnchorSha256": "64 lowercase hex characters",
  "poseGuideManifestSha256": "value from job.json",
  "actions": {
    "idle": { "identityLocked": true, "anatomyComplete": true, "motionApproved": true, "attempts": 1 }
  }
}
```

Include all nine action keys. `attempts` is 1 for the first accepted generation, 2 after one redraw, or 3 after two redraws. Never write `true` for a check that was not visually inspected against the final character sheet.

## Manifest

Only after all eleven images pass, write:

```json
{
  "version": 6,
  "petName": "name from job.json",
  "sourcePhotoCount": 3,
  "bodyPlan": "quadruped",
  "style": "identity-locked-semi-realistic-desktop-pet",
  "background": "transparent-or-chroma-green",
  "canvas": { "width": 512, "height": 512, "baseline": 462 },
  "actions": {
    "idle": ["idle.png"],
    "walk": ["walk.png"],
    "settle": ["settle.png"],
    "gaze": ["gaze-a.png", "gaze-b.png"],
    "sleep": ["sleep.png"],
    "happy": ["happy.png"],
    "chase": ["chase.png"],
    "catch": ["catch.png"],
    "yawn": ["yawn.png"]
  },
  "playback": {
    "idle": { "fps": 4, "loop": true },
    "walk": { "fps": 8, "loop": true },
    "settle": { "fps": 6, "loop": false },
    "gaze": { "fps": 8, "loop": false },
    "sleep": { "fps": 4, "loop": false },
    "happy": { "fps": 7, "loop": false },
    "chase": { "fps": 9, "loop": false },
    "catch": { "fps": 10, "loop": false },
    "yawn": { "fps": 5, "loop": false }
  }
}
```

Finish with a short statement that the complete version-6 action pack is ready. Do not merely return prompts or implementation advice.
