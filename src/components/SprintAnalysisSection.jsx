import { useEffect, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function SprintTicketRow({ ticket, tag }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <span className="text-lg flex-shrink-0">{tag === "moved" ? "🔀" : "✅"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://${import.meta.env.VITE_JIRA_DOMAIN || "tu-dominio.atlassian.net"}/browse/${ticket.key}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-primary hover:underline flex-shrink-0">
            {ticket.key}
          </a>
          <span className="text-sm truncate">{ticket.summary}</span>
          {ticket.sprint && (
            <Badge variant="outline" className="text-xs text-muted-foreground hidden sm:inline-flex">
              {ticket.sprint}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">{ticket.assignee}</span>
          {ticket.cliente_nombre && (
            <>
              <span className="text-xs text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">🏢 {ticket.cliente_nombre}</span>
            </>
          )}
          {ticket.priority && (
            <>
              <span className="text-xs text-muted-foreground/40">·</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  ticket.priority === "Highest" || ticket.priority === "High"
                    ? "text-red-600"
                    : ticket.priority === "Medium"
                      ? "text-yellow-600"
                      : "text-green-600",
                )}>
                {ticket.priority}
              </span>
            </>
          )}
        </div>
      </div>
      <Badge variant="secondary" className="text-xs flex-shrink-0">
        {ticket.status}
      </Badge>
    </div>
  );
}

function CollapsibleBlock({ title, icon, tickets, tag, emptyMsg, badgeClass, queryError, showCopy }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    const text = tickets.map((t) => t.key.replace(/^[A-Z0-9]+-/, "")).join(", ");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mb-5">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 h-auto hover:bg-muted/40 rounded-lg mb-2 text-left">
        {/* Fila 1: icono + título + badge — siempre visible, ocupa todo el ancho disponible */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="shrink-0">{icon}</span>
          <span className="font-semibold text-sm truncate">{title}</span>
          {queryError ? (
            <Badge className="text-xs rounded-full bg-red-100 text-red-700 hover:bg-red-100 shrink-0">Error JQL</Badge>
          ) : (
            <Badge className={cn("text-xs rounded-full shrink-0", badgeClass)}>{tickets.length}</Badge>
          )}
        </div>
        {/* Fila 2 (o inline si hay espacio): botón copiar + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {showCopy && !queryError && tickets.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleCopy}
              onKeyDown={(e) => e.key === "Enter" && handleCopy(e)}
              className="text-xs px-2 py-0.5 rounded border border-border bg-background hover:bg-muted transition-colors cursor-pointer select-none whitespace-nowrap">
              {copied ? "✅ Copiado" : "📋 Copiar IDs"}
            </span>
          )}
          <span className="text-muted-foreground/50 text-xs">{open ? "▼" : "▶"}</span>
        </div>
      </Button>

      {open && (
        <Card className="overflow-hidden shadow-sm animate-in fade-in-0 slide-in-from-top-1 duration-150">
          {queryError ? (
            <div className="px-4 py-4 space-y-1">
              <p className="text-sm font-medium text-destructive">⚠️ Error en la consulta Jira</p>
              <p className="text-xs text-muted-foreground font-mono break-all">{queryError}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyMsg}</div>
          ) : (
            <CardContent className="p-0">
              <div className="divide-y">
                {tickets.map((t) => (
                  <SprintTicketRow key={t.key} ticket={t} tag={tag} />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

export default function SprintAnalysisSection() {
  const {
    sprintMovedTickets,
    sprintDone306,
    sprintDone307,
    sprintConfigured,
    sprintQueryErrors,
    sprintAnalysisLoading,
    sprintAnalysisError,
    fetchSprintAnalysis,
  } = useAppData();

  const [sectionOpen, setSectionOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSprintAnalysis();
  }, [fetchSprintAnalysis]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSprintAnalysis(true);
    setRefreshing(false);
  };

  const notConfigured = !sprintConfigured.moved && !sprintConfigured.done306 && !sprintConfigured.done307;

  return (
    <section className="mb-8">
      {/* ── Cabecera sección ── */}
      <div className="flex items-center gap-2 mb-4">
        <span>📊</span>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Análisis de Versiones</h2>
        <Separator className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || sprintAnalysisLoading}
          className="text-xs">
          {refreshing || sprintAnalysisLoading ? "⏳" : "🔄"}
          <span className="hidden sm:inline ml-1">Actualizar</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSectionOpen((o) => !o)}
          className="text-xs text-muted-foreground">
          {sectionOpen ? "Ocultar ▲" : "Mostrar ▼"}
        </Button>
      </div>

      {!sectionOpen ? null : sprintAnalysisLoading ? (
        <div className="flex items-center justify-center h-24 text-muted-foreground gap-3">
          <div className="text-2xl animate-pulse">📋</div>
          <span className="text-sm">Cargando análisis de versiones...</span>
        </div>
      ) : sprintAnalysisError ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
          ⚠️ Error al cargar: {sprintAnalysisError}
        </div>
      ) : notConfigured ? (
        <div className="bg-muted/50 border border-border rounded-xl px-5 py-4 text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">
            ⚙️ Configura las variables de entorno para activar esta sección
          </p>
          <p>
            Agrega las siguientes variables al archivo <code className="bg-muted px-1 rounded">.env</code> del backend:
          </p>
          <pre className="bg-background border rounded p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
            {`# Tickets movidos de 3.10.7 al sprint stable
JIRA_JQL_MOVED="project = TU_PROYECTO AND sprint = \\"3.10.6.1 stable\\" AND sprint was \\"3.10.7\\""

# Tickets finalizados en 3.10.6 stable
JIRA_JQL_DONE_306="project = TU_PROYECTO AND sprint = \\"3.10.6.1 stable\\" AND statusCategory = Done ORDER BY priority ASC"

# Tickets finalizados en 3.10.7
JIRA_JQL_DONE_307="project = TU_PROYECTO AND sprint = \\"3.10.7\\" AND statusCategory = Done ORDER BY priority ASC"`}
          </pre>
        </div>
      ) : (
        <>
          {/* Tickets movidos de 3.10.7 → stable */}
          {sprintConfigured.moved && (
            <CollapsibleBlock
              title="Movidos de 3.10.7 → Stable"
              icon="🔀"
              tickets={sprintMovedTickets}
              tag="moved"
              emptyMsg="No se encontraron tickets movidos de 3.10.7 al sprint stable."
              badgeClass="bg-blue-100 text-blue-700 hover:bg-blue-100"
              queryError={sprintQueryErrors?.moved}
              showCopy
            />
          )}

          {/* Finalizados 3.10.6 stable */}
          {sprintConfigured.done306 && (
            <CollapsibleBlock
              title="Finalizados — 3.10.6 Stable"
              icon="✅"
              tickets={sprintDone306}
              tag="done"
              emptyMsg="No hay tickets finalizados en el sprint 3.10.6 stable."
              badgeClass="bg-green-100 text-green-700 hover:bg-green-100"
              queryError={sprintQueryErrors?.done306}
              showCopy
            />
          )}

          {/* Finalizados 3.10.7 */}
          {sprintConfigured.done307 && (
            <CollapsibleBlock
              title="Finalizados — 3.10.7"
              icon="🏁"
              tickets={sprintDone307}
              tag="done"
              emptyMsg="No hay tickets finalizados en el sprint 3.10.7."
              badgeClass="bg-purple-100 text-purple-700 hover:bg-purple-100"
              queryError={sprintQueryErrors?.done307}
              showCopy
            />
          )}
        </>
      )}
    </section>
  );
}
