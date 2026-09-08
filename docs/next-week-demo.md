# Opportunity Pet Demo Checklist

This is a product demo checklist, not a claim that MAH production execution already exists.

## Before the meeting

1. Run `npm ci` and `npm run check`.
2. Run `npm run start` on a normal desktop session.
3. Choose **Use Iron sample** if personalized pet generation would make the demo too long.
4. Confirm the lead card says **Make this happen →** with the quiet **Continues in MAH** disclosure.
5. Configure the release MAH desktop route and web entry before testing Accept.
6. With MAH installed, confirm Accept opens MAH with the opportunity attached.
7. Without MAH installed, confirm Accept opens the MAH web download entry.
8. Open **Preview target outcome** and confirm **ILLUSTRATIVE TARGET** is visible above the revenue card.

## Three-minute demo path

1. The pet returns with a concrete creator-store opportunity.
2. Click **Make this happen →**. No plan or document appears in the pet; **Continues in MAH** makes the destination clear before the jump.
3. Show MAH opening with the opportunity context already attached.
4. Repeat without MAH installed and show the web download fallback.
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
