import { Pencil, Trash2, Plus } from "lucide-react";
import { money } from "../lib/money";

export default function SoftwareList({ items, currency, onAdd, onEdit, onDelete }) {
  if (!items.length) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-10 text-center">
        <h1 className="text-xl font-semibold">No software tracked yet</h1>
        <p className="text-sm text-slate-500 mt-2">Add the tools your team pays for so spend and seats stay visible.</p>
        <button onClick={onAdd} className="mt-5 touch-target inline-flex items-center gap-2 bg-emerald-600 text-white px-5 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add Your First Software
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Software List</h1>
          <p className="text-sm text-slate-500 mt-1">{items.length} tools on the books</p>
        </div>
        <button onClick={onAdd} className="touch-target inline-flex items-center gap-2 bg-emerald-600 text-white px-4 rounded-xl text-sm font-medium">
          <Plus size={16} /> Add software
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Tool</th>
                <th className="px-4 py-3 font-medium">Billing</th>
                <th className="px-4 py-3 font-medium">Seats</th>
                <th className="px-4 py-3 font-medium">Monthly cost</th>
                <th className="px-4 py-3 font-medium">Renewal</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.category}</div>
                  </td>
                  <td className="px-4 py-3">{s.billing_cycle}</td>
                  <td className="px-4 py-3">
                    {s.activeSeats}/{s.total_seats}
                    {s.activeSeats < s.total_seats && (
                      <span className="ml-2 text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">unused seats</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{money(currency, s.monthlyCost)}</td>
                  <td className="px-4 py-3">
                    {s.daysUntilRenewal <= 7 && s.daysUntilRenewal >= 0 ? (
                      <span className="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">in {s.daysUntilRenewal}d</span>
                    ) : (
                      <span className="text-slate-500">{s.renewal_date}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => onEdit(s)} className="touch-target inline-flex items-center px-2 text-slate-500" aria-label="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => onDelete(s)} className="touch-target inline-flex items-center px-2 text-rose-500" aria-label="Remove">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
