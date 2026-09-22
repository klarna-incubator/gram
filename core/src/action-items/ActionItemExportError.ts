import Threat from "../data/threats/Threat.js";

export type ActionItemExportFailure = {
  actionItem: Threat;
  cause: string;
};

export function formatExportFailureCause(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error === undefined || error === null) {
    return "Unknown export failure";
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Thrown by an {@link ActionItemExporter} after a batch when some items failed.
 * {@link ActionItemHandler} records each entry in `failures`, including its cause.
 */
export class ActionItemExportError extends Error {
  readonly failures: ActionItemExportFailure[];

  constructor(
    failures: ActionItemExportFailure[],
    options?: { message?: string }
  ) {
    super(
      options?.message ?? `Failed to export ${failures.length} action item(s)`
    );
    this.name = "ActionItemExportError";
    this.failures = failures;
  }

  get failedActionItems(): Threat[] {
    return this.failures.map((failure) => failure.actionItem);
  }
}
