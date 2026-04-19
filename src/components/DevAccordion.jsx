import { useState } from "react";
import TicketRow from "./TicketRow";

// Listas de equipo (sincronizadas con v1.js)
const EQUIPO_DEV = ["Jairo Proaño", "Jerson Andino", "Mateo Congo", "Erick Ramírez", "Fabio Enríquez"];
const EQUIPO_QA = ["Diego Rosales", "Samuel López", "ALEXANDER ANDAGOYA", "Ana Cristina Catucuamba"];

function loadStyle(horas) {
  if (horas > 32) return { badge: "bg-red-100 text-red-700", bar: "bg-red-500" };
  if (horas >= 16) return { badge: "bg-yellow-100 text-yellow-700", bar: "bg-yellow-400" };
  return { badge: "bg-green-100 text-green-700", bar: "bg-green-500" };
}

function DevCard({ nombre, tickets, onUpdate }) {
  const [open, setOpen] = useState(true);
  const totalHoras = tickets.reduce((s, t) => s + (t.horas || 0), 0);
  const style = loadStyle(totalHoras);

  // Ordenar por prioridad dentro de la tarjeta
  const sorted = [...tickets].sort((a, b) => a.priorityOrder - b.priorityOrder);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-4 overflow-hidden">
      {/* Header de la tarjeta */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left">
        <div className="flex items-center gap-3">
          <span className="text-slate-300 text-sm">{open ? "▼" : "▶"}</span>
          <span className="font-semibold text-slate-800 text-sm">👤 {nombre}</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
          </span>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-bold ${style.badge}`}>Carga: {totalHoras}h</span>
      </button>

      {/* Lista de tickets */}
      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {sorted.map((t) => (
            <TicketRow key={t.key} ticket={t} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DevAccordion({ tickets, onUpdate }) {
  const devMap = {};
  const qaMap = {};

  for (const ticket of tickets) {
    const name = ticket.assignee;
    const st = ticket.status.toLowerCase();

    if (EQUIPO_QA.includes(name) || st.includes("operativas") || st.includes("pruebas")) {
      if (!qaMap[name]) qaMap[name] = [];
      qaMap[name].push(ticket);
    } else {
      if (!devMap[name]) devMap[name] = [];
      devMap[name].push(ticket);
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <p className="text-5xl mb-4">📭</p>
        <p className="text-lg font-medium">No hay tickets activos en este sprint</p>
        <p className="text-sm mt-1">Presiona "Sincronizar Jira" para cargar los datos.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── ÁREA DESARROLLO ── */}
      {Object.keys(devMap).length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b-2 border-blue-100 pb-2 mb-4 flex items-center gap-2">
            <span>🚀</span> Área Desarrollo
          </h2>
          {Object.entries(devMap).map(([nombre, tks]) => (
            <DevCard key={nombre} nombre={nombre} tickets={tks} onUpdate={onUpdate} />
          ))}
        </section>
      )}

      {/* ── ÁREA QA / OPS ── */}
      {Object.keys(qaMap).length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b-2 border-purple-100 pb-2 mb-4 flex items-center gap-2">
            <span>🧪</span> Área Pruebas (QA / Ops)
          </h2>
          {Object.entries(qaMap).map(([nombre, tks]) => (
            <DevCard key={nombre} nombre={nombre} tickets={tks} onUpdate={onUpdate} />
          ))}
        </section>
      )}
    </div>
  );
}
