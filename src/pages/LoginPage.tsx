import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ShieldCheck, BarChart3, CalendarCheck } from "lucide-react";
import { authApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import logo from "../assets/images/logo.png";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showAlert } = useAlert();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      showAlert("Validación", "Ingresa tu usuario.", "error");
      return;
    }

    if (!password.trim()) {
      showAlert("Validación", "Ingresa tu contraseña.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.login({
        username: username.trim(),
        password: password.trim(),
      });

      login(res.data);
      showAlert("Bienvenido", "Login correcto.", "success");
      navigate("/dashboard");
    } catch (error: any) {
      showAlert(
        "Error",
        error?.response?.data?.message || "No se pudo iniciar sesión.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-blue-100 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-slate-200 blur-3xl" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_35%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Sistema empresarial
            </div>

            <h1 className="mt-8 max-w-lg text-5xl font-black leading-[1.05] tracking-tight">
              Gestión centralizada para tu negocio.
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              Administra clientes, contratos, pagos, servicios y agenda desde
              una plataforma segura, ordenada y preparada para crecer.
            </p>
          </div>

          <div className="relative grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200">
                <BarChart3 className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-white">Control operativo</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Visualiza indicadores, clientes, contratos y avance financiero
                en un solo lugar.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-white">Acceso seguro</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Ingreso exclusivo para usuarios autorizados.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-200">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-white">Agenda integrada</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Control de reuniones, entregas, cobros y seguimientos.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-[620px] items-center justify-center bg-white px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
            <div className="mx-auto flex items-center justify-center">
  <img
    src={logo}
    alt="Consultoría Ramirez"
    className="h-36 w-auto object-contain"
  />
</div>

              <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
                Bienvenido
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ingresa tus credenciales para acceder al panel administrativo.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Usuario
                </label>

                <input
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  value={username}
                  disabled={loading}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Contraseña
                </label>

                <div className="relative">
                  <input
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    disabled={loading}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                    disabled={loading}
                    onClick={() => setShowPassword((value) => !value)}
                    title={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Ingresar
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
              <p className="text-xs leading-5 text-slate-500">
                Acceso exclusivo para usuarios autorizados de{" "}
                <span className="font-bold text-slate-700">
                  Consultoría Ramirez
                </span>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}