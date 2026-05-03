import { useState, useEffect, useRef } from "react";
import DevAccordion from "../components/DevAccordion";
import DeployDrawer from "../components/DeployDrawer";
import DeployNotificationModal from "../components/DeployNotificationModal";
import ServerUpdateModal from "../components/ServerUpdateModal";
import { useTickets } from "../hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { PanelLeftOpen } from "lucide-react";

export default function Dashboard({ sidebarOpen, setSidebarOpen }) {
  const { tickets, doneTickets, loading, error, refetch, updateTicketInfo, updateDeployStatus } = useTickets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Release Notes removed per UX request
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

  // Open Server Update modal with provided tickets
  const openServerUpdateWith = (tickets) => {
    setServerUpdateTickets(tickets || []);
    setServerUpdateOpen(true);
  };

  // Detect changes between ticket fetches (status/assignee/summary)
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
        {/* ── Área principal ── */}
        {/* Top bar */}
        <header className="bg-background border-b px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-x-4 flex-shrink-0 shadow-sm">
          <div className="min-w-0 flex-1">
            <div className="flex items-center">
              {/* Mobile toggle: show to the left of the title on small screens and only when sidebar is closed */}
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir panel"
                  className="mr-3 lg:hidden h-8 w-8 bg-primary/10 hover:bg-primary/20 text-primary rounded-md shadow-sm ring-1 ring-primary/25 flex items-center justify-center">
                  <PanelLeftOpen size={16} />
                </button>
              )}
              <h1 className="text-base sm:text-xl font-bold tracking-tight leading-tight flex items-center">
                📊 Centro de Mando — Project Lead
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Sprint: Versión 3.10.6.1 stable · Proyecto Ecomex 360
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Contador activos */}
            {!loading && !error && (
              <Badge variant="secondary" className="rounded-full text-xs whitespace-nowrap">
                {tickets.length} activos
              </Badge>
            )}
            {/* Contador finalizados - link a página dedicada */}
            {!loading && !error && doneTickets.length > 0 && (
              <Badge variant="outline" className="rounded-full text-xs text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = '/finalizados'}>
                {doneTickets.length} finalizados →
              </Badge>
            )}

            {/* Sincronizar */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="text-xs sm:text-sm whitespace-nowrap">
              {syncing ? (
                "⏳ Sincronizando..."
              ) : (
                <>
                  <span>🔄</span>
                  <span className="hidden sm:inline"> Sincronizar Jira</span>
                </>
              )}
            </Button>

            {/* Actualización Servidor */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setServerUpdateOpen(true)}
              className="text-xs sm:text-sm font-medium whitespace-nowrap">
              <span>🖥️</span>
              <span className="hidden sm:inline"> Actualización Servidor</span>
            </Button>

            {/* Cambios Jira (notificaciones) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChangesOpen(true)}
              className="text-xs sm:text-sm font-medium whitespace-nowrap">
              🔔<span className="hidden sm:inline"> Cambios</span>
              {ticketChanges.length > 0 && ` (${ticketChanges.length})`}
            </Button>

            {/* Plan de Despliegue */}
            <Button
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="font-bold shadow-sm text-xs sm:text-sm whitespace-nowrap">
              <span>📅</span>
              <span className="hidden sm:inline"> Plan de Despliegue</span>
            </Button>
          </div>
        </header>

        {/* Contenido scrollable */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5">
          {/* Estado de carga: Skeleton */}
          {loading && (
            <div className="space-y-4">
              {/* Header skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-7 w-72" />
                <Skeleton className="h-4 w-96" />
              </div>

              {/* Stats bars */}
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-32 rounded-full" />
              </div>

              {/* Dev cards skeleton */}
              <div className="space-y-3 mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-16 ml-auto rounded-full" />
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="flex items-center gap-3">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 flex-1" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error de conexión */}
          {!loading && error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-destructive text-2xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-bold text-destructive">Error al conectar con el backend</p>
                  <p className="text-sm text-destructive/80 mt-1 font-mono break-all">{error}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Asegúrate de que el backend esté corriendo en <code>localhost:3001</code> y el archivo{" "}
                    <code>.env</code> esté configurado correctamente.
                  </p>
                  <Button variant="link" onClick={handleSync} className="mt-2 p-0 h-auto text-sm font-bold">
                    Reintentar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Vista principal de tickets */}
          {!loading && !error && (
              <DevAccordion
                tickets={tickets}
                onUpdate={updateTicketInfo}
                onUpdateDeployStatus={updateDeployStatus}
                onOpenDeployModal={() => setDeployModalOpen(true)}
              />
          )}
        </main>
      </div>

      {/* ── Drawer lateral ── */}
      <DeployDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onOpenServerUpdate={openServerUpdateWith} />

      {/* Release Notes modal removed */}

      {/* ── Modal Gestión de Despliegues ── */}
      <DeployNotificationModal
        open={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        tickets={doneTickets}
        onUpdateStatus={updateDeployStatus}
      />

      {/* ── Modal Actualización Servidor ── */}
      <ServerUpdateModal
        open={serverUpdateOpen}
        onClose={() => setServerUpdateOpen(false)}
        doneTickets={serverUpdateTickets.length ? serverUpdateTickets : doneTickets}
      />

      {/* ── Modal Cambios/Notificaciones ── */}
      <DeployNotificationModal
        open={changesOpen}
        onClose={() => setChangesOpen(false)}
        tickets={ticketChanges}
        onUpdateStatus={() => {}}
      />
    </>
  );
}
