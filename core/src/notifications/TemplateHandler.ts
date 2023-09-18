import { NotificationTemplateKey } from "../data/notifications/NotificationInput";
import { getLogger } from "log4js";
import {
  NotificationTemplate,
  NotificationVariables,
} from "./NotificationTemplate";

const log = getLogger("TemplateHandler");

export class TemplateHandler {
  private templates: Map<NotificationTemplateKey, NotificationTemplate> =
    new Map();

  register(template: NotificationTemplate) {
    this.templates.set(template.key, template);
  }

  render(key: NotificationTemplateKey, variables: NotificationVariables) {
    const template = this.templates.get(key);
    if (!template) {
      throw new Error(`No such notification template ${key}`);
    }
    return template.render(variables);
  }

  get(key: NotificationTemplateKey) {
    return this.templates.get(key);
  }
}
