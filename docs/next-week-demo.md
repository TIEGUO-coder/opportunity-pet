# Opportunity Pet Demo Checklist

This is a product demo checklist, not a claim that MAH production execution already exists.

## Before the meeting

1. Run `npm ci` and `npm run check`.
2. Run `npm run start` on a normal desktop session.
3. Choose **Use Iron sample** if personalized pet generation would make the demo too long.
4. Confirm the lead card says **Accept and preview handoff** while the production adapter is absent.
5. Accept the Creator Store Launch Kit once, then restart the app and confirm the saved workflow is restored rather than duplicated.
6. Open **View managed workflow** and confirm all stages are visible.
7. Open **Preview target outcome** and confirm **ILLUSTRATIVE TARGET** is visible above the revenue card.

## Three-minute demo path

1. The pet returns with a concrete creator-store opportunity.
2. Click **Accept and preview handoff**. No plan is copied and there is no manual paste step.
3. Open **View managed workflow**. Show the transition from acceptance to routemap, delegated product work, listing preparation, and scheduled sales monitoring.
4. Restart the app if time allows. The same MAH project and routemap IDs should recover and the accept action should remain locked.
5. Open the target outcome and point out that it is explicitly illustrative until a connected storefront monitor returns live data.

## Once MAH production is available

1. Read the official Skill/CLI documentation and map the explicit project-entry, routemap, project-snapshot, and checkpoint operations in the production adapter.
2. Map the accepted opportunity to the official routemap format.
3. Map build and listing work to MAH tasks.
4. Map opportunity scouting and storefront checks to MAH scheduled tasks.
5. Preserve the provided idempotency key when creating a routemap.
6. Return the official project, routemap, task, schedule, checkpoint, and event IDs to the pet.
7. Return storefront results with `isIllustrative: false` only when the figures came from the connected account.
8. Launch with `OPPORTUNITY_PET_MAH_ADAPTER=/absolute/path/to/production-adapter.js npm run start`.

## Do not claim

- Do not describe the preview workflow as a live MAH task.
- Do not describe the sample Gumroad numbers as real sales.
- Do not say publishing is automated until the production adapter and storefront authorization have completed it.
- Do not add a development-environment link to the public README.
