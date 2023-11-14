import { DataAccessLayer } from "../dal.js";
import { createPostgresPool } from "../postgres.js";
import { _deleteAllTheThings } from "../utils.js";

describe("ReportDataService implementation", () => {
  let dal: DataAccessLayer;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
  });

  afterAll(async () => {
    await _deleteAllTheThings(dal);
    await dal.pool.end();
  });

  describe("listSystemCompliance", () => {
    it("should not crash", async () => {
      const report = await dal.reportService.listSystemCompliance({});

      expect(report.TotalSystems).toBe("0");
    });
  });
});
