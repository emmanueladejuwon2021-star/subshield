import { useCallback, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Toast from "./components/Toast.jsx";
import Modal from "./components/Modal.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SoftwareList from "./pages/SoftwareList.jsx";
import SeatAudit from "./pages/SeatAudit.jsx";
import Renewals from "./pages/Renewals.jsx";
import Insights from "./pages/Insights.jsx";
import { api } from "./lib/api.js";

const emptyForm = {
  name: "",
  category: "Operations",
  cost: "",
  billing_cycle: "Monthly",
  renewal_date: "",
  total_seats: 1,
};

export default function App() {
  const [overview, setOverview] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [seats, setSeats] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [insights, setInsights] = useState({ total: 0, breakdown: [] });
  const [settings, setSettings] = useState({ company_name: "My Company", currency_symbol: "$" });
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [departName, setDepartName] = useState("");

  const notify = (message, type = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadAll = useCallback(async () => {
    try {
      const [ov, subs, emps, st, ren, ins, set] = await Promise.all([
        api.overview(),
        api.subscriptions(),
        api.employees(),
        api.seats(),
        api.renewals(),
        api.insights(),
        api.settings(),
      ]);
      setOverview(ov);
      setSubscriptions(subs);
      setEmployees(emps);
      setSeats(st);
      setRenewals(ren);
      setInsights(ins);
      setSettings(set);
    } catch (err) {
      notify(err.message || "Unable to load data—please try again", "error");
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const currency = settings.currency_symbol || overview?.currency || "$";

  async function saveSoftware(e) {
    e.preventDefault();
    const payload = { ...form, cost: Number(form.cost), total_seats: Number(form.total_seats || 1) };
    try {
      if (form.id) {
        await api.updateSubscription(form.id, payload);
        notify("Changes saved");
      } else {
        await api.addSubscription(payload);
        notify("Subscription added!");
      }
      setModal(null);
      setForm(emptyForm);
      await loadAll();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function removeSoftware(item) {
    const prev = subscriptions;
    setSubscriptions((list) => list.filter((s) => s.id !== item.id));
    try {
      await api.deleteSubscription(item.id);
      notify("Software removed");
      await loadAll();
    } catch (err) {
      setSubscriptions(prev);
      notify("Something went wrong. Changes were not saved.", "error");
    }
  }

  async function toggleSeat(seat) {
    const prev = seats;
    setSeats((list) => list.map((s) => (s.id === seat.id ? { ...s, is_active: Number(s.is_active) === 1 ? 0 : 1 } : s)));
    try {
      const res = await api.toggleSeat(seat.id);
      notify(res.message);
      await loadAll();
    } catch {
      setSeats(prev);
      notify("Something went wrong. Changes were not saved.", "error");
    }
  }

  async function addPerson(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    try {
      await api.addEmployee({
        full_name: String(data.get("full_name") || "").trim(),
        department: String(data.get("department") || "Operations"),
      });
      notify("Team member added");
      e.target.reset();
      await loadAll();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function assignSeat(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    try {
      const res = await api.assignSeat({
        employee_id: Number(data.get("employee_id")),
        subscription_id: Number(data.get("subscription_id")),
      });
      notify(res.message);
      e.target.reset();
      await loadAll();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function markDeparted(emp) {
    try {
      const res = await api.setEmployeeStatus(emp.id, "Departed");
      notify(res.message);
      await loadAll();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function submitDeparted(e) {
    e.preventDefault();
    const match = employees.find((p) => p.full_name.toLowerCase() === departName.trim().toLowerCase());
    if (!match) {
      try {
        const created = await api.addEmployee({ full_name: departName.trim(), department: "Operations" });
        await api.setEmployeeStatus(created.id, "Departed");
        notify("Team member marked as departed");
      } catch (err) {
        notify(err.message, "error");
        return;
      }
    } else {
      await markDeparted(match);
    }
    setModal(null);
    setDepartName("");
    await loadAll();
  }

  async function toggleCancel(sub) {
    const next = Number(sub.canceling) === 1 ? 0 : 1;
    const prev = renewals;
    setRenewals((list) => list.map((s) => (s.id === sub.id ? { ...s, canceling: next } : s)));
    try {
      await api.updateSubscription(sub.id, { canceling: next });
      notify("Changes saved");
      await loadAll();
    } catch {
      setRenewals(prev);
      notify("Something went wrong. Changes were not saved.", "error");
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    try {
      await api.saveSettings({
        company_name: data.get("company_name"),
        currency_symbol: data.get("currency_symbol"),
      });
      notify("Changes saved");
      await loadAll();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <Layout companyName={overview?.companyName || settings.company_name} monthlyBurn={overview?.monthlyBurnRate} currency={currency}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <Routes>
        <Route path="/" element={<Dashboard overview={overview} onAddSoftware={() => { setForm(emptyForm); setModal("software"); }} onLogDeparted={() => setModal("depart")} />} />
        <Route path="/software" element={<SoftwareList items={subscriptions} currency={currency} onAdd={() => { setForm(emptyForm); setModal("software"); }} onEdit={(s) => { setForm({ id: s.id, name: s.name, category: s.category, cost: s.cost, billing_cycle: s.billing_cycle, renewal_date: s.renewal_date, total_seats: s.total_seats }); setModal("software"); }} onDelete={removeSoftware} />} />
        <Route path="/seats" element={<SeatAudit seats={seats} employees={employees} subscriptions={subscriptions} currency={currency} onToggle={toggleSeat} onAssign={assignSeat} onDepart={markDeparted} onAddPerson={addPerson} />} />
        <Route path="/renewals" element={<Renewals items={renewals} currency={currency} onToggleCancel={toggleCancel} />} />
        <Route path="/insights" element={<Insights insights={insights} currency={currency} settings={settings} onSaveSettings={saveSettings} />} />
      </Routes>
      {modal === "software" && (
        <Modal title={form.id ? "Edit software" : "Add software"} onClose={() => setModal(null)}>
          <form onSubmit={saveSoftware} className="space-y-3">
            <label className="block text-sm">Tool name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl h-11 px-3" />
            </label>
            <label className="block text-sm">Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl h-11 px-3">
                {["Design", "Engineering", "Marketing", "Operations"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">Price
                <input required type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl h-11 px-3" />
              </label>
              <label className="block text-sm">Billing
                <select value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl h-11 px-3">
                  <option>Monthly</option>
                  <option>Annual</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">Renewal date
                <input required type="date" value={form.renewal_date} onChange={(e) => setForm({ ...form, renewal_date: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl h-11 px-3" />
              </label>
              <label className="block text-sm">Seats bought
                <input required type="number" min="1" value={form.total_seats} onChange={(e) => setForm({ ...form, total_seats: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl h-11 px-3" />
              </label>
            </div>
            <button className="touch-target w-full bg-emerald-600 text-white rounded-xl text-sm font-medium">Save</button>
          </form>
        </Modal>
      )}
      {modal === "depart" && (
        <Modal title="Log departed staff" onClose={() => setModal(null)}>
          <form onSubmit={submitDeparted} className="space-y-3">
            <p className="text-sm text-slate-500">Name the person who left. Their paid seats will be marked inactive so you can stop paying for them.</p>
            <input required value={departName} onChange={(e) => setDepartName(e.target.value)} placeholder="Full name" className="w-full border border-slate-200 rounded-xl h-11 px-3" />
            <button className="touch-target w-full bg-emerald-600 text-white rounded-xl text-sm font-medium">Mark as departed</button>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
