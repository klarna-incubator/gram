import log4js from "log4js";
import {
  NotificationTemplateKey,
  NotificationVariables,
} from "../data/notifications/NotificationInput.js";

const log = log4js.getLogger("NotificationProvider");

export type DeliveryOutcome = "sent" | "failed" | "dropped";

/**
 * Explicit marker a provider returns from render() to deliberately opt a
 * channel out of a given template key, without that showing up as a failure. The
 * shape is standardized by core so the dispatcher/outcome-resolution logic can
 * recognize it structurally; the "real content" half of ProviderTemplate is left
 * entirely to each provider.
 */
export type DropMarker = { kind: "drop" };

export function isDropMarker(template: object): template is DropMarker {
  return (
    typeof template === "object" &&
    template !== null &&
    (template as any).kind === "drop"
  );
}

/**
 * Either a real, sendable template (provider-defined shape) or an explicit drop
 * marker. render() returns this.
 */
export type SendableTemplate = {
  [key: string]: any;
};
export type ProviderTemplate = DropMarker | SendableTemplate;

/**
 * Surfaces whatever diagnostic detail a thrown error carries beyond its bare
 * message - e.g. emailjs's SMTPError exposes `.code` (an SMTP error state),
 * `.smtp` (the raw server response, if the server sent one before the failure),
 * and `.previous` (the underlying socket/network error). None of that shows up
 * if you only log `err.message`, which is exactly the detail needed to tell
 * "DNS/network unreachable" apart from "auth rejected" apart from "connection
 * dropped mid-handshake".
 */
function describeError(err: any): string {
  if (err == null) {
    return String(err);
  }

  const parts = [err.message || String(err)];

  if (err.code !== undefined && err.code !== null) {
    parts.push(`code=${err.code}`);
  }
  if (err.smtp) {
    parts.push(`smtp=${JSON.stringify(err.smtp)}`);
  }
  if (err.previous) {
    parts.push(`previous=${describeError(err.previous)}`);
  }

  return parts.join(" | ");
}

/**
 * One provider = one notification channel. Providers are registered via
 * GramConfiguration.bootstrapProviders()'s `notificationProviders` array
 * (Bootstrapper.registerNotificationProviders()).
 *
 * There's no closed set of template keys a provider must implement - `render()`
 * is handed every key a caller ever queues (built-in review-lifecycle events,
 * plugin-registered ones like magic-link's login template, or anything else)
 * and is free to return `undefined` for whatever it has no content for
 * (reported as `failed` by handle() below - never a silent no-op).
 */
export abstract class NotificationProvider {
  /**
   * Mandatory, unique channel identifier. This is the exact value written into a
   * notification row's `type` column for rows destined for this provider, and the
   * value notificationHandler routes on. Two providers registering the same key
   * fail boot (see Bootstrapper.registerNotificationProviders).
   */
  abstract readonly key: string;

  /**
   * Renders this provider's content for a given template key, or returns
   * undefined if this provider has no template for that key.
   */
  abstract render(
    templateKey: NotificationTemplateKey,
    variables: NotificationVariables
  ): ProviderTemplate | undefined;

  /**
   * Attempts delivery of a single row routed to this provider and resolves the
   * outcome:
   * - no entry at all (render() returns undefined) -> `failed`, logged here
   * - explicit drop marker -> `dropped`
   * - real template -> delegates to send(); `sent` on success, `failed` (logged)
   *   on a falsy result or a thrown transport error
   */
  async handle(
    templateKey: NotificationTemplateKey,
    variables: NotificationVariables,
    notificationId: number
  ): Promise<DeliveryOutcome> {
    let template: ProviderTemplate | undefined;

    try {
      template = this.render(templateKey, variables);
    } catch (err: any) {
      // A render() implementation throwing (e.g. a Handlebars `strict: true`
      // template hitting an unexpectedly missing field) must not escape here -
      // this runs inside a Promise.all() over a whole polled batch, so an
      // uncaught throw would silently drop outcome-tracking for every other
      // notification in that batch, not just this one.
      log.error("Provider threw while rendering notification", {
        payload: {
          notificationId,
          error: describeError(err),
        },
        meta: {
          provider: this.key,
          templateKey,
        },
      });
      return "failed";
    }

    if (template === undefined) {
      log.warn("Provider has no template entry for key - reporting failed", {
        payload: {
          notificationId,
        },
        meta: {
          provider: this.key,
          templateKey,
        },
      });
      return "failed";
    }

    if (isDropMarker(template)) {
      return "dropped";
    }

    try {
      const success = await this.send(template);
      if (!success) {
        log.warn("Provider failed to send notification", {
          payload: {
            notificationId,
          },
          meta: {
            provider: this.key,
            templateKey,
          },
        });
      }
      return success ? "sent" : "failed";
    } catch (err: any) {
      log.error("Provider threw while sending notification", {
        payload: {
          notificationId,
          error: describeError(err),
        },
        meta: {
          provider: this.key,
          templateKey,
        },
      });
      return "failed";
    }
  }

  /**
   * Sends a real (non-dropped) rendered template via this provider's transport.
   * Implemented by concrete providers - each defines its own sendable template
   * shape internally.
   */
  protected abstract send(template: SendableTemplate): Promise<boolean>;
}
