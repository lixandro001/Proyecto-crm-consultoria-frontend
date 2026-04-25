import { useEffect, useState } from "react";
import { clientesApi, contratosApi, plantillasApi, serviciosApi } from "../api/endpoints";
import type { Cliente, Contrato, PlantillaContrato, Servicio } from "../types/entities";
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const { showAlert } = useAlert();

  const load = async () => {
    setLoading(true);
    try {
      const [contratosRes, clientesRes, serviciosRes, plantillasRes] = await Promise.all([
        contratosApi.list(),
        clientesApi.list(),
        serviciosApi.list(),
        plantillasApi.list(),
      ]);

      setItems(contratosRes.data);
      setClientes(clientesRes.data);
      setServicios(serviciosRes.data);
      setPlantillas(plantillasRes.data);
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo cargar la información de contratos.",
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

    if (!form.precioTotal || Number(form.precioTotal) <= 0) {
      showAlert("Validación", "Debes ingresar un costo total válido.", "error");
      return;
    }

    if (!form.fechaContrato) {
      showAlert("Validación", "Debes ingresar la fecha del contrato.", "error");
      return;
    }

    if (form.fechaEntrega && new Date(form.fechaEntrega) < new Date(form.fechaContrato)) {
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
      plantillaContratoId: form.plantillaContratoId ? Number(form.plantillaContratoId) : null,
      precioTotal: Number(form.precioTotal),
      montoPagado: form.montoPagado ? Number(form.montoPagado) : 0,
      fechaContrato: form.fechaContrato,
      fechaEntrega: form.fechaEntrega || null,
      estadoContrato: form.estadoContrato,
      firmaRepresentante: form.firmaRepresentante,
      firmaCliente: form.firmaCliente,
    };

    try {
      await contratosApi.create(payload);
      showAlert("Ok", "Contrato registrado correctamente.", "success");

      setOpen(false);
      setForm(initialForm);
      load();
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo registrar el contrato.",
        "error"
      );
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

  const makePdf = async (id: number) => {
    try {
      await contratosApi.generarPdf(id);
      showAlert("PDF", "Se generó el PDF del contrato.", "success");
      load();
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo generar el PDF.",
        "error"
      );
    }
  };

  return (
    <div>
      <SectionHeader
        title="Contratos"
        subtitle="Registra contratos, genera Word y PDF del servicio contratado."
        action={
          <button className="btn-primary" onClick={handleNewContrato}>
            Nuevo contrato
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState message="No hay contratos registrados." />
      ) : (
        <TableWrapper>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Servicio contratado</th>
                <th className="px-4 py-3">Costo total</th>
                <th className="px-4 py-3">Monto abonado</th>
                <th className="px-4 py-3">Fecha de entrega</th>
                <th className="px-4 py-3">Estado del contrato</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-slate-200 align-top">
                  <td className="px-4 py-3 font-medium">{i.clienteNombre}</td>
                  <td className="px-4 py-3">{i.servicioNombre}</td>
                  <td className="px-4 py-3">{formatCurrency(i.precioTotal)}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(i.montoPagado)}
                    <br />
                    <span className="text-xs text-rose-600">
                      Saldo pendiente: {formatCurrency(i.saldoPendiente)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(i.fechaEntrega)}</td>
                  <td className="px-4 py-3">{i.estadoContrato}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-secondary" onClick={() => downloadWord(i.id)}>
                        Word
                      </button>
                      <button className="btn-primary" onClick={() => makePdf(i.id)}>
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}

      <FormModal
        open={open}
        title="Nuevo contrato"
        onClose={() => {
          setOpen(false);
          setForm(initialForm);
        }}
      >
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              value={form.clienteId}
              onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
              required
            >
              <option value="">Selecciona cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombres} {c.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Servicio contratado <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              value={form.servicioId}
              onChange={(e) => setForm({ ...form, servicioId: e.target.value })}
              required
            >
              <option value="">Selecciona servicio</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Plantilla de contrato
            </label>
            <select
              className="input"
              value={form.plantillaContratoId}
              onChange={(e) => setForm({ ...form, plantillaContratoId: e.target.value })}
            >
              <option value="">Sin plantilla</option>
              {plantillas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombrePlantilla}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Estado del contrato
            </label>
            <select
              className="input"
              value={form.estadoContrato}
              onChange={(e) => setForm({ ...form, estadoContrato: e.target.value })}
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN_PROCESO">EN PROCESO</option>
              <option value="FINALIZADO">FINALIZADO</option>
              <option value="ANULADO">ANULADO</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Costo total <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Ejemplo: 1400.00"
              value={form.precioTotal}
              onChange={(e) => setForm({ ...form, precioTotal: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Monto abonado
            </label>
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Ejemplo: 500.00"
              value={form.montoPagado}
              onChange={(e) => setForm({ ...form, montoPagado: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fecha del contrato <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              type="date"
              value={form.fechaContrato}
              onChange={(e) => setForm({ ...form, fechaContrato: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fecha de entrega
            </label>
            <input
              className="input"
              type="date"
              value={form.fechaEntrega}
              onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Firma del representante
            </label>
            <input
              className="input"
              placeholder="Nombre o firma representante"
              value={form.firmaRepresentante}
              onChange={(e) => setForm({ ...form, firmaRepresentante: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Firma del cliente
            </label>
            <input
              className="input"
              placeholder="Nombre o firma cliente"
              value={form.firmaCliente}
              onChange={(e) => setForm({ ...form, firmaCliente: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button className="btn-primary" type="submit">
              Guardar
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}