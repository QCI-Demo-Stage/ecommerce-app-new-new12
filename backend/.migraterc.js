module.exports = {
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/ecommerce",
  migrationsTable: "pgmigrations",
  dir: "migrations",
  direction: "up",
  tsconfig: "./tsconfig.json",
};
