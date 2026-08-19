# Opportunity Pet

Opportunity Pet is a desktop scout pet. A user imports 3-5 photos of their own pet, gives it a name, generates an animated pet character, and the pet brings back product opportunity cards for approval before the idea moves into a grilling/planning step.

Tieguo is only the default test pet in this local prototype.

## Current MVP

- Import 3-5 pet photos and a pet name.
- Treat uploaded photos as source material for an identity sheet and generated pet animation assets.
- Show a small always-on-top Electron desktop pet.
- Surface a "Ding! I found a money lead." toast.
- Open an opportunity card with type, evidence, risk, and approval actions.
- Prepare a Grilling Brief before handing the idea to a stricter planning flow.

The current version uses local mock opportunities from `src/opportunities.js` and Tieguo as a development sample. The intended product flow is documented in `docs/pet-generation-pipeline.md`: uploaded photos must become generated sprite animations before the pet starts scouting.

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
2. Opportunity Pet generates and confirms a multi-view identity sheet.
3. Opportunity Pet generates a complete animated sprite character from that identity sheet.
4. The generated pet scouts for leads and brings back opportunity cards.
5. User approves, skips, or reviews the plan.
6. Approved leads become Grilling Briefs.
7. Later: Grilling output routes into MAH routemap.
