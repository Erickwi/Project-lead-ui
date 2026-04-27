import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import TicketRow from "./TicketRow";
import SprintAnalysisSection from "./SprintAnalysisSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Listas de equipo (sincronizadas con v1.js)
const EQUIPO_DEV = ["Jairo Proaño", "Jerson Andino", "Mateo Congo", "Erick Ramírez", "Fabio Enríquez"];
const EQUIPO_QA = ["Diego Rosales", "Samuel López", "ALEXANDER ANDAGOYA", "Ana Cristina Catucuamba"];

function loadStyle(horas) {
  if (horas > 32) return { badge: "bg-red-100 text-red-700 hover:bg-red-100", bar: "bg-red-500" };
  if (horas >= 16) return { badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100", bar: "bg-yellow-400" };
  return { badge: "bg-green-100 text-green-700 hover:bg-green-100", bar: "bg-green-500" };
}

function DevCard({ nombre, tickets, onUpdate }) {
  const [open, setOpen] = useState(true);
  const totalHoras = tickets.reduce((s, t) => s + (t.horas || 0), 0);
  const style = loadStyle(totalHoras);

  const sorted = [...tickets].sort((a, b) => a.priorityOrder - b.priorityOrder);
  const totalSubtasks = tickets.reduce((s, t) => s + (t.subtasks?.length || 0), 0);
  const totalItems = tickets.length + totalSubtasks;

  return (
    <Card className="mb-4 overflow-hidden shadow-sm">
      <CardHeader className="p-0">
        <Button
          variant="ghost"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 rounded-none h-auto text-left">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground/40 text-sm">{open ? "▼" : "▶"}</span>
            <span className="font-semibold text-sm">👤 {nombre}</span>
            <Badge variant="secondary" className="text-xs rounded-full">
              {totalItems} {totalItems === 1 ? "ticket" : "tickets"}
            </Badge>
          </div>
          <Badge className={cn("text-xs font-bold", style.badge)}>Carga: {totalHoras}h</Badge>
        </Button>
      </CardHeader>

      {open && (
        <CardContent className="p-0 border-t animate-in fade-in-0 slide-in-from-top-1 duration-150">
          <div className="divide-y">
            {sorted.map((t) => (
              <TicketRow key={t.key} ticket={t} onUpdate={onUpdate} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function deployStatusBadge(status) {
  if (status === "confirmado")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs">✓ Confirmado</Badge>
    );
  if (status === "notificado")
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs">⏳ Notificado</Badge>
    );
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Pendiente
    </Badge>
  );
}

export default function DevAccordion({ tickets, doneTickets = [], onUpdate, onUpdateDeployStatus, onOpenDeployModal }) {
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

  if (tickets.length === 0 && doneTickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
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
          <div className="flex items-center gap-2 mb-4">
            <span>🚀</span>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Área Desarrollo</h2>
            <Separator className="flex-1" />
          </div>
          {Object.entries(devMap).map(([nombre, tks]) => (
            <DevCard key={nombre} nombre={nombre} tickets={tks} onUpdate={onUpdate} />
          ))}
        </section>
      )}

      {/* ── ÁREA QA / OPS ── */}
      {Object.keys(qaMap).length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span>🧪</span>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Área Pruebas (QA / Ops)
            </h2>
            <Separator className="flex-1" />
          </div>
          {Object.entries(qaMap).map(([nombre, tks]) => (
            <DevCard key={nombre} nombre={nombre} tickets={tks} onUpdate={onUpdate} />
          ))}
        </section>
      )}

      {/* ── FINALIZADOS ── */}
      {doneTickets.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span>✅</span>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Finalizados</h2>
            <Separator className="flex-1" />
            <Button size="sm" onClick={onOpenDeployModal} className="text-xs">
              🚀 Gestionar despliegues
            </Button>
          </div>

          <Card className="overflow-hidden shadow-sm">
            <div className="divide-y">
              {doneTickets.map((t) => (
                <div key={t.key} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  {/* Status icon */}
                  <span className="text-lg flex-shrink-0">
                    {t.deploy_status === "confirmado" ? "✅" : t.deploy_status === "notificado" ? "⏳" : "🏁"}
                  </span>

                  {/* Key + summary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{t.key}</span>
                      <span className="text-sm truncate">{t.summary}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{t.assignee}</span>
                      {t.cliente_nombre && (
                        <>
                          <span className="text-xs text-muted-foreground/40">·</span>
                          <span className="text-xs text-muted-foreground">🏢 {t.cliente_nombre}</span>
                        </>
                      )}
                      {t.dia_despliegue &&
                        (() => {
                          const d = parseISO(t.dia_despliegue);
                          return isValid(d) ? (
                            <>
                              <span className="text-xs text-muted-foreground/40">·</span>
                              <span className="text-xs text-muted-foreground">
                                📅 {format(d, "d MMM", { locale: es })}
                              </span>
                            </>
                          ) : null;
                        })()}
                    </div>
                  </div>

                  {/* Deploy status badge */}
                  {deployStatusBadge(t.deploy_status)}
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* ── ANÁLISIS DE VERSIONES (movidos + finalizados por sprint) ── */}
      <SprintAnalysisSection />
    </div>
  );
}
