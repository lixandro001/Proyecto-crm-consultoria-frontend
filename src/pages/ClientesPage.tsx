import { useEffect, useMemo, useState } from "react";
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
    ciclo: 0,
  };

  const [items, setItems] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 6;

  const { showAlert } = useAlert();

  const ciclos = Array.from({ length: 12 }, (_, i) => i + 1);

  const onlyNumbers = (value: string) => value.replace(/\D/g, "");

  const onlyAlphaNumeric = (value: string) =>
    value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const getDocumentoMaxLength = (tipo: string) => {
    switch (tipo) {
      case "DNI":
        return 8;
      case "RUC":
        return 11;
      case "CE":
        return 12;
      default:
        return 15;
    }
  };

  const formatDocumentoValue = (tipo: string, value: string) => {
    const maxLength = getDocumentoMaxLength(tipo);

    if (tipo === "CE") {
      return onlyAlphaNumeric(value).slice(0, maxLength);
    }

    return onlyNumbers(value).slice(0, maxLength);
  };

  const validateDocumento = (tipo: string, numero: string) => {
    if (tipo === "DNI") {
      return /^\d{8}$/.test(numero);
    }

    if (tipo === "RUC") {
      return /^\d{11}$/.test(numero);
    }

    if (tipo === "CE") {
      return /^[A-Z0-9]{1,12}$/.test(numero);
    }

    return numero.trim().length > 0;
  };

  const validateTelefono = (telefono: string) => {
    return /^9\d{8}$/.test(telefono);
  };

  const validateEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return items;

    return items.filter((cliente) => {
      const fullName = `${cliente.nombres || ""} ${cliente.apellidos || ""}`;
      const documento = `${cliente.documentoTipo || ""} ${cliente.documentoNumero || ""}`;

      const searchText = [
        fullName,
        documento,
        cliente.telefono || "",
        cliente.email || "",
        cliente.direccion || "",
        cliente.estadoCliente || "",
        cliente.universidad || "",
        cliente.carrera || "",
        cliente.ciclo?.toString() || "",
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
      const r = await clientesApi.list();
      setItems(r.data);
      setCurrentPage(1);
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message ||
          "No se pudo cargar la lista de clientes.",
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

    if (!form.nombres.trim()) {
      showAlert("Validación", "Debes ingresar los nombres del cliente.", "error");
      return;
    }

    if (!form.apellidos.trim()) {
      showAlert(
        "Validación",
        "Debes ingresar los apellidos del cliente.",
        "error"
      );
      return;
    }

    if (!form.documentoTipo.trim()) {
      showAlert(
        "Validación",
        "Debes seleccionar el tipo de documento.",
        "error"
      );
      return;
    }

    if (!form.documentoNumero.trim()) {
      showAlert(
        "Validación",
        "Debes ingresar el número de documento.",
        "error"
      );
      return;
    }

    if (!validateDocumento(form.documentoTipo, form.documentoNumero)) {
      const mensaje =
        form.documentoTipo === "DNI"
          ? "El DNI debe tener exactamente 8 dígitos."
          : form.documentoTipo === "RUC"
          ? "El RUC debe tener exactamente 11 dígitos."
          : "El Carnet de Extranjería debe tener máximo 12 caracteres alfanuméricos.";

      showAlert("Validación", mensaje, "error");
      return;
    }

    if (!form.telefono.trim()) {
      showAlert("Validación", "Debes ingresar el celular del cliente.", "error");
      return;
    }

    if (!validateTelefono(form.telefono)) {
      showAlert(
        "Validación",
        "El celular debe tener 9 dígitos y empezar con 9.",
        "error"
      );
      return;
    }

    if (form.email && !validateEmail(form.email)) {
      showAlert(
        "Validación",
        "Debes ingresar un correo válido. Ejemplo: cliente@gmail.com",
        "error"
      );
      return;
    }

    if (!form.carrera.trim()) {
      showAlert(
        "Validación",
        "Debes ingresar la carrera profesional.",
        "error"
      );
      return;
    }

    if (!form.universidad.trim()) {
      showAlert(
        "Validación",
        "Debes ingresar la universidad o instituto.",
        "error"
      );
      return;
    }

    if (!form.ciclo || Number(form.ciclo) <= 0) {
      showAlert(
        "Validación",
        "Debes seleccionar el ciclo académico.",
        "error"
      );
      return;
    }

    const payload = {
      ...form,
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      documentoTipo: form.documentoTipo.trim(),
      documentoNumero: form.documentoNumero.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      direccion: form.direccion.trim(),
      carrera: form.carrera.trim(),
      universidad: form.universidad.trim(),
      ciclo: Number(form.ciclo),
    };

    setSaving(true);

    try {
      form.id
        ? await clientesApi.update(form.id, payload)
        : await clientesApi.create(payload);

      showAlert(
        "Ok",
        form.id ? "Cliente actualizado." : "Cliente registrado.",
        "success"
      );

      setOpen(false);
      setForm(initial);
      await load();
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || "No se pudo guardar.",
        "error"
      );
    } finally {
      setSaving(false);
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
            disabled={loading || saving}
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
        <>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Buscar clientes
                </h3>
                <p className="text-xs text-slate-500">
                  Filtra por nombre, documento, celular, correo, universidad,
                  carrera o estado.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 md:w-[420px] md:flex-row">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  
                  </span>
                  <input
                    className="input pl-10"
                    placeholder="Buscar..."
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
              cliente(s).
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState message="No se encontraron clientes con ese criterio de búsqueda." />
          ) : (
            <TableWrapper>
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] text-sm">
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
                    {paginatedItems.map((i) => (
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

                        <td className="px-4 py-3">{i.estadoCliente}</td>

                        <td className="px-4 py-3">
                          {formatDate(i.fechaRegistro)}
                        </td>

                        <td className="px-4 py-3">{i.universidad || "-"}</td>

                        <td className="px-4 py-3">{i.carrera || "-"}</td>

                        <td className="px-4 py-3">{i.ciclo || "-"}</td>

                        <td className="px-4 py-3">
                          <button
                            className="btn-secondary"
                            disabled={saving}
                            onClick={() => {
                              setForm({
                                ...i,
                                telefono: i.telefono || "",
                                email: i.email || "",
                                direccion: i.direccion || "",
                                carrera: i.carrera || "",
                                universidad: i.universidad || "",
                                ciclo: i.ciclo || 0,
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
                  clientes
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
        title={form.id ? "Editar cliente" : "Nuevo cliente"}
        onClose={() => {
          if (!saving) {
            setOpen(false);
            setForm(initial);
          }
        }}
      >
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nombres <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="Ejemplo: Edwin Lixandro"
              value={form.nombres}
              disabled={saving}
              onChange={(e) => setForm({ ...form, nombres: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Apellidos <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="Ejemplo: Gómez Rincón"
              value={form.apellidos}
              disabled={saving}
              onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tipo de documento <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              value={form.documentoTipo}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  documentoTipo: e.target.value,
                  documentoNumero: "",
                })
              }
              required
            >
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
              <option value="CE">Carnet de Extranjería</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Número de documento <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              type="text"
              inputMode={form.documentoTipo === "CE" ? "text" : "numeric"}
              maxLength={getDocumentoMaxLength(form.documentoTipo)}
              placeholder={
                form.documentoTipo === "DNI"
                  ? "Ejemplo: 70123456"
                  : form.documentoTipo === "RUC"
                  ? "Ejemplo: 20601234567"
                  : "Ejemplo: 000123456789"
              }
              value={form.documentoNumero}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  documentoNumero: formatDocumentoValue(
                    form.documentoTipo,
                    e.target.value
                  ),
                })
              }
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              {form.documentoTipo === "DNI"
                ? "El DNI debe tener 8 dígitos numéricos."
                : form.documentoTipo === "RUC"
                ? "El RUC debe tener 11 dígitos numéricos."
                : "El Carnet de Extranjería permite hasta 12 caracteres alfanuméricos."}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Celular <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              maxLength={9}
              placeholder="Ejemplo: 987654321"
              value={form.telefono}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  telefono: onlyNumbers(e.target.value).slice(0, 9),
                })
              }
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Ingresa un celular de 9 dígitos. Debe iniciar con 9.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Correo electrónico
            </label>
            <input
              className="input"
              type="email"
              placeholder="Ejemplo: cliente@gmail.com"
              value={form.email}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value.trim(),
                })
              }
            />
            <p className="mt-1 text-xs text-slate-500">
              Campo opcional. Ingresa un correo válido para contactar al cliente.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Carrera profesional <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="Ejemplo: Ingeniería Civil"
              value={form.carrera}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  carrera: e.target.value,
                })
              }
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Universidad / Instituto <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="Ejemplo: Universidad Nacional Mayor de San Marcos"
              value={form.universidad}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  universidad: e.target.value,
                })
              }
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Ciclo académico <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              value={form.ciclo}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  ciclo: Number(e.target.value),
                })
              }
              required
            >
              <option value={0}>Seleccionar ciclo</option>

              {ciclos.map((n) => (
                <option key={n} value={n}>
                  {n}° Ciclo
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Dirección
            </label>
            <input
              className="input"
              placeholder="Ejemplo: Av. Los Próceres 123"
              value={form.direccion}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  direccion: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Estado del cliente
            </label>
            <select
              className="input"
              value={form.estadoCliente}
              disabled={saving}
              onChange={(e) =>
                setForm({
                  ...form,
                  estadoCliente: e.target.value,
                })
              }
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="POTENCIAL">POTENCIAL</option>
              <option value="INACTIVO">INACTIVO</option>
              <option value="BLOQUEADO">BLOQUEADO</option>
            </select>
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