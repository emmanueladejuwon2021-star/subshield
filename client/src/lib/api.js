const base = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong. Changes were not saved.");
  }
  return data;
}

export const api = {
  overview: () => request("/api/overview"),
  subscriptions: () => request("/api/subscriptions"),
  addSubscription: (body) => request("/api/subscriptions", { method: "POST", body: JSON.stringify(body) }),
  updateSubscription: (id, body) => request(`/api/subscriptions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteSubscription: (id) => request(`/api/subscriptions/${id}`, { method: "DELETE" }),
  employees: () => request("/api/employees"),
  addEmployee: (body) => request("/api/employees", { method: "POST", body: JSON.stringify(body) }),
  setEmployeeStatus: (id, status) =>
    request(`/api/employees/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  seats: () => request("/api/seats"),
  assignSeat: (body) => request("/api/seats/assign", { method: "POST", body: JSON.stringify(body) }),
  toggleSeat: (id) => request(`/api/seats/${id}/toggle`, { method: "PATCH" }),
  renewals: () => request("/api/renewals"),
  insights: () => request("/api/insights"),
  settings: () => request("/api/settings"),
  saveSettings: (body) => request("/api/settings", { method: "PUT", body: JSON.stringify(body) }),
};
