import axios from "axios";
import { storage } from "../utils/storage";
import type { AuthUser } from "../types/auth";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5080/api" });
api.interceptors.request.use((config) => {
  const auth = storage.get<AuthUser>(storage.authKey);
  if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`;
  return config;
});
export default api;
