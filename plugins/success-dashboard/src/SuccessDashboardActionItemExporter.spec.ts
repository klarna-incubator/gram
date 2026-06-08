import { describe, expect, it, jest } from "@jest/globals";
import type { MockedFunction } from "jest-mock";
import type { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Threat from "@gram/core/dist/data/threats/Threat.js";
import { SuccessDashboardActionItemExporter } from "./SuccessDashboardActionItemExporter.js";

function validThreat(): Threat {
  return new Threat("Title", "Desc", "m1", "c1", "u@k");
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

const createdTicket = (id = "uuid-1") => jsonResponse({ id, qid: "Q42" }, 201);

describe("SuccessDashboardActionItemExporter", () => {
  const dal = {} as DataAccessLayer;

  it("exposes a stable exporter key", () => {
    const exporter = new SuccessDashboardActionItemExporter({});
    expect(exporter.key).toBe("success-dashboard");
  });

  it("defaults exportOnReviewApproved to true", () => {
    const exporter = new SuccessDashboardActionItemExporter({});
    expect(exporter.exportOnReviewApproved).toBe(true);
  });

  it("does not invoke fetchImpl when baseUrl is not configured", async () => {
    const fetchMock: MockedFunction<typeof fetch> = jest.fn();
    const exporter = new SuccessDashboardActionItemExporter({
      fetchImpl: fetchMock,
    });
    const threat = new Threat("t", "d", "mid", "cid", "user@x");
    await exporter.export(dal, [threat]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts each action item to /api/v2/tickets when baseUrl is set", async () => {
    const fetchMock: MockedFunction<typeof fetch> = jest.fn();
    fetchMock.mockResolvedValue(createdTicket());
    const exporter = new SuccessDashboardActionItemExporter({
      baseUrl: "https://sd.example",
      fetchImpl: fetchMock,
    });
    const threat = new Threat("title", "desc", "m1", "c1", "u@k");
    threat.id = "tid-1";

    await exporter.export(dal, [threat]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sd.example/api/v2/tickets?awaitSync=true");
    expect(init.method).toBe("POST");
    const body = JSON.parse((init.body as string) ?? "{}");
    expect(body.title).toBe("title");
    expect(body.typeId).toBe("actionable_improvement");
    expect(body.statusId).toBe("backlog");
    expect(body.observedIssue).toBe("desc");
  });

  it("includes Authorization when apiToken is set", async () => {
    const fetchMock: MockedFunction<typeof fetch> = jest.fn();
    fetchMock.mockResolvedValue(createdTicket());
    const exporter = new SuccessDashboardActionItemExporter({
      baseUrl: "https://sd.example",
      apiToken: "secret",
      fetchImpl: fetchMock,
    });
    const threat = new Threat("t", "d", "m", "c", "u");

    await exporter.export(dal, [threat]);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer secret"
    );
  });

  it("throws when API returns non-OK", async () => {
    const fetchMock: MockedFunction<typeof fetch> = jest.fn();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      headers: headersWith(),
      text: async () => "upstream error",
    } as unknown as Response);
    const exporter = new SuccessDashboardActionItemExporter({
      baseUrl: "https://sd.example",
      fetchImpl: fetchMock,
    });
    const threat = new Threat("t", "d", "m", "c", "u");

    await expect(exporter.export(dal, [threat])).rejects.toThrow(
      /failed \(502\): upstream error/
    );
  });

  it("createExport throws when baseUrl is not configured", async () => {
    const exporter = new SuccessDashboardActionItemExporter({});
    await expect(exporter.createExport(validThreat())).rejects.toThrow(
      "baseUrl is not configured"
    );
  });

  it("createExport throws when title is missing", async () => {
    const exporter = new SuccessDashboardActionItemExporter({
      baseUrl: "https://sd.example",
    });
    const bad = validThreat();
    bad.title = "   ";
    await expect(exporter.createExport(bad)).rejects.toThrow(
      "threat.title is required"
    );
  });

  it("createExport POSTs to /api/v2/tickets after checks pass", async () => {
    const fetchMock: MockedFunction<typeof fetch> = jest.fn();
    fetchMock.mockResolvedValue(createdTicket());
    const exporter = new SuccessDashboardActionItemExporter({
      baseUrl: "https://sd.example",
      fetchImpl: fetchMock,
    });

    await exporter.createExport(validThreat());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sd.example/api/v2/tickets?awaitSync=true");
    expect(init.method).toBe("POST");
  });

  it("updateExport throws when exportId is empty", async () => {
    const exporter = new SuccessDashboardActionItemExporter({
      baseUrl: "https://sd.example",
    });
    await expect(exporter.updateExport("  ", validThreat())).rejects.toThrow(
      "exportId is required"
    );
  });

  it("updateExport PUTs to /api/v2/tickets/{id} after checks pass", async () => {
    const fetchMock: MockedFunction<typeof fetch> = jest.fn();
    fetchMock.mockResolvedValue(emptyResponse(200));
    const exporter = new SuccessDashboardActionItemExporter({
      baseUrl: "https://sd.example",
      fetchImpl: fetchMock,
    });

    await exporter.updateExport("uuid-1", validThreat());

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sd.example/api/v2/tickets/uuid-1");
    expect(init.method).toBe("PUT");
  });

  it("deleteExport throws when exportId is empty", async () => {
    const exporter = new SuccessDashboardActionItemExporter({
      baseUrl: "https://sd.example",
    });
    await expect(exporter.deleteExport("")).rejects.toThrow(
      "exportId is required"
    );
  });

  it("deleteExport DELETEs /api/v2/tickets/{id} after checks pass", async () => {
    const fetchMock: MockedFunction<typeof fetch> = jest.fn();
    fetchMock.mockResolvedValue(emptyResponse(204));
    const exporter = new SuccessDashboardActionItemExporter({
      baseUrl: "https://sd.example",
      fetchImpl: fetchMock,
    });

    await exporter.deleteExport("uuid-9");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sd.example/api/v2/tickets/uuid-9");
    expect(init.method).toBe("DELETE");
  });

  it("sets observed_issue_url when publicGramBaseUrl is configured", async () => {
    const fetchMock: MockedFunction<typeof fetch> = jest.fn();
    fetchMock.mockResolvedValue(createdTicket());
    const exporter = new SuccessDashboardActionItemExporter({
      baseUrl: "https://sd.example",
      publicGramBaseUrl: "https://gram.example/",
      fetchImpl: fetchMock,
    });
    const threat = new Threat("t", "d", "model-9", "c", "u");

    await exporter.export(dal, [threat]);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse((init.body as string) ?? "{}");
    expect(body.attributes.observed_issue_url).toBe(
      "https://gram.example/model/model-9"
    );
  });
});
