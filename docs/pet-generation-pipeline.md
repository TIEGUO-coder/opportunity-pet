# Pet Generation Pipeline

Opportunity Pet should be usable immediately after download. The user uploads 3-5 pet photos, and the app asks the user's signed-in Codex to generate a personalized animated scout without prompt copying or a project-owned API key. A basic offline motion fallback remains available.

## Required Output

Generate six local action states per pet:

- `idle`: front-facing calm standing or sitting pose
- `walk`: strict side-view search walk with a raised tail
- `sleep`: curled resting loop with subtle breathing
- `happy`: approval/click feedback
- `chase`: one-shot butterfly chase when handing a lead to Grill-with-docs
- `yawn`: one-shot front-facing yawn during low-frequency idle behavior

Each action has 4 frames. The Codex path first generates a multi-view character sheet, then generates one four-frame strip per action. The Electron main process removes chroma green when necessary, crops each frame, aligns the ground line, validates the output, and stores the transparent PNG frames in the app user-data directory.

## Product Flow

1. User uploads 3-5 pet photos and names the pet.
2. User clicks Generate with Codex.
3. Electron saves temporary input copies and invokes `codex exec` with the bundled `pet-action-pack` skill.
4. Codex infers a multi-view identity sheet and creates six action strips.
5. Electron slices, cleans, aligns, validates, and saves 24 local transparent frames.
6. Temporary input copies are deleted.
7. The generated pet begins scouting for product opportunities.
8. If Codex is unavailable, returns incomplete/invalid files, or does not complete within the default 6-minute budget, the app automatically builds a local animated scout from the uploaded photos and continues to the lead card.

## Account And Cost Boundary

Opportunity Pet does not run a paid generation backend or require an `OPENAI_API_KEY`. High-fidelity generation uses the user's installed, signed-in Codex and may consume that account's included or paid usage. The local fallback does not call AI, but it cannot invent a truly new side view or open mouth that is absent from the source photos.

## Privacy Boundary

The AI button is the explicit consent boundary for sending selected photos through the user's Codex. Temporary copies under the app user-data directory are deleted after success or failure. Generated character sheets, action strips, aligned frames, manifests, and a local Codex log remain in the job directory so the pet can be reused and generation failures can be diagnosed.

## Photo Requirements

Ask for 3-5 images:

- face/front view (first)
- side full-body view (second)
- standing or sitting full body (third)
- sleeping/resting pose (fourth or last)
- distinctive details such as tail, ears, markings, or scars

## MVP Rule

The lead-discovery flow must not begin until a local generated or imported sprite profile exists. Tieguo frames may be used as a development sample, but they are not the user-personalized pet. Task states must use semantically correct views: side view while scouting, front view when presenting a lead, chase for Grill-with-docs handoff, and curled sleep or yawn only as occasional ambient behavior.
