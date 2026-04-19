import { useState, useEffect, useCallback } from "react";
import api from "../api/client";

const DIAS_ORDER = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sin día"];

export default function DeployDrawer({ open, onClose }) {
  const [plan, setPlan] = useState({});
  const [loading, setLoading] = useState(false);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/deploy-plan");
      setPlan(data.plan || {});
    } catch (err) {
      console.error("Error cargando plan de despliegue:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar cuando se abre el drawer
  useEffect(() => {
    if (open) loadPlan();
  }, [open, loadPlan]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const clientes = Object.keys(plan).sort();
  const hasData = clientes.length > 0;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel deslizante */}
      <aside
        className={`fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-label="Plan de Despliegue">
        {/* Header del drawer */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">📅 Plan de Despliegue</h2>
            <p className="text-blue-200 text-xs mt-0.5">Tickets agrupados por cliente y día</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadPlan}
              title="Recargar"
              className="text-blue-200 hover:text-white text-lg transition-colors">
              🔄
            </button>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white text-2xl leading-none transition-colors"
              aria-label="Cerrar">
              ✕
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-400 text-sm">Cargando plan...</p>
            </div>
          )}

          {!loading && !hasData && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center">
              <p className="text-4xl mb-3">🗓️</p>
              <p className="font-medium">Sin tickets asignados a clientes</p>
              <p className="text-sm mt-1 max-w-xs leading-relaxed">
                Abre cualquier ticket en la vista principal y asígnale un cliente y un día de despliegue.
              </p>
            </div>
          )}

          {!loading &&
            hasData &&
            clientes.map((cliente) => {
              const dias = plan[cliente];
              const totalTickets = Object.values(dias).reduce((s, arr) => s + arr.length, 0);
              return (
                <div key={cliente} className="mb-6">
                  {/* Cabecera cliente */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <h3 className="font-bold text-slate-800 text-sm flex-1">{cliente}</h3>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {totalTickets} ticket{totalTickets !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Días */}
                  {DIAS_ORDER.filter((d) => dias[d]).map((dia) => (
                    <div key={dia} className="mb-3 ml-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{dia}</p>
                      <div className="space-y-1.5">
                        {dias[dia].map((t) => (
                          <div
                            key={t.key}
                            className="flex items-center gap-2 bg-slate-50 hover:bg-blue-50 rounded-xl px-3 py-2 border border-slate-200 transition-colors">
                            <span className="text-blue-600 font-bold text-xs w-24 flex-shrink-0">{t.key}</span>
                            <span className="text-sm text-slate-700 flex-1 truncate" title={t.summary}>
                              {t.summary}
                            </span>
                            <span className="text-xs text-slate-400 flex-shrink-0">{t.assignee.split(" ")[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
        </div>
      </aside>
    </>
  );
}
