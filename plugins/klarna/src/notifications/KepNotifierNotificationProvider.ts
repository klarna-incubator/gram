import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import {
  NotificationTemplateKey,
  NotificationVariables,
} from "@gram/core/dist/data/notifications/NotificationInput.js";
import {
  DropMarker,
  NotificationProvider,
  ProviderTemplate,
  SendableTemplate,
} from "@gram/core/dist/notifications/NotificationProvider.js";
import { isDevelopment } from "@gram/core/dist/util/env.js";
import type { Agent } from "http";
import { HttpProxyAgent } from "http-proxy-agent";
import log4js from "log4js";
import fetch from "node-fetch";

const log = log4js.getLogger("KepNotifierNotificationProvider");

const DROP: DropMarker = { kind: "drop" };

/**
 * kep-notifier's own wire schema for POST /s2s/v3/notify-team.
 * ActionableNotification is SimpleNotification plus an `actions` array.
 */
export type Sink = string;

export type NotificationAction = {
  title: string;
  url: string;
};

export type SimpleNotification = {
  sinks: Sink[];
  title: string;
  message: string;
  why: string;
  severity?: "info" | "warning";
};

export type ActionableNotification = SimpleNotification & {
  actions: NotificationAction[];
};

/**
 * `requester` is only carried on the template so send() can resolve
 * team_acc from it - it's not part of kep-notifier's wire schema.
 */
export type NotifyTeamTemplate = (
  | SimpleNotification
  | ActionableNotification
) & {
  team_acc: string;
  requester: Record<string, unknown>;
};

export type NotifySystemTemplate = (
  | SimpleNotification
  | ActionableNotification
) & {
  system_id: string;
};

type KepNotifierNotifyResponse = {
  request_id: string;
};

/**
 * Confirmed directly against two real, delivered notifications on staging -
 * the field is `state` (not `last_state`), and `"DELIVERED"` is the terminal
 * success value. Other fields (accepted_at/routed_at/settled_at/last_event_at,
 * plus a per-sink block like `slack: {...}`) exist on the real response but
 * aren't needed for the delivery check below, so they're left untyped here.
 */
type KepNotifierNotificationStatusResponse = {
  request_id: string;
  state: string;
};

const NOTIFICATION_DELIVERED_STATE = "DELIVERED";
const NOTIFICATION_SENDING_STATE = "SENDING";
const NOTIFICATION_STATUS_MAX_ATTEMPTS = 5;
const NOTIFICATION_STATUS_RETRY_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEFAULT_SINKS: Sink[] = ["slack"];

type KepNotifierTemplateContent = {
  title: string;
  message: string;
  why: string;
  actions?: NotificationAction[];
};

/**
 * The only notification events this channel has content for. Checked in
 * render() before branching on system presence - the team (no-system) path
 * always builds the standalone-model message regardless of templateKey, so
 * without this upfront check an out-of-scope key on a system-less model
 * would incorrectly send that message instead of dropping.
 */
const IN_SCOPE_TEMPLATE_KEYS = new Set([
  "review-requested",
  "review-approved",
  "review-meeting-requested",
  "review-meeting-requested-reminder",
  "review-canceled",
]);

const TEMPLATES: Record<
  string,
  (variables: NotificationVariables) => KepNotifierTemplateContent
> = {
  "review-requested": (v) => ({
    title: `New Gram threat model review requested for ${v.model?.name}`,
    message: `${v.requester?.name} just requested a Gram review for ${v.model?.name}. \n\nIt should get picked up in the next few days by ${v.reviewer?.name}.`,
    actions: [{ title: "View in Gram", url: v.model?.link }],
    why: "https://wiki.klarna.net/wiki/Secure_Development/Threat_Modeling_-_Threat_Modeling_Process#Are_we_doing_a_good_job_at_it",
    severity: "info",
  }),
  "review-approved": (v) => ({
    title: `Gram threat model review approved for ${v.model?.name}`,
    message: `${v.reviewer?.name} approved the Gram review for ${
      v.model?.name
    }.${
      v.review?.note ? ` They left this note: "${v.review.note}".` : ""
    } Heads up - any action items marked medium severity or higher automatically become AIMs, so it's worth a look.`,
    actions: [
      { title: "View in Gram", url: v.model?.link },
      {
        title: "Go to Success Dashboard",
        url: "https://klarna-dashboards.klarna.net",
      },
    ],
    severity: "info",
    why: "https://wiki.klarna.net/wiki/Secure_Development/Threat_Modeling_-_Threat_Modeling_Process#Action_items",
  }),
  "review-meeting-requested": (v) => ({
    title: `Let's talk - Gram threat model review meeting requested for ${v.model?.name}`,
    message: `${
      v.reviewer?.name
    } would like to meet to go over the threat model for ${v.model?.name}.${
      v.review?.note ? ` They left this note: "${v.review.note}".` : ""
    } \n\n Please get in contact with the threat model reviewer. \n\nIf the reviewer is part of Secure Development, click the "Book a session with Secure Development" button to schedule a meeting.`,
    actions: [
      { title: "View in Gram", url: v.model?.link },
      {
        title: "Book a session with Secure Development",
        url: v.sessionBookingLink,
      },
    ],
    severity: "warning",
    why: "https://wiki.klarna.net/wiki/Secure_Development/Threat_Modeling_-_Threat_Modeling_Process#Are_we_doing_a_good_job_at_it",
  }),
  "review-meeting-requested-reminder": (v) => ({
    title: `Still waiting - Gram threat model review meeting reminder for ${v.model?.name}`,
    message: `Friendly nudge - the review meeting for ${v.model?.name} still hasn't been booked. \n\nPlease get in contact with the threat model reviewer. \n\nIf the reviewer is part of Secure Development, click the "Book a session with Secure Development" button to schedule a meeting.`,
    actions: [
      { title: "View in Gram", url: v.model?.link },
      {
        title: "Book a session with Secure Development",
        url: v.sessionBookingLink,
      },
    ],
    severity: "warning",
    why: "https://wiki.klarna.net/wiki/Secure_Development/Threat_Modeling_-_Threat_Modeling_Process#Are_we_doing_a_good_job_at_it",
  }),
  "review-canceled": (v) => ({
    title: `Gram threat model review canceled for ${v.model?.name}`,
    message: `The Gram threat model review for ${v.model?.name} has been canceled. \n\nIf you want to start a new review, go to Gram and click "Request Review" on the review box.`,
    actions: [{ title: "View in Gram", url: v.model?.link }],
    severity: "warning",
    why: "https://wiki.klarna.net/wiki/Secure_Development/Threat_Modeling_-_Threat_Modeling_Process",
  }),
  "standalone-model": (v) => ({
    title:
      "Heads up - Gram threat model review requested for a standalone model",
    message:
      `${v.requester?.name} just requested a Gram review for a threat model that isn't linked to a system yet. ` +
      "\n\nThe review process is meant for system-owned models - if this one's a template or something you're just exploring, feel free to cancel the review instead. " +
      "\nWant it linked to a real system? Reach out to Secure Development and we'll get you set up.",
    actions: [
      { title: "View in Gram", url: v.model?.link },
      {
        title: "Contact Secure Development",
        url: "https://klarna.enterprise.slack.com/archives/C01FZM386J1",
      },
    ],
    why: "https://wiki.klarna.net/wiki/Secure_Development/Threat_Modeling_-_Threat_Modeling_Process#Are_we_doing_a_good_job_at_it",
    severity: "warning",
  }),
};
function buildSystemTemplate(
  templateKey: string,
  variables: NotificationVariables
): NotifySystemTemplate {
  const content = TEMPLATES[templateKey](variables);
  const system_id = variables.system?.id;

  const base: SimpleNotification & { system_id: string } = {
    sinks: DEFAULT_SINKS,
    title: content.title,
    message: content.message,
    why: content.why ?? "",
    system_id,
  };

  if (content.actions !== undefined) {
    const actionable: ActionableNotification & { system_id: string } = {
      ...base,
      actions: content.actions,
    };
    return actionable;
  }

  return base;
}

function buildTeamTemplate(
  templateKey: string,
  variables: NotificationVariables
): NotifyTeamTemplate {
  const content = TEMPLATES[templateKey](variables);
  const team_acc = "";

  const base: SimpleNotification & {
    team_acc: string;
    requester: Record<string, unknown>;
  } = {
    sinks: DEFAULT_SINKS,
    title: content.title,
    message: content.message,
    why: content.why ?? "",
    team_acc,
    requester: variables.requester ?? {},
  };

  if (content.actions !== undefined) {
    const actionable: ActionableNotification & {
      team_acc: string;
      requester: Record<string, unknown>;
    } = {
      ...base,
      actions: content.actions,
    };
    return actionable;
  }

  return base;
}
/**
 * What render() produces once an accountable ID is known: enough for send()
 * to build either a SimpleNotification or an ActionableNotification, without
 * needing anything else from `variables`.
 */
export type KepNotifierSendableTemplate = SendableTemplate &
  (NotifyTeamTemplate | NotifySystemTemplate);

export class KepNotifierNotificationProvider extends NotificationProvider {
  readonly key = "kep-notifier";

  constructor(private dal: DataAccessLayer) {
    super();
  }

  render(
    templateKey: NotificationTemplateKey,
    variables: NotificationVariables
  ): NotifyTeamTemplate | NotifySystemTemplate | DropMarker {
    if (!IN_SCOPE_TEMPLATE_KEYS.has(templateKey)) {
      return DROP;
    }

    let template;

    try {
      if (variables.system?.id) {
        template = buildSystemTemplate(templateKey, variables);
      } else {
        template = buildTeamTemplate("standalone-model", variables);
      }
    } catch (error) {
      // If the template is not found, we are choosing to drop the notification.
      log.error(`Error building template: ${error}`);
      return DROP;
    }

    return template;
  }

  private notifyTeamUrl(): string {
    const base = process.env.KEP_NOTIFIER_URL;
    if (!base) {
      throw new Error(
        "KEP_NOTIFIER_URL is not configured - cannot reach kep-notifier"
      );
    }
    return `${base}/s2s/v3/notify-team`;
  }

  private notifySystemUrl(): string {
    const base = process.env.KEP_NOTIFIER_URL;
    if (!base) {
      throw new Error(
        "KEP_NOTIFIER_URL is not configured - cannot reach kep-notifier"
      );
    }
    return `${base}/s2s/v2/notify-system`;
  }

  private notificationStatusUrl(notificationId: string): string {
    const base = process.env.KEP_NOTIFIER_URL;
    if (!base) {
      throw new Error(
        "KEP_NOTIFIER_URL is not configured - cannot reach kep-notifier"
      );
    }
    return `${base}/s2s/v2/notification/${notificationId}`;
  }

  /**
   * Resolves the team accountable ID to address a NotifyTeamTemplate to,
   * from the requester's own team (there's no system to derive it from on
   * this path - see buildTeamTemplate). Uses this provider's own `dal`
   * reference, since NotificationVariables only carries the requester's
   * name/email, not their team.
   */
  private async resolveTeamAcc(
    requester: Record<string, unknown>
  ): Promise<string | undefined> {
    const requesterEmail = requester.email;
    if (typeof requesterEmail !== "string" || !requesterEmail) {
      return undefined;
    }
    const teams = await this.dal.teamHandler.getTeamsForUser(
      {},
      requesterEmail
    );
    log.debug(`Teams for ${requesterEmail}: ${JSON.stringify(teams)}`);
    return teams[0]?.id;
  }

  private async postNotifyTeam(
    template: NotifyTeamTemplate
  ): Promise<string | undefined> {
    const url = this.notifyTeamUrl();
    const headers = { "Content-Type": "application/json" };

    // `requester` is only carried on the template so send() can resolve
    // team_acc from it - it's not part of kep-notifier's wire schema, so it
    // never gets sent.
    const { requester: _requester, ...wireTemplate } = template;
    const body = JSON.stringify(wireTemplate);

    let resp;
    if (isDevelopment() && process.env.C2C_PROXY) {
      const agent = new HttpProxyAgent(process.env.C2C_PROXY);
      resp = await fetch(url, {
        method: "POST",
        headers,
        body,
        agent: agent as unknown as Agent,
      });
    } else {
      resp = await fetch(url, { method: "POST", headers, body });
    }

    if (!resp.ok) {
      log.error(
        `Failed to notify kep-notifier: ${resp.status} ${
          resp.statusText
        } ${await resp.text()}`
      );
      return undefined;
    }

    const data = (await resp.json()) as KepNotifierNotifyResponse;
    return data.request_id;
  }

  private async postNotifySystem(
    template: NotifySystemTemplate
  ): Promise<string | undefined> {
    const url = this.notifySystemUrl();
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify(template);

    let resp;
    if (isDevelopment() && process.env.C2C_PROXY) {
      const agent = new HttpProxyAgent(process.env.C2C_PROXY);
      resp = await fetch(url, {
        method: "POST",
        headers,
        body,
        agent: agent as unknown as Agent,
      });
    } else {
      resp = await fetch(url, { method: "POST", headers, body });
    }

    if (!resp.ok) {
      log.error(
        `Failed to notify kep-notifier: ${resp.status} ${
          resp.statusText
        } ${await resp.text()}`
      );
      return undefined;
    }

    const data = (await resp.json()) as KepNotifierNotifyResponse;
    return data.request_id;
  }
  private async getNotificationStatus(
    notificationId: string
  ): Promise<KepNotifierNotificationStatusResponse | undefined> {
    const url = this.notificationStatusUrl(notificationId);
    const headers = { "Content-Type": "application/json" };

    let resp;
    if (isDevelopment() && process.env.C2C_PROXY) {
      const agent = new HttpProxyAgent(process.env.C2C_PROXY);
      resp = await fetch(url, {
        method: "GET",
        headers,
        agent: agent as unknown as Agent,
      });
    } else {
      resp = await fetch(url, { method: "GET", headers });
    }

    if (!resp.ok) {
      log.error(
        `Failed to get notification status: ${resp.status} ${
          resp.statusText
        } ${await resp.text()}`
      );
      return undefined;
    }
    return (await resp.json()) as KepNotifierNotificationStatusResponse;
  }

  /**
   * Polls the notification's status until it reaches the DELIVERED terminal
   * state, retrying only while it's still in-flight (state === SENDING), up
   * to NOTIFICATION_STATUS_MAX_ATTEMPTS times, NOTIFICATION_STATUS_RETRY_DELAY_MS
   * apart. Any state other than SENDING or DELIVERED (e.g. a terminal
   * failure state) stops retrying immediately and reports failure - it's not
   * going to become DELIVERED by waiting longer.
   */
  private async waitForDelivery(notificationId: string): Promise<boolean> {
    for (
      let attempt = 1;
      attempt <= NOTIFICATION_STATUS_MAX_ATTEMPTS;
      attempt++
    ) {
      const status = await this.getNotificationStatus(notificationId);
      log.debug(
        `Notification ${notificationId} status: ${JSON.stringify(status)}`
      );

      if (!status) {
        return false;
      }
      if (status.state === NOTIFICATION_DELIVERED_STATE) {
        return true;
      }
      if (status.state !== NOTIFICATION_SENDING_STATE) {
        log.error(
          `Notification ${notificationId} failed with state ${status.state}`
        );
        return false;
      }
      if (attempt < NOTIFICATION_STATUS_MAX_ATTEMPTS) {
        await delay(NOTIFICATION_STATUS_RETRY_DELAY_MS);
      }
    }

    log.error(
      `Notification ${notificationId} did not reach ${NOTIFICATION_DELIVERED_STATE} after ${NOTIFICATION_STATUS_MAX_ATTEMPTS} attempts`
    );
    return false;
  }

  protected async send(
    template: NotifyTeamTemplate | NotifySystemTemplate
  ): Promise<boolean> {
    log.debug(`Sending notification: ${JSON.stringify(template)}`);

    // Send the template to kep-notifier and retrieve the notification ID.
    let notificationId: string | undefined;
    if ("team_acc" in template) {
      const teamAcc = await this.resolveTeamAcc(template.requester);
      if (!teamAcc) {
        log.error(
          `Could not resolve an accountable team for requester ${JSON.stringify(
            template.requester
          )} - not notifying kep-notifier`
        );
        return false;
      }
      notificationId = await this.postNotifyTeam({
        ...template,
        team_acc: teamAcc,
      });
    } else if ("system_id" in template) {
      notificationId = await this.postNotifySystem(template);
    } else {
      throw new Error("Invalid template");
    }
    if (!notificationId) {
      return false;
    }

    return this.waitForDelivery(notificationId);
  }
}
