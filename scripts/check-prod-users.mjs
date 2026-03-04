import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const usersRes = await pool.query("SELECT email, name FROM \"User\" LIMIT 20");
console.log("Users:", JSON.stringify(usersRes.rows, null, 2));

const tenantsRes = await pool.query("SELECT id, name, slug FROM \"Tenant\" LIMIT 10");
console.log("Tenants:", JSON.stringify(tenantsRes.rows, null, 2));

await pool.end();
