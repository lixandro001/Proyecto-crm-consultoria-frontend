import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import Loader from "../components/ui/Loader";
import logo from "../assets/images/logo.png";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showAlert } = useAlert();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      login(res.data);
      showAlert("Bienvenido", "Login correcto.", "success");
      navigate("/dashboard");
    } catch (error:any) {
      showAlert("Error", error?.response?.data?.message || "No se pudo iniciar sesión.", "error");
    } finally {
      setLoading(false);
    }
  };

  return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white-950 via-slate-950 to-slate-900 p-4">
<div className="card w-[280px] p-3">
      <div className="mb-8 text-center">
        {/* <p className="text-sm font-semibold uppercase tracking-[.2em] text-brand-600">Sistema</p> */}
   <div className="mb-6 flex justify-center overflow-hidden">
    <img
      src={logo}
      alt="Logo"
      className="max-h-16 w-auto object-contain"
      style={{ maxWidth: "150px" }}
    />
  </div>

  {/* <h1 className="mt-2 text-3xl font-bold">Consultoria</h1> */}
  <p className="mt-2 text-sm text-slate-500">Gestiona clientes, contratos, agenda y finanzas.</p>
  </div>
    <form onSubmit={submit} className="space-y-4">
    <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Usuario" />
    <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Contraseña" />
    <button className="btn-primary w-full" type="submit">{loading ? <Loader label="Ingresando..." /> : "Ingresar"}</button>
    </form>
    </div>
    </div>;
}
