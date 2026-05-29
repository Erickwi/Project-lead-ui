import { useEffect, useState, useRef } from "react";
import { useAppData } from "../context/AppDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

function SprintTicketRow({ ticket, tag }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/30 transition-colors">
      <span className="text-lg flex-shrink-0">{tag === "moved" ? "🔀" : "✅"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://${import.meta.env.VITE_JIRA_DOMAIN || "tu-dominio.atlassian.net"}/browse/${ticket.key}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-blue-600 hover:underline flex-shrink-0">
            {ticket.key}
          </a>
          <span className="text-sm truncate text-navy-700">{ticket.summary}</span>
          {ticket.sprint && (
            <Badge variant="outline" className="text-xs text-blue-400/60 border-blue-200 bg-blue-50/50 hidden sm:inline-flex">
              {ticket.sprint}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-blue-400/70">{ticket.assignee}</span>
          {ticket.servidor && (
            <Badge variant="outline" className="text-xs flex-shrink-0 border-blue-200 text-blue-500 bg-blue-50/50">
              🖥️ {ticket.servidor}
            </Badge>
          )}
          {ticket.cliente_nombre && (
            <>
              <span className="text-xs text-blue-300/50">·</span>
              <span className="text-xs text-blue-400/70">🏢 {ticket.cliente_nombre}</span>
            </>
          )}
          {ticket.priority && (
            <>
              <span className="text-xs text-blue-300/50">·</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  ticket.priority === "Highest" || ticket.priority === "High"
                    ? "text-red-500"
                    : ticket.priority === "Medium"
                      ? "text-amber-600"
                      : "text-emerald-600",
                )}>
                {ticket.priority}
              </span>
            </>
          )}
        </div>
      </div>
      <Badge variant="secondary" className="text-xs flex-shrink-0 bg-blue-50 text-blue-600 border-blue-200">
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
        className="w-full flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 h-auto hover:bg-blue-50/40 rounded-lg mb-2 text-left">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="shrink-0">{icon}</span>
          <span className="font-semibold text-sm truncate text-navy-800">{title}</span>
          {queryError ? (
            <Badge className="text-xs rounded-full bg-red-50 text-red-600 border-red-200 shrink-0">Error JQL</Badge>
          ) : (
            <Badge className={cn("text-xs rounded-full shrink-0", badgeClass)}>{tickets.length}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showCopy && !queryError && tickets.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleCopy}
              onKeyDown={(e) => e.key === "Enter" && handleCopy(e)}
              className="text-xs px-2 py-0.5 rounded border border-blue-200 bg-white hover:bg-blue-50 transition-colors cursor-pointer select-none whitespace-nowrap text-blue-600">
              {copied ? "✅ Copiado" : "📋 Copiar IDs"}
            </span>
          )}
          <span className={`text-blue-300/50 text-xs transition-transform ${open ? "rotate-180" : ""}`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </span>
        </div>
      </Button>

      {open && (
        <Card className="navy-card overflow-hidden animate-fade-in">
          {queryError ? (
            <div className="px-4 py-4 space-y-1">
              <p className="text-sm font-medium text-red-600">⚠️ Error en la consulta Jira</p>
              <p className="text-xs text-blue-400/60 font-mono break-all">{queryError}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-blue-400/60">{emptyMsg}</div>
          ) : (
            <CardContent className="p-0">
              <div className="divide-y divide-blue-50">
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

function DoneByDateBlock({ title, grouped, emptyMsg }) {
  const [openMonths, setOpenMonths] = useState({});
  const [openDates, setOpenDates] = useState({});

  const toggleMonth = (k) => setOpenMonths((s) => ({ ...s, [k]: !s[k] }));
  const toggleDate = (d) => setOpenDates((s) => ({ ...s, [d]: !s[d] }));

  const groupByMonth = (grp) => {
    if (!grp || grp.length === 0) return [];
    const months = {};
    for (const g of grp) {
      const date = g.date;
      if (!date || date === "Sin fecha") {
        months["Sin fecha"] = months["Sin fecha"] || { label: "Sin fecha", dates: [] };
        months["Sin fecha"].dates.push(g);
        continue;
      }
      const d = new Date(date + "T00:00:00");
      if (isNaN(d)) {
        months["Sin fecha"] = months["Sin fecha"] || { label: "Sin fecha", dates: [] };
        months["Sin fecha"].dates.push(g);
        continue;
      }
      const monthKey = d.toISOString().slice(0, 7);
      const label = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(d);
      months[monthKey] = months[monthKey] || { label: label.charAt(0).toUpperCase() + label.slice(1), dates: [] };
      months[monthKey].dates.push(g);
    }
    return Object.entries(months)
      .map(([k, v]) => ({
        key: k,
        label: v.label,
        dates: v.dates.toSorted((a, b) => b.date.localeCompare(a.date)),
      }))
      .toSorted((a, b) => b.key.localeCompare(a.key));
  };

  const monthList = groupByMonth(grouped);

  if (!grouped || grouped.length === 0) {
    return (
      <div className="mb-5">
        <div className="font-semibold text-sm text-navy-800 mb-2">{title}</div>
        <div className="px-4 py-6 text-center text-sm text-blue-400/60">{emptyMsg}</div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <div className="font-semibold text-sm text-navy-800 mb-2">{title}</div>
      <div className="space-y-4">
        {monthList.map((m) => (
          <div key={m.key}>
            <Card className="navy-card p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-blue-100/50">
                <div className="text-sm font-semibold text-navy-700">{m.label}</div>
                <Button size="sm" variant="ghost" onClick={() => toggleMonth(m.key)}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                  {openMonths[m.key] ? "Ocultar" : `Ver (${m.dates.reduce((s, d) => s + d.items.length, 0)})`}
                </Button>
              </div>
              {openMonths[m.key] && (
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {m.dates.map((g) => (
                      <Card key={g.date} className="p-0 border-0 rounded-none shadow-none">
                        <div className="flex items-center justify-between px-4 py-2 bg-blue-50/20 border-b border-blue-50">
                          <div className="text-xs font-semibold text-blue-500">{g.date}</div>
                          <Button size="sm" variant="ghost" onClick={() => toggleDate(g.date)}
                            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                            {openDates[g.date] ? "Ocultar" : `Ver (${g.items.length})`}
                          </Button>
                        </div>
                        {openDates[g.date] && (
                          <CardContent className="p-0">
                            <div className="divide-y divide-blue-50">
                              {g.items.map((t) => (
                                <div key={t.key}>
                                  <SprintTicketRow ticket={t} tag="done" />
                                  {t.doneChange && <DoneChangeInfo doneChange={t.doneChange} />}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoneChangeInfo({ doneChange }) {
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    setDateStr(new Date(doneChange.created).toLocaleString());
  }, [doneChange.created]);
  return (
    <div className="px-6 pb-3 text-xs text-blue-400/60">
      <div>Estado: {doneChange.from} · {doneChange.to}</div>
      <div suppressHydrationWarning>Fecha cambio: {dateStr}</div>
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
    sprintDone306Grouped,
    sprintDone307Grouped,
  } = useAppData();

  const { sprintDone306Title, sprintDone307Title } = useAppData();
  const { currentSprintTitle } = useAppData();

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
      <div className="flex items-center gap-3 mb-4">
        <div className="size-7 rounded-full bg-amber-100 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-600">
            <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
          </svg>
        </div>
        <h2 className="section-title">Análisis de Versiones</h2>
        <Separator className="flex-1 bg-blue-100/50" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || sprintAnalysisLoading}
          className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50">
          {refreshing || sprintAnalysisLoading ? "⏳" : "🔄"}
          <span className="hidden sm:inline ml-1">Actualizar</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSectionOpen((o) => !o)}
          className="text-xs text-blue-400/60 hover:text-blue-600">
          {sectionOpen ? "Ocultar ▲" : "Mostrar ▼"}
        </Button>
      </div>

      {!sectionOpen ? null : sprintAnalysisLoading ? (
        <div className="flex items-center justify-center h-24 text-blue-400/60 gap-3">
          <RefreshCw size={20} className="animate-spin text-blue-400" />
          <span className="text-sm">Cargando análisis de versiones...</span>
        </div>
      ) : sprintAnalysisError ? (
        <div className="navy-card border-red-200/80 bg-red-50/50 px-4 py-3 text-sm text-red-600">
          ⚠️ Error al cargar: {sprintAnalysisError}
        </div>
      ) : notConfigured ? (
        <div className="navy-card border-dashed border-blue-200 px-5 py-4 text-sm text-blue-400/60 space-y-2">
          <p className="font-semibold text-navy-700">
            ⚙️ Configura las variables de entorno para activar esta sección
          </p>
          <p>
            Agrega las siguientes variables al archivo <code className="bg-blue-50 text-blue-600 px-1 rounded font-mono">.env</code> del backend:
          </p>
          <pre className="bg-navy-900 text-blue-100 border border-navy-700 rounded p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
            {`JIRA_JQL_MOVED="project = TU_PROYECTO AND sprint = \\"3.10.6.1 stable\\" AND sprint was \\"3.10.7\\""
JIRA_JQL_DONE_306="project = TU_PROYECTO AND sprint = \\"3.10.6.1 stable\\" AND statusCategory = Done ORDER BY priority ASC"
JIRA_JQL_DONE_307="project = TU_PROYECTO AND sprint = \\"3.10.7\\" AND statusCategory = Done ORDER BY priority ASC"`}
          </pre>
        </div>
      ) : (
        <>
          {sprintConfigured.moved && (
            <CollapsibleBlock
              title="Movidos de 3.10.7 a Stable"
              icon="🔀"
              tickets={sprintMovedTickets}
              tag="moved"
              emptyMsg="No se encontraron tickets movidos de 3.10.7 al sprint stable."
              badgeClass="bg-blue-50 text-blue-600 border-blue-200"
              queryError={sprintQueryErrors?.moved}
              showCopy
            />
          )}

          {sprintConfigured.done306 && (
            <DoneByDateBlock
              title={sprintDone306Title || (currentSprintTitle
                ? `Finalizados - ${currentSprintTitle.replace(/^Sprint:\s*/i, "").split("·")[0].trim()}`
                : "Finalizados - 3.10.6 Stable")}
              grouped={sprintDone306 && sprintDone306.length ? sprintDone306Grouped : []}
              emptyMsg={
                sprintDone306Title
                  ? `No hay tickets finalizados en ${sprintDone306Title}.`
                  : currentSprintTitle
                    ? `No hay tickets finalizados en ${currentSprintTitle.replace(/^Sprint:\s*/i, "").split("·")[0].trim()}.`
                    : "No hay tickets finalizados en el sprint 3.10.6 stable."
              }
            />
          )}

          {sprintConfigured.done307 && (
            <DoneByDateBlock
              title={sprintDone307Title || "Finalizados - 3.10.7"}
              grouped={sprintDone307 && sprintDone307.length ? sprintDone307Grouped : []}
              emptyMsg={sprintDone307Title
                ? `No hay tickets finalizados en ${sprintDone307Title}.`
                : "No hay tickets finalizados en el sprint 3.10.7."}
            />
          )}
        </>
      )}
    </section>
  );
}
