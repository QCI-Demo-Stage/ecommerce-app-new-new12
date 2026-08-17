import cors from "cors";
import express, { type Request, type Response } from "express";
import { metricsHandler, metricsMiddleware } from "./metrics";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const appVersion = process.env.APP_VERSION ?? "0.0.0";

app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

/** Liveness — process is up (Kubernetes livenessProbe). */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", version: appVersion });
});

/** Readiness — ready to accept traffic (Kubernetes readinessProbe). */
app.get("/ready", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ready", version: appVersion });
});

/** Backward-compatible aliases used by older probe configs / Docker HEALTHCHECK. */
app.get("/health/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "alive", version: appVersion });
});

app.get("/health/ready", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ready", version: appVersion });
});

/** Prometheus scrape endpoint. */
app.get("/metrics", metricsHandler);

app.get("/api/products", (_req: Request, res: Response) => {
  res.json({
    items: [
      { id: "1", name: "Sample Product", price: 19.99, currency: "USD" },
      { id: "2", name: "Starter Bundle", price: 49.99, currency: "USD" },
    ],
  });
});

app.get("/api", (_req: Request, res: Response) => {
  res.json({
    name: "Ecommerce App New API",
    version: appVersion,
    environment: process.env.NODE_ENV ?? "development",
  });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${port}`);
});
