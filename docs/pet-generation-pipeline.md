# Pet Generation Pipeline

Opportunity Pet should not use the uploaded pet photo as the desktop pet itself. The photo is only the source image. The product needs to turn the whole animal into a consistent animated character first.

## Required Output

Generate one transparent sprite sheet per pet:

- `idle`: calm standing or sitting loop
- `scout`: walking/searching loop for bringing back leads
- `sleep`: resting loop
- `celebrate`: approval/click feedback loop

Each action should have 4 frames. The character must preserve the uploaded pet's recognizable body shape, fur markings, face shape, ears, tail, and color pattern.

## Product Flow

1. User uploads a full pet photo and names the pet.
2. The app sends the photo to a pet sprite generator.
3. The generator returns a transparent sprite sheet.
4. The app extracts frames into action folders.
5. Only then does the pet begin scouting for product opportunities.

## Generator Prompt Template

```text
Use case: stylized-concept
Asset type: transparent 2D desktop pet sprite sheet
Primary request: Turn the pet in the reference photo into a complete animated desktop scout pet character.
Input images: Image 1 is the source pet identity reference.
Subject: preserve the whole animal's body shape, markings, face, ears, tail, fur colors, and distinctive traits.
Style/medium: polished 2D desktop pet sprite, cute but still recognizable as the source pet.
Composition/framing: 4 rows, 4 frames per row. Rows are idle, scout/walk, sleep, celebrate. Full body visible in every frame.
Scene/backdrop: transparent background.
Constraints: consistent character identity across all frames; no text; no props unless scouting requires a tiny neutral sparkle; no cropping.
Avoid: using the source photo as a flat sticker, changing species, generic cat/dog markings, extra animals, watermark, labels.
```

## MVP Rule

The lead-discovery flow must not begin until a generated sprite profile exists. Tieguo frames may be used as a development sample, but they are not the user-personalized pet.
