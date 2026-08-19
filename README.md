# Opportunity Pet

Opportunity Pet is a desktop scout pet workflow. A user imports 3-5 photos of their own pet, uses their own AI image tool with the built-in prompts to generate an animated pet character, imports the sprite sheet, and then the pet brings back product opportunity cards for approval before the idea moves into a grilling/planning step.

Tieguo is only the default test pet in this local prototype.

## Current MVP

- Import 3-5 pet photos and a pet name.
- Copy prompts for identity-sheet and sprite-sheet generation.
- Import AI-generated identity sheet and 4x4 sprite sheet.
- Slice the imported sprite sheet into 16 local action frames in the app.
- Show a small always-on-top Electron desktop pet.
- Surface a "Ding! I found a money lead." toast.
- Open an opportunity card with type, evidence, risk, and approval actions.
- Prepare a Grilling Brief before handing the idea to a stricter planning flow.

The current version does not pay for or call an image generation API. Users bring their own AI tool, paste the prompts, then import the generated images. Local mock opportunities live in `src/opportunities.js`; Tieguo remains a development sample.

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
2. User copies the identity prompt into their AI image tool and imports the identity sheet.
3. User copies the sprite prompt into their AI image tool and imports the 4x4 sprite sheet.
4. Opportunity Pet slices the sprite sheet into local action frames.
5. The imported animated pet scouts for leads and brings back opportunity cards.
6. User approves, skips, or reviews the plan.
7. Approved leads become Grilling Briefs.
8. Later: Grilling output routes into MAH routemap.
