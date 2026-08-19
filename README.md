# Opportunity Pet

Opportunity Pet is a desktop scout pet. A user imports their own pet photo, gives it a name, and the pet brings back product opportunity cards for approval before the idea moves into a grilling/planning step.

Tieguo is only the default test pet in this local prototype.

## Current MVP

- Import a pet photo and pet name.
- Show a small always-on-top Electron desktop pet.
- Surface a "Ding! I found a money lead." toast.
- Open an opportunity card with type, evidence, risk, and approval actions.
- Prepare a Grilling Brief before handing the idea to a stricter planning flow.

The current version uses local mock opportunities from `src/opportunities.js`. The next step is replacing those mocks with live GitHub/OSS Goldmine signals and replacing the uploaded-photo placeholder with generated pet animation assets.

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

1. User imports a pet photo.
2. Opportunity Pet creates a scout pet profile.
3. The pet scouts for leads and brings back opportunity cards.
4. User approves, skips, or reviews the plan.
5. Approved leads become Grilling Briefs.
6. Later: Grilling output routes into MAH routemap.
