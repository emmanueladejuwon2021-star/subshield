import { money } from "../lib/money";

const colors = ["bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-violet-500", "bg-rose-500"];

export default function Insights({ insights, currency, settings, onSaveSettings }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Cost Insights</h1>
        <p className="text-sm text-slate-500 mt-1">Where monthly software money goes.</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-100 p-4 space-y-4">
          <p className="text-sm text-slate-500">Total monthly spend {money(currency, insights?.total || 0)}</p>
          {(insights?.breakdown || []).map((row, i) => (
            <div key={row.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{row.category}</span>
                <span>{money(currency, row.monthly)} · {row.share}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${colors[i % colors.length]}`} style={{ width: `${row.share}%` }} />
              </div>
            </div>
          ))}
          {!insights?.breakdown?.length && <p className="text-sm text-slate-500">Add software to see a breakdown.</p>}
        </div>
        <form onSubmit={onSaveSettings} className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 space-y-3">
          <h2 className="font-semibold">Company details</h2>
          <label className="block text-sm">
            Company name
            <input name="company_name" defaultValue={settings?.company_name || ""} className="mt-1 w-full border border-slate-200 rounded-xl h-11 px-3" />
          </label>
          <label className="block text-sm">
            Currency symbol
            <input name="currency_symbol" defaultValue={settings?.currency_symbol || "$"} className="mt-1 w-full border border-slate-200 rounded-xl h-11 px-3" />
          </label>
          <button className="touch-target w-full bg-emerald-600 text-white rounded-xl text-sm font-medium">Save company details</button>
        </form>
      </div>
    </div>
  );
}
