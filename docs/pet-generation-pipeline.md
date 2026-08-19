# Pet Generation Pipeline

Opportunity Pet should not use uploaded pet photos as the desktop pet itself. The photos are only source material. The product needs to infer the pet's identity from 3-5 photos, generate a multi-view identity sheet, then turn the whole animal into a consistent animated character.

## Required Output

Generate one transparent sprite sheet per pet:

- `idle`: calm standing or sitting loop
- `scout`: walking/searching loop for bringing back leads
- `sleep`: resting loop
- `celebrate`: approval/click feedback loop

Each action should have 4 frames. The character must preserve the uploaded pet's recognizable body shape, fur markings, face shape, ears, tail, and color pattern.

## Product Flow

1. User uploads 3-5 pet photos and names the pet.
2. The app sends the photo set to an identity-sheet generator.
3. The user reviews the multi-view identity sheet and can request corrections.
4. The app sends the approved identity sheet to the sprite generator.
5. The generator returns a transparent sprite sheet.
6. The app extracts frames into action folders.
7. Only then does the pet begin scouting for product opportunities.

## Photo Requirements

Ask for 3-5 images:

- face/front view
- side body view
- standing or sitting full body
- sleeping/resting pose
- distinctive details such as tail, ears, markings, or scars

## Generator Prompt Template

```text
Use case: stylized-concept
Asset type: transparent 2D desktop pet sprite sheet
Primary request: Infer the pet's identity from the reference photo set and create a multi-view character identity sheet.
Input images: 3-5 source pet references showing different angles, poses, and distinctive markings.
Subject: preserve the whole animal's body shape, markings, face, ears, tail, fur colors, and distinctive traits across all views.
Style/medium: polished 2D desktop pet sprite, cute but still recognizable as the source pet.
Composition/framing: front view, side view, back view, 45-degree view, sleeping/resting pose, and one distinctive-detail callout.
Scene/backdrop: transparent background.
Constraints: consistent character identity across all views; no props; no cropping.
Avoid: using any source photo as a flat sticker, changing species, generic cat/dog markings, extra animals, watermark.
```

After identity approval, generate the animation sprite sheet from the identity sheet:

```text
Use case: stylized-concept
Asset type: transparent 2D desktop pet sprite sheet
Primary request: Turn the approved pet identity sheet into a complete animated desktop scout pet character.
Input images: Image 1 is the approved pet identity sheet.
Composition/framing: 4 rows, 4 frames per row. Rows are idle, scout/walk, sleep, celebrate. Full body visible in every frame.
Scene/backdrop: transparent background.
Constraints: preserve the approved pet identity exactly; consistent scale across frames; no text; no watermark.
Avoid: changing markings, changing body shape, cropped tail or paws, extra animals.
```

## MVP Rule

The lead-discovery flow must not begin until a generated sprite profile exists. Tieguo frames may be used as a development sample, but they are not the user-personalized pet.
