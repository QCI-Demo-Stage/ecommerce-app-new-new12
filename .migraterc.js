/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();

/** @type {import('node-pg-migrate').RunnerOption} */
module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  migrationsTable: "pgmigrations",
  dir: "migrations",
  direction: "up",
  migrationFileLanguage: "ts",
  tsconfig: "./tsconfig.migrations.json",
  verbose: true,
  decamelize: true,
};
