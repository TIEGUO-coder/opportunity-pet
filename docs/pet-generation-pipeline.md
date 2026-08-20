# Pet Generation Pipeline

Opportunity Pet should be usable immediately after download. The user uploads 3-5 pet photos, and the app generates a local animated scout from that photo set without requiring prompt copying, paid APIs, or external image tools.

## Required Output

Generate six local action states per pet:

- `idle`: front-facing calm standing or sitting pose
- `walk`: strict side-view search walk with a raised tail
- `sleep`: curled resting loop with subtle breathing
- `happy`: approval/click feedback
- `chase`: one-shot butterfly chase when handing a lead to Grill-with-docs
- `yawn`: one-shot front-facing yawn during low-frequency idle behavior

Each action has 4 frames. The local MVP maps uploaded front, side, full-body, and resting photos to the matching actions and creates PNG data frames in the renderer. A professionally generated action sheet can still replace these local motion frames.

## Product Flow

1. User uploads 3-5 pet photos and names the pet.
2. User clicks Generate animated scout.
3. The renderer creates idle, side-walk, sleep, response, chase, and yawn frames from the uploaded photo set.
4. The generated frame loops are saved locally.
5. The pet begins scouting for product opportunities.
6. Advanced users can import a transparent 4x4 legacy sheet; missing chase and yawn states receive compatible fallbacks.

## No Required AI Billing

The MVP does not call a paid image generation API. Opportunity Pet owns upload, local motion mapping, optional sprite import, slicing, preview, and lead interaction. Local transforms cannot invent a truly new side view or open mouth that is absent from the source photos. High-fidelity pose synthesis therefore remains an optional AI action-pack step rather than a hidden claim of the offline renderer.

## Photo Requirements

Ask for 3-5 images:

- face/front view (first)
- side full-body view (second)
- standing or sitting full body (third)
- sleeping/resting pose (fourth or last)
- distinctive details such as tail, ears, markings, or scars

## MVP Rule

The lead-discovery flow must not begin until a local generated or imported sprite profile exists. Tieguo frames may be used as a development sample, but they are not the user-personalized pet. Task states must use semantically correct views: side view while scouting, front view when presenting a lead, chase for Grill-with-docs handoff, and curled sleep or yawn only as occasional ambient behavior.
