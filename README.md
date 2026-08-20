# Opportunity Pet

Opportunity Pet is a free, open-source desktop scout pet workflow. A user imports 3-5 photos of their own pet, generates a ready-to-use animated scout with their signed-in Codex, and then the pet brings back product opportunity cards for the user to explore however they want.

Tieguo is only the default test pet in this local prototype.

## Current MVP

- Import 3-5 pet photos and a pet name.
- Generate a multi-view character sheet and six identity-consistent task states with one click.
- Call the user's own Codex CLI; no Opportunity Pet API key or prompt copying is required.
- Fall back to basic local photo motion when Codex is unavailable.
- Optionally import a professionally generated sprite sheet; legacy 4x4 sheets remain supported.
- Show a small always-on-top Electron desktop pet.
- Open an opportunity card with approval actions.
- Prepare a Grill-with-docs handoff when the user wants to stress-test a lead and turn it into routemap-ready material.

The AI path requires the Codex CLI to be installed and signed in. It uses the user's Codex access and may count against that account's usage limits, but Opportunity Pet does not require a separate image API key or operate a paid backend. Selected photos are copied to the app's user-data directory for the generation job and those temporary input copies are deleted afterward. Generated action assets remain local. Tieguo remains a development sample.

Opportunity Pet does not charge users, promise revenue, or decide what the user should build. It only surfaces practical money-adjacent leads, public signals to inspect, and small experiments a GitHub user could try.

## Run

```bash
npm install
npm run prepare:assets
npm run check
npm run start
```

For personalized AI actions, install and sign in to Codex before starting Opportunity Pet. The app detects the CLI automatically. Without Codex, choose `Use local fallback`; it animates supplied views but cannot synthesize unseen poses.

If Electron's postinstall download fails:

```bash
npm run install:electron
npm run start
```

## Product Path

1. User imports 3-5 pet photos.
2. User clicks Generate with Codex.
3. The bundled `pet-action-pack` skill first infers a multi-view identity sheet, then creates idle, side-walk, sleep, response, butterfly-chase, and yawn states.
4. The animated pet scouts for leads and brings back opportunity cards.
5. User approves, skips, or sends the idea to Grill-with-docs.
6. Approved leads become Grill-with-docs briefs that can become routemap candidates.
7. Later: Grilling output routes into MAH routemap.
