import { money } from "../lib/money";

export default function Renewals({ items, currency, onToggleCancel }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Renewal Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">Review charges before they hit the card.</p>
      </div>
      <div className="space-y-3">
        {items.map((s) => {
          const urgent = s.daysUntilRenewal >= 0 && s.daysUntilRenewal <= 7;
          return (
            <div key={s.id} className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold">{s.name}</h2>
                  {urgent && (
                    <span className="text-[11px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">
                      Renews in {s.daysUntilRenewal} days — {money(currency, s.billing_cycle === "Annual" ? s.cost : s.monthlyCost)}/{s.billing_cycle === "Annual" ? "yr" : "mo"}
                    </span>
                  )}
                  {Number(s.canceling) === 1 && (
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Canceling before renewal</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">{s.category} · Next date {s.renewal_date}</p>
              </div>
              <button onClick={() => onToggleCancel(s)} className="touch-target text-sm font-medium border border-slate-200 rounded-xl px-4">
                {Number(s.canceling) === 1 ? "Keep this tool" : "Canceling Before Renewal"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
