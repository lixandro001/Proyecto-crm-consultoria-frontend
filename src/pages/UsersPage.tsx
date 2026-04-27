import { useEffect, useMemo, useState } from "react";
import { usersApi } from "../api/endpoints";
import type { User } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { formatDate } from "../utils/format";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";

export default function UsersPage() {
  const initialForm = {
    username: "",
    fullName: "",
    password: "",
    roleCode: "USER",
  };

  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 6;

  const { showAlert } = useAlert();
  const { user } = useAuth();

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return items;

    return items.filter((item) => {
      const searchText = [
        item.username || "",
        item.fullName || "",
        item.roleCode || "",
        item.isActive ? "activo si" : "inactivo no",
        item.fechaRegistro ? formatDate(item.fechaRegistro) : "",
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(term);
    });
  }, [items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const startIndex =
    filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const resetForm = () => {
    setForm(initialForm);
  };

  const load = async () => {
    setLoading(true);

    try {
      const r = await usersApi.list();
      setItems(r.data);
      setCurrentPage(1);
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message ||
          "No se pudo cargar la lista de usuarios.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      load();
    } else {
      setLoading(false);
    }
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username.trim()) {
      showAlert("Validación", "Debes ingresar el usuario.", "error");
      return;
    }

    if (!form.fullName.trim()) {
      showAlert("Validación", "Debes ingresar el nombre completo.", "error");
      return;
    }

    if (!form.password.trim()) {
      showAlert("Validación", "Debes ingresar la contraseña.", "error");
      return;
    }

    if (form.password.trim().length < 6) {
      showAlert(
        "Validación",
        "La contraseña debe tener como mínimo 6 caracteres.",
        "error"
      );
      return;
    }

    if (!form.roleCode.trim()) {
      showAlert("Validación", "Debes seleccionar el perfil del usuario.", "error");
      return;
    }

    const payload = {
      username: form.username.trim(),
      fullName: form.fullName.trim(),
      password: form.password.trim(),
      roleCode: form.roleCode.trim(),
    };

    setSaving(true);

    try {
      await usersApi.create(payload);

      showAlert("Ok", "Usuario registrado correctamente.", "success");

      setOpen(false);
      resetForm();
      await load();
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message ||
          "No se pudo registrar el usuario.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeClass = (roleCode: string) => {
    if (roleCode === "ADMIN") {
      return "bg-blue-100 text-blue-700";
    }

    if (roleCode === "USER") {
      return "bg-slate-100 text-slate-700";
    }

    return "bg-violet-100 text-violet-700";
  };

  const getActiveBadgeClass = (isActive: boolean) => {
    return isActive
      ? "bg-emerald-100 text-emerald-700"
      : "bg-rose-100 text-rose-700";
  };

  if (user?.role !== "ADMIN") {
    return <EmptyState message="Solo el administrador puede ver este módulo." />;
  }

  return (
    <div>
      <SectionHeader
        title="Usuarios"
        subtitle="Gestiona usuarios y perfiles del sistema."
        action={
          <button
            className="btn-primary"
            disabled={loading || saving}
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            Nuevo usuario
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState message="No hay usuarios registrados." />
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Buscar usuarios
                </h3>
                <p className="text-xs text-slate-500">
                  Filtra por usuario, nombre completo, perfil, estado o fecha.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-[430px]">
                <div className="relative flex-1">
                  {/* <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                    />
                  </svg> */}

                  <input
                    className="input w-full pl-10"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {searchTerm && (
                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setSearchTerm("")}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Mostrando{" "}
              <span className="font-semibold text-slate-700">
                {filteredItems.length}
              </span>{" "}
              resultado(s) de{" "}
              <span className="font-semibold text-slate-700">
                {items.length}
              </span>{" "}
              usuario(s).
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState message="No se encontraron usuarios con ese criterio de búsqueda." />
          ) : (
            <TableWrapper>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Rol</th>
                      <th className="px-4 py-3">Activo</th>
                      <th className="px-4 py-3">Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedItems.map((i) => (
                      <tr
                        key={i.id}
                        className="border-t border-slate-200 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {i.username}
                        </td>

                        <td className="px-4 py-3">
                          {i.fullName || "-"}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getRoleBadgeClass(
                              i.roleCode
                            )}`}
                          >
                            {i.roleCode}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getActiveBadgeClass(
                              i.isActive
                            )}`}
                          >
                            {i.isActive ? "Sí" : "No"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          {formatDate(i.fechaRegistro)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                <div>
                  Mostrando{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredItems.length === 0 ? 0 : startIndex + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(endIndex, filteredItems.length)}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredItems.length}
                  </span>{" "}
                  usuarios
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                  >
                    Anterior
                  </button>

                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </TableWrapper>
          )}
        </>
      )}

      <FormModal
        open={open}
        title="Nuevo usuario"
        onClose={() => {
          if (!saving) {
            setOpen(false);
            resetForm();
          }
        }}
      >
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Usuario <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              placeholder="Ejemplo: admin"
              value={form.username}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  username: e.target.value.trim(),
                })
              }
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Nombre de acceso con el que iniciará sesión.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nombre completo <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              placeholder="Ejemplo: Administrador General"
              value={form.fullName}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  fullName: e.target.value,
                })
              }
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Nombre visible del usuario en el sistema.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Contraseña <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Debe tener como mínimo 6 caracteres.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Perfil / Rol <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              value={form.roleCode}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  roleCode: e.target.value,
                })
              }
              required
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Define los permisos generales del usuario dentro del sistema.
            </p>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={saving}
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}