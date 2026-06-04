const { Client } = require("pg");

exports.handler = async function handler() {
  if (!process.env.DATABASE_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "DATABASE_URL is not configured in Netlify." })
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
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.end().catch(() => {});
  }
};
