import { useEffect, useMemo, useState } from "react";
import {
  clientesApi,
  contratosApi,
  plantillasApi,
  serviciosApi,
} from "../api/endpoints";
import type {
  Cliente,
  Contrato,
  PlantillaContrato,
  Servicio,
} from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { formatCurrency, formatDate } from "../utils/format";
import { useAlert } from "../context/AlertContext";

export default function ContratosPage() {
  const initialForm = {
    clienteId: "",
    servicioId: "",
    plantillaContratoId: "",
    precioTotal: "",
    montoPagado: "",
    fechaContrato: new Date().toISOString().slice(0, 10),
    fechaEntrega: "",
    estadoContrato: "PENDIENTE",
    firmaRepresentante: "",
    firmaCliente: "",
  };

  const [items, setItems] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaContrato[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 6;

  const { showAlert } = useAlert();

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return items;

    return items.filter((contrato) => {
      const searchText = [
        contrato.clienteNombre || "",
        contrato.servicioNombre || "",
        contrato.estadoContrato || "",
        contrato.precioTotal?.toString() || "",
        contrato.montoPagado?.toString() || "",
        contrato.saldoPendiente?.toString() || "",
        contrato.fechaEntrega ? formatDate(contrato.fechaEntrega) : "",
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

  const load = async () => {
    setLoading(true);

    try {
      const [contratosRes, clientesRes, serviciosRes, plantillasRes] =
        await Promise.all([
          contratosApi.list(),
          clientesApi.list(),
          serviciosApi.list(),
          plantillasApi.list(),
        ]);

      setItems(contratosRes.data);
      setClientes(clientesRes.data);
      setServicios(serviciosRes.data);
      setPlantillas(plantillasRes.data);
      setCurrentPage(1);
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message ||
          "No se pudo cargar la información de contratos.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleNewContrato = () => {
    setForm(initialForm);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.clienteId) {
      showAlert("Validación", "Debes seleccionar un cliente.", "error");
      return;
    }

    if (!form.servicioId) {
      showAlert("Validación", "Debes seleccionar un servicio.", "error");
      return;
    }

    if (!form.plantillaContratoId) {
      showAlert(
        "Validación",
        "Debes seleccionar una plantilla de contrato.",
        "error"
      );
      return;
    }

    if (!form.estadoContrato) {
      showAlert(
        "Validación",
        "Debes seleccionar el estado del contrato.",
        "error"
      );
      return;
    }

    if (!form.precioTotal || Number(form.precioTotal) <= 0) {
      showAlert(
        "Validación",
        "Debes ingresar un costo total válido.",
        "error"
      );
      return;
    }

    if (!form.fechaContrato) {
      showAlert(
        "Validación",
        "Debes ingresar la fecha del contrato.",
        "error"
      );
      return;
    }

    if (
      form.fechaEntrega &&
      new Date(form.fechaEntrega) < new Date(form.fechaContrato)
    ) {
      showAlert(
        "Validación",
        "La fecha de entrega no puede ser menor que la fecha del contrato.",
        "error"
      );
      return;
    }

    const payload = {
      clienteId: Number(form.clienteId),
      servicioId: Number(form.servicioId),
      plantillaContratoId: Number(form.plantillaContratoId),
      precioTotal: Number(form.precioTotal),
      montoPagado: form.montoPagado ? Number(form.montoPagado) : 0,
      fechaContrato: form.fechaContrato,
      fechaEntrega: form.fechaEntrega || null,
      estadoContrato: form.estadoContrato,
      firmaRepresentante: form.firmaRepresentante.trim(),
      firmaCliente: form.firmaCliente.trim(),
    };

    setSaving(true);

    try {
      await contratosApi.create(payload);

      showAlert("Ok", "Contrato registrado correctamente.", "success");

      setOpen(false);
      setForm(initialForm);
      await load();
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo registrar el contrato.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const downloadWord = async (id: number) => {
    try {
      const response = await contratosApi.downloadWord(id);

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `Contrato_${id}.docx`;
      link.click();

      window.URL.revokeObjectURL(url);

      showAlert("Descarga", "Se descargó el Word del contrato.", "success");
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo descargar el Word.",
        "error"
      );
    }
  };

  return (
    <div>
      <SectionHeader
        title="Contratos"
        subtitle="Registra contratos y genera el Word del servicio contratado."
        action={
          <button
            className="btn-primary"
            disabled={loading || saving}
            onClick={handleNewContrato}
          >
            Nuevo contrato
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState message="No hay contratos registrados." />
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Buscar contratos
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Filtra por cliente, servicio, estado, monto o fecha de entrega.
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
                    placeholder="Buscar contrato..."
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
              contrato(s).
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState message="No se encontraron contratos con ese criterio de búsqueda." />
          ) : (
            <TableWrapper>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Cliente</th>
                      <th className="px-4 py-3 font-semibold">
                        Servicio contratado
                      </th>
                      <th className="px-4 py-3 font-semibold">Costo total</th>
                      <th className="px-4 py-3 font-semibold">Monto abonado</th>
                      <th className="px-4 py-3 font-semibold">
                        Fecha de entrega
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        Estado del contrato
                      </th>
                      <th className="px-4 py-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedItems.map((i) => (
                      <tr
                        key={i.id}
                        className="border-t border-slate-200 align-top transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {i.clienteNombre}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {i.servicioNombre}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-800">
                          {formatCurrency(i.precioTotal)}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {formatCurrency(i.montoPagado)}
                          </div>
                          <div className="mt-1 text-xs font-medium text-rose-600">
                            Saldo pendiente:{" "}
                            {formatCurrency(i.saldoPendiente)}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {formatDate(i.fechaEntrega)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              i.estadoContrato === "FINALIZADO"
                                ? "bg-emerald-100 text-emerald-700"
                                : i.estadoContrato === "ANULADO"
                                ? "bg-rose-100 text-rose-700"
                                : i.estadoContrato === "EN_PROCESO"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {i.estadoContrato}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
                            onClick={() => downloadWord(i.id)}
                            title="Descargar contrato en Word"
                          >
                            <span className="text-base">📄</span>
                            <span>Word</span>
                          </button>
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
                  contratos
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
        title="Nuevo contrato"
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
              Cliente <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              value={form.clienteId}
              disabled={saving}
              onChange={(e) =>
                setForm({ ...form, clienteId: e.target.value })
              }
              required
            >
              <option value="">Selecciona cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombres} {c.apellidos}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Selecciona el cliente que firmará el contrato.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Servicio contratado <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              value={form.servicioId}
              disabled={saving}
              onChange={(e) =>
                setForm({ ...form, servicioId: e.target.value })
              }
              required
            >
              <option value="">Selecciona servicio</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Indica el servicio contratado por el cliente.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Plantilla de contrato <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              value={form.plantillaContratoId}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  plantillaContratoId: e.target.value,
                })
              }
              required
            >
              <option value="">Selecciona plantilla</option>
              {plantillas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombrePlantilla}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Plantilla Word que se usará para generar el contrato.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Estado del contrato <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              value={form.estadoContrato}
              disabled={saving}
              onChange={(e) =>
                setForm({ ...form, estadoContrato: e.target.value })
              }
              required
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN_PROCESO">EN PROCESO</option>
              <option value="FINALIZADO">FINALIZADO</option>
              <option value="ANULADO">ANULADO</option>
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Define la situación actual del contrato.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Costo total <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ejemplo: 1400.00"
              value={form.precioTotal}
              disabled={saving}
              onChange={(e) =>
                setForm({ ...form, precioTotal: e.target.value })
              }
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Monto total acordado por el servicio.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Monto abonado
            </label>

            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ejemplo: 500.00"
              value={form.montoPagado}
              disabled={saving}
              onChange={(e) =>
                setForm({ ...form, montoPagado: e.target.value })
              }
            />

            <p className="mt-1 text-xs text-slate-500">
              Pago inicial o adelanto realizado por el cliente.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Fecha del contrato <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              type="date"
              value={form.fechaContrato}
              disabled={saving}
              onChange={(e) =>
                setForm({ ...form, fechaContrato: e.target.value })
              }
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Fecha en la que se registra o firma el contrato.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Fecha de entrega
            </label>

            <input
              className="input"
              type="date"
              value={form.fechaEntrega}
              disabled={saving}
              onChange={(e) =>
                setForm({ ...form, fechaEntrega: e.target.value })
              }
            />

            <p className="mt-1 text-xs text-slate-500">
              Fecha estimada para entregar el servicio o proyecto.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Firma del representante
            </label>

            <input
              className="input"
              placeholder="Nombre o firma representante"
              value={form.firmaRepresentante}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  firmaRepresentante: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Firma del cliente
            </label>

            <input
              className="input"
              placeholder="Nombre o firma cliente"
              value={form.firmaCliente}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  firmaCliente: e.target.value,
                })
              }
            />
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