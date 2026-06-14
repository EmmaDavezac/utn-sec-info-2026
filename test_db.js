const { Pool } = require('pg');

const connStr = "postgresql://postgres.damnbmjqqeaxcudxdfem:Emma141592365@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function test() {
  console.log("Testing transaction pooler (6543)...");
  const pool = new Pool({ connectionString: connStr });
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("SUCCESS: Connection established successfully! Database time:", res.rows[0].now);
  } catch (err) {
    console.error("FAIL: Connection failed:", err.message);
  } finally {
    await pool.end();
  }
}

test();
