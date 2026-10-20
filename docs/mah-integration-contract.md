# MAH Integration Contract

Opportunity Pet is the business interaction layer. MAH owns the project entry, routemap, delegated tasks, scheduled operations, approval checkpoints, execution events, retries, agent routing, and long-running state.

## User-facing launch contract

The required acquisition path is: a pet shows an opportunity, the owner chooses **Make this happen**, and an installed MAH opens the corresponding roadmap for action. If MAH is absent, open its download page and retain the opportunity for retry after installation. Opening the application alone does not meet this requirement.

1. Save the selected opportunity and preferences locally before attempting a launch.
2. Detect the application registered for `mah:`. Open its application path through the OS when available. The fallback is `mah://account`, a route supported by the inspected MAH 0.1.1896 build; it opens the account surface rather than importing a task.
3. If absent or the launch fails, open `https://mah.bot/download?source=opportunity-pet`. Never include the opportunity payload in an ordinary download-page URL.
4. Keep **Make this happen** enabled until a roadmap handoff is acknowledged. Each click checks installation again. The saved opportunity survives a pet restart and is selected on the next opportunity display.
5. Opening an app is not a receipt for a task. Keep the opportunity locally and label the result as a launch request until MAH provides an import acknowledgement.
6. Packaged pets expose `opportunity-pet://open` and focus the existing instance. MAH can use that URL for a project/plugin entry. The pet passes `launchUrl` to the existing adapter registration; an actual MAH-side entry still requires its production adapter.

### Managed project entry (configured locally)

The user's managed project is `电子铁锅-mah`, with the app in `components/app`. Its native Project Tools entry **打开机会宠物** runs `npm --prefix components/app run start:mah` in detached mode. This entry is registered using `mah project entry`, not the preview adapter. The launcher removes MAH's inherited `ELECTRON_RUN_AS_NODE` setting, binds the containing project, and starts the sample pet on first launch without requiring photo generation. Further launches focus the existing instance.

The card, initial status, summary and supporting note do not name MAH before the user chooses **Make this happen**. Regardless of launch origin, that action saves the opportunity and attempts to open MAH or its download page. Managed launches save structured JSON under `<project>/.mah/opportunity-pet/`; standalone launches use the pet's local user-data directory. No clipboard workflow or separate save-only action is provided. The label remains **Make this happen**, the pet holds its current frame and position, and unconfirmed handoffs remain retryable. Saving/opening does not submit an agent task or open a roadmap; the UI explicitly reports this limitation. No MAH source files or account settings are modified.

### Outstanding MAH-side requirement

MAH 0.1.1896 exposes account/fleet deep links, but no external project/roadmap navigation or opportunity import route. Its internal `mah:openEvolutionDesktop` IPC is not an external integration API. The missing receiver must accept an idempotent opportunity payload, create or resolve the correct project/roadmap, navigate to it, and acknowledge its identifiers. Do not substitute the pet source project's governance roadmap for the user's business opportunity, or treat an OS application-launch result as this acknowledgement.

### Automatic launch on this Mac

The installed MAH entry schema has no autostart field and no MAH source checkout was found locally. The local integration therefore uses `scripts/mah-pet-bridge.swift`: a user-session `NSWorkspace.didLaunchApplicationNotification` listener for bundle ID `bot.mah.desktop`. It starts this managed project's pet when MAH launches; the listener also checks for an already-running MAH when it starts. It does not poll, create tasks, or restart a pet the user closes during the same MAH session. The pet's single-instance lock prevents duplicate windows.

`npm run mah:autostart -- enable` compiles and installs the bridge in `~/Library/Application Support/opportunity-pet/mah-autostart/` and registers `~/Library/LaunchAgents/com.tieguocoder.opportunitypet.mah-bridge.plist`. `status` checks the service; `disable` unloads it and retains the plist with a `.disabled` suffix. This setting is local to the current macOS user and bound component path; it is not a vendor MAH startup plugin, not a project-switch hook, and is not yet included in public desktop downloads. Moving the project requires re-enabling it from the new component path.

Verified 2026-10-16: quit both the pet and MAH, confirmed neither was running, then opened MAH alone. The pet reappeared with `fromMah=1`; the native bridge process was its direct parent. Existing automatic checks also passed.

The installed MAH 0.1.1896 parser rejects `mah://import/opportunity` and query parameters. Do not use that invented route as the default. Once a real opportunity import endpoint is supplied, set `OPPORTUNITY_PET_MAH_DEEP_LINK`; that explicit integration receives `source` and a base64url JSON `handoff` containing the idempotency key, opportunity and preferences. `OPPORTUNITY_PET_MAH_WEB_URL` is likewise only for a confirmed web import receiver, not the general website. `OPPORTUNITY_PET_MAH_DOWNLOAD_URL` overrides the download page if needed.

The repository does not guess unpublished MAH CLI commands. Until the production Skill and CLI are available, the app previews the same resource boundaries locally and labels every resource as non-live.

## Why the boundary is explicit

A single `createWorkflow(plan)` call would repeat the original clipboard problem in code: the pet would still hand one opaque plan to MAH and know nothing about the native resources underneath. The adapter therefore exposes the user intent in MAH-shaped operations.

## Adapter boundary

Set `OPPORTUNITY_PET_MAH_ADAPTER` to an absolute JavaScript module path. The module must export an adapter object, or a `createAdapter(context)` function returning one, with these methods:

```js
module.exports.createAdapter = ({ userDataPath }) => ({
  async getStatus() {
    return { connected: true, mode: 'production', label: 'MAH production' };
  },

  async registerProjectEntry({ key, title, launchSurfaces }) {
    // Register one MAH project entry shared by the MAH and desktop launch surfaces.
    return entry;
  },

  async createOpportunityRoutemap({ idempotencyKey, opportunity }) {
    // Create the native MAH project/routemap and its initial resources.
    return projectSnapshot;
  },

  async getProjectSnapshot(projectId) {
    // Read the native routemap, tasks, schedules, checkpoints, events, and result.
    return projectSnapshot;
  },

  async submitCheckpointDecision({ projectId, checkpointId, decision }) {
    // Send a publish/stop/resume decision back to MAH.
    return acknowledgement;
  }
});
```

The production adapter translates these operations into the official MAH formats. It must preserve the provided idempotency key so reopening the pet or retrying a slow request does not create a second routemap.

## Required project snapshot

```json
{
  "project": {
    "id": "mah-project-id",
    "entryId": "mah-entry-id",
    "isLive": true
  },
  "routemap": {
    "id": "mah-routemap-id",
    "status": "product_build",
    "statusLabel": "Building the first sellable package",
    "phases": [
      { "key": "accepted", "label": "Opportunity accepted", "state": "complete" },
      { "key": "product_build", "label": "Product tasks delegated", "state": "active" }
    ]
  },
  "tasks": [
    { "id": "mah-task-id", "kind": "build_product", "label": "Build the product package", "state": "active" }
  ],
  "schedules": [
    { "id": "mah-schedule-id", "kind": "store_monitor", "label": "Monitor the connected storefront", "state": "active" }
  ],
  "checkpoints": [
    { "id": "mah-checkpoint-id", "kind": "publish_approval", "label": "Approve publishing", "state": "waiting" }
  ],
  "events": [
    { "type": "task.started", "source": "mah", "taskId": "mah-task-id" }
  ],
  "result": {
    "isIllustrative": false,
    "presentation": {
      "title": "Weekend store result",
      "revenue": "$203",
      "customer": "Freelance Client Portal Kit",
      "stats": [["Orders", "7"], ["Refunds", "0"]],
      "ledger": [["Fri 8:10 PM", "Gumroad order", "+$29"]]
    }
  },
  "isLive": true
}
```

## Native resource mapping

| Opportunity Pet event | Native MAH resource |
| --- | --- |
| Open from MAH or desktop | Shared project entry |
| Owner accepts a lead | Project + routemap |
| Research/build/listing work | Delegated tasks |
| Daily opportunity search | Scheduled task |
| Store order and revenue check | Scheduled task |
| Publish/stop/resume decision | Approval checkpoint |
| Task progress or sale detected | Project event returned to the pet |
| Task failure | MAH retry, fallback, and agent routing |

The pet UI must not implement these reliability mechanisms itself. It invokes native MAH resources and presents their returned state in business language.
