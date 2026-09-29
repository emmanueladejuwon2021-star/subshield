import { money } from "../lib/money";

export default function SeatAudit({ seats, employees, subscriptions, currency, onToggle, onAssign, onDepart, onAddPerson }) {
  const wasted = seats.filter((s) => Number(s.is_active) === 0);
  const monthlySavings = wasted.reduce((sum, s) => sum + Number(s.cost_per_seat), 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Seat Audit</h1>
          <p className="text-sm text-slate-500 mt-1">See who still needs a paid seat — and who does not.</p>
        </div>
        <div className="bg-amber-50 text-amber-800 text-sm font-medium px-4 py-2 rounded-xl">
          Possible monthly savings {money(currency, monthlySavings)}
        </div>
      </div>
      <form className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 grid sm:grid-cols-3 gap-3" onSubmit={onAddPerson}>
        <input name="full_name" required placeholder="New team member name" className="border border-slate-200 rounded-xl px-3 h-11 text-sm" />
        <select name="department" className="border border-slate-200 rounded-xl px-3 h-11 text-sm">
          <option>Engineering</option>
          <option>Design</option>
          <option>Marketing</option>
          <option>Operations</option>
        </select>
        <button className="touch-target bg-white border border-slate-200 rounded-xl text-sm font-medium">Add team member</button>
      </form>
      <form className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 grid sm:grid-cols-3 gap-3" onSubmit={onAssign}>
        <select name="employee_id" required className="border border-slate-200 rounded-xl px-3 h-11 text-sm">
          <option value="">Choose team member</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.full_name}</option>
          ))}
        </select>
        <select name="subscription_id" required className="border border-slate-200 rounded-xl px-3 h-11 text-sm">
          <option value="">Choose software</option>
          {subscriptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button className="touch-target bg-emerald-600 text-white rounded-xl text-sm font-medium">Assign seat</button>
      </form>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
          <h2 className="font-semibold mb-3">Team members</h2>
          <ul className="divide-y divide-slate-100">
            {employees.map((e) => (
              <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{e.full_name}</p>
                  <p className="text-xs text-slate-500">{e.department} · {e.status}</p>
                </div>
                {e.status === "Active" ? (
                  <button onClick={() => onDepart(e)} className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-lg touch-target">Mark departed</button>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Departed</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 font-semibold">Seat assignments</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Person</th>
                  <th className="px-4 py-2 font-medium">Tool</th>
                  <th className="px-4 py-2 font-medium">Cost</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {seats.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{s.full_name}</td>
                    <td className="px-4 py-2">{s.software_name}</td>
                    <td className="px-4 py-2">{money(currency, s.cost_per_seat)}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => onToggle(s)} className={`text-xs font-medium px-3 py-2 rounded-lg touch-target ${Number(s.is_active) === 1 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {Number(s.is_active) === 1 ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
