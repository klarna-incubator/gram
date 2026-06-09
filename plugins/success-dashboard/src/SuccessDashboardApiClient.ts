import log4js from "log4js";
import {
  GramActionItemCreatePayload,
  GramActionItemUpdatePayload,
  SuccessDashboardApiClientOptions,
  SuccessDashboardCreateResult,
  SuccessDashboardUpdateResult,
  RequestOptions,
} from "./types.js";

const log = log4js.getLogger("SuccessDashboardApiClient");

const DEFAULT_API_PREFIX = "/api/v2";
/**
 * HTTP client for the Success Dashboard v2 tickets API.
 * See {@link https://klarna-dashboards-aim-api-eu.production.c2c.klarna.net/api/v2/docs/}.
 */
export class SuccessDashboardApiClient {
  private readonly baseUrl: string;
  private readonly apiToken?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SuccessDashboardApiClientOptions = {}) {
    this.baseUrl =
      process.env.SUCCESS_DASHBOARD_API_URL?.trim() ||
      options.baseUrl?.trim() ||
      "";
    this.apiToken =
      process.env.SUCCESS_DASHBOARD_API_TOKEN?.trim() ||
      options.apiToken?.trim() ||
      "";
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
  }

  async getTicketByQid(qid: string): Promise<any> {
    const res = await this.request<any>({
      method: "GET",
      path: `/tickets/qid/${encodeURIComponent(qid)}`,
    });
    return res;
  }
  async getTicketById(id: string): Promise<any> {
    const res = await this.request<any>({
      method: "GET",
      path: `/tickets/${encodeURIComponent(id)}`,
    });
    return res;
  }
  /** GET /api/v1/contributors/email/{email} — gets a contributor by email. */
  async getContributorByEmail(email: string): Promise<any> {
    const res = await this.request<any>({
      method: "GET",
      apiPrefix: "/api/v1",
      path: `/contributors/${encodeURIComponent(email)}`,
    });
    return res;
  }

  /** POST /api/v2/tickets — creates an AIM and returns its SD UUID. */
  async createExport(
    body: GramActionItemCreatePayload
  ): Promise<SuccessDashboardCreateResult> {
    const res = await this.request<SuccessDashboardCreateResult>({
      method: "POST",
      path: "/tickets",
      body,
    });
    return res;
  }

  /** POST /api/v2/tickets/bulk — best-effort bulk create. */
  async createBulkExport(bodies: GramActionItemCreatePayload[]): Promise<void> {
    await this.request({
      method: "POST",
      path: "/tickets/bulk",
      body: bodies,
    });
  }

  /**
   * PUT /api/v2/tickets/{id} — partial update.
   * `exportId` MUST be the SD UUID returned by {@link createExport}, not a Gram id.
   */
  async updateExport(
    exportId: string,
    body: GramActionItemUpdatePayload
  ): Promise<SuccessDashboardUpdateResult> {
    const res = await this.request<SuccessDashboardUpdateResult>({
      method: "PUT",
      path: `/tickets/${encodeURIComponent(exportId)}`,
      body: body,
    });
    return res;
  }

  /**
   * DELETE /api/v2/tickets/{id}.
   * `exportId` MUST be the SD UUID returned by {@link createExport}.
   */
  async deleteExport(exportId: string): Promise<void> {
    await this.request({
      method: "DELETE",
      path: `/tickets/${encodeURIComponent(exportId)}`,
    });
  }

  // Helper methods for making the API request
  private buildUrl({
    path,
    query,
    apiPrefix,
  }: Pick<RequestOptions, "path" | "query" | "apiPrefix">) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(
      `${this.baseUrl}${apiPrefix ?? DEFAULT_API_PREFIX}${normalized}`
    );
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.apiToken) {
      headers.Authorization = `Bearer ${this.apiToken}`;
    }
    return headers;
  }

  private async request<T = unknown>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options);
    try {
      const res = await this.fetchImpl(url, {
        method: options.method,
        headers: this.buildHeaders(),
        body:
          options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Success Dashboard API ${options.method} ${url} failed (${
            res.status
          }): ${text || res.statusText}`
        );
      }

      // 204 No Content (or empty body) — fine for DELETE.
      if (res.status === 204) return undefined as T;
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) return undefined as T;
      return (await res.json()) as T;
    } catch (error) {
      log.error(
        `Success Dashboard API ${options.method} ${url} failed: ${error}`
      );
      return { success: false, error: error } as T;
    }
  }
}
