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

const EVENT_TYPES = [
  {
    value: "REUNION_INICIAL",
    label: "Reunión inicial",
    color: "#2563eb",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    dotClass: "bg-blue-600",
  },
  {
    value: "ASESORIA_TESIS",
    label: "Asesoría de tesis",
    color: "#0f766e",
    badgeClass: "bg-teal-100 text-teal-700 border-teal-200",
    dotClass: "bg-teal-700",
  },
  {
    value: "REVISION_AVANCE",
    label: "Revisión de avance",
    color: "#0891b2",
    badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
    dotClass: "bg-cyan-600",
  },
  {
    value: "SEGUIMIENTO_CLIENTE",
    label: "Seguimiento con cliente",
    color: "#7c3aed",
    badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
    dotClass: "bg-violet-700",
  },
  {
    value: "ALCANCE_TECNICO",
    label: "Alcance técnico",
    color: "#ea580c",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
    dotClass: "bg-orange-600",
  },
  {
    value: "COBRO_PROGRAMADO",
    label: "Cobro programado",
    color: "#16a34a",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    dotClass: "bg-green-600",
  },
  {
    value: "PAGO_PENDIENTE",
    label: "Pago pendiente",
    color: "#dc2626",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    dotClass: "bg-red-600",
  },
  {
    value: "ENTREGA_PARCIAL",
    label: "Entrega parcial",
    color: "#f59e0b",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  {
    value: "ENTREGA_FINAL",
    label: "Entrega final",
    color: "#22c55e",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  {
    value: "SOPORTE_TECNICO",
    label: "Soporte técnico",
    color: "#334155",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    dotClass: "bg-slate-700",
  },
  {
    value: "OTRO",
    label: "Otro",
    color: "#64748b",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
    dotClass: "bg-gray-500",
  },
];

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

function getDatePart(value: string) {
  return value.split("T")[0];
}

function getLocalDateKey(value: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = value.getFullYear();
  const month = pad(value.getMonth() + 1);
  const day = pad(value.getDate());

  return `${year}-${month}-${day}`;
}

function isSameDate(startValue: string, endValue: string) {
  if (!startValue || !endValue) return false;

  return getDatePart(startValue) === getDatePart(endValue);
}

function getDefaultEndDateTime(startValue: string) {
  if (!startValue) return "";

  const start = new Date(startValue);
  start.setHours(start.getHours() + 1);

  return toInputDateTime(start);
}

function getMaxEndDateTime(startValue: string) {
  if (!startValue) return "";

  const start = new Date(startValue);
  start.setHours(start.getHours() + 6);

  return toInputDateTime(start);
}

function getDurationInHours(startValue: string | Date, endValue: string | Date) {
  const start = new Date(startValue);
  const end = new Date(endValue);

  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function getSafeCalendarEndDate(start: Date, originalEnd: Date) {
  const startDate = getLocalDateKey(start);
  const endDate = getLocalDateKey(originalEnd);

  const durationHours =
    (originalEnd.getTime() - start.getTime()) / (1000 * 60 * 60);

  const isInvalidDuration = durationHours <= 0 || durationHours > 6;
  const isDifferentDay = startDate !== endDate;

  if (isDifferentDay || isInvalidDuration) {
    const safeEnd = new Date(start);
    safeEnd.setHours(start.getHours() + 1);
    return safeEnd;
  }

  return originalEnd;
}

function formatDateTime(value: string | Date) {
  if (!value) return "-";

  return new Date(value).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventType(tipo: string) {
  return (
    EVENT_TYPES.find((item) => item.value === tipo?.toUpperCase()) ||
    EVENT_TYPES.find((item) => item.value === "OTRO")!
  );
}

function formatTipoEvento(tipo: string) {
  return getEventType(tipo).label;
}

function getTipoEventoColor(tipo: string) {
  return getEventType(tipo).badgeClass;
}

function DetailRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="grid gap-1 rounded-xl border border-slate-200 bg-white px-4 py-3 md:grid-cols-3 md:gap-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div
        className={`md:col-span-2 ${
          muted
            ? "text-sm leading-6 text-slate-600"
            : "text-sm font-semibold text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
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
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [selectedEvent, setSelectedEvent] = useState<AgendaEvento | null>(null);

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
    return items.map((i) => {
      const start = new Date(i.fechaInicio);
      const originalEnd = new Date(i.fechaFin);
      const safeEnd = getSafeCalendarEndDate(start, originalEnd);

      return {
        id: i.id,
        title: formatTipoEvento(i.tipoEvento),
        start,
        end: safeEnd,
        allDay: false,
        resource: i,
      };
    });
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

    if (!isSameDate(form.fechaInicio, form.fechaFin)) {
      showAlert(
        "Validación",
        "La fecha de fin debe ser el mismo día que la fecha de inicio.",
        "error"
      );
      return;
    }

    if (fin <= inicio) {
      showAlert(
        "Validación",
        "La hora de fin debe ser mayor que la hora de inicio.",
        "error"
      );
      return;
    }

    const duracionHoras = getDurationInHours(form.fechaInicio, form.fechaFin);

    if (duracionHoras > 6) {
      showAlert(
        "Validación",
        "El evento no puede durar más de 6 horas.",
        "error"
      );
      return;
    }

    const payload = {
      ...form,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      clienteId: Number(form.clienteId),
    };

    setSaving(true);

    try {
      await agendaApi.create(payload);

      showAlert("Ok", "Evento registrado correctamente.", "success");

      setOpen(false);
      setForm(initialForm);
      await load();
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo guardar el evento.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSelectSlot = ({ start }: { start: Date; end: Date }) => {
    const fechaInicio = toInputDateTime(start);
    const fechaFin = getDefaultEndDateTime(fechaInicio);

    setForm({
      ...initialForm,
      fechaInicio,
      fechaFin,
    });

    setOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event.resource);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const eventType = getEventType(event.resource.tipoEvento);

    return {
      style: {
        backgroundColor: eventType.color,
        borderRadius: "8px",
        border: "none",
        color: "white",
        padding: "2px 6px",
        fontSize: "11px",
        fontWeight: 700,
        boxShadow: "0 2px 6px rgba(15, 23, 42, 0.18)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: "100%",
      },
    };
  };

  return (
    <div>
      <SectionHeader
        title="Agenda"
        subtitle="Programa reuniones, pagos, cobros y seguimientos."
        action={
          <button
            className="btn-primary"
            disabled={loading || saving}
            onClick={handleNewEvent}
          >
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
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Leyenda de eventos
                </h3>
                <p className="text-xs text-slate-500">
                  Cada color representa un tipo de actividad programada.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {items.length} evento(s)
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {EVENT_TYPES.map((type) => (
                <div
                  key={type.value}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
                >
                  <span
                    className="h-3 w-3 rounded-full shadow-sm"
                    style={{ backgroundColor: type.color }}
                  />
                  <span>{type.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-[380px]">
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
              Cliente relacionado al evento programado.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tipo de evento <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              value={form.tipoEvento}
              disabled={saving}
              onChange={(e) => setForm({ ...form, tipoEvento: e.target.value })}
              required
            >
              <option value="">Selecciona tipo de evento</option>

              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-slate-500">
              Clasifica el evento para identificarlo por color en el calendario.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Título del evento <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              placeholder="Ejemplo: Reunión de avance con cliente"
              value={form.titulo}
              disabled={saving}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Nombre corto que se mostrará solo en el detalle del evento.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Descripción
            </label>

            <textarea
              className="input min-h-[110px]"
              placeholder="Detalle breve del evento"
              value={form.descripcion}
              disabled={saving}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
            />

            <p className="mt-1 text-xs text-slate-500">
              Agrega información útil sobre la reunión, pago, entrega o
              seguimiento.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Fecha y hora de inicio <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              type="datetime-local"
              value={form.fechaInicio}
              disabled={saving}
              onChange={(e) => {
                const fechaInicio = e.target.value;

                setForm({
                  ...form,
                  fechaInicio,
                  fechaFin: getDefaultEndDateTime(fechaInicio),
                });
              }}
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Al elegir el inicio, la hora de fin se calcula automáticamente con
              una duración inicial de 1 hora.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Fecha y hora de fin <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              type="datetime-local"
              value={form.fechaFin}
              disabled={saving || !form.fechaInicio}
              min={form.fechaInicio || undefined}
              max={
                form.fechaInicio
                  ? getMaxEndDateTime(form.fechaInicio)
                  : undefined
              }
              onChange={(e) => {
                const fechaFin = e.target.value;

                if (!form.fechaInicio) {
                  showAlert(
                    "Validación",
                    "Primero debes seleccionar la fecha y hora de inicio.",
                    "error"
                  );
                  return;
                }

                if (!isSameDate(form.fechaInicio, fechaFin)) {
                  showAlert(
                    "Validación",
                    "La fecha de fin debe ser el mismo día que la fecha de inicio.",
                    "error"
                  );
                  return;
                }

                const inicio = new Date(form.fechaInicio);
                const fin = new Date(fechaFin);

                if (fin <= inicio) {
                  showAlert(
                    "Validación",
                    "La hora de fin debe ser mayor que la hora de inicio.",
                    "error"
                  );
                  return;
                }

                const duracionHoras = getDurationInHours(
                  form.fechaInicio,
                  fechaFin
                );

                if (duracionHoras > 6) {
                  showAlert(
                    "Validación",
                    "El evento no puede durar más de 6 horas.",
                    "error"
                  );
                  return;
                }

                setForm({
                  ...form,
                  fechaFin,
                });
              }}
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Debe ser el mismo día del inicio y no puede superar 6 horas de
              duración.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <div>
                <div className="font-semibold text-slate-800">
                  Activar recordatorio
                </div>
                <div className="text-xs font-normal text-slate-500">
                  Marca esta opción si deseas identificar el evento como
                  recordatorio.
                </div>
              </div>

              <input
                type="checkbox"
                className="h-5 w-5"
                checked={form.recordatorioActivo}
                disabled={saving}
                onChange={(e) =>
                  setForm({ ...form, recordatorioActivo: e.target.checked })
                }
              />
            </label>
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

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${getTipoEventoColor(
                      selectedEvent.tipoEvento
                    )}`}
                  >
                    {formatTipoEvento(selectedEvent.tipoEvento)}
                  </span>

                  <h2 className="mt-3 text-2xl font-bold text-slate-900">
                    {selectedEvent.titulo || "Detalle del evento"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Información completa del evento programado en la agenda.
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                  onClick={() => setSelectedEvent(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 px-6 py-5">
              <DetailRow
                label="Cliente"
                value={selectedEvent.clienteNombre || "-"}
              />

              <DetailRow
                label="Tipo de evento"
                value={formatTipoEvento(selectedEvent.tipoEvento)}
              />

              <DetailRow
                label="Fecha inicio real"
                value={formatDateTime(selectedEvent.fechaInicio)}
              />

              <DetailRow
                label="Fecha fin real"
                value={formatDateTime(selectedEvent.fechaFin)}
              />

              <DetailRow
                label="Duración real"
                value={`${getDurationInHours(
                  selectedEvent.fechaInicio,
                  selectedEvent.fechaFin
                ).toFixed(1)} hora(s)`}
              />

              <DetailRow
                label="Recordatorio"
                value={
                  selectedEvent.recordatorioActivo ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      No activo
                    </span>
                  )
                }
              />

              <DetailRow
                label="Descripción"
                muted
                value={
                  selectedEvent.descripcion?.trim()
                    ? selectedEvent.descripcion
                    : "Sin descripción registrada."
                }
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setSelectedEvent(null)}
              >
                Cerrar
              </button>

              <button
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                onClick={() => setSelectedEvent(null)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}