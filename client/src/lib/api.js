import { localApi } from "./store.js";

const base = import.meta.env.VITE_API_URL || "";
const useLocalOnly = typeof window !== "undefined" && (window.location.hostname.endsWith("github.io") || import.meta.env.VITE_USE_LOCAL === "true");

async function request(path, options = {}) {
  if (useLocalOnly) return localHandle(path, options);
  try {
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
  } catch (err) {
    if (String(err.message || "").includes("Changes were not saved") && !String(err.message).includes("fetch")) {
      throw err;
    }
    return localHandle(path, options);
  }
}

function localHandle(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const subMatch = path.match(/^\/api\/subscriptions\/(\d+)$/);
  const empMatch = path.match(/^\/api\/employees\/(\d+)\/status$/);
  const seatMatch = path.match(/^\/api\/seats\/(\d+)\/toggle$/);
  if (path === "/api/overview") return localApi.overview();
  if (path === "/api/subscriptions" && method === "GET") return localApi.subscriptions();
  if (path === "/api/subscriptions" && method === "POST") return localApi.addSubscription(body);
  if (subMatch && method === "PUT") return localApi.updateSubscription(subMatch[1], body);
  if (subMatch && method === "DELETE") return localApi.deleteSubscription(subMatch[1]);
  if (path === "/api/employees" && method === "GET") return localApi.employees();
  if (path === "/api/employees" && method === "POST") return localApi.addEmployee(body);
  if (empMatch && method === "PATCH") return localApi.setEmployeeStatus(empMatch[1], body.status);
  if (path === "/api/seats" && method === "GET") return localApi.seats();
  if (path === "/api/seats/assign" && method === "POST") return localApi.assignSeat(body);
  if (seatMatch && method === "PATCH") return localApi.toggleSeat(seatMatch[1]);
  if (path === "/api/renewals") return localApi.renewals();
  if (path === "/api/insights") return localApi.insights();
  if (path === "/api/settings" && method === "GET") return localApi.settings();
  if (path === "/api/settings" && method === "PUT") return localApi.saveSettings(body);
  throw new Error("Unable to load data—please try again");
}

export const api = {
  overview: () => Promise.resolve(request("/api/overview")),
  subscriptions: () => Promise.resolve(request("/api/subscriptions")),
  addSubscription: (body) => Promise.resolve(request("/api/subscriptions", { method: "POST", body: JSON.stringify(body) })),
  updateSubscription: (id, body) => Promise.resolve(request(`/api/subscriptions/${id}`, { method: "PUT", body: JSON.stringify(body) })),
  deleteSubscription: (id) => Promise.resolve(request(`/api/subscriptions/${id}`, { method: "DELETE" })),
  employees: () => Promise.resolve(request("/api/employees")),
  addEmployee: (body) => Promise.resolve(request("/api/employees", { method: "POST", body: JSON.stringify(body) })),
  setEmployeeStatus: (id, status) => Promise.resolve(request(`/api/employees/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) })),
  seats: () => Promise.resolve(request("/api/seats")),
  assignSeat: (body) => Promise.resolve(request("/api/seats/assign", { method: "POST", body: JSON.stringify(body) })),
  toggleSeat: (id) => Promise.resolve(request(`/api/seats/${id}/toggle`, { method: "PATCH" })),
  renewals: () => Promise.resolve(request("/api/renewals")),
  insights: () => Promise.resolve(request("/api/insights")),
  settings: () => Promise.resolve(request("/api/settings")),
  saveSettings: (body) => Promise.resolve(request("/api/settings", { method: "PUT", body: JSON.stringify(body) })),
};
