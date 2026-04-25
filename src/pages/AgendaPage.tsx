import { useEffect, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { agendaApi, clientesApi } from "../api/endpoints";
import type { AgendaEvento, Cliente } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import FormModal from "../components/ui/FormModal";
import { useAlert } from "../context/AlertContext";

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
});

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: AgendaEvento;
};

function toInputDateTime(value: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = value.getFullYear();
  const month = pad(value.getMonth() + 1);
  const day = pad(value.getDate());
  const hours = pad(value.getHours());
  const minutes = pad(value.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AgendaPage() {
  const initialForm = {
    clienteId: "",
    titulo: "",
    descripcion: "",
    fechaInicio: "",
    fechaFin: "",
    tipoEvento: "",
    recordatorioActivo: false,
  };

  const [items, setItems] = useState<AgendaEvento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const { showAlert } = useAlert();

  const load = async () => {
    setLoading(true);
    try {
      const [agendaRes, clientesRes] = await Promise.all([
        agendaApi.list(),
        clientesApi.list(),
      ]);

      setItems(agendaRes.data);
      setClientes(clientesRes.data);
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo cargar la agenda.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return items.map((i) => ({
      id: i.id,
      title: `${i.tipoEvento} - ${i.titulo}`,
      start: new Date(i.fechaInicio),
      end: new Date(i.fechaFin),
      resource: i,
    }));
  }, [items]);

  const handleNewEvent = () => {
    setForm(initialForm);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.clienteId) {
      showAlert("Validación", "Debes seleccionar un cliente.", "error");
      return;
    }

    if (!form.tipoEvento) {
      showAlert("Validación", "Debes seleccionar un tipo de evento.", "error");
      return;
    }

    if (!form.titulo || form.titulo.trim() === "") {
      showAlert("Validación", "Debes ingresar el título del evento.", "error");
      return;
    }

    if (!form.fechaInicio) {
      showAlert(
        "Validación",
        "Debes ingresar la fecha y hora de inicio.",
        "error"
      );
      return;
    }

    if (!form.fechaFin) {
      showAlert(
        "Validación",
        "Debes ingresar la fecha y hora de fin.",
        "error"
      );
      return;
    }

    const inicio = new Date(form.fechaInicio);
    const fin = new Date(form.fechaFin);

    if (fin < inicio) {
      showAlert(
        "Validación",
        "La fecha y hora de fin no puede ser menor que la de inicio.",
        "error"
      );
      return;
    }

    const payload = {
      ...form,
      clienteId: Number(form.clienteId),
    };

    try {
      await agendaApi.create(payload);
      showAlert("Ok", "Evento registrado correctamente.", "success");

      setOpen(false);
      setForm(initialForm);
      load();
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo guardar el evento.",
        "error"
      );
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setForm({
      ...initialForm,
      fechaInicio: toInputDateTime(start),
      fechaFin: toInputDateTime(end),
    });

    setOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const ev = event.resource;

    showAlert(
      ev.titulo,
      `Cliente: ${ev.clienteNombre}
Tipo: ${ev.tipoEvento}
Inicio: ${new Date(ev.fechaInicio).toLocaleString()}
Fin: ${new Date(ev.fechaFin).toLocaleString()}
Descripción: ${ev.descripcion || "-"}`,
      "info"
    );
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const tipo = event.resource.tipoEvento?.toUpperCase();

    let backgroundColor = "#2563eb";

    if (tipo === "REUNION_INICIAL") backgroundColor = "#1d4ed8";
    else if (tipo === "ASESORIA_TESIS") backgroundColor = "#0f766e";
    else if (tipo === "REVISION_AVANCE") backgroundColor = "#0891b2";
    else if (tipo === "SEGUIMIENTO_CLIENTE") backgroundColor = "#7c3aed";
    else if (tipo === "ALCANCE_TECNICO") backgroundColor = "#ea580c";
    else if (tipo === "COBRO_PROGRAMADO") backgroundColor = "#16a34a";
    else if (tipo === "PAGO_PENDIENTE") backgroundColor = "#dc2626";
    else if (tipo === "ENTREGA_PARCIAL") backgroundColor = "#f59e0b";
    else if (tipo === "ENTREGA_FINAL") backgroundColor = "#22c55e";
    else if (tipo === "SOPORTE_TECNICO") backgroundColor = "#334155";
    else if (tipo === "OTRO") backgroundColor = "#64748b";

    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        border: "none",
        color: "white",
        padding: "2px 6px",
        fontSize: "12px",
      },
    };
  };

  return (
    <div>
      <SectionHeader
        title="Agenda"
        subtitle="Programa reuniones, pagos, cobros y seguimientos."
        action={
          <button className="btn-primary" onClick={handleNewEvent}>
            Nuevo evento
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState message="No hay eventos en agenda." />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-700"></span>
                Reunión inicial
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-teal-700"></span>
                Asesoría tesis
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-cyan-600"></span>
                Revisión avance
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-violet-700"></span>
                Seguimiento cliente
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-600"></span>
                Alcance técnico
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-600"></span>
                Cobro programado
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-[300px]">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                defaultView={Views.MONTH}
                popup
                selectable
                culture="es"
                messages={{
                  next: "Siguiente",
                  previous: "Anterior",
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  agenda: "Agenda",
                  date: "Fecha",
                  time: "Hora",
                  event: "Evento",
                  noEventsInRange: "No hay eventos en este rango.",
                  showMore: (total) => `+ Ver más (${total})`,
                }}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
              />
            </div>
          </div>
        </div>
      )}

      <FormModal
        open={open}
        title="Nuevo evento"
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
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo de evento <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              value={form.tipoEvento}
              onChange={(e) => setForm({ ...form, tipoEvento: e.target.value })}
              required
            >
              <option value="">Selecciona tipo de evento</option>
              <option value="REUNION_INICIAL">Reunión inicial</option>
              <option value="ASESORIA_TESIS">Asesoría de tesis</option>
              <option value="REVISION_AVANCE">Revisión de avance</option>
              <option value="SEGUIMIENTO_CLIENTE">
                Seguimiento con cliente
              </option>
              <option value="ALCANCE_TECNICO">Alcance técnico</option>
              <option value="COBRO_PROGRAMADO">Cobro programado</option>
              <option value="PAGO_PENDIENTE">Pago pendiente</option>
              <option value="ENTREGA_PARCIAL">Entrega parcial</option>
              <option value="ENTREGA_FINAL">Entrega final</option>
              <option value="SOPORTE_TECNICO">Soporte técnico</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Título del evento <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="Ejemplo: Reunión de avance con cliente"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              className="input min-h-[110px]"
              placeholder="Detalle breve del evento"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fecha y hora de inicio <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              type="datetime-local"
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fecha y hora de fin <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              type="datetime-local"
              value={form.fechaFin}
              onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.recordatorioActivo}
                onChange={(e) =>
                  setForm({ ...form, recordatorioActivo: e.target.checked })
                }
              />
              Activar recordatorio
            </label>
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