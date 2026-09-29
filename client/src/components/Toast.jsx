import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const ok = toast.type !== "error";
  return (
    <div className="fixed top-4 right-4 z-[60] max-w-sm w-[calc(100%-2rem)]">
      <div className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-card border ${ok ? "bg-white border-emerald-200" : "bg-white border-rose-200"}`}>
        {ok ? <CheckCircle2 className="text-emerald-600 shrink-0" size={20} /> : <AlertCircle className="text-rose-600 shrink-0" size={20} />}
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button onClick={onClose} className="touch-target grid place-items-center text-slate-400" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
