import { useEffect, useMemo, useState } from "react";
import { clientesApi, contratosApi, pagosApi } from "../api/endpoints";
import type { Cliente, Contrato, Pago } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { formatCurrency, formatDate } from "../utils/format";
import { useAlert } from "../context/AlertContext";

export default function PagosPage() {
  const initialForm = {
    clienteId: 0,
    contratoId: null as number | null,
    monto: 0,
    fechaPago: new Date().toISOString().slice(0, 10),
    tipoMovimiento: "INGRESO",
    estadoPago: "PAGADO",
    metodoPago: "",
    observacion: "",
  };

  const [items, setItems] = useState<Pago[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
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

    return items.filter((pago) => {
      const searchText = [
        pago.clienteNombre || "",
        pago.monto?.toString() || "",
        pago.tipoMovimiento || "",
        pago.estadoPago || "",
        pago.metodoPago || "",
        pago.observacion || "",
        pago.fechaPago ? formatDate(pago.fechaPago) : "",
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
      const [pagosRes, clientesRes, contratosRes] = await Promise.all([
        pagosApi.list(),
        clientesApi.list(),
        contratosApi.list(),
      ]);

      setItems(pagosRes.data);
      setClientes(clientesRes.data);
      setContratos(contratosRes.data);
      setCurrentPage(1);
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message ||
          "No se pudo cargar la información de pagos y deudas.",
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

    if (!form.clienteId || Number(form.clienteId) <= 0) {
      showAlert("Validación", "Debes seleccionar un cliente.", "error");
      return;
    }

    if (!form.monto || Number(form.monto) <= 0) {
      showAlert("Validación", "Debes ingresar un monto válido.", "error");
      return;
    }

    if (!form.fechaPago) {
      showAlert("Validación", "Debes seleccionar la fecha del movimiento.", "error");
      return;
    }

    if (!form.tipoMovimiento) {
      showAlert("Validación", "Debes seleccionar el tipo de movimiento.", "error");
      return;
    }

    if (!form.estadoPago) {
      showAlert("Validación", "Debes seleccionar el estado del pago.", "error");
      return;
    }

    const payload = {
      ...form,
      clienteId: Number(form.clienteId),
      contratoId: form.contratoId ? Number(form.contratoId) : null,
      monto: Number(form.monto),
      metodoPago: form.metodoPago.trim(),
      observacion: form.observacion.trim(),
    };

    setSaving(true);

    try {
      await pagosApi.create(payload);

      showAlert("Ok", "Pago o deuda registrado correctamente.", "success");

      setOpen(false);
      resetForm();
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

  const getTipoBadgeClass = (tipo: string) => {
    if (tipo === "INGRESO") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (tipo === "DEUDA") {
      return "bg-rose-100 text-rose-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  const getEstadoBadgeClass = (estado: string) => {
    if (estado === "PAGADO") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (estado === "PENDIENTE") {
      return "bg-amber-100 text-amber-700";
    }

    if (estado === "VENCIDO") {
      return "bg-rose-100 text-rose-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  return (
    <div>
      <SectionHeader
        title="Pagos y deudas"
        subtitle="Controla ingresos, pagos pendientes y deudas por cliente."
        action={
          <button
            className="btn-primary"
            disabled={loading || saving}
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            Nuevo movimiento
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState message="No hay pagos o deudas registradas." />
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Buscar movimientos
                </h3>
                <p className="text-xs text-slate-500">
                  Filtra por cliente, monto, tipo, estado, método de pago,
                  observación o fecha.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-[430px]">
                <div className="relative flex-1">
                  <svg
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
                  </svg>

                  <input
                    className="input w-full pl-10"
                    placeholder="Buscar movimiento..."
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
              movimiento(s).
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState message="No se encontraron pagos o deudas con ese criterio de búsqueda." />
          ) : (
            <TableWrapper>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Método</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Observación</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedItems.map((i) => (
                      <tr
                        key={i.id}
                        className="border-t border-slate-200 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {i.clienteNombre}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-900">
                          {formatCurrency(i.monto)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getTipoBadgeClass(
                              i.tipoMovimiento
                            )}`}
                          >
                            {i.tipoMovimiento}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getEstadoBadgeClass(
                              i.estadoPago
                            )}`}
                          >
                            {i.estadoPago}
                          </span>
                        </td>

                        <td className="px-4 py-3">{i.metodoPago || "-"}</td>

                        <td className="px-4 py-3">
                          {formatDate(i.fechaPago)}
                        </td>

                        <td className="px-4 py-3 max-w-xs truncate">
                          {i.observacion || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-3 md:hidden">
                {paginatedItems.map((i) => (
                  <div
                    key={i.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Cliente
                        </p>
                        <h3 className="mt-1 text-sm font-bold text-slate-900">
                          {i.clienteNombre}
                        </h3>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Monto
                        </p>
                        <p className="mt-1 text-base font-black text-slate-900">
                          {formatCurrency(i.monto)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getTipoBadgeClass(
                          i.tipoMovimiento
                        )}`}
                      >
                        {i.tipoMovimiento}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getEstadoBadgeClass(
                          i.estadoPago
                        )}`}
                      >
                        {i.estadoPago}
                      </span>
                    </div>

                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between gap-3 border-t border-slate-100 pt-2">
                        <span className="font-medium text-slate-500">
                          Método
                        </span>
                        <span className="text-right font-semibold text-slate-800">
                          {i.metodoPago || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 border-t border-slate-100 pt-2">
                        <span className="font-medium text-slate-500">
                          Fecha
                        </span>
                        <span className="text-right font-semibold text-slate-800">
                          {formatDate(i.fechaPago)}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 pt-2">
                        <span className="font-medium text-slate-500">
                          Observación
                        </span>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {i.observacion || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
                  movimientos
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
        title="Nuevo pago o deuda"
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
              Cliente <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              value={form.clienteId}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  clienteId: Number(e.target.value),
                })
              }
              required
            >
              <option value={0}>Selecciona cliente</option>

              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombres} {c.apellidos}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Cliente al que pertenece este ingreso, pago pendiente o deuda.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Contrato asociado
            </label>

            <select
              className="input"
              value={form.contratoId ?? ""}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  contratoId: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">Sin contrato</option>

              {contratos.map((c) => (
                <option key={c.id} value={c.id}>
                  Contrato #{c.id} - {c.clienteNombre}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Opcional. Selecciona el contrato relacionado al movimiento.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Monto <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              value={form.monto}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  monto: Number(e.target.value),
                })
              }
              placeholder="Ejemplo: 500.00"
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Importe del ingreso o deuda registrada.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Fecha del movimiento <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              type="date"
              value={form.fechaPago}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  fechaPago: e.target.value,
                })
              }
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Fecha en la que se realizó o se registró el movimiento.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tipo de movimiento <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              value={form.tipoMovimiento}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  tipoMovimiento: e.target.value,
                  estadoPago:
                    e.target.value === "INGRESO" ? "PAGADO" : "PENDIENTE",
                })
              }
              required
            >
              <option value="INGRESO">INGRESO</option>
              <option value="DEUDA">DEUDA</option>
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Usa INGRESO para pagos recibidos y DEUDA para montos pendientes.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Estado del pago <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              value={form.estadoPago}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  estadoPago: e.target.value,
                })
              }
              required
            >
              <option value="PAGADO">PAGADO</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="VENCIDO">VENCIDO</option>
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Define si el movimiento ya fue pagado, está pendiente o vencido.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Método de pago
            </label>

            <input
              className="input"
              placeholder="Ejemplo: Efectivo, Yape, Plin, Transferencia"
              value={form.metodoPago}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  metodoPago: e.target.value,
                })
              }
            />

            <p className="mt-1 text-xs text-slate-500">
              Opcional. Indica cómo se realizó el pago.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Observación
            </label>

            <input
              className="input"
              placeholder="Ejemplo: Primera cuota del servicio"
              value={form.observacion}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  observacion: e.target.value,
                })
              }
            />

            <p className="mt-1 text-xs text-slate-500">
              Opcional. Agrega una nota breve sobre el movimiento.
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