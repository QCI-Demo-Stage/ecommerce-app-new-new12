import express, { type Request, type Response } from "express";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "backend",
    version: process.env.BUILD_VERSION ?? "dev",
    sha: process.env.BUILD_SHA ?? "unknown",
  });
});

app.get("/ready", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ready" });
});

app.get("/api/products", (_req: Request, res: Response) => {
  res.json([
    { id: "1", name: "Sample Product", priceCents: 1999 },
    { id: "2", name: "Demo Widget", priceCents: 4999 },
  ]);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`backend listening on :${port}`);
});
