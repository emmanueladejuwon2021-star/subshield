export default function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center p-0 sm:p-4">
      <button className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-label="Close" />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-card p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-500 text-sm touch-target">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
