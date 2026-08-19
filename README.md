# Opportunity Pet

Opportunity Pet is a desktop scout pet workflow. A user imports 3-5 photos of their own pet, generates a ready-to-use animated scout locally, and then the pet brings back product opportunity cards for approval before the idea moves into a grilling/planning step.

Tieguo is only the default test pet in this local prototype.

## Current MVP

- Import 3-5 pet photos and a pet name.
- Generate a local animated pet from the photo set with one click.
- Optionally import a professionally generated 4x4 sprite sheet.
- Slice imported sprite sheets into 16 local action frames in the app.
- Show a small always-on-top Electron desktop pet.
- Open an opportunity card with approval actions.
- Prepare a Grilling Brief before handing the idea to a stricter planning flow.

The current version does not pay for or call an image generation API. The default generator runs locally in the Electron renderer. Local mock opportunities live in `src/opportunities.js`; Tieguo remains a development sample.

## Run

```bash
npm install
npm run prepare:assets
npm run check
npm run start
```

If Electron's postinstall download fails:

```bash
npm run install:electron
npm run start
```

## Product Path

1. User imports 3-5 pet photos.
2. User clicks Generate animated scout.
3. Opportunity Pet creates local idle, walk, sleep, and happy frame loops.
4. The animated pet scouts for leads and brings back opportunity cards.
5. User approves, skips, or sends the idea to Grill-me.
6. Approved leads become Grilling Briefs.
7. Later: Grilling output routes into MAH routemap.
