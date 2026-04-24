// import { useEffect, useState } from "react";
// import { agendaApi, clientesApi } from "../api/endpoints";
// import type { AgendaEvento, Cliente } from "../types/entities";
// import SectionHeader from "../components/ui/SectionHeader";
// import Loader from "../components/ui/Loader";
// import EmptyState from "../components/ui/EmptyState";
// import TableWrapper from "../components/ui/TableWrapper";
// import FormModal from "../components/ui/FormModal";
// import { formatDateTime } from "../utils/format";
// import { useAlert } from "../context/AlertContext";

// export default function AgendaPage() {
//   const [items,setItems]=useState<AgendaEvento[]>([]);
//   const [clientes,setClientes]=useState<Cliente[]>([]);
//   const [loading,setLoading]=useState(true);
//   const [open,setOpen]=useState(false);
//   const [form,setForm]=useState({ clienteId:0, titulo:"", descripcion:"", fechaInicio:"", fechaFin:"", tipoEvento:"REUNION", recordatorioActivo:false });
//   const { showAlert } = useAlert();

//   const load = async()=>{ setLoading(true); try{ const [a,b]=await Promise.all([agendaApi.list(), clientesApi.list()]); setItems(a.data); setClientes(b.data);} finally{ setLoading(false);} };
//   useEffect(()=>{load();},[]);

//   const save = async(e:React.FormEvent)=>{ e.preventDefault(); try{ await agendaApi.create(form); showAlert("Ok","Evento registrado correctamente.","success"); setOpen(false); load(); } catch(err:any){ showAlert("Error", err?.response?.data?.message || "No se pudo guardar el evento.", "error"); } };

//   return <div><SectionHeader title="Agenda" subtitle="Programa reuniones, pagos, cobros y seguimientos." action={<button className="btn-primary" onClick={()=>setOpen(true)}>Nuevo evento</button>} />
//   {loading ? <Loader /> : items.length===0 ? <EmptyState message="No hay eventos en agenda." /> :
//   <TableWrapper><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Título</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Inicio</th><th className="px-4 py-3">Fin</th><th className="px-4 py-3">Recordatorio</th></tr></thead><tbody>{items.map(i => <tr key={i.id} className="border-t border-slate-200"><td className="px-4 py-3">{i.clienteNombre}</td><td className="px-4 py-3">{i.titulo}<br /><span className="text-xs text-slate-500">{i.descripcion || "-"}</span></td><td className="px-4 py-3">{i.tipoEvento}</td><td className="px-4 py-3">{formatDateTime(i.fechaInicio)}</td><td className="px-4 py-3">{formatDateTime(i.fechaFin)}</td><td className="px-4 py-3">{i.recordatorioActivo ? "Sí":"No"}</td></tr>)}</tbody></table></TableWrapper>}
//   <FormModal open={open} title="Nuevo evento" onClose={()=>setOpen(false)}><form onSubmit={save} className="grid gap-4 md:grid-cols-2"><select className="input" value={form.clienteId} onChange={e=>setForm({...form,clienteId:Number(e.target.value)})} required><option value={0}>Selecciona cliente</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}</select><select className="input" value={form.tipoEvento} onChange={e=>setForm({...form,tipoEvento:e.target.value})}><option>REUNION</option><option>PAGO</option><option>COBRO</option><option>ENTREGA</option><option>SEGUIMIENTO</option></select><input className="input md:col-span-2" placeholder="Título" value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} required /><textarea className="input md:col-span-2" placeholder="Descripción" value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} /><input className="input" type="datetime-local" value={form.fechaInicio} onChange={e=>setForm({...form,fechaInicio:e.target.value})} required /><input className="input" type="datetime-local" value={form.fechaFin} onChange={e=>setForm({...form,fechaFin:e.target.value})} required /><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.recordatorioActivo} onChange={e=>setForm({...form,recordatorioActivo:e.target.checked})} /> Activar recordatorio</label><div className="md:col-span-2 flex justify-end"><button className="btn-primary" type="submit">Guardar</button></div></form></FormModal></div>;
// }

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

const locales = {
  es,
};

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
  const [items, setItems] = useState<AgendaEvento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    clienteId: 0,
    titulo: "",
    descripcion: "",
    fechaInicio: "",
    fechaFin: "",
    tipoEvento: "REUNION",
    recordatorioActivo: false,
  });

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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await agendaApi.create(form);
      showAlert("Ok", "Evento registrado correctamente.", "success");

      setOpen(false);
      setForm({
        clienteId: 0,
        titulo: "",
        descripcion: "",
        fechaInicio: "",
        fechaFin: "",
        tipoEvento: "REUNION",
        recordatorioActivo: false,
      });

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
    setForm((prev) => ({
      ...prev,
      fechaInicio: toInputDateTime(start),
      fechaFin: toInputDateTime(end),
    }));

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

    let backgroundColor = "#2563eb"; // default azul

    if (tipo === "REUNION") backgroundColor = "#0f766e";
    if (tipo === "PAGO") backgroundColor = "#16a34a";
    if (tipo === "COBRO") backgroundColor = "#7c3aed";
    if (tipo === "ENTREGA") backgroundColor = "#ea580c";
    if (tipo === "SEGUIMIENTO") backgroundColor = "#0891b2";

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
          <button className="btn-primary" onClick={() => setOpen(true)}>
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
          {/* Leyenda */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-teal-700"></span>
                Reunión
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-600"></span>
                Pago
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-violet-700"></span>
                Cobro
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-600"></span>
                Entrega
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-cyan-600"></span>
                Seguimiento
              </span>
            </div>
          </div>

          {/* Calendario */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
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

      {/* Modal */}
      <FormModal open={open} title="Nuevo evento" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <select
            className="input"
            value={form.clienteId}
            onChange={(e) =>
              setForm({ ...form, clienteId: Number(e.target.value) })
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

          <select
            className="input"
            value={form.tipoEvento}
            onChange={(e) => setForm({ ...form, tipoEvento: e.target.value })}
          >
            <option value="REUNION">REUNION</option>
            <option value="PAGO">PAGO</option>
            <option value="COBRO">COBRO</option>
            <option value="ENTREGA">ENTREGA</option>
            <option value="SEGUIMIENTO">SEGUIMIENTO</option>
          </select>

          <input
            className="input md:col-span-2"
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            required
          />

          <textarea
            className="input md:col-span-2"
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />

          <input
            className="input"
            type="datetime-local"
            value={form.fechaInicio}
            onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            required
          />

          <input
            className="input"
            type="datetime-local"
            value={form.fechaFin}
            onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
            required
          />

          <label className="flex items-center gap-3 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.recordatorioActivo}
              onChange={(e) =>
                setForm({ ...form, recordatorioActivo: e.target.checked })
              }
            />
            Activar recordatorio
          </label>

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