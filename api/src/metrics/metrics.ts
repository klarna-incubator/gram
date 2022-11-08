import promBundle from "express-prom-bundle";

export const metricsMiddleware = promBundle({
  includeMethod: true,
  metricType: "summary",
  autoregister: false,
});
