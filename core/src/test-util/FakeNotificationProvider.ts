import {
  DropMarker,
  NotificationProvider,
  ProviderTemplate,
  SendableTemplate,
} from "../notifications/NotificationProvider.js";

/**
 * A minimal, fully-configurable NotificationProvider for tests. Only knows how
 * to render the "review-approved" key (returning a fixed sendable template by
 * default, never a drop marker, unless configured otherwise) - any other key
 * resolves to "no entry" (failed), matching a real provider's behavior for an
 * unimplemented template key. `send()` resolves to `sendResult` (true by
 * default) unless `sendImpl` is supplied for finer control (e.g. throwing, or
 * per-call behavior).
 */
export class FakeNotificationProvider extends NotificationProvider {
  sendResult = true;
  sendImpl?: (template: SendableTemplate) => Promise<boolean>;
  // When set, render() throws this instead of returning renderResult - for
  // simulating a template implementation that throws (e.g. a Handlebars
  // `strict: true` template hitting a missing field).
  renderError?: Error;

  constructor(
    public readonly key: string = "fake",
    private renderResult: ProviderTemplate | DropMarker = { rendered: true }
  ) {
    super();
  }

  render(templateKey: string): ProviderTemplate | undefined {
    if (this.renderError) {
      throw this.renderError;
    }
    if (templateKey !== "review-approved") {
      return undefined;
    }
    return this.renderResult;
  }

  protected async send(template: SendableTemplate): Promise<boolean> {
    if (this.sendImpl) {
      return this.sendImpl(template);
    }
    return this.sendResult;
  }
}
