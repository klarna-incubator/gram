import promBundle from "express-prom-bundle";

export const metricsMiddleware = promBundle({
  includeMethod: true,
  metricType: "summary",
  autoregister: true, // Adds the /metrics endpoint on both 8080 and 8081
});
