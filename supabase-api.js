(function () {
  const config = window.WEDDING_SUPABASE || {};
  const hasSupabaseConfig =
    config.url &&
    config.anonKey &&
    !config.anonKey.includes("PASTE_YOUR_SUPABASE_ANON_KEY_HERE");

  const client = hasSupabaseConfig && window.supabase
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;
  const serverApiBase = config.serverApiBase || "/.netlify/functions/db";

  function isEnabled() {
    return Boolean(client || serverApiBase);
  }

  async function callServerApi(action, options = {}) {
    const url = new URL(serverApiBase, window.location.origin);
    url.searchParams.set("action", action);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json"
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Database request failed.");
    }

    return payload.data;
  }

  function toRsvpRow(rsvp) {
    return {
      id: rsvp.id || crypto.randomUUID(),
      first_name: rsvp.firstName,
      last_name: rsvp.lastName,
      guest_count: Number.isInteger(Number(rsvp.guestCount)) ? Number(rsvp.guestCount) : 1,
      email: rsvp.email,
      attendance: rsvp.attendance,
      meal: rsvp.meal || "-",
      dietary: rsvp.dietary || "-",
      song: rsvp.song || "-",
      submitted_at: rsvp.timestamp || new Date().toISOString()
    };
  }

  function fromRsvpRow(row) {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      guestCount: Number.isInteger(Number(row.guest_count)) ? Number(row.guest_count) : 1,
      email: row.email,
      attendance: row.attendance,
      meal: row.meal,
      dietary: row.dietary,
      song: row.song,
      timestamp: row.submitted_at || row.created_at
    };
  }

  function toRegistryRow(item, sortOrder) {
    return {
      site: item.site,
      title: item.title,
      description: item.desc,
      link: item.link || "#",
      sort_order: sortOrder
    };
  }

  function fromRegistryRow(row) {
    return {
      id: row.id,
      site: row.site,
      title: row.title,
      desc: row.description,
      link: row.link
    };
  }

  async function getSiteConfig() {
    if (!client) return callServerApi("siteConfig");

    const { data, error } = await client
      .from("site_config")
      .select("config")
      .eq("id", "default")
      .maybeSingle();

    if (error) throw error;
    return data?.config || null;
  }

  async function saveSiteConfig(nextConfig) {
    if (!client) return callServerApi("saveSiteConfig", {
      method: "POST",
      body: { config: nextConfig }
    });

    const { error } = await client
      .from("site_config")
      .upsert({
        id: "default",
        config: nextConfig,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return nextConfig;
  }

  async function listRsvps() {
    if (!client) return callServerApi("listRsvps");

    const { data, error } = await client
      .from("rsvps")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    return data.map(fromRsvpRow);
  }

  async function getRsvp(id) {
    if (!client) return callServerApi("getRsvp", { params: { id } });
    if (!id) return null;

    const { data, error } = await client
      .from("rsvps")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? fromRsvpRow(data) : null;
  }

  async function saveRsvp(rsvp) {
    if (!client) return callServerApi("saveRsvp", {
      method: "POST",
      body: { rsvp }
    });

    const row = toRsvpRow(rsvp);
    const { data, error } = await client
      .from("rsvps")
      .upsert(row)
      .select()
      .single();

    if (error) throw error;
    return fromRsvpRow(data);
  }

  async function deleteRsvp(id) {
    if (!client) return callServerApi("deleteRsvp", {
      method: "DELETE",
      params: { id }
    });

    const { error } = await client
      .from("rsvps")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  async function listRegistryItems() {
    if (!client) return callServerApi("listRegistryItems");

    const { data, error } = await client
      .from("registry_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data.map(fromRegistryRow);
  }

  async function saveRegistryItem(item, sortOrder = 0) {
    if (!client) return callServerApi("saveRegistryItem", {
      method: "POST",
      body: { item, sortOrder }
    });

    const row = toRegistryRow(item, sortOrder);
    if (item.id) row.id = item.id;

    const { data, error } = await client
      .from("registry_items")
      .upsert(row)
      .select()
      .single();

    if (error) throw error;
    return fromRegistryRow(data);
  }

  async function deleteRegistryItem(id) {
    if (!client) return callServerApi("deleteRegistryItem", {
      method: "DELETE",
      params: { id }
    });

    const { error } = await client
      .from("registry_items")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  window.WeddingSupabase = {
    isEnabled,
    getSiteConfig,
    saveSiteConfig,
    listRsvps,
    getRsvp,
    saveRsvp,
    deleteRsvp,
    listRegistryItems,
    saveRegistryItem,
    deleteRegistryItem
  };
})();
