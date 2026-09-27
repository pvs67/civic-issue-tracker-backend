async function api(path, options) {
  try {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    console.error("API call failed:", path, err);
    return null;
  }
}

const Store = {
  async list(params = {}) {
    const query = new URLSearchParams(params).toString();
    const data = await api("/api/issues" + (query ? `?${query}` : ""));
    return data || [];
  },
  async get(id) {
    const data = await api("/api/issues/" + encodeURIComponent(id));
    if (data && !data.error) return data;
    return null;
  },
  async update(id, body) {
    return await api(
      "/api/issues/" + encodeURIComponent(id) + "/status",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  },
  async delete(id) {
    return await api("/api/issues/" + encodeURIComponent(id), {
      method: "DELETE",
    });
  },
};