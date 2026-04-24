export default function AlertModal({ open, title, message, type, onClose }:{ open:boolean; title:string; message:string; type:"success"|"error"|"info"; onClose:()=>void; }) {
  if (!open) return null;
  const chip = type==="success" ? "bg-emerald-100 text-emerald-700" : type==="error" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700";
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft"><div className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${chip}`}>{type}</div><h3 className="mb-2 text-lg font-bold">{title}</h3><p className="mb-6 text-sm text-slate-600">{message}</p><div className="flex justify-end"><button className="btn-primary" onClick={onClose}>Entendido</button></div></div></div>;
}
