# wedding-website

## Run with Node

1. Install dependencies:

```sh
npm install
```

2. Create a `DATABASE_URL` environment variable with your Supabase Postgres connection string.
3. Start the site:

```sh
npm start
```

The website will run at `http://localhost:3000`.

## Supabase setup

1. Open your Supabase project and go to **SQL Editor**.
2. Run the SQL in `supabase-schema.sql`.
3. Go to **Project Settings > API**.
4. Copy the public `anon` key.
5. Paste it into `supabase-config.js`:

```js
window.WEDDING_SUPABASE = {
  url: "https://setzkulmkjjdjqtriwec.supabase.co",
  anonKey: "YOUR_PUBLIC_ANON_KEY"
};
```

Do not put the Postgres connection string or database password in browser files.
