# MAH Integration Contract

Opportunity Pet is the business interaction layer. MAH owns the project entry, routemap, delegated tasks, scheduled operations, approval checkpoints, execution events, retries, agent routing, and long-running state.

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
