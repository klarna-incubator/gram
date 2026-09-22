import { describe, expect, it, jest } from "@jest/globals";
import type { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { actionItemExportCheck } from "./actionItemExportCheck.js";

function invokeCheck(
  dal: DataAccessLayer
): Promise<{ healthy: boolean; message?: string }> {
  return new Promise((resolve) => {
    actionItemExportCheck(dal)(
      (response: { healthy: boolean; message?: string }) => {
        resolve(response);
      }
    );
  });
}

describe("actionItemExportCheck", () => {
  it("reports healthy when the failures table is empty", async () => {
    const dal = {
      actionItemHandler: { countFailures: jest.fn(async () => 0) },
    } as unknown as DataAccessLayer;

    const result = await invokeCheck(dal);

    expect(result.healthy).toBe(true);
  });

  it("reports unhealthy when failed exports exist", async () => {
    const dal = {
      actionItemHandler: { countFailures: jest.fn(async () => 3) },
    } as unknown as DataAccessLayer;

    const result = await invokeCheck(dal);

    expect(result.healthy).toBe(false);
    expect(result.message).toMatch(/action_item_failed_exports/);
  });
});
