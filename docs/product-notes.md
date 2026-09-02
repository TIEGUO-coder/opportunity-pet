# Product Notes

Opportunity Pet turns product discovery into a small free desktop companion loop.

It is not a paid product, a bookmark tool, or a promise that the user will make money. The pet should bring back practical leads, ask for an explicit owner decision, and pass accepted opportunities directly into a MAH-managed workflow.

## Core Loop

1. The user uploads 3-5 photos of their own pet.
2. Opportunity Pet uses the user's Codex to infer a multi-view identity and generate the six-action scout, with a basic local fallback.
3. The generated pet scouts for small opportunities a GitHub/Codex builder can package and fulfill.
4. The pet brings back a money lead as a compact card, such as a creator-store launch kit.
5. The user approves, skips, or reviews the lead.
6. Approved leads are sent directly through the MAH adapter without clipboard copying.
7. MAH owns the routemap, delegated tasks, schedules, retries, and agent routing.
8. Opportunity Pet renders returned progress and clearly distinguishes illustrative targets from live results.

## Opportunity Types

- Codex-fulfillable service: a narrow service where Codex can produce most of the deliverable.
- Packaging gap: a creator or small operator has an asset, but no sellable page, delivery kit, or proof.
- Underserved: a narrow workflow exists, but the specific user segment is not served well.

## Opportunity Card

Each card should answer:

- What is the opportunity?
- Why is it worth looking at?
- What evidence supports it?
- What is the risk?
- What small experiment could be tried?
- What result page would prove the experiment worked?
- What work should be delegated through MAH?

## MVP Boundary

The current MVP has explicit MAH project, routemap, task, schedule, checkpoint, and event boundaries. It sends structured opportunity data after owner approval and renders the returned project snapshot. Until the production MAH interface is available, a local adapter previews those resource boundaries and labels every result as non-live. The uploaded photo set is source material for the animated pet generator.

The Creator Store case is no longer an open-ended service idea. Its business source of truth is the [Creator Store Launch Kit blueprint](creator-store-blueprint.md): one user-owned source asset, one fixed demonstration product, eight reviewable stages, one publishing approval, and two recurring intents.
