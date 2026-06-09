import { describe, expect, it, jest } from "@jest/globals";
import type { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Threat, { ThreatSeverity } from "@gram/core/dist/data/threats/Threat.js";
import { LinkObjectType } from "@gram/core/dist/data/links/Link.js";
import { SuccessDashboardActionItemExporter } from "./SuccessDashboardActionItemExporter.js";
import { SUCCESS_DASHBOARD_URL_DOMAIN } from "./constant.js";

function eligibleThreat(): Threat {
  const threat = new Threat("title", "desc", "m1", "c1", "u@k");
  threat.id = "tid-1";
  threat.severity = ThreatSeverity.High;
  return threat;
}

function makeModel() {
  return {
    id: "m1",
    systemId: "sys-1",
    data: { components: [{ id: "c1", name: "Some Component" }] },
  };
}

/** Minimal DAL stub covering only the services the exporter touches. */
function makeDal(overrides: Record<string, unknown> = {}): DataAccessLayer {
  return {
    modelService: { getById: jest.fn(async () => null) },
    reviewService: { getByModelId: jest.fn(async () => null) },
    controlService: { listByThreatId: jest.fn(async () => []) },
    linkService: {
      listLinks: jest.fn(async () => []),
      insertLink: jest.fn(async () => {}),
      deleteLink: jest.fn(async () => {}),
    },
    systemProvider: { getSystem: jest.fn(async () => null) },
    ...overrides,
  } as unknown as DataAccessLayer;
}

/** Construct the exporter and stub out its network-facing collaborators. */
function makeExporter(dal: DataAccessLayer) {
  const exporter = new SuccessDashboardActionItemExporter(dal, {
    gramBaseUrl: "https://gram.example",
  });
  const client = {
    createExport: jest.fn(async () => ({ success: true, id: "abcd1234-0000" })),
    updateExport: jest.fn(async () => ({ success: true, id: "abcd1234-0000" })),
    getTicketById: jest.fn(async () => ({
      id: "ticket-uuid",
      statusId: "in_progress",
    })),
    getTicketByQid: jest.fn(async () => ({
      id: "ticket-uuid",
      statusId: "in_progress",
    })),
    getContributorByEmail: jest.fn(async () => null),
  };
  const wikibase = {
    getSystemQID: jest.fn(async () => "Q999"),
    getOrgUnitQID: jest.fn(async () => "Q123"),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exporter.successDashboardClient = client as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exporter.wikibaseClient = wikibase as any;
  return { exporter, client, wikibase };
}

describe("SuccessDashboardActionItemExporter", () => {
  it("exposes a stable exporter key", () => {
    const { exporter } = makeExporter(makeDal());
    expect(exporter.key).toBe("success-dashboard");
  });

  it("defaults exportOnReviewApproved to true and honours the override", () => {
    const dal = makeDal();
    expect(
      new SuccessDashboardActionItemExporter(dal).exportOnReviewApproved
    ).toBe(true);
    expect(
      new SuccessDashboardActionItemExporter(dal, {
        exportOnReviewApproved: false,
      }).exportOnReviewApproved
    ).toBe(false);
  });

  it("skips a threat with no model id", async () => {
    const dal = makeDal();
    const { exporter, client } = makeExporter(dal);
    const threat = new Threat("t", "d", "", "c", "u");
    threat.severity = ThreatSeverity.High;

    await exporter.export(dal, [threat]);

    expect(client.createExport).not.toHaveBeenCalled();
    expect(dal.linkService.insertLink).not.toHaveBeenCalled();
  });

  it("skips a low-severity threat that has no existing links", async () => {
    const dal = makeDal({
      modelService: { getById: jest.fn(async () => makeModel()) },
    });
    const { exporter, client } = makeExporter(dal);
    const threat = eligibleThreat();
    threat.severity = ThreatSeverity.Low;

    await exporter.export(dal, [threat]);

    expect(client.createExport).not.toHaveBeenCalled();
  });

  it("creates a ticket and links it for an eligible threat", async () => {
    const dal = makeDal({
      modelService: { getById: jest.fn(async () => makeModel()) },
    });
    const { exporter, client } = makeExporter(dal);

    await exporter.export(dal, [eligibleThreat()]);

    expect(client.createExport).toHaveBeenCalledTimes(1);
    const body = (client.createExport.mock.calls[0] as any[])[0];
    expect(body.title).toBe("title");
    expect(body.typeId).toBe("actionable_improvement");
    expect(body.statusId).toBe("backlog");
    expect(body.observedIssue).toBe("title: desc");
    expect(body.severity).toBe("2 Major");
    expect(body.priority).toBe(2);
    expect(body.mainSystem).toBe("Q999");
    expect(body.attributes.observed_issue_url).toBe(
      "https://gram.example/model/m1"
    );

    expect(dal.linkService.insertLink).toHaveBeenCalledTimes(1);
    const linkArgs = (dal.linkService.insertLink as jest.Mock).mock.calls[0];
    expect(linkArgs[0]).toBe(LinkObjectType.Threat);
    expect(linkArgs[1]).toBe("tid-1");
    expect(linkArgs[2]).toBe("abcd1234");
    expect(linkArgs[3]).toBe(
      `https://${SUCCESS_DASHBOARD_URL_DOMAIN}/abcd1234-0000`
    );
    expect(linkArgs[5]).toBe("success-dashboard");
  });

  it("updates an existing ticket that is still in treatment instead of creating a new one", async () => {
    const dal = makeDal({
      modelService: { getById: jest.fn(async () => makeModel()) },
      linkService: {
        listLinks: jest.fn(async () => [
          {
            id: 5,
            url: "https://klarna-dashboards.klarna.net/123e4567-e89b-12d3-a456-426614174000",
            createdBy: "success-dashboard",
          },
        ]),
        insertLink: jest.fn(async () => {}),
        deleteLink: jest.fn(async () => {}),
      },
    });
    const { exporter, client } = makeExporter(dal);
    client.getTicketById.mockResolvedValue({
      id: "ticket-uuid",
      statusId: "in_progress",
    });

    await exporter.export(dal, [eligibleThreat()]);

    expect(client.updateExport).toHaveBeenCalledTimes(1);
    expect((client.updateExport.mock.calls[0] as any[])[0]).toBe("ticket-uuid");
    expect(client.createExport).not.toHaveBeenCalled();
    expect(dal.linkService.insertLink).not.toHaveBeenCalled();
  });

  it("removes a stale link and creates a fresh ticket when the existing one is completed", async () => {
    const deleteLink = jest.fn(async () => {});
    const dal = makeDal({
      modelService: { getById: jest.fn(async () => makeModel()) },
      linkService: {
        listLinks: jest.fn(async () => [
          {
            id: 7,
            url: "https://klarna-dashboards.klarna.net/123e4567-e89b-12d3-a456-426614174000",
            createdBy: "success-dashboard",
          },
        ]),
        insertLink: jest.fn(async () => {}),
        deleteLink,
      },
    });
    const { exporter, client } = makeExporter(dal);
    client.getTicketById.mockResolvedValue({
      id: "ticket-uuid",
      statusId: "completed",
    });

    await exporter.export(dal, [eligibleThreat()]);

    expect(deleteLink).toHaveBeenCalledWith(7);
    expect(client.createExport).toHaveBeenCalledTimes(1);
    expect(client.updateExport).not.toHaveBeenCalled();
  });
});
