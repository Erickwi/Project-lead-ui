import { useState, useEffect, useRef } from "react";
import { useAppData } from "../context/AppDataContext";
import DevAccordion from "../components/DevAccordion";
import DeployDrawer from "../components/DeployDrawer";
import DeployNotificationModal from "../components/DeployNotificationModal";
import ServerUpdateModal from "../components/ServerUpdateModal";
import { useTickets } from "../hooks/useTickets";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { PanelLeftOpen, RefreshCw, Bell, Server, ArrowUpRight, GitPullRequest } from "lucide-react";

export default function Dashboard({ sidebarOpen, setSidebarOpen }) {
  const { tickets, doneTickets, loading, error, refetch, updateTicketInfo, updateDeployStatus } = useTickets();
  const navigate = useNavigate();
  const { currentSprintTitle } = useAppData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [serverUpdateOpen, setServerUpdateOpen] = useState(false);
  const [serverUpdateTickets, setServerUpdateTickets] = useState([]);
  const [ticketChanges, setTicketChanges] = useState([]);
  const [changesOpen, setChangesOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await refetch();
    setSyncing(false);
  };

  const openServerUpdateWith = (tickets) => {
    setServerUpdateTickets(tickets || []);
    setServerUpdateOpen(true);
  };

  const prevTicketsRef = useRef([]);
  useEffect(() => {
    const prev = prevTicketsRef.current;
    if (prev.length > 0 && tickets.length > 0) {
      const prevMap = Object.fromEntries(prev.map((t) => [t.key, t]));
      const diffs = [];
      for (const t of tickets) {
        const p = prevMap[t.key];
        if (!p) continue;
        const changes = [];
        if (t.status !== p.status) changes.push(`Estado: ${p.status} → ${t.status}`);
        if (t.assignee !== p.assignee) changes.push(`Asignado: ${p.assignee} → ${t.assignee}`);
        if (t.summary !== p.summary) changes.push(`Resumen cambiado`);
        if (changes.length) diffs.push({ key: t.key, summary: t.summary, changes, cliente_nombre: t.cliente_nombre });
      }
      if (diffs.length) setTicketChanges((s) => [...diffs, ...s]);
    }
    prevTicketsRef.current = tickets;
  }, [tickets]);

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Page Header */}
        <header className="page-header flex-shrink-0">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  aria-label="Abrir panel"
                  className="lg:hidden size-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0"
                >
                  <PanelLeftOpen size={16} />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-heading navy-gradient-text">
                    Centro de Mando
                  </h1>
                  <p className="text-xs text-blue-400/80 mt-0.5 font-medium tracking-wide">
                    {currentSprintTitle || "Sprint: — · Proyecto Ecomex 360"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!loading && !error && (
                <Badge variant="secondary" className="badge-blue gap-1.5">
                  <span className="size-1.5 rounded-full bg-blue-500 animate-pulse-soft" />
                  {tickets.length} activos
                </Badge>
              )}
              {!loading && !error && doneTickets.length > 0 && (
                <Badge
                  variant="outline"
                  className="badge-green gap-1 cursor-pointer hover:bg-emerald-100/50 transition-colors"
                  onClick={() => navigate("/finalizados")}
                >
                  {doneTickets.length} finalizados
                  <ArrowUpRight size={10} />
                </Badge>
              )}

              <button
                onClick={handleSync}
                disabled={syncing}
                className="btn-ghost text-xs gap-1.5"
              >
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{syncing ? "Sincronizando..." : "Sincronizar"}</span>
              </button>

              <button
                onClick={() => setServerUpdateOpen(true)}
                className="btn-ghost text-xs gap-1.5"
              >
                <Server size={14} />
                <span className="hidden sm:inline">Servidor</span>
              </button>

              <button
                onClick={() => setChangesOpen(true)}
                className="btn-ghost text-xs gap-1.5 relative"
              >
                <Bell size={14} />
                {ticketChanges.length > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {ticketChanges.length}
                  </span>
                )}
                <span className="hidden sm:inline">Cambios</span>
              </button>

              <button
                onClick={() => setDrawerOpen(true)}
                className="btn-primary text-xs"
              >
                <GitPullRequest size={14} />
                <span className="hidden sm:inline">Plan de Despliegue</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Loading */}
          {loading && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-48 bg-blue-100/50" />
                <Skeleton className="h-4 w-64 bg-blue-100/50" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-7 w-24 rounded-full bg-blue-100/50" />
                <Skeleton className="h-7 w-32 rounded-full bg-blue-100/50" />
              </div>
              <div className="space-y-3 mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={`dev-skel-${i}`} className="navy-card overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 bg-blue-50/30">
                      <Skeleton className="size-9 rounded-full bg-blue-100/50" />
                      <Skeleton className="h-5 w-32 bg-blue-100/50" />
                      <Skeleton className="h-5 w-16 ml-auto rounded-full bg-blue-100/50" />
                    </div>
                    <div className="px-5 py-3 space-y-2 border-t border-blue-50">
                      {[1, 2, 3].map((j) => (
                        <div key={`dev-row-${i}-${j}`} className="flex items-center gap-3">
                          <Skeleton className="h-4 w-20 bg-blue-100/50" />
                          <Skeleton className="h-4 flex-1 bg-blue-100/50" />
                          <Skeleton className="h-5 w-16 rounded-full bg-blue-100/50" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="navy-card border-red-200/80 bg-red-50/50 p-6 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                    <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-800">Error al conectar con el backend</p>
                  <p className="text-sm text-red-600/80 mt-1 font-mono break-all">{error}</p>
                  <p className="text-xs text-blue-400/70 mt-2">
                    Asegúrate de que el backend esté corriendo en <code className="text-blue-600 font-mono">localhost:3001</code>.
                  </p>
                  <button onClick={handleSync} className="btn-ghost text-sm mt-2 p-0 h-auto font-semibold text-red-600 hover:text-red-700">
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main tickets view */}
          {!loading && !error && (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <DevAccordion
                tickets={tickets}
                onUpdate={updateTicketInfo}
                onUpdateDeployStatus={updateDeployStatus}
                onOpenDeployModal={() => setDeployModalOpen(true)}
              />
            </div>
          )}
        </main>
      </div>

      <DeployDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onOpenServerUpdate={openServerUpdateWith} />

      <DeployNotificationModal
        open={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        tickets={doneTickets}
        onUpdateStatus={updateDeployStatus}
      />

      <ServerUpdateModal
        open={serverUpdateOpen}
        onClose={() => setServerUpdateOpen(false)}
        doneTickets={serverUpdateTickets.length ? serverUpdateTickets : doneTickets}
      />

      <DeployNotificationModal
        open={changesOpen}
        onClose={() => setChangesOpen(false)}
        tickets={ticketChanges}
        onUpdateStatus={() => {}}
      />
    </>
  );
}
