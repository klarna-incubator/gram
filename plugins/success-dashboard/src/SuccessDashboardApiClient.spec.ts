import { describe, expect, it, jest } from "@jest/globals";
import type { MockedFunction } from "jest-mock";
import Threat, { ThreatSeverity } from "@gram/core/dist/data/threats/Threat.js";
import { SuccessDashboardApiClient } from "./SuccessDashboardApiClient.js";
import { SECURE_DEVELOPMENT_ORG_UNIT } from "./constant.js";

function sampleThreat(): Threat {
  return new Threat("x", "d", "m", "c", "u@k");
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
  describe("createExport", () => {
    it("POSTs to /api/v2/tickets with awaitSync=true and returns id/qid", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "uuid-1", qid: "Q42" }, 201)
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      const result = await client.createExport(sampleThreat());

      expect(result).toEqual({ id: "uuid-1", qid: "Q42" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://sd.example/api/v2/tickets?awaitSync=true");
      expect(init.method).toBe("POST");
    });

    it("maps a Threat to the Success Dashboard create payload", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "uuid-1", qid: null }, 201)
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      await client.createExport(sampleThreat());

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.typeId).toBe("actionable_improvement");
      expect(body.statusId).toBe("backlog");
      expect(body.title).toBe("x");
      expect(body.observedIssue).toBe("d");
      expect(body.suggestedSolution).toBe("");
      expect(body.estimatedEffort).toBe(1);
      expect(body.ticketRelations).toEqual([]);
      expect(body.orgRelations).toEqual({
        relation: "reporting_team",
        orgUnit: {
          externalId: SECURE_DEVELOPMENT_ORG_UNIT,
          name: "Secure Development",
        },
        qualifiers: [
          {
            relation: "reporting_contributor",
            user: { externalId: "u@k", name: "u@k" },
          },
        ],
      });
      expect(body.attributes).toEqual({ observed_issue_url: "" });
    });

    it("maps Gram severity to Success Dashboard severity", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "uuid-1", qid: null }, 201)
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });
      const threat = sampleThreat();
      threat.severity = ThreatSeverity.High;

      await client.createExport(threat);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.severity).toBe("2 Major");
      expect(body.priority).toBe(2);
    });

    it("omits severity when the threat is Informative (no SD equivalent)", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "uuid-1", qid: null }, 201)
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });
      const threat = sampleThreat();
      threat.severity = ThreatSeverity.Informative;

      await client.createExport(threat);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.severity).toBeUndefined();
    });

    it("sets observed_issue_url and appends the Gram model link to observedIssue", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "uuid-1", qid: null }, 201)
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        publicGramBaseUrl: "https://gram.example",
        fetchImpl: fetchMock,
      });

      await client.createExport(sampleThreat());

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.attributes.observed_issue_url).toBe(
        "https://gram.example/model/m"
      );
      expect(body.observedIssue).toContain(
        "Gram model: https://gram.example/model/m"
      );
    });

    it("defaults to the EU production base URL when none is configured", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "uuid-1", qid: null }, 201)
      );
      const client = new SuccessDashboardApiClient({ fetchImpl: fetchMock });

      await client.createExport(sampleThreat());

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        "https://klarna-dashboards-aim-api-eu.production.c2c.klarna.net/api/v2/tickets?awaitSync=true"
      );
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

      await client.updateExport("uuid-1", sampleThreat());

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://sd.example/api/v2/tickets/uuid-1");
      expect(init.method).toBe("PUT");
    });

    it("sends a partial body (no typeId/statusId)", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(emptyResponse(200));
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });
      const threat = sampleThreat();
      threat.severity = ThreatSeverity.Low;

      await client.updateExport("uuid-1", threat);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.title).toBe("x");
      expect(body.observedIssue).toBe("d");
      expect(body.severity).toBe("4 Minor");
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

      await client.updateExport("a/b", sampleThreat());

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

  describe("createBulkExport", () => {
    it("POSTs to /api/v2/tickets/bulk with an array body", async () => {
      const fetchMock: MockedFunction<typeof fetch> = jest.fn();
      fetchMock.mockResolvedValue(
        jsonResponse(
          { success: true, total: 1, created: 1, failed: 0, results: [] },
          201
        )
      );
      const client = new SuccessDashboardApiClient({
        baseUrl: "https://sd.example",
        fetchImpl: fetchMock,
      });

      await client.createBulkExport([sampleThreat(), sampleThreat()]);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://sd.example/api/v2/tickets/bulk");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
      expect(body[0].typeId).toBe("actionable_improvement");
    });
  });

  describe("auth + errors", () => {
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

      await client.createExport(sampleThreat());

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

      await client.createExport(sampleThreat());

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(
        (init.headers as Record<string, string>).Authorization
      ).toBeUndefined();
    });

    it("throws with method + URL + status when the API rejects the request", async () => {
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

      await expect(client.createExport(sampleThreat())).rejects.toThrow(
        /POST https:\/\/sd\.example\/api\/v2\/tickets\?awaitSync=true failed \(400\): missing required field: title/
      );
    });
  });
});
