---
name: opportunity-pet-creator
description: Create an identity-locked animated Opportunity Pet from 3-5 real pet photos inside Codex. Use when a user wants a personalized desktop pet rather than a static photo or a generic sprite.
---

# Opportunity Pet Creator

Create a polished, importable pet bundle in the current workspace. This is a Codex-native creation flow: use the host image-generation tool here, not an API key, a background CLI process, or a source-photo cutout.

## Start with the real pet

- Ask for 3-5 clear photos only when they are not already attached. Prefer front, side, standing/full-body, and resting views.
- Treat the photos as identity evidence, never as sprite layers. Preserve species, adult/young proportions, face and muzzle, eyes, coat pattern, paws, and tail visible across the photos.
- First create only one illustrated identity preview: a 2×2 reference sheet showing front, strict side, rear three-quarter, and curled/resting views. Use a clean, semi-realistic desktop-pet illustration style with a transparent or flat chroma-green background.
- Show that preview in the conversation and ask whether it looks like the pet. If the user asks for changes, apply only corrections compatible with the photos and regenerate the preview. Do not begin movement generation until the user approves it.

## After approval

Use the approved preview as the immutable identity anchor. Build the complete version-6 action pack in a folder named `output` in the current workspace. Keep the animal fully inside every cell, at one apparent scale and baseline. Motion happens in place; never simulate it by sliding, rotating, or cropping a photo.

Create these exact 4×2, eight-frame PNG sheets:

`idle.png`, `walk.png`, `settle.png`, `gaze-a.png`, `gaze-b.png`, `sleep.png`, `happy.png`, `chase.png`, `catch.png`, and `yawn.png`.

Use `character-sheet.png` as the approved identity reference. The two gaze sheets together form a 16-direction attention sequence: the body stays planted while eyes, ears, head, and neck orient naturally. The motion set must include a walk-to-sit settle, a natural curled sleep, a complete grounded walk, and a notice/stalk/pounce sequence without drawing a butterfly into the sheet.

Read [the action-pack contract](../pet-action-pack/SKILL.md) before making the action sheets. It defines the required beat order, output manifest, quality report, action timing, and the defects that must trigger a redraw.

## Finish and hand off

- Inspect the full set against the approved preview. Redraw a failed whole action, at most twice, if identity drifts, anatomy is missing, scale pulses, frames are duplicates, or a paw, ear, whisker, or tail is cropped.
- Write `output/manifest.json` and `output/quality-report.json` using the version-6 contract. The quality report must include the SHA-256 of the final `character-sheet.png` and an approved audit entry for all nine actions.
- Tell the user only when the complete pack is ready. The user can then select this `output` folder once in Opportunity Pet. Do not call it ready if it is partial.
