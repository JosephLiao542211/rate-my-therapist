import { Pool } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

// Reuse pool across hot-reloads in dev
const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

export default pool;
