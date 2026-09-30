# Notifications

Gram's notification pipeline is a plugin point: any number of `NotificationProvider`
channels (email, Slack, Teams, ...) can be registered, and each queued event is
fanned out to every one of them.

## How it works end to end

A caller such as `ReviewDataService` or `KlarnaCronJob` resolves the event's
channel-agnostic domain data itself (`buildReviewNotificationVariables()`),
then the pipeline queues one row per channel and three pollers move those rows
to a terminal status.

### 1. Notification is queued

`NotificationDataService.queue({ templateKey, variables })` persists the caller's
`variables` verbatim. It does not resolve or transform them.

- If zero `NotificationProvider`s are registered, it creates no rows.
- Otherwise it inserts one `notifications` row per currently registered
  provider, with `status` `new` and `type` set to that provider's `key`.

Fan-out happens here, at queue time. A channel added later never receives a
backlog of past events, because no row was created for it. A channel removed
from config stops being a destination for new rows.

### 2. Notification handler

Three jobs scheduled by `notificationHandler` in `core/src/notifications/handler.ts` claim work. Each takes up to 25 rows, oldest
first. Claiming is what keeps two ticks from processing the same row.

#### New notifications

`notificationNewHandler` runs on `notificationNewInterval` (default 1 minute). It always
polls, including when zero providers are registered, so a row whose channel was
removed from config is still found and resolved instead of staying `new`.

It claims `new` rows by setting `status` to `pending` and refreshing
`updated_at` before any provider runs. Each claimed row goes to the one
registered provider whose `key` matches the row's `type`. There is no fan-out
here; that already happened at queue time.

- No matching provider: the handler marks the row `dropped` and does not call
  a provider.
- Otherwise it calls `provider.handle(templateKey, variables, notificationId)`.
  The handler writes the resulting status: `sent`, `failed`, `dropped`, or
  `awaiting-confirmation`. An `awaiting-confirmation` result stores `ref` on
  `provider_ref`, leaves the row `pending`, and does not increment
  `confirmation_attempts`.

#### Pending notifications

`notificationPendingHandler` runs on `notificationPendingInterval` (default
5 minutes). It claims `pending` rows whose `updated_at` is older than
`notificationPendingLease` (default 60s). Claiming only refreshes `updated_at`,
so a dispatch still inside `send()` is not selected, and a claimed row is not
selected again until the lease passes.

- No `provider_ref`: set the row back to `new` so the new-row poller can
  dispatch it. This covers a crash before the ref was stored, and an
  `awaiting-confirmation` result that returned no ref.
- `provider_ref` set and the provider implements `checkStatus`: call
  `checkStatus(ref)` and apply `sent`, stay `pending`, or `failed`. An unknown
  ref (`missing_ref`, for example HTTP 404) becomes `failed`, never `new`.
  Reclaiming it would POST again.
- The provider is gone, or it does not implement `checkStatus`: leave the row
  `pending`. It is not reclaimed and not dropped. It stays until that provider
  can confirm it, or until retention deletes it.
- `checkStatus` throws: leave the row `pending` and do not count an attempt.
  The next poll after the lease tries again.
- A still-pending confirmation increments `confirmation_attempts`. At
  `notificationConfirmationAttemptCap` (default 5) the row is `dropped`.

#### Failed notifications

`notificationFailedHandler` runs on `notificationFailedInterval` (default 20
minutes). It claims `failed` rows
whose `provider_ref` is null, the same way the new-row poller claims `new`
rows, and routes them through the same per-row logic.

A `failed` row that already has a `provider_ref` is a confirmation or delivery
failure. This job does not select it and does not POST it again. It stays
`failed` until retention or an admin delete. Rows with a null ref are retried
on every run until they succeed, get dropped (for example their provider was
removed from config), or age out via retention.

## Writing a NotificationProvider

One provider = one channel. Extend `NotificationProvider`
(`NotificationProvider.ts`) and implement the members below. Leave `handle()`
alone: the base class already calls `render()` and `send()`, maps the result
to a row outcome, and logs failures.

### Mandatory

**`key`** — a unique channel id. It is written into `notifications.type`, and
the handler routes each row to the provider whose `key` matches that column.
Two providers registering the same `key` fail boot.

**`render(templateKey, variables)`** — builds this channel's content. There is
no closed set of template keys: `render()` is handed whatever a caller queued
(a built-in review-lifecycle event, a plugin-registered key like magic-link's
login template, or anything else). Return one of:

- a real, sendable template (whatever shape this provider wants — it is not
  shared across channels),
- `{ kind: "drop" }`, to deliberately opt this channel out of that event,
- `undefined`, when this provider has no template for that key. That is
  reported as `failed`, never a silent no-op.

A lookup table of one render function per key works here too. See
`EmailNotificationProvider`, which looks the key up in an `EmailProviderTemplates`
map assembled in `config/default.ts`.

**`send(template)`** — protected. Delivers the template `render()` just
produced. Return `{ outcome: "sent" }` when delivery finishes in this call,
`{ outcome: "failed" }` when it does not, or
`{ outcome: "awaiting-confirmation", ref }` when a later status read confirms
it. `send()` never returns `dropped`; that only comes from `render()`.

### Optional: `checkStatus(ref)`

Implement `checkStatus` only when `send()` returns `awaiting-confirmation`.
The pending job calls it with the stored `provider_ref` and does not POST
again. Return `{ outcome: "sent" | "pending" | "failed" | "missing_ref" }`.
The handler writes `notifications.status`; `checkStatus` does not.

Omit it for a one-shot transport. Email returns `{ outcome: "sent" }` from
`send()` and has no `checkStatus`. A provider that returns
`awaiting-confirmation` without implementing `checkStatus` leaves those rows
`pending` until retention.

### Example

`postToSlack` and `readSlackDelivery` stand in for the channel's own transport.

```ts
import {
  DropMarker,
  NotificationProvider,
  SendResult,
  StatusCheckResult,
} from "./NotificationProvider.js";
import {
  NotificationTemplateKey,
  NotificationVariables,
} from "../data/notifications/NotificationInput.js";

type SlackTemplate = { channel: string; text: string };

export class SlackNotificationProvider extends NotificationProvider {
  readonly key = "slack";

  render(
    templateKey: NotificationTemplateKey,
    variables: NotificationVariables
  ): SlackTemplate | DropMarker | undefined {
    if (templateKey === "review-meeting-requested-reminder") {
      return { kind: "drop" };
    }
    if (templateKey !== "review-requested") {
      return undefined;
    }
    return {
      channel: "#reviews",
      text: `${variables.requester?.name} requested a review of ${variables.model?.name}`,
    };
  }

  protected async send(template: SlackTemplate): Promise<SendResult> {
    const ref = await postToSlack(template);
    if (!ref) {
      return { outcome: "failed" };
    }
    return { outcome: "awaiting-confirmation", ref };
  }

  async checkStatus(ref: string): Promise<StatusCheckResult> {
    const state = await readSlackDelivery(ref);
    if (state === "delivered") return { outcome: "sent" };
    if (state === "sending") return { outcome: "pending" };
    if (state === "unknown") return { outcome: "missing_ref" };
    return { outcome: "failed" };
  }
}
```

A one-shot provider keeps `key`, `render`, and `send`, returns
`{ outcome: "sent" }` from `send()`, and leaves `checkStatus` unimplemented.

Register providers in `config/default.ts` via the `notificationProviders` array
on `bootstrapProviders()`'s return value — the same pattern as `identityProviders`.

## Outcomes: sent, failed, dropped, awaiting confirmation

`handle()` / `send()` resolve to one of:

- **`sent`** - a real template existed for the row's `template_key` and the
  transport finished delivery in that call (email). `provider_ref` stays null.
- **`failed`** - a real template existed but the transport failed, **or** the
  routed provider has no entry at all for that `template_key`. Both report
  `failed` identically: a missing template is a delivery failure to fix, not a
  silent no-op. The specific reason (transport error, or the unmatched
  `template_key`) is **logged**, not persisted - the `notifications` table has no
  reason/error column.
- **`dropped`** - either the routed provider has an explicit drop marker for that
  `template_key`, or no provider matched the row's `type` at all (its channel was
  removed from config). Both are deliberate decisions, never errors, and `dropped`
  is its own value on the `notification_status` enum - never aliased to `sent` or
  `failed`. A pending row that stays in flight past the confirmation-attempt cap
  is also `dropped`.
- **`awaiting-confirmation`** - dispatch was accepted and delivery is confirmed
  later. When `ref` is present, the handler stores it on
  `notifications.provider_ref` and leaves `status` as `pending`. It does not
  increment `confirmation_attempts`. A result with no `ref` also stays
  `pending`; after the lease, the pending job treats the null ref as "never
  dispatched" and sets the row back to `new`.

`checkStatus(ref)` is optional and returns `sent`, `pending`, `failed`, or
`missing_ref`. The handler writes `notifications.status`; providers do not.
Return `sent` from `send()` for a one-shot transport and omit `checkStatus`
(email). Return `awaiting-confirmation` only when a later status read can
finish the delivery, and implement `checkStatus` for that provider.

Kep-notifier `send()` POSTs and returns as soon as kep-notifier accepts the
request (`awaiting-confirmation` plus the `request_id`). It does not wait for
delivery. `checkStatus` reads `GET /s2s/v2/notification/{id}`: `DELIVERED` →
`sent`, `SENDING` → `pending`, HTTP 404 → `missing_ref`, any other terminal
state → `failed`. Those HTTP calls time out at `notificationHttpTimeout`
(default 15s), which is shorter than the pending lease, so a hung POST becomes
`failed` with no ref (a retryable dispatch) instead of a pending row the
poller reclaims while the original POST is still in flight.

`failed` always means "a provider existed and was asked to act, but something is
wrong" - something a developer should fix. `dropped` always means "nothing is
wrong here, sending was never going to happen."

## Retention

A cleanup job scheduled by `notificationHandler` deletes any `notifications` row older than
the retention window, **regardless of status** - `sent`, `failed`, `dropped`,
and even still-unresolved `new`/`pending` rows are all in scope
(`NotificationDataService.deleteOlderThan()`). The default window is one week
(`notificationCleanUpThreshold`) and the sweep runs once a day
(`notificationCleanUpInterval`). Deployments can override the retention threshold and cleanup interval. This is a backstop against the table
growing forever, not a substitute for `countFailures()`/`countStalled()`:
those health checks should catch problems well before a row ages out.

## Schema

The table below is the result of migrations `9_notifications.sql`,
`10_notifications_refactor.sql` (`template` renamed to `template_key`),
`33_notification_status_add_dropped.sql`, and
`35_notifications_add_provider_ref_and_confirmation_attempts.sql`.

| Key                     | Type                       | Constraints / default                                         |
| ----------------------- | -------------------------- | ------------------------------------------------------------- |
| `id`                    | `serial`                   | Primary key                                                   |
| `type`                  | `varchar(255)`             | Nullable; contains the provider `key`                         |
| `template_key`          | `varchar(255)`             | Nullable                                                      |
| `status`                | `notification_status`      | Nullable; enum: `new`, `pending`, `sent`, `failed`, `dropped` |
| `variables`             | `jsonb`                    | Not null; default `{}`                                        |
| `sent_at`               | `timestamp with time zone` | Nullable; default `NULL`                                      |
| `created_at`            | `timestamp with time zone` | Nullable; default `current_timestamp`                         |
| `updated_at`            | `timestamp with time zone` | Nullable; default `current_timestamp`                         |
| `provider_ref`          | `text`                     | Nullable                                                      |
| `confirmation_attempts` | `integer`                  | Not null; default `0`                                         |

The table has a primary-key index on `id` and an additional index on `status`.

`type` is the provider `key` the row is routed to. `template_key` is the event
the caller queued. `variables` is that caller's payload, stored verbatim.
`sent_at` is set when the row becomes `sent`.

`provider_ref` is an opaque id returned by the provider at dispatch time. It
stays null for a one-shot send. Core only checks whether it is present and
passes it to `checkStatus`. `confirmation_attempts` counts confirmation polls
that are still in flight, not dispatch retries. Both columns are additive:
rolling the code back leaves them unused.

## The `dropped` migration is one-way

`dropped` is its own value on the Postgres `notification_status` enum, added via
`ALTER TYPE notification_status ADD VALUE 'dropped'`. Postgres has no `DROP VALUE`

- once this ships, it can't be cleanly rolled back without recreating the enum
  type from scratch. Treat any future change to this enum as a deliberate,
  one-way step.
