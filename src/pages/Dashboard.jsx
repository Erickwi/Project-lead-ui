import { useState } from "react";
import Sidebar from "../components/Sidebar";
import DevAccordion from "../components/DevAccordion";
import DeployDrawer from "../components/DeployDrawer";
import ReleaseNotes from "../components/ReleaseNotes";
import { useTickets } from "../hooks/useTickets";

export default function Dashboard() {
  const { tickets, loading, error, refetch, updateTicketInfo } = useTickets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [relNotesOpen, setRelNotesOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await refetch();
    setSyncing(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* ── Sidebar izquierdo ── */}
      <Sidebar />

      {/* ── Área principal ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">📊 Centro de Mando — Project Lead</h1>
            <p className="text-xs text-slate-400 mt-0.5">Sprint: Versión 3.10.6.1 stable · Proyecto Ecomex 360</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Contador */}
            {!loading && !error && (
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                {tickets.length} tickets activos
              </span>
            )}

            {/* Sincronizar */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="text-sm text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {syncing ? "⏳ Sincronizando..." : "🔄 Sincronizar Jira"}
            </button>

            {/* Release Notes */}
            <button
              onClick={() => setRelNotesOpen(true)}
              className="text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl transition-colors">
              📝 Release Notes
            </button>

            {/* Plan de Despliegue */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-1.5 rounded-xl transition-colors shadow-sm">
              📅 Plan de Despliegue
            </button>
          </div>
        </header>

        {/* Contenido scrollable */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          {/* Estado de carga */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <div className="text-4xl mb-4 animate-spin">⚙️</div>
              <p className="text-base font-medium">Conectando con Jira...</p>
              <p className="text-sm mt-1">Cargando tickets del sprint activo</p>
            </div>
          )}

          {/* Error de conexión */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-2xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-bold text-red-800">Error al conectar con el backend</p>
                  <p className="text-sm text-red-600 mt-1 font-mono break-all">{error}</p>
                  <p className="text-xs text-red-500 mt-2">
                    Asegúrate de que el backend esté corriendo en <code>localhost:3001</code> y el archivo{" "}
                    <code>.env</code> esté configurado correctamente.
                  </p>
                  <button
                    onClick={handleSync}
                    className="mt-3 text-sm font-bold text-red-700 hover:text-red-900 underline">
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Vista principal de tickets */}
          {!loading && !error && <DevAccordion tickets={tickets} onUpdate={updateTicketInfo} />}
        </main>
      </div>

      {/* ── Drawer lateral ── */}
      <DeployDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ── Modal Release Notes ── */}
      <ReleaseNotes open={relNotesOpen} onClose={() => setRelNotesOpen(false)} />
    </div>
  );
}
