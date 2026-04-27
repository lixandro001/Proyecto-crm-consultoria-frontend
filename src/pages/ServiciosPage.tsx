import { useEffect, useMemo, useState } from "react";
import { serviciosApi } from "../api/endpoints";
import type { Servicio } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { useAlert } from "../context/AlertContext";

export default function ServiciosPage() {
  const initialForm = {
    codigo: "",
    nombre: "",
    descripcion: "",
    precioBase: 0,
  };

  const [items, setItems] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 15;

  const { showAlert } = useAlert();

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return items;

    return items.filter((servicio) => {
      const searchText = [
        servicio.codigo || "",
        servicio.nombre || "",
        servicio.descripcion || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(term);
    });
  }, [items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const startIndex = filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const load = async () => {
    setLoading(true);

    try {
      const r = await serviciosApi.list();
      setItems(r.data);
      setCurrentPage(1);
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo cargar la lista de servicios.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.codigo.trim()) {
      showAlert("Validación", "Debes ingresar el código del servicio.", "error");
      return;
    }

    if (!form.nombre.trim()) {
      showAlert("Validación", "Debes ingresar el nombre del servicio.", "error");
      return;
    }

    setSaving(true);

    try {
      await serviciosApi.create({
        ...form,
        codigo: form.codigo.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precioBase: Number(form.precioBase) || 0,
      });

      showAlert("Ok", "Servicio registrado correctamente.", "success");

      setOpen(false);
      setForm(initialForm);
      await load();
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo registrar.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Servicios"
        subtitle="Administra servicios de asesoría, compra, venta y soporte."
        action={
          <button
            className="btn-primary"
            disabled={loading || saving}
            onClick={() => {
              setForm(initialForm);
              setOpen(true);
            }}
          >
            Nuevo servicio
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState message="No hay servicios registrados." />
      ) : (
        <>
          <div className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Buscar servicios
                </h3>
                <p className="text-xs text-slate-500">
                  Filtra por código, nombre o descripción del servicio.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 md:w-[420px] md:flex-row">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                     
                  </span>

                  <input
                    className="input pl-10"
                    placeholder="Buscar servicio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {searchTerm && (
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => setSearchTerm("")}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Mostrando{" "}
              <span className="font-semibold text-slate-700">
                {filteredItems.length}
              </span>{" "}
              resultado(s) de{" "}
              <span className="font-semibold text-slate-700">
                {items.length}
              </span>{" "}
              servicio(s).
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState message="No se encontraron servicios con ese criterio de búsqueda." />
          ) : (
            <TableWrapper>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Descripción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedItems.map((i) => (
                      <tr key={i.id} className="border-t border-slate-200">
                        <td className="px-4 py-3">{i.codigo}</td>
                        <td className="px-4 py-3 font-medium">{i.nombre}</td>
                        <td className="px-4 py-3">{i.descripcion || "-"}</td>
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
                  servicios
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
        title="Nuevo servicio"
        onClose={() => {
          if (!saving) {
            setOpen(false);
            setForm(initialForm);
          }
        }}
      >
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="Ejemplo: SOPORTE"
              value={form.codigo}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  codigo: e.target.value.toUpperCase(),
                })
              }
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Código corto para identificar el servicio. Ejemplo: SOPORTE, VENTA, COMPRA.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="Ejemplo: Soporte Técnico"
              value={form.nombre}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  nombre: e.target.value,
                })
              }
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Nombre comercial o descriptivo del servicio.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Descripción
            </label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Ejemplo: Soporte técnico presencial o remoto para equipos y sistemas."
              value={form.descripcion}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  descripcion: e.target.value,
                })
              }
            />
            <p className="mt-1 text-xs text-slate-500">
              Detalla brevemente qué incluye este servicio.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Precio base
            </label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ejemplo: 150.00"
              value={form.precioBase}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  precioBase: Number(e.target.value),
                })
              }
            />
            <p className="mt-1 text-xs text-slate-500">
              Precio referencial del servicio. Puedes dejarlo en 0 si no aplica.
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