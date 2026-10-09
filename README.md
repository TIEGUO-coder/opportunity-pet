# Opportunity Pet

> **My pet learned to earn its own treats by bringing back sellable opportunities. Now it is working on paying my rent.**

<p align="center">
  <img src="docs/screenshots/creator-store-lead.png" width="460" alt="Iron brings back a Creator Store Launch Kit opportunity with a direct MAH handoff action">
</p>

<p align="center"><em>Iron found something small enough to build and concrete enough to sell.</em></p>

<p align="center">
  <img src="docs/screenshots/creator-store-result.png" width="460" alt="Clearly labelled illustrative Gumroad-style target result for a creator product">
</p>

<p align="center"><em>The finish line is not another idea document. It is a product, delivered orders, and a result you can inspect.</em></p>

Opportunity Pet is a free, open-source desktop pet for builders. Give it 3-5 photos of your own animal and it becomes a small animated scout: it wanders across your desktop, brings back opportunities that match your interests, and asks whether you want to reject one, test it, or turn it into real work.

The pet is playful. The workflow behind it is serious:

```text
your pet photos
      -> animated desktop scout
      -> a small sellable opportunity
      -> owner approval
      -> managed MAH workflow
      -> a shipped product and measurable result
```

## 1. Create Your Pet

<p align="center">
  <img src="docs/screenshots/setup-page.png" width="360" alt="Opportunity Pet photo import screen">
</p>

Upload 3-5 different, clear photos in Opportunity Pet. It creates one readable local Codex task under `Documents/Opportunity Pet Tasks`, containing the photos and fixed pet rules. In Codex, create and approve the illustrated identity first; then create the motion pack in that same task. Opportunity Pet watches for each finished stage and brings the preview and completed pet back automatically. The original photos are identity references only; they are never cut out and moved around as sprites.

The generated action pack is not one photo sliding around the screen. It contains distinct states:

- **Idle:** faces you, blinks, breathes, and occasionally yawns.
- **Scout:** walks left and right in side view with its tail raised.
- **Rest:** curls into a ball and stays still long enough to feel asleep.
- **Look:** follows the butterfly through sixteen complete head-and-eye directions without rotating a cut-out face.
- **Found:** turns toward you when it brings back an opportunity.
- **Send:** chases a butterfly while the approved opportunity is handed directly to MAH.
- **Happy:** reacts briefly when clicked or when a task moves forward.

The setup window disappears after generation, leaving only the small transparent desktop pet. Iron is just the included sample pet; you can replace him with your own animal.

<p align="center">
  <img src="assets/source/iron-expressive-spritesheet.png" width="760" alt="Iron multi-action character sheet">
</p>

## 2. Let It Bring Back Leads That Fit You

Opportunity Pet is not limited to one kind of business idea. It can bring back different leads based on your preferences, skills, audience, region, risk tolerance, and the platforms you already understand.

<p align="center">
  <img src="docs/demo/scout-motion-v3.gif" width="400" alt="Iron performs a fixed-anchor scouting walk cycle without horizontal translation">
</p>

<p align="center"><em>The scout loop lives on your desktop: pace, notice, return, and ask for your call.</em></p>

One possible lead looks like this:

> **Creator Store Launch Kit**
>
> Turn one messy creator asset into a product page, cleaned delivery file, FAQ, launch copy, and lightweight sales report for Gumroad, Etsy, Stan Store, Shopify, or a link-in-bio store.

This kind of lead fits builders because the fulfillment work is mostly files, structured content, and small automations that Codex can produce. A customer might already have a useful Notion template, prompt pack, checklist, guide, or workflow, but still need help turning it into something another person can understand, buy, and receive.

```text
messy creator asset
      -> positioning and product page
      -> cleaned PDF / template / download
      -> FAQ and delivery instructions
      -> launch posts
      -> sales and delivery report
```

The pet does not claim that every lead will make money. Its job is to make plausible opportunities visible at the moment when you can still make a small decision: approve one, reject it, or investigate it properly.

## 3. Accept The Lead In MAH

Approving a card does not produce another plan or document to copy. Opportunity Pet packages the useful context and opens [MAH](https://mah.bot/) with the opportunity already attached. If the MAH desktop app is installed, it opens the native import route. Otherwise, the same action opens the official [MAH download page](https://mah.bot/download).

The handoff keeps the useful context instead of forcing another interview loop. It includes:

- Who already pays for this outcome.
- What the smallest deliverable should be.
- Which claims need evidence or human approval.
- What MAH can delegate to an agent, and where a person must decide.
- What should count as a useful first result.

For a creator-store lead, a practical first experiment is one asset, one storefront, one price, and one launch channel. MAH owns task delegation and long-running execution; you choose the niche, validate demand, and approve claims or external publishing when required.

## 4. Let MAH Run The Work

Opportunity Pet is MAH's playful business interface. It discovers and presents the lead, captures the owner's decision, and hands execution to MAH.

MAH is the running base underneath it: routemap evolution, task delegation, agent routing, retries, scheduled storefront checks, and long-running state. The pet does not reimplement those mechanisms.

```text
lead card -> owner accepts -> MAH opens with the opportunity -> MAH takes over
```

The web fallback uses MAH's official public domain, while the native desktop route remains configurable until its final protocol is published. The pet does not imitate MAH execution inside its own UI. See [the MAH integration contract](docs/mah-integration-contract.md).

## 5. End With A Result, Not A Bookmark

Here is one concrete outcome the loop can aim for:

```text
Product: Freelance Client Portal Kit
Orders: 7
Gross revenue: $203
Files delivered: 7/7
Refunds: 0
Balance after fees: $181
```

The result page makes the finish line legible: did the product ship, did anyone buy it, were the files delivered, where did buyers come from, and did anyone ask for a refund?

Opportunity Pet does not guarantee those numbers. The point is to replace a vague promise like “AI helps you make money” with a modest, testable outcome that the workflow can actually aim at.

## Choose Your Path

Gumroad is one lightweight creator-commerce path for selling digital products, memberships, courses, and services without building a complete store from scratch. It can host a product page, take payment, deliver files or links, send receipts, manage customers and refunds, and show sales analytics.

That makes it a useful sample finish line for a digital-product lead. Codex can help package many of the deliverables, while Gumroad provides the external surface where you can see whether the offer was purchased and delivered.

- [Gumroad features](https://gumroad.com/features)
- [Gumroad analytics dashboard](https://gumroad.com/help/article/74-the-analytics-dashboard.html)
- [Gumroad customer and sales dashboard](https://gumroad.com/help/article/268-customer-dashboard)

Gumroad is only one possible destination. The same loop can point to Etsy, Shopify, Stan Store, a creator's own checkout, a paid service marketplace, a local-service booking flow, or any other path with a real transaction and delivery trail.

## What Works Today

- Upload 3-5 pet photos and a name once, then continue in one prepared Codex task.
- Reconstruct one multi-view illustrated identity in Codex, approve it in Opportunity Pet, then generate a standardized 80-frame action pack.
- Validate nine behavior states, including a walk-to-rest transition and sixteen-direction gaze, on one 512×512 canvas and baseline, with an identity audit bound to the final character sheet.
- Reject incomplete generation instead of silently importing a raw-photo cutout, recolored template, partial pack, or Iron frames under another pet's name.
- Run as a small transparent Electron desktop pet on top of ordinary work.
- Scout curated opportunity cards and let the user approve or reject them.
- Hand approved leads directly to MAH without clipboard copying or an intermediate plan document.
- Open the installed MAH desktop import route with a structured, idempotent opportunity payload.
- Fall back to the official [MAH download page](https://mah.bot/download) when the desktop app is not installed.
- Open a result page that explicitly labels the intended business outcome as illustrative.
- Build packaged desktop downloads for macOS, Windows, and Linux.

The current opportunity feed is curated rather than live web search. That is intentional for this version: the complete decision and handoff loop matters more than showing a large pile of weak leads. Pluggable live sources are a later step.

## Download

Open [Opportunity Pet Releases](../../releases) and choose the build for your system:

- macOS: Apple Silicon or Intel `.dmg` / `.zip`
- Windows: Setup or Portable `.exe`
- Linux: `.AppImage`

These early community builds are not code-signed. On macOS, right-click the app and choose **Open** the first time. On Windows, SmartScreen may require **More info > Run anyway**. Only download builds from the official Releases page.

## Run From Source

```bash
npm install
npm run prepare:assets
npm run check
npm run start
```

For personalized generation, Opportunity Pet prepares a local Codex task from the photos you choose. Open that prepared folder in Codex and paste the short message the app provides. Codex uses its native image generation in the foreground, shows the static identity for approval first, and only then creates the complete action pack. Opportunity Pet does not impersonate that capability through a background CLI call. If identity locking or any required action fails validation, nothing partial is imported. Iron remains a clearly separate sample.

If Electron's post-install download fails:

```bash
npm run install:electron
npm run start
```

## Build The Desktop App

```bash
npm ci
npm run check
npm run dist
```

Build output is written to `release/`. The included GitHub Actions workflow builds macOS, Windows, and Linux artifacts. Creating a tag such as `v0.1.0` publishes those artifacts to a GitHub Release.

## Privacy And Boundaries

Opportunity Pet has no paid backend and requires no Opportunity Pet API key. Personalized creation happens in the user's own Codex task and may count against that user's Codex usage limits.

The user chooses photos in Opportunity Pet once. It copies them only into the prepared local Codex task; generated action assets remain local.

Opportunity Pet does not choose what someone should build, promise revenue, publish unreviewed claims, or make business decisions. It turns “maybe this is interesting” into a visible choice and a direct handoff to a managed workflow.

## Roadmap

- Add pluggable live opportunity sources with evidence and freshness checks.
- Replace the preview adapter with the official MAH production adapter once its CLI and workflow formats are available.
- Create live MAH routemaps, delegated tasks, and scheduled storefront checks through that adapter.
- Improve generated-pet quality checks and visual regression coverage.
- Add a short product video showing the full loop in under one minute.
- Keep the pet expressive enough that people want to leave it running.

---

Opportunity Pet brings the opportunity home. [MAH](https://mah.bot/) is the running base that turns an accepted opportunity into managed work.
