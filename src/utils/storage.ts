const AUTH_KEY = "tesiscrm_auth";
export const storage = {
  authKey: AUTH_KEY,
  get<T>(key:string): T | null { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : null; },
  set<T>(key:string, value:T) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key:string) { localStorage.removeItem(key); }
};
