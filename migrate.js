const { Pool } = require("pg");
const fs = require("fs");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile("/home/andrew/Desktop/wedding website/.env");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Adding guest_limit column to public.rsvps...");
    await pool.query(`
      alter table public.rsvps
        add column if not exists guest_limit integer not null default 1;
    `);
    console.log("Column added successfully!");

    console.log("Adding constraint rsvps_guest_limit_check...");
    await pool.query(`
      alter table public.rsvps
        drop constraint if exists rsvps_guest_limit_check;
      alter table public.rsvps
        add constraint rsvps_guest_limit_check
        check (guest_limit >= 1);
    `);
    console.log("Constraint added successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
