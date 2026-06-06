const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
};

function json(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

const temporaryNetworkCodes = new Set([
  "EAI_AGAIN",
  "ENOTFOUND",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPERM"
]);

function databaseErrorResponse(error) {
  if (temporaryNetworkCodes.has(error?.code)) {
    return json(503, {
      error: "The database is temporarily unreachable. Check your internet/DNS connection and Supabase DATABASE_URL."
    });
  }

  return json(500, { error: error?.message || "Database request failed." });
}

function toRsvp(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    guestCount: Number.isInteger(Number(row.guest_count)) ? Number(row.guest_count) : 1,
    email: row.email,
    attendance: row.attendance,
    meal: row.meal || "-",
    dietary: row.dietary || "-",
    song: row.song || "-",
    timestamp: row.submitted_at || row.created_at
  };
}

function toRegistryItem(row) {
  return {
    id: row.id,
    site: row.site,
    title: row.title,
    desc: row.description,
    link: row.link
  };
}

async function readBody(event) {
  if (!event.body) return {};
  return JSON.parse(event.body);
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (!process.env.DATABASE_URL) {
    return json(500, { error: "DATABASE_URL is not configured." });
  }

  const action = event.queryStringParameters?.action;

  try {
    if (event.httpMethod === "GET" && action === "siteConfig") {
      const result = await pool.query("select config from public.site_config where id = 'default' limit 1");
      return json(200, { data: result.rows[0]?.config || null });
    }

    if (event.httpMethod === "POST" && action === "saveSiteConfig") {
      const { config } = await readBody(event);
      await pool.query(
        `insert into public.site_config (id, config, updated_at)
         values ('default', $1::jsonb, now())
         on conflict (id) do update set config = excluded.config, updated_at = now()`,
        [JSON.stringify(config)]
      );
      return json(200, { data: config });
    }

    if (event.httpMethod === "GET" && action === "listRsvps") {
      const result = await pool.query("select * from public.rsvps order by submitted_at desc");
      return json(200, { data: result.rows.map(toRsvp) });
    }

    if (event.httpMethod === "GET" && action === "getRsvp") {
      const id = event.queryStringParameters?.id;
      const result = await pool.query("select * from public.rsvps where id = $1 limit 1", [id]);
      return json(200, { data: result.rows[0] ? toRsvp(result.rows[0]) : null });
    }

    if (event.httpMethod === "POST" && action === "saveRsvp") {
      const { rsvp } = await readBody(event);
      const result = await pool.query(
        `insert into public.rsvps
         (id, first_name, last_name, guest_count, email, attendance, submitted_at)
         values
          (coalesce($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7)
         on conflict (id) do update set
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          guest_count = excluded.guest_count,
          email = excluded.email,
          attendance = excluded.attendance,
          submitted_at = excluded.submitted_at
         returning *`,
        [
          rsvp.id || null,
          rsvp.firstName,
          rsvp.lastName,
          Number.isInteger(Number(rsvp.guestCount)) ? Number(rsvp.guestCount) : 1,
          rsvp.email || "-",
          rsvp.attendance || "Pending",
          rsvp.timestamp || new Date().toISOString()
        ]
      );
      return json(200, { data: toRsvp(result.rows[0]) });
    }

    if (event.httpMethod === "DELETE" && action === "deleteRsvp") {
      const id = event.queryStringParameters?.id;
      await pool.query("delete from public.rsvps where id = $1", [id]);
      return json(200, { data: true });
    }

    if (event.httpMethod === "GET" && action === "listRegistryItems") {
      const result = await pool.query("select * from public.registry_items order by sort_order asc, created_at asc");
      return json(200, { data: result.rows.map(toRegistryItem) });
    }

    if (event.httpMethod === "POST" && action === "saveRegistryItem") {
      const { item, sortOrder } = await readBody(event);
      const result = await pool.query(
        `insert into public.registry_items
          (id, site, title, description, link, sort_order, updated_at)
         values
          (coalesce($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, now())
         on conflict (id) do update set
          site = excluded.site,
          title = excluded.title,
          description = excluded.description,
          link = excluded.link,
          sort_order = excluded.sort_order,
          updated_at = now()
         returning *`,
        [item.id || null, item.site, item.title, item.desc, item.link || "#", sortOrder || 0]
      );
      return json(200, { data: toRegistryItem(result.rows[0]) });
    }

    if (event.httpMethod === "DELETE" && action === "deleteRegistryItem") {
      const id = event.queryStringParameters?.id;
      await pool.query("delete from public.registry_items where id = $1", [id]);
      return json(200, { data: true });
    }

    return json(404, { error: "Unknown database action." });
  } catch (error) {
    console.error(error);
    return databaseErrorResponse(error);
  }
};
