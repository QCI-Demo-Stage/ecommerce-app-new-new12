/**
 * Static SQL lint / syntax structure check for reference DDL and seed files.
 * Does not connect to any database.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..');

const REQUIRED_STATEMENTS = [
  /CREATE\s+TABLE\s+users\b/i,
  /CREATE\s+TABLE\s+products\b/i,
  /CREATE\s+TABLE\s+inventory\b/i,
  /CREATE\s+TABLE\s+orders\b/i,
  /CREATE\s+TABLE\s+audit_logs\b/i,
  /PRIMARY\s+KEY/i,
  /REFERENCES\s+products/i,
  /REFERENCES\s+users/i,
  /CREATE\s+INDEX/i,
  /UNIQUE/i,
];

const FORBIDDEN = [
  { re: /password\s*=\s*'[^$]/i, msg: 'plaintext password assignment detected' },
  { re: /password_hash\s*,\s*'[^$]/i, msg: 'possible plaintext password_hash value' },
];

function lintFile(relativePath: string): void {
  const full = path.join(ROOT, relativePath);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing file: ${relativePath}`);
  }
  const sql = fs.readFileSync(full, 'utf8');
  if (!sql.trim()) {
    throw new Error(`Empty SQL file: ${relativePath}`);
  }

  // Basic balance checks
  const opens = (sql.match(/\(/g) ?? []).length;
  const closes = (sql.match(/\)/g) ?? []).length;
  if (opens !== closes) {
    throw new Error(`${relativePath}: unbalanced parentheses (${opens} vs ${closes})`);
  }

  for (const rule of FORBIDDEN) {
    if (rule.re.test(sql) && relativePath.includes('seed')) {
      // seed may contain bcrypt hashes starting with $2 — only flag non-hash strings
      const matches = sql.match(/'[^{$][^']{0,40}'/g);
      if (matches?.some((m) => /password/i.test(m))) {
        throw new Error(`${relativePath}: ${rule.msg}`);
      }
    }
  }

  console.log(`sql-lint OK: ${relativePath} (${sql.split('\n').length} lines)`);
}

function lintSchema(): void {
  const schemaPath = 'db/schema.sql';
  const sql = fs.readFileSync(path.join(ROOT, schemaPath), 'utf8');
  for (const re of REQUIRED_STATEMENTS) {
    if (!re.test(sql)) {
      throw new Error(`${schemaPath}: missing required pattern ${re}`);
    }
  }
  lintFile(schemaPath);
}

function lintSeed(): void {
  const seedPath = 'db/seeds/001_demo_data.sql';
  const sql = fs.readFileSync(path.join(ROOT, seedPath), 'utf8');
  const productInserts = (sql.match(/WDG-|GAD-|ACC-|HME-|OUT-|OFF-/g) ?? []).length;
  if (productInserts < 10) {
    throw new Error(`${seedPath}: expected >= 10 product SKUs, found ${productInserts}`);
  }
  if (!/\$2[aby]\$\d{2}\$/.test(sql)) {
    throw new Error(`${seedPath}: expected bcrypt password_hash values`);
  }
  lintFile(seedPath);
}

function lintMigrationsPresent(): void {
  const dir = path.join(ROOT, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts'));
  for (const f of files) {
    const body = fs.readFileSync(path.join(dir, f), 'utf8');
    if (!/export\s+async\s+function\s+up\b/.test(body)) {
      throw new Error(`${f}: missing up()`);
    }
    if (!/export\s+async\s+function\s+down\b/.test(body)) {
      throw new Error(`${f}: missing down()`);
    }
    console.log(`migration-lint OK: ${f}`);
  }
}

function main(): void {
  lintSchema();
  lintSeed();
  lintMigrationsPresent();
  console.log('verify-sql: PASSED');
}

main();
