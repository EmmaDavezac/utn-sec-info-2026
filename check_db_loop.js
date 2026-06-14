const { Pool } = require('pg');

const connStr = "postgresql://postgres.damnbmjqqeaxcudxdfem:Emma141592365@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
const maxRetries = 60; // 60 attempts
const delayMs = 10000;  // 10 seconds delay between attempts

async function checkConnection() {
  const pool = new Pool({ connectionString: connStr });
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("SUCCESS: Database connection established successfully! Server time:", res.rows[0].now);
    return true;
  } catch (err) {
    console.log(`Connection attempt failed: ${err.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function loop() {
  console.log("Starting database connection loop check...");
  for (let i = 1; i <= maxRetries; i++) {
    console.log(`\n--- Attempt ${i}/${maxRetries} ---`);
    const success = await checkConnection();
    if (success) {
      process.exit(0);
    }
    if (i < maxRetries) {
      console.log(`Waiting ${delayMs / 1000} seconds before retrying...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  console.error("ERROR: Maximum retries reached. Database is still offline.");
  process.exit(1);
}

loop();
