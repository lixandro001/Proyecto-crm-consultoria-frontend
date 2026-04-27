import { useEffect, useMemo, useState } from "react";
import { plantillasApi } from "../api/endpoints";
import type { PlantillaContrato } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { formatDate } from "../utils/format";
import { useAlert } from "../context/AlertContext";

export default function PlantillasPage() {
  const [items, setItems] = useState<PlantillaContrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const [nombrePlantilla, setNombrePlantilla] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivoWord, setArchivoWord] = useState<File | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 6;

  const { showAlert } = useAlert();

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return items;

    return items.filter((plantilla) => {
      const searchText = [
        plantilla.nombrePlantilla || "",
        plantilla.descripcion || "",
        plantilla.activa ? "activa si activo" : "inactiva no",
        plantilla.fechaRegistro ? formatDate(plantilla.fechaRegistro) : "",
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
    setNombrePlantilla("");
    setDescripcion("");
    setArchivoWord(null);
  };

  const load = async () => {
    setLoading(true);

    try {
      const r = await plantillasApi.list();
      setItems(r.data);
      setCurrentPage(1);
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message ||
          "No se pudo cargar la lista de plantillas.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validarArchivoWord = (file: File | null) => {
    if (!file) return false;

    const nombre = file.name.toLowerCase();
    return nombre.endsWith(".doc") || nombre.endsWith(".docx");
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setArchivoWord(null);
      return;
    }

    if (!validarArchivoWord(file)) {
      showAlert(
        "Validación",
        "Solo se permiten archivos Word con extensión .doc o .docx.",
        "error"
      );
      setArchivoWord(null);
      return;
    }

    setArchivoWord(file);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombrePlantilla.trim()) {
      showAlert(
        "Validación",
        "Debes ingresar el nombre de la plantilla.",
        "error"
      );
      return;
    }

    if (!descripcion.trim()) {
      showAlert(
        "Validación",
        "Debes ingresar la descripción de la plantilla.",
        "error"
      );
      return;
    }

    if (!archivoWord) {
      showAlert(
        "Validación",
        "Debes adjuntar un archivo Word para la plantilla.",
        "error"
      );
      return;
    }

    if (!validarArchivoWord(archivoWord)) {
      showAlert(
        "Validación",
        "El archivo debe ser Word con extensión .doc o .docx.",
        "error"
      );
      return;
    }

    const fd = new FormData();
    fd.append("archivoWord", archivoWord);
    fd.append("nombrePlantilla", nombrePlantilla.trim());
    fd.append("descripcion", descripcion.trim());

    setSaving(true);

    try {
      await plantillasApi.upload(fd);

      showAlert("Ok", "Plantilla subida correctamente.", "success");

      setOpen(false);
      resetForm();
      await load();
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo subir la plantilla.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Plantillas de contrato"
        subtitle="Sube plantillas Word para autocompletar contratos."
        action={
          <button
            className="btn-primary"
            disabled={loading || saving}
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            Subir plantilla
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState message="No hay plantillas registradas." />
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Buscar plantillas
                </h3>
                <p className="text-xs text-slate-500">
                  Filtra por nombre, descripción, estado o fecha de registro.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 md:w-[420px] md:flex-row">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                 
                  </span>

                  <input
                    className="input pl-10"
                    placeholder="Buscar plantilla..."
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

            <div className="mt-3 text-xs text-slate-500">
              Mostrando{" "}
              <span className="font-semibold text-slate-700">
                {filteredItems.length}
              </span>{" "}
              resultado(s) de{" "}
              <span className="font-semibold text-slate-700">
                {items.length}
              </span>{" "}
              plantilla(s).
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState message="No se encontraron plantillas con ese criterio de búsqueda." />
          ) : (
            <TableWrapper>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Activa</th>
                      <th className="px-4 py-3">Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedItems.map((i) => (
                      <tr key={i.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-medium">
                          {i.nombrePlantilla}
                        </td>

                        <td className="px-4 py-3">{i.descripcion || "-"}</td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              i.activa
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {i.activa ? "Sí" : "No"}
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
                  plantillas
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
        title="Subir plantilla Word"
        onClose={() => {
          if (!saving) {
            setOpen(false);
            resetForm();
          }
        }}
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nombre de la plantilla <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              placeholder="Ejemplo: Contrato de asesoría de tesis"
              value={nombrePlantilla}
              disabled={saving}
              onChange={(e) => setNombrePlantilla(e.target.value)}
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Escribe un nombre claro para identificar esta plantilla.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Descripción <span className="text-red-500">*</span>
            </label>

            <textarea
              className="input min-h-[90px]"
              placeholder="Ejemplo: Plantilla usada para contratos de servicios de asesoría académica."
              value={descripcion}
              disabled={saving}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Describe brevemente para qué tipo de contrato se utilizará.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Archivo Word <span className="text-red-500">*</span>
            </label>

            <label
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
                saving
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"
                  : "border-blue-200 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <input
                type="file"
                accept=".doc,.docx"
                className="hidden"
                disabled={saving}
                onChange={(e) =>
                  handleFileChange(e.target.files?.[0] || null)
                }
                required
              />

              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-sm">
                📄
              </div>

              <p className="text-sm font-semibold text-slate-800">
                {archivoWord
                  ? archivoWord.name
                  : "Haz clic para seleccionar un archivo Word"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Formatos permitidos: .doc y .docx
              </p>
            </label>

            {archivoWord && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <span className="truncate">
                  Archivo seleccionado:{" "}
                  <span className="font-semibold text-slate-800">
                    {archivoWord.name}
                  </span>
                </span>

                <button
                  type="button"
                  className="ml-3 rounded-lg px-2 py-1 font-medium text-red-600 hover:bg-red-50"
                  disabled={saving}
                  onClick={() => setArchivoWord(null)}
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={saving}
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {saving ? "Subiendo..." : "Subir"}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}