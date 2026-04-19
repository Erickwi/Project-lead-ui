import { useState, useEffect } from "react";

const PRIORITY_BADGE = {
  Highest: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low: "bg-green-100 text-green-700 border-green-200",
  Lowest: "bg-slate-100 text-slate-500 border-slate-200",
};

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const JIRA_BASE = "https://qualitysoftec.atlassian.net/browse/";

export default function TicketRow({ ticket, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [cliente, setCliente] = useState(ticket.cliente_nombre || "");
  const [dia, setDia] = useState(ticket.dia_despliegue || "");

  // Sincronizar si el ticket cambia desde el padre (refetch / updateTicketInfo)
  useEffect(() => {
    setCliente(ticket.cliente_nombre || "");
    setDia(ticket.dia_despliegue || "");
  }, [ticket.cliente_nombre, ticket.dia_despliegue]);

  const persist = (newCliente, newDia) => {
    onUpdate(ticket.key, {
      cliente_nombre: newCliente,
      dia_despliegue: newDia,
      estado_entrega: ticket.estado_entrega,
    });
  };

  const handleBlurCliente = () => {
    if (cliente !== (ticket.cliente_nombre || "")) persist(cliente, dia);
  };

  const handleChangeDia = (e) => {
    const val = e.target.value;
    setDia(val);
    persist(cliente, val);
  };

  const badgeClass = PRIORITY_BADGE[ticket.priority] || PRIORITY_BADGE.Medium;

  const fechaDisplay = ticket.fechaFin
    ? new Date(ticket.fechaFin).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Sin fecha";

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* ── Fila clickeable ── */}
      <div
        className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors select-none"
        onClick={() => setOpen((o) => !o)}>
        {/* Caret */}
        <span className="text-slate-300 text-xs w-3 flex-shrink-0">{open ? "▼" : "▶"}</span>

        {/* Key + enlace Jira */}
        <a
          href={`${JIRA_BASE}${ticket.key}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 font-bold text-xs hover:underline w-28 flex-shrink-0">
          {ticket.key}
        </a>

        {/* Badge prioridad */}
        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${badgeClass}`}>
          {ticket.priority}
        </span>

        {/* Resumen */}
        <span className="flex-1 text-sm text-slate-700 truncate min-w-0" title={ticket.summary}>
          {ticket.summary}
        </span>

        {/* Fecha + urgencia */}
        <span
          className={`text-xs flex-shrink-0 ${
            ticket.esUrgente ? "text-red-600 font-bold animate-pulse" : "text-slate-400"
          }`}>
          {ticket.esUrgente && "🚨 "}
          {fechaDisplay}
        </span>

        {/* Comentarios */}
        {ticket.numComentarios > 0 && (
          <span
            className="flex-shrink-0 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 font-medium"
            onClick={(e) => e.stopPropagation()}
            title={`${ticket.numComentarios} comentarios`}>
            💬 {ticket.numComentarios}
          </span>
        )}

        {/* Horas */}
        <span className="text-xs text-slate-400 flex-shrink-0 w-10 text-right">{ticket.horas}h</span>
      </div>

      {/* ── Panel expandido ── */}
      {open && (
        <div className="px-6 pb-5 pt-3 bg-slate-50 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-5">
            {/* Revisores */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Revisores</p>
              <p className="text-sm text-slate-700 mb-1">
                <span className="text-slate-400">QA:</span> <span className="font-medium">{ticket.revInterno}</span>
              </p>
              <p className="text-sm text-slate-700">
                <span className="text-slate-400">Ops:</span> <span className="font-medium">{ticket.revOperativo}</span>
              </p>
            </div>

            {/* Despliegue */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Despliegue</p>
              <input
                type="text"
                placeholder="Nombre del cliente..."
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                onBlur={handleBlurCliente}
                onClick={(e) => e.stopPropagation()}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                value={dia}
                onChange={handleChangeDia}
                onClick={(e) => e.stopPropagation()}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                <option value="">Día de despliegue...</option>
                {DIAS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comentarios */}
          {ticket.comentarios.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                💬 Últimas observaciones
              </p>
              <div className="space-y-2">
                {ticket.comentarios.map((c, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">{c.autor}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(c.fecha).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{c.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
