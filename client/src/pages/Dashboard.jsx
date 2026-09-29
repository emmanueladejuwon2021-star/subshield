import { Plus, UserMinus } from "lucide-react";
import { money } from "../lib/money";

export default function Dashboard({ overview, onAddSoftware, onLogDeparted }) {
  if (!overview) return null;
  const cards = [
    { label: "Monthly burn rate", value: money(overview.currency, overview.monthlyBurnRate), hint: "All tools combined" },
    { label: "Annual spending", value: money(overview.currency, overview.annualSpending), hint: "Projected for 12 months" },
    { label: "Wasted seat cost", value: money(overview.currency, overview.wastedSeatCost), hint: "Empty or unused seats", warn: overview.wastedSeatCost > 0 },
    { label: "Renewals this week", value: String(overview.upcomingCount || 0), hint: "Charges coming soon", danger: overview.upcomingCount > 0 },
  ];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">A clear view of software spend for {overview.companyName}.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onAddSoftware} className="touch-target inline-flex items-center gap-2 bg-emerald-600 text-white px-4 rounded-xl text-sm font-medium">
            <Plus size={16} /> Add software
          </button>
          <button onClick={onLogDeparted} className="touch-target inline-flex items-center gap-2 bg-white border border-slate-200 px-4 rounded-xl text-sm font-medium">
            <UserMinus size={16} /> Log departed staff
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-4 shadow-card border border-slate-100">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`mt-2 text-xl font-semibold ${c.warn ? "text-amber-600" : c.danger ? "text-rose-600" : "text-slate-900"}`}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-1">{c.hint}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
        <h2 className="font-semibold mb-3">Upcoming renewals this week</h2>
        {overview.upcomingRenewals?.length ? (
          <ul className="divide-y divide-slate-100">
            {overview.upcomingRenewals.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.billing_cycle} · {r.category}</p>
                </div>
                <span className="text-xs font-semibold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full">
                  Renews in {r.days} day{r.days === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No charges due in the next 7 days.</p>
        )}
      </div>
    </div>
  );
}
