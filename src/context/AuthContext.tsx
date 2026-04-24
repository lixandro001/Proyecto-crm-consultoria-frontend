import { createContext, useContext, useMemo, useState } from "react";
import type { AuthUser } from "../types/auth";
import { storage } from "../utils/storage";

const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(storage.get<AuthUser>(storage.authKey));
  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    login: (u: AuthUser) => { storage.set(storage.authKey, u); setUser(u); },
    logout: () => { storage.remove(storage.authKey); setUser(null); }
  }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx as { user: AuthUser | null; isAuthenticated:boolean; login:(u:AuthUser)=>void; logout:()=>void };
}
