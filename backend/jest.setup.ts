/**
 * Test environment defaults — secrets are fixtures for local/CI unit tests only.
 * Never reuse these values outside automated tests.
 */
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ??
  "test-access-secret-at-least-32-characters-long";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ??
  "test-refresh-secret-at-least-32-characters-long";
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
process.env.JWT_REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS ?? "10";
process.env.APP_VERSION = process.env.APP_VERSION ?? "0.0.0-test";
