import client from "prom-client";
import type { Request, Response, NextFunction } from "express";

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: "ecommerce_frontend_",
});

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code", "service"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const httpRequestErrors = new client.Counter({
  name: "http_request_errors_total",
  help: "Total number of HTTP requests that resulted in an error status",
  labelNames: ["method", "route", "status_code", "service"] as const,
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code", "service"] as const,
  registers: [register],
});

const SERVICE = "frontend";

function resolveRoute(req: Request): string {
  if (req.route?.path) {
    const base = req.baseUrl ?? "";
    return `${base}${req.route.path}`;
  }
  // Static SPA assets share a coarse route label to avoid cardinality explosion.
  if (req.path.startsWith("/assets")) {
    return "/assets/*";
  }
  return req.path || "unknown";
}

/** Express middleware: records request latency histograms and error counters. */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === "/metrics") {
    next();
    return;
  }

  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    const route = resolveRoute(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
      service: SERVICE,
    };
    end(labels);
    httpRequestsTotal.inc(labels);
    if (res.statusCode >= 400) {
      httpRequestErrors.inc(labels);
    }
  });

  next();
}

export async function metricsHandler(
  _req: Request,
  res: Response,
): Promise<void> {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
}

export { register };
