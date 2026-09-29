import { NavLink } from "react-router-dom";
import { LayoutDashboard, AppWindow, Users, CalendarClock, PieChart, Shield } from "lucide-react";

const tabs = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/software", label: "Software List", icon: AppWindow },
  { to: "/seats", label: "Seat Audit", icon: Users },
  { to: "/renewals", label: "Renewal Calendar", icon: CalendarClock },
  { to: "/insights", label: "Cost Insights", icon: PieChart },
];

export default function Layout({ companyName, monthlyBurn, currency, children }) {
  return (
    <div className="min-h-screen bg-paper pb-24 lg:pb-8">
      <header className="hidden lg:block sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
          <div className="flex items-center gap-2 font-semibold">
            <span className="h-8 w-8 rounded-lg bg-emerald-600 text-white grid place-items-center">
              <Shield size={16} />
            </span>
            SubShield
          </div>
          <div className="text-sm text-slate-500 truncate">{companyName || "My Company"}</div>
          <div className="ml-auto text-sm font-semibold text-emerald-700">
            Monthly spend {currency}{Number(monthlyBurn || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <nav className="flex items-center gap-1">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium touch-target inline-flex items-center ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <span className="h-8 w-8 rounded-lg bg-emerald-600 text-white grid place-items-center">
            <Shield size={16} />
          </span>
          SubShield
        </div>
        <div className="text-xs font-semibold text-emerald-700">
          {currency}{Number(monthlyBurn || 0).toFixed(0)} / mo
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5">{children}</main>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 grid grid-cols-5 z-40">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium touch-target ${
                  isActive ? "text-emerald-700" : "text-slate-500"
                }`
              }
            >
              <Icon size={18} />
              <span className="leading-tight text-center px-1">{t.label.split(" ")[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
