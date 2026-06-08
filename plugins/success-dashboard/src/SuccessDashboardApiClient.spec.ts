import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { MockedFunction } from "jest-mock";
import { SuccessDashboardApiClient } from "./SuccessDashboardApiClient.js";
import {
  SECURE_DEVELOPMENT_ORG_UNIT,
  THREAT_MODEL_FINDING_TAG,
  SECURITY_FINDING_TAG,
} from "./constant.js";
import type { GramActionItemCreatePayload } from "./types.js";

function samplePayload(
  overrides: Partial<GramActionItemCreatePayload> = {}
): GramActionItemCreatePayload {
  return {
    title: "x",
    typeId: "actionable_improvement",
    description: "d",
    dueDate: "2026-07-20T00:00:00Z",
    estimatedEffort: 1,
    observedIssue: "obs",
    suggestedSolution: "sol",
    statusId: "backlog",
    orgRelations: [
      {
        relation: "reporting_team",
        orgUnit: {
          externalId: SECURE_DEVELOPMENT_ORG_UNIT,
          name: "Secure Development",
        },
      },
    ],
    tagIds: [THREAT_MODEL_FINDING_TAG, SECURITY_FINDING_TAG],
    ...overrides,
  };
}

function headersWith(contentType?: string) {
  return {
    get: (name: string) =>
      name.toLowerCase() === "content-type" ? contentType ?? null : null,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    headers: headersWith("application/json"),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function emptyResponse(status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    headers: headersWith(),
    json: async () => undefined,
    text: async () => "",
  } as unknown as Response;
}

describe("SuccessDashboardApiClient", () => {
  beforeEach(() => {
    // Options must win in tests; the client otherwise prefers these env vars.
    delete process.env.SUCCESS_DASHBOARD_URL;
    delete process.env.SUCCESS_DASHBOARD_API_TOKEN;
  });

  describe("createExport", () => {
    it("POSTs the payload to /api/v2/tickets and returns the parsed body", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "uuid-1", qid: "Q42" }, 201)
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      const result = await client.createExport(samplePayload());

      expect(result).toEqual({ id: "uuid-1", qid: "Q42" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://sd.example/api/v2/tickets");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.typeId).toBe("actionable_improvement");
      expect(body.statusId).toBe("backlog");
      expect(body.title).toBe("x");
      expect(body.tagIds).toEqual([
        THREAT_MODEL_FINDING_TAG,
        SECURITY_FINDING_TAG,
      ]);
    });

    it("swallows a non-OK response into a success:false result instead of throwing", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: headersWith(),
        text: async () => "missing required field: title",
      } as unknown as Response);
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      const result = (await client.createExport(samplePayload())) as {
        success: boolean;
        error: unknown;
      };
      expect(result.success).toBe(false);
      expect(String(result.error)).toMatch(
        /POST https:\/\/sd\.example\/api\/v2\/tickets failed \(400\): missing required field: title/
      );
    });
  });

  describe("createBulkExport", () => {
    it("POSTs to /api/v2/tickets/bulk with an array body", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ success: true, total: 2, created: 2, failed: 0 }, 201)
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      await client.createBulkExport([samplePayload(), samplePayload()]);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://sd.example/api/v2/tickets/bulk");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
      expect(body[0].typeId).toBe("actionable_improvement");
    });
  });

  describe("updateExport", () => {
    it("PUTs to /api/v2/tickets/{id}", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(emptyResponse(200));
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      await client.updateExport("uuid-1", { title: "x" });

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://sd.example/api/v2/tickets/uuid-1");
      expect(init.method).toBe("PUT");
      const body = JSON.parse(init.body as string);
      expect(body.title).toBe("x");
      expect(body.typeId).toBeUndefined();
      expect(body.statusId).toBeUndefined();
    });

    it("encodes the exportId in the path", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(emptyResponse(200));
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      await client.updateExport("a/b", { title: "x" });

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://sd.example/api/v2/tickets/a%2Fb");
    });
  });

  describe("deleteExport", () => {
    it("DELETEs /api/v2/tickets/{id} with no body", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(emptyResponse(204));
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      await client.deleteExport("uuid-1");

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://sd.example/api/v2/tickets/uuid-1");
      expect(init.method).toBe("DELETE");
      expect(init.body).toBeUndefined();
    });
  });

  describe("ticket + contributor lookups", () => {
    it("GETs a ticket by UUID", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "uuid-1", statusId: "backlog" })
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      await client.getTicketById("uuid-1");

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://sd.example/api/v2/tickets/uuid-1");
      expect(init.method).toBe("GET");
    });

    it("GETs a ticket by QID", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "uuid-1", statusId: "backlog" })
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      await client.getTicketByQid("Q42");

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://sd.example/api/v2/tickets/qid/Q42");
    });

    it("GETs a contributor by email under the /api/v1 prefix", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "c1", contributorName: "u" })
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      await client.getContributorByEmail("u@k");

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://sd.example/api/v1/contributors/u%40k");
    });
  });

  describe("auth + headers", () => {
    it("sends Authorization when apiToken is set", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "uuid-1", qid: null }, 201)
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        apiToken: "tok",
        fetchImpl: fetchMock,
      });

      await client.createExport(samplePayload());

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Bearer tok"
      );
    });

    it("omits Authorization when no apiToken is set", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "uuid-1", qid: null }, 201)
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      await client.createExport(samplePayload());

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(
        (init.headers as Record<string, string>).Authorization
      ).toBeUndefined();
    });
  });
});
