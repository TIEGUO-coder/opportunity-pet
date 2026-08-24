# Opportunity Pet

> **My pet learned to earn its own treats. Now it is working on paying my rent.**

<p align="center">
  <img src="docs/screenshots/lead-card.svg" width="460" alt="Iron brings back a Creator Store Launch Kit opportunity">
</p>

<p align="center"><em>Iron found something small enough to build and concrete enough to sell.</em></p>

<p align="center">
  <img src="docs/screenshots/creator-store-result.svg" width="920" alt="Gumroad-style sales result for a creator product">
</p>

<p align="center"><em>The finish line is not another idea document. It is a product, delivered orders, and a result you can inspect.</em></p>

Opportunity Pet is a free, open-source desktop pet for builders. Give it 3-5 photos of your own animal and it becomes a small animated scout: it wanders across your desktop, brings back opportunities that match your interests, and asks whether you want to reject one, test it, or turn it into real work.

The pet is playful. The workflow behind it is serious:

```text
your pet photos
      -> animated desktop scout
      -> a small sellable opportunity
      -> Grill-with-docs
      -> routemap-ready work in MAH
      -> a shipped product and measurable result
```

## 1. Create Your Pet

<p align="center">
  <img src="docs/screenshots/setup-page.png" width="360" alt="Opportunity Pet photo import screen">
</p>

Start with 3-5 clear photos from different angles. Opportunity Pet uses your signed-in Codex CLI to identify the animal's stable features, build a consistent multi-view character, and prepare the actions needed by each stage of the workflow.

The generated action pack is not one photo sliding around the screen. It contains distinct states:

- **Idle:** faces you, blinks, breathes, and occasionally yawns.
- **Scout:** walks left and right in side view with its tail raised.
- **Rest:** curls into a ball and stays still long enough to feel asleep.
- **Found:** turns toward you when it brings back an opportunity.
- **Send:** chases a butterfly while the brief moves into Grill-with-docs.
- **Happy:** reacts briefly when clicked or when a task moves forward.

The setup window disappears after generation, leaving only the small transparent desktop pet. Iron is just the included sample pet; you can replace him with your own animal.

<p align="center">
  <img src="assets/source/iron-expressive-spritesheet.png" width="760" alt="Iron multi-action character sheet">
</p>

## 2. Let It Bring Back Leads That Fit You

Opportunity Pet is not limited to one kind of business idea. It can bring back different leads based on your preferences, skills, audience, region, risk tolerance, and the platforms you already understand.

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

## 3. Turn The Lead Into A Plan

Approving a card does not launch a giant autonomous project. Opportunity Pet turns the lead into a structured plan: recommended direction, smallest useful experiment, validation tasks, build tasks, distribution path, risks, and the judgment points that should go into MAH.

<p align="center">
  <img src="docs/screenshots/grill-brief.svg" width="820" alt="Opportunity card converted into a routemap-ready plan">
</p>

The plan keeps the good answers instead of forcing another interview loop. It should already say:

- Who already pays for this outcome.
- What the smallest deliverable should be.
- Which claims need evidence or human approval.
- What Codex can automate, and where a person must decide.
- What should count as a useful first result.

For a creator-store lead, a practical first experiment is one asset, one storefront, one price, and one launch channel. Codex can draft the package and supporting files; you choose the niche, validate demand, approve claims, and publish the offer.

## 4. Move The Surviving Work Into MAH

Once the idea has been challenged, the brief should stop being a chat artifact and become durable project work: tasks, dependencies, decisions, follow-ups, and review points.

That is where Opportunity Pet quietly hands the story to **MAH**. The pet creates the moment of curiosity; Grill-with-docs sharpens the idea; MAH is the ongoing system that can carry the work after the first exciting prompt has ended.

```text
lead card -> grilled brief -> routemap -> tasks -> execution -> review
```

[Explore the MAH Product System ->](https://dev.mah.bot/product)

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

- Import 3-5 pet photos and a name.
- Generate a multi-view identity and six aligned action states through the signed-in Codex CLI.
- Fall back to a local transparent scout if image generation is unavailable.
- Run as a small transparent Electron desktop pet on top of ordinary work.
- Scout curated opportunity cards and let the user approve or reject them.
- Copy a routemap-ready plan for an approved lead.
- Open a result page that shows the intended business outcome.
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

For personalized generation, install and sign in to Codex before starting Opportunity Pet. The app detects the CLI automatically and keeps **Generate with Codex** as the primary path.

Opportunity Pet uses `gpt-5.6-luna` by default. To choose another available Codex model:

```bash
OPPORTUNITY_PET_CODEX_MODEL=gpt-5.5 npm run start
```

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

Opportunity Pet has no paid backend and requires no Opportunity Pet API key. Its personalized generation path uses the downloader's signed-in Codex CLI and may count against that account's usage limits.

Selected photos are copied into the app's local user-data directory for the generation job. Temporary input copies are deleted afterward; generated action assets remain local.

Opportunity Pet does not choose what someone should build, promise revenue, publish unreviewed claims, or make business decisions. It turns “maybe this is interesting” into a visible choice, a structured brief, and a path toward reviewable work.

## Roadmap

- Add pluggable live opportunity sources with evidence and freshness checks.
- Pass approved plans directly into MAH routemap creation.
- Improve generated-pet quality checks and visual regression coverage.
- Add a short product video showing the full loop in under one minute.
- Keep the pet expressive enough that people want to leave it running.

---

Opportunity Pet is the playful front door. [MAH](https://dev.mah.bot/product) is where the work keeps going.
