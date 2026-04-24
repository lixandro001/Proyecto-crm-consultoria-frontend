export const formatDate = (v?: string | null) => v ? new Date(v).toLocaleDateString("es-PE") : "-";
export const formatDateTime = (v?: string | null) => v ? new Date(v).toLocaleString("es-PE") : "-";
export const formatCurrency = (v?: number | null) => new Intl.NumberFormat("es-PE",{style:"currency",currency:"PEN"}).format(v ?? 0);
