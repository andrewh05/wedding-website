# wedding-website

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
