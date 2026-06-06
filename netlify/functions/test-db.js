const { Client } = require("pg");

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

function errorBody(error) {
  if (temporaryNetworkCodes.has(error?.code)) {
    return {
      error: "The database is temporarily unreachable. Check your internet/DNS connection and Supabase DATABASE_URL."
    };
  }

  return { error: error.message };
}

exports.handler = async function handler() {
  if (!process.env.DATABASE_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "DATABASE_URL is not configured." })
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query("select now()");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Connected successfully!",
        time: result.rows[0]
      })
    };
  } catch (error) {
    return {
      statusCode: temporaryNetworkCodes.has(error?.code) ? 503 : 500,
      body: JSON.stringify(errorBody(error))
    };
  } finally {
    await client.end().catch(() => {});
  }
};
