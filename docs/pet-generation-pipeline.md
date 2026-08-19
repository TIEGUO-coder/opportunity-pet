# Pet Generation Pipeline

Opportunity Pet should be usable immediately after download. The user uploads 3-5 pet photos, and the app generates a local animated scout from that photo set without requiring prompt copying, paid APIs, or external image tools.

## Required Output

Generate four local action loops per pet:

- `idle`: calm standing or sitting loop
- `scout`: walking/searching loop for bringing back leads
- `sleep`: resting loop
- `celebrate`: approval/click feedback loop

Each action should have 4 frames. The local MVP uses the uploaded photo set as visual source material and creates transparent PNG data frames in the renderer. A professionally generated 4x4 sprite sheet can still be imported as an advanced replacement.

## Product Flow

1. User uploads 3-5 pet photos and names the pet.
2. User clicks Generate animated scout.
3. The renderer creates idle, walk, sleep, and celebrate frames from the uploaded photo set.
4. The generated frame loops are saved locally.
5. The pet begins scouting for product opportunities.
6. Advanced users can import a transparent 4x4 sprite sheet to replace the local generated frames.

## No Required AI Billing

The MVP does not call a paid image generation API. Opportunity Pet owns the upload, local animation, optional sprite import, slicing, preview, and lead interaction. A future AI mode can be added behind an explicit user-provided API key.

## Photo Requirements

Ask for 3-5 images:

- face/front view
- side body view
- standing or sitting full body
- sleeping/resting pose
- distinctive details such as tail, ears, markings, or scars

## MVP Rule

The lead-discovery flow must not begin until a local generated or imported sprite profile exists. Tieguo frames may be used as a development sample, but they are not the user-personalized pet.
