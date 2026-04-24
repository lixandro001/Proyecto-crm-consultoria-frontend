import { createContext, useContext, useMemo, useState } from "react";
type AlertType = "success"|"error"|"info";
const AlertContext = createContext<any>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({ open:false, title:"", message:"", type:"info" as AlertType });
  const value = useMemo(() => ({
    state,
    showAlert: (title:string, message:string, type:AlertType="info") => setState({ open:true, title, message, type }),
    closeAlert: () => setState((p) => ({ ...p, open:false }))
  }), [state]);
  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert debe usarse dentro de AlertProvider");
  return ctx as { state:{open:boolean;title:string;message:string;type:AlertType}; showAlert:(a:string,b:string,c?:AlertType)=>void; closeAlert:()=>void };
}
