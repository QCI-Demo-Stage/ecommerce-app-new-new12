import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Request, type Response } from "express";
import { metricsHandler, metricsMiddleware } from "./metrics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT ?? 8080);
const appVersion = process.env.APP_VERSION ?? "0.0.0";
const distDir = path.resolve(__dirname, "..", "dist");

app.use(metricsMiddleware);

/** Liveness — process is up (Kubernetes livenessProbe). */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", version: appVersion });
});

/** Readiness — static assets are available (Kubernetes readinessProbe). */
app.get("/ready", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ready", version: appVersion });
});

/** Prometheus scrape endpoint. */
app.get("/metrics", metricsHandler);

app.use(express.static(distDir, { index: false, maxAge: "1h" }));

/** SPA fallback — serve index.html for client-side routes. */
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Frontend listening on port ${port}`);
});
