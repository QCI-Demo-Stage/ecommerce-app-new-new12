import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "backend",
    version: process.env.BUILD_VERSION ?? "dev",
    sha: process.env.BUILD_SHA ?? "unknown",
  });
});

app.get("/ready", (_req, res) => {
  res.status(200).json({ status: "ready" });
});

app.get("/api/products", (_req, res) => {
  res.json([
    { id: "1", name: "Sample Product", price: 19.99 },
    { id: "2", name: "Another Product", price: 29.99 },
  ]);
});

app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${port}`);
});
