import log4js from "log4js";
import { DataAccessLayer } from "../dal.js";
import { GramConnectionPool } from "../postgres.js";

export type StatInterval = "day" | "month" | "year";

export class StatsDataService {
  constructor(private dal: DataAccessLayer) {
    this.pool = dal.pool;
  }

  private pool: GramConnectionPool;

  log = log4js.getLogger("StatsDataService");

  async upsertStat(
    key: string,
    interval: StatInterval,
    date: Date,
    value: number
  ): Promise<void> {
    const query = `
      INSERT INTO stats (key, interval, date, value)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key, interval, date) DO UPDATE
      SET value = $3
    `;

    await this.pool.query(query, [key, interval, date, value]);
  }

  async listStats(
    key: string,
    interval: StatInterval,
    start: Date,
    end: Date
  ): Promise<{ date: Date; value: number }[]> {
    const query = `
      SELECT date, value
      FROM stats
      WHERE key = $1
      AND interval = $2
      AND date >= $3
      AND date <= $4
      ORDER BY date
    `;

    const res = await this.pool.query(query, [key, interval, start, end]);

    return res.rows;
  }
}
