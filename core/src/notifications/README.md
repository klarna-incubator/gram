# Notifications

Gram's notification pipeline is a plugin point: any number of `NotificationProvider`
channels (email, Slack, Teams, ...) can be registered, and each queued event is
fanned out to every one of them.

## How it works end to end

```
Caller (e.g. ReviewDataService, KlarnaCronJob) resolves the event's
channel-agnostic domain data itself (e.g. buildReviewNotificationVariables())
  -> DataService.queue({ templateKey, variables })
  -> NotificationDataService.queue()
       - if zero NotificationProviders are registered: does nothing (no rows
         created)
       - otherwise: inserts ONE notifications row per currently-registered
         provider, each with `type` set to that provider's `key` and the same
         `variables` passed in - queue() does not resolve or transform
         `variables` itself, it's persisted verbatim
  -> notificationHandler, polled on an interval
       - always polls, regardless of provider count (including zero) - this is
         what lets rows orphaned by removing every provider from config still be
         found and resolved, instead of being stuck in `new` forever
       - for each polled row, looks up the ONE registered provider whose `key`
         matches the row's `type` and routes the row to it (no fan-out here -
         fan-out already happened at queue time)
       - if no provider matches (its channel was removed from config after the
         row was created), reports `dropped` for that row directly, without
         invoking any provider
       - otherwise calls provider.handle(templateKey, variables, notificationId),
         which resolves to `sent`, `failed`, or `dropped` (see below) and updates
         the row's `status` accordingly
```

Because fan-out happens at **queue time** (one row per provider), a channel added
later never retroactively receives a backlog of past events - there was never a
row created for it - and a channel removed from config simply stops being a
destination for new rows; any rows already created for it resolve to `dropped`
the next time `notificationHandler` polls them.

## Writing a NotificationProvider

One provider = one channel. Extend `NotificationProvider` (`NotificationProvider.ts`):

```ts
export class SlackNotificationProvider extends NotificationProvider {
  readonly key = "slack"; // mandatory, unique - written into notifications.type

  render(templateKey, variables) { ... }

  protected async send(template): Promise<boolean> { ... }
}
```

`render()` is the **only** abstract method - there's no closed set of template
keys a provider must implement. It's handed whatever `templateKey` a caller
queued (a built-in review-lifecycle event, a plugin-registered key like
magic-link's login template, or anything else) and returns either:

- a real, sendable template (whatever shape this provider wants - it's entirely
  provider-defined, not shared across channels),
- an explicit drop marker, `{ kind: "drop" }`, to deliberately opt this channel
  out of that specific event (e.g. a Slack provider deciding meeting-reminder
  emails are too noisy for Slack), or
- `undefined`, if this provider has no template for that key at all - reported
  as `failed` (see below), never a silent no-op.

A provider whose templates are naturally organized as a lookup table (one
render function per key) can just look the key up directly in `render()` -
see `EmailNotificationProvider`, which does exactly that against an
`EmailProviderTemplates` map assembled in `config/default.ts`.

Register providers in `config/default.ts` via the `notificationProviders` array
on `bootstrapProviders()`'s return value - the same pattern as `identityProviders`,
etc. Two providers registering the same `key` fail boot.

## Outcomes: sent, failed, dropped

Every row resolves to exactly one outcome:

- **`sent`** - a real template existed for the row's `template_key` and the
  transport succeeded.
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
  `failed`.

`failed` always means "a provider existed and was asked to act, but something is
wrong" - something a developer should fix. `dropped` always means "nothing is
wrong here, sending was never going to happen."

## Retrying failed notifications

A minute-interval job (`api/src/index.ts`, `notificationRetryHandler`) polls up
to 25 `failed` rows (oldest first), claims them the same way `notificationHandler`
claims `new` rows, and routes them through the exact same per-row logic - same
provider lookup, same `sent`/`failed`/`dropped` outcome resolution. There is
**no attempt limit or backoff**: every currently-failed row is retried on every
run, indefinitely, until it either succeeds, gets dropped (e.g. its provider was
removed from config in the meantime), or ages out via the monthly retention
cleanup below. If you need to force a specific row to be retried immediately
rather than waiting for the next minute, reset it manually:

```sql
UPDATE notifications SET status = 'new' WHERE id = <id>;
```

(This re-queues it through `notificationHandler`'s regular path rather than the
retry job, but the effect is the same.)

## Retention

A weekly job (`api/src/index.ts`) deletes any `notifications` row older than one
month, **regardless of status** - `sent`, `failed`, `dropped`, and even
still-unresolved `new`/`pending` rows are all in scope
(`NotificationDataService.deleteOlderThan()`). This is a backstop against the
table growing forever, not a substitute for `countFailures()`/`countStalled()`:
those health checks should catch problems well before a row is a month old.

## The `dropped` migration is one-way

`dropped` is its own value on the Postgres `notification_status` enum, added via
`ALTER TYPE notification_status ADD VALUE 'dropped'`. Postgres has no `DROP VALUE`

- once this ships, it can't be cleanly rolled back without recreating the enum
  type from scratch. Treat any future change to this enum as a deliberate,
  one-way step.
