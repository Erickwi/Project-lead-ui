import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import DevAccordion from "../components/DevAccordion";
import DeployDrawer from "../components/DeployDrawer";
import ReleaseNotes from "../components/ReleaseNotes";
import DeployNotificationModal from "../components/DeployNotificationModal";
import ServerUpdateModal from "../components/ServerUpdateModal";
import { useTickets } from "../hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { tickets, doneTickets, loading, error, refetch, updateTicketInfo, updateDeployStatus } = useTickets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [relNotesOpen, setRelNotesOpen] = useState(false);
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
    <div className="flex h-screen overflow-hidden bg-muted/30 font-sans">
      {/* ── Sidebar izquierdo ── */}
      <Sidebar />

      {/* ── Área principal ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-background border-b px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold tracking-tight">📊 Centro de Mando — Project Lead</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sprint: Versión 3.10.6.1 stable · Proyecto Ecomex 360
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Contador activos */}
            {!loading && !error && (
              <Badge variant="secondary" className="rounded-full text-xs">
                {tickets.length} activos
              </Badge>
            )}
            {/* Contador finalizados */}
            {!loading && !error && doneTickets.length > 0 && (
              <Badge variant="outline" className="rounded-full text-xs text-muted-foreground">
                {doneTickets.length} finalizados
              </Badge>
            )}

            {/* Sincronizar */}
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="text-sm">
              {syncing ? "⏳ Sincronizando..." : "🔄 Sincronizar Jira"}
            </Button>

            {/* Release Notes */}
            <Button variant="outline" size="sm" onClick={() => setRelNotesOpen(true)} className="text-sm font-medium">
              📝 Release Notes
            </Button>

            {/* Actualización Servidor */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setServerUpdateOpen(true)}
              className="text-sm font-medium">
              🖥️ Actualización Servidor
            </Button>

            {/* Cambios Jira (notificaciones) */}
            <Button variant="outline" size="sm" onClick={() => setChangesOpen(true)} className="text-sm font-medium">
              🔔 Cambios {ticketChanges.length > 0 && `(${ticketChanges.length})`}
            </Button>

            {/* Plan de Despliegue */}
            <Button size="sm" onClick={() => setDrawerOpen(true)} className="font-bold shadow-sm">
              📅 Plan de Despliegue
            </Button>
          </div>
        </header>

        {/* Contenido scrollable */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          {/* Estado de carga */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <div className="text-4xl mb-4 animate-spin">⚙️</div>
              <p className="text-base font-medium">Conectando con Jira...</p>
              <p className="text-sm mt-1">Cargando tickets del sprint activo</p>
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
              doneTickets={doneTickets}
              onUpdate={updateTicketInfo}
              onUpdateDeployStatus={updateDeployStatus}
              onOpenDeployModal={() => setDeployModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* ── Drawer lateral ── */}
      <DeployDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onOpenServerUpdate={openServerUpdateWith} />

      {/* ── Modal Release Notes ── */}
      <ReleaseNotes open={relNotesOpen} onClose={() => setRelNotesOpen(false)} />

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
    </div>
  );
}
