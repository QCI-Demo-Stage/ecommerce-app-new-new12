/**
 * Static SQL lint / syntax structure check for payment token DDL and migrations.
 * Does not connect to any database. Never applies migrations.
 */

import fs from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..");

const REQUIRED_SCHEMA_PATTERNS = [
  /CREATE\s+TABLE\s+customers\b/i,
  /CREATE\s+TABLE\s+payment_tokens\b/i,
  /customer_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+customers/i,
  /token_encrypted\s+TEXT\s+NOT\s+NULL/i,
  /CREATE\s+UNIQUE\s+INDEX\s+payment_tokens_token_encrypted_uidx/i,
  /PRIMARY\s+KEY/i,
  /created_at/i,
  /updated_at/i,
];

const FORBIDDEN_COLUMN = [
  {
    re: /^\s*(pan|cvv|cvc|card_number|primary_account_number)\s+/im,
    msg: "forbidden cardholder data column definition",
  },
];

function lintFile(relativePath: string): void {
  const full = path.join(ROOT, relativePath);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing file: ${relativePath}`);
  }
  const sql = fs.readFileSync(full, "utf8");
  if (!sql.trim()) {
    throw new Error(`Empty SQL file: ${relativePath}`);
  }

  const opens = (sql.match(/\(/g) ?? []).length;
  const closes = (sql.match(/\)/g) ?? []).length;
  if (opens !== closes) {
    throw new Error(
      `${relativePath}: unbalanced parentheses (${opens} vs ${closes})`,
    );
  }

  for (const rule of FORBIDDEN_COLUMN) {
    if (rule.re.test(sql)) {
      throw new Error(`${relativePath}: ${rule.msg}`);
    }
  }

  console.log(`sql-lint OK: ${relativePath} (${sql.split("\n").length} lines)`);
}

function lintSchema(): void {
  const schemaPath = "db/schema.sql";
  const sql = fs.readFileSync(path.join(ROOT, schemaPath), "utf8");
  for (const re of REQUIRED_SCHEMA_PATTERNS) {
    if (!re.test(sql)) {
      throw new Error(`${schemaPath}: missing required pattern ${re}`);
    }
  }
  lintFile(schemaPath);
}

function lintMigrationsPresent(): void {
  const dir = path.join(ROOT, "migrations");
  if (!fs.existsSync(dir)) {
    throw new Error("Missing migrations/ directory");
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts"));
  if (files.length < 1) {
    throw new Error("Expected at least one migration file");
  }
  for (const f of files) {
    const body = fs.readFileSync(path.join(dir, f), "utf8");
    if (!/export\s+async\s+function\s+up\b/.test(body)) {
      throw new Error(`${f}: missing up()`);
    }
    if (!/export\s+async\s+function\s+down\b/.test(body)) {
      throw new Error(`${f}: missing down()`);
    }
    if (!/payment_tokens/.test(body)) {
      throw new Error(`${f}: expected payment_tokens table definition`);
    }
    if (!/token_encrypted/.test(body)) {
      throw new Error(`${f}: expected token_encrypted column`);
    }
    if (!/payment_tokens_token_encrypted_uidx/.test(body)) {
      throw new Error(`${f}: expected unique index on token_encrypted`);
    }
    console.log(`migration-lint OK: ${f}`);
  }
}

function main(): void {
  lintSchema();
  lintMigrationsPresent();
  console.log("verify-sql: PASSED");
}

main();
