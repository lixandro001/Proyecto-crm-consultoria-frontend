import { useEffect, useState } from "react";
import { clientesApi } from "../api/endpoints";
import type { Cliente } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { formatDate } from "../utils/format";
import { useAlert } from "../context/AlertContext";

export default function ClientesPage() {
  const initial = {
    id: 0,
    nombres: "",
    apellidos: "",
    documentoTipo: "DNI",
    documentoNumero: "",
    telefono: "",
    email: "",
    direccion: "",
    estadoCliente: "ACTIVO",
    carrera: "",
    universidad: "",
    ciclo: 0
  };

  const [items, setItems] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);

  const { showAlert } = useAlert();

  const ciclos = Array.from({ length: 12 }, (_, i) => i + 1);

  const load = async () => {
    setLoading(true);
    try {
      const r = await clientesApi.list();
      setItems(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      form.id
        ? await clientesApi.update(form.id, form)
        : await clientesApi.create(form);

      showAlert(
        "Ok",
        form.id ? "Cliente actualizado." : "Cliente registrado.",
        "success"
      );

      setOpen(false);
      setForm(initial);
      load();
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo guardar.",
        "error"
      );
    }
  };

  return (
    <div>
      <SectionHeader
        title="Clientes"
        subtitle="Registra clientes, datos personales y estado del cliente."
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setForm(initial);
              setOpen(true);
            }}
          >
            Nuevo cliente
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState message="No hay clientes registrados." />
      ) : (
        <TableWrapper>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Universidad</th>
                <th className="px-4 py-3">Carrera</th>
                <th className="px-4 py-3">Ciclo</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>

            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium">
                    {i.nombres} {i.apellidos}
                  </td>

                  <td className="px-4 py-3">
                    {i.documentoTipo} - {i.documentoNumero}
                  </td>

                  <td className="px-4 py-3">
                    {i.telefono || "-"}
                    <br />
                    {i.email || "-"}
                  </td>

                  <td className="px-4 py-3 max-w-xs truncate">
                    {i.direccion || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {i.estadoCliente}
                  </td>

                  <td className="px-4 py-3">
                    {formatDate(i.fechaRegistro)}
                  </td>

                  <td className="px-4 py-3">
                    {i.universidad || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {i.carrera || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {i.ciclo || "-"}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setForm({
                          ...i,
                          telefono: i.telefono || "",
                          email: i.email || "",
                          direccion: i.direccion || "",
                          carrera: i.carrera || "",
                          universidad: i.universidad || "",
                          ciclo: i.ciclo || 0
                        });

                        setOpen(true);
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}

      <FormModal
        open={open}
        title={form.id ? "Editar cliente" : "Nuevo cliente"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <input
            className="input"
            placeholder="Nombres"
            value={form.nombres}
            onChange={(e) =>
              setForm({ ...form, nombres: e.target.value })
            }
            required
          />

          <input
            className="input"
            placeholder="Apellidos"
            value={form.apellidos}
            onChange={(e) =>
              setForm({ ...form, apellidos: e.target.value })
            }
            required
          />

          <select
            className="input"
            value={form.documentoTipo}
            onChange={(e) =>
              setForm({
                ...form,
                documentoTipo: e.target.value
              })
            }
          >
            <option>DNI</option>
            <option>RUC</option>
            <option>CE</option>
          </select>

          <input
            className="input"
            placeholder="Número documento"
            value={form.documentoNumero}
            onChange={(e) =>
              setForm({
                ...form,
                documentoNumero: e.target.value
              })
            }
            required
          />

          <input
            className="input"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) =>
              setForm({
                ...form,
                telefono: e.target.value
              })
            }
          />

          <input
            className="input"
            placeholder="Correo"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
          />

          <input
            className="input"
            placeholder="Carrera"
            value={form.carrera}
            onChange={(e) =>
              setForm({
                ...form,
                carrera: e.target.value
              })
            }
          />

          <input
            className="input"
            placeholder="Universidad"
            value={form.universidad}
            onChange={(e) =>
              setForm({
                ...form,
                universidad: e.target.value
              })
            }
          />

          <select
            className="input"
            value={form.ciclo}
            onChange={(e) =>
              setForm({
                ...form,
                ciclo: Number(e.target.value)
              })
            }
          >
            <option value={0}>Seleccionar ciclo</option>

            {ciclos.map((n) => (
              <option key={n} value={n}>
                {n}° Ciclo
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="Dirección"
            value={form.direccion}
            onChange={(e) =>
              setForm({
                ...form,
                direccion: e.target.value
              })
            }
          />

          <select
            className="input"
            value={form.estadoCliente}
            onChange={(e) =>
              setForm({
                ...form,
                estadoCliente: e.target.value
              })
            }
          >
            <option>ACTIVO</option>
            <option>EN_PROCESO</option>
            <option>FINALIZADO</option>
            <option>INACTIVO</option>
          </select>

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