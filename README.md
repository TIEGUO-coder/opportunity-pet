# Opportunity Pet

> A tiny desktop pet that brings back product opportunities, asks whether they are worth chasing, and turns the good ones into a brief for serious project planning.

![Opportunity Pet sprite sheet](assets/source/teiguo-expressive-spritesheet.png)

Opportunity Pet is a free, open-source experiment for builders who collect too many ideas and execute too few of them.

You give it 3-5 photos of your own pet. It creates a small animated scout. The pet wanders around your desktop, brings back a money-adjacent opportunity card, and lets you either reject it, approve it, or copy a Grill-with-docs brief for deeper planning.

It is deliberately a little silly. That is the point. The pet is the hook; the real loop is:

```text
notice a lead -> stress-test it -> turn it into tasks -> keep the work moving
```

That loop is the part we care about. If the idea of ongoing AI work feels interesting, look at the system this experiment is pointing toward: [MAH Product System](https://dev.mah.bot/product).

## The Lead It Brings Back

The first demo lead is intentionally concrete:

> **Missed-Quote Money Finder**
> U.S. mobile detailers, cleaners, movers, lawn crews, and handymen lose jobs because customers ask for quotes in scattered places and owners reply too late or forget the follow-up.

That is small enough to inspect in public, but real enough to become a product experiment. A builder could look at Yelp, Thumbtack, Facebook, and Google Business pages, find patterns in slow replies or vague quote forms, and prototype one tiny helper:

```text
paste customer message -> ask missing quote questions -> draft reply -> set follow-up reminder
```

The pet does not magically make the business work. It makes the decision point visible: is this worth grilling, planning, and turning into a routemap?

## Why This Exists

Most AI project ideas die in one of three places:

- They stay as bookmarks.
- They become a giant prompt nobody wants to run twice.
- They start in a chat window and lose context before anything real ships.

Opportunity Pet makes that failure mode visible and playful. A pet brings you a lead. You make one small decision. The next step is not "vibe harder"; it is a structured brief that can become a routemap, tasks, scheduled follow-ups, and reviewable work.

This repo is the toy version of a larger question:

> What if AI work did not live inside one disappearing chat, but inside an ongoing project system with context, agents, recovery, and human decisions?

That is the MAH-shaped question.

## What It Does Today

- Imports 3-5 pet photos and a pet name.
- Uses the user's signed-in Codex CLI to generate a personalized animated pet action pack.
- Creates six action states: idle, side-walk scout, curled sleep, happy response, butterfly chase, and yawn.
- Falls back to basic local photo animation when Codex is unavailable.
- Runs as a small transparent Electron desktop pet.
- Lets the pet scout demo opportunity cards.
- Copies a Grill-with-docs brief for leads the user wants to stress-test.
- Includes packaged desktop downloads for macOS, Windows, and Linux.

Tieguo is only the default development sample. Your pet is supposed to replace him.

## The Demo Loop

1. Import a few photos of your pet.
2. Generate a tiny animated scout.
3. Let it bring back an opportunity card.
4. Approve the lead or send the pet back out.
5. Copy the Grill-with-docs brief.
6. Turn the fuzzy lead into a routemap-ready plan.
7. Continue the work in a real ongoing-work system such as [MAH](https://dev.mah.bot/product).

The current opportunities are intentionally simple examples for GitHub builders: missed quote workflows, local-business review rescue, resale listing polishers, and similar small experiments that can be researched from public signals.

## Download

Open the repository's **Releases** page and download the build for your system:

- macOS: Apple Silicon or Intel `.dmg` / `.zip`
- Windows: Setup or Portable `.exe`
- Linux: `.AppImage`

These early community builds are not code-signed. macOS may require right-clicking the app and choosing **Open** the first time. Windows SmartScreen may require **More info > Run anyway**. Only download builds from this repository.

## Run From Source

```bash
npm install
npm run prepare:assets
npm run check
npm run start
```

For personalized AI actions, install and sign in to Codex before starting Opportunity Pet. The app detects the CLI automatically. Without Codex, choose `Use local fallback`; it animates supplied views but cannot synthesize unseen poses.

If Electron's postinstall download fails:

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

Opportunity Pet does not run a paid backend and does not require an Opportunity Pet API key.

The AI generation path uses your signed-in Codex CLI and may count against that account's usage limits. Selected photos are copied into the app's local user-data directory for the generation job, then temporary input copies are deleted. Generated action assets remain local.

Opportunity Pet does not promise revenue, choose what you should build, or automate business decisions. It only turns "maybe this is interesting" into a small decision point and a planning brief.

## How This Points To MAH

Opportunity Pet is not trying to explain MAH in full. It is trying to make one feeling obvious:

> A good AI workflow should keep moving after the first prompt.

MAH is built around that ongoing-work layer: project context, planned multi-agent execution, background continuity, recovery, and decision-ready review. If this pet makes you want a bigger system behind the loop, start here:

[Explore MAH Product System ->](https://dev.mah.bot/product)

## Roadmap

- Replace static demo opportunities with pluggable opportunity sources.
- Add a cleaner handoff into Grill-with-docs and MAH routemap flows.
- Improve generated pet quality checks with visual regression tests.
- Add a short demo video or GIF once the flow is stable enough to show in one glance.
- Keep the project weird enough that people actually remember it.
