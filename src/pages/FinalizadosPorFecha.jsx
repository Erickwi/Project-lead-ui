import { useEffect, useState, useMemo } from "react";
import { useAppData } from "../context/AppDataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelLeftOpen, Package } from "lucide-react";

function TicketRowSimple({ t }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a
            href={`https://${import.meta.env.VITE_JIRA_DOMAIN || "qualitysoftec.atlassian.net"}/browse/${t.key}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
            {t.key}
          </a>
          <span className="text-sm truncate text-navy-800">{t.summary}</span>
        </div>
        <div className="text-xs text-blue-400/70 mt-1 flex items-center gap-2">
          <span>{t.assignee}</span>
          {t.cliente_nombre && <span>· 🏢 {t.cliente_nombre}</span>}
          {t.servidor && (
            <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-500 bg-blue-50/50">
              🖥️ {t.servidor}
            </Badge>
          )}
          <span>· {t.priority}</span>
        </div>
      </div>
      <div className="text-xs text-blue-400/60 font-medium">{t.status}</div>
    </div>
  );
}

function DateDisplay({ isoString }) {
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    setDateStr(new Date(isoString).toLocaleString());
  }, [isoString]);
  return <span suppressHydrationWarning>{dateStr}</span>;
}

const EMPTY_TICKETS_ARRAY = [];

const MONTH_FORMATTER = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });

function RenderGroups({ title, groups, expandedMonth, expandedDate, toggleMonth, toggleDate, loading }) {
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
      const label = MONTH_FORMATTER.format(d);
      months[monthKey] = months[monthKey] || { label: label.charAt(0).toUpperCase() + label.slice(1), dates: [] };
      months[monthKey].dates.push(g);
    }
    return Object.entries(months)
      .map(([k, v]) => ({ key: k, label: v.label, dates: v.dates.toSorted((a, b) => b.date.localeCompare(a.date)) }))
      .toSorted((a, b) => b.key.localeCompare(a.key));
  };

  const months = groupByMonth(groups);

  if (loading) {
    return (
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">{title}</h3>
        <div className="space-y-3">
          <Card className="navy-card p-3">
            <Skeleton className="h-5 w-1/3 bg-blue-100/50 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-12 bg-blue-100/50 rounded-lg" />
              <Skeleton className="h-12 bg-blue-100/50 rounded-lg" />
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>
        </svg>
        {title}
      </h3>
      {!months || months.length === 0 ? (
        <div className="text-sm text-blue-400/60">No hay elementos.</div>
      ) : (
        <div className="space-y-3">
          {months.map((m) => (
            <div key={m.key}>
              <Card className="navy-card p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-blue-100/50">
                  <div className="text-sm font-semibold text-navy-700">{m.label}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleMonth(m.key)}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                    {expandedMonth[m.key] ? "Ocultar" : `Ver (${m.dates.reduce((s, d) => s + d.items.length, 0)})`}
                  </Button>
                </div>
                {expandedMonth[m.key] && (
                  <CardContent className="p-0">
                    <div className="space-y-1">
                      {m.dates.map((g) => (
                        <Card key={g.date} className="p-0 border-0 rounded-none shadow-none">
                          <div className="flex items-center justify-between px-4 py-2 bg-blue-50/20 border-b border-blue-50">
                            <div className="text-xs font-semibold text-blue-500">{g.date}</div>
                            <Button size="sm" variant="ghost" onClick={() => toggleDate(g.date)}
                              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                              {expandedDate[g.date] ? "Ocultar" : `Ver (${g.items.length})`}
                            </Button>
                          </div>
                          {expandedDate[g.date] && (
                            <CardContent className="p-0">
                              <div className="divide-y divide-blue-50">
                                {g.items.map((t) => (
                                  <div key={t.key}>
                                    <TicketRowSimple t={t} />
                                    {t.doneChange && (
                                      <div className="px-6 pb-3 text-xs text-blue-400/60 flex items-center gap-2">
                                        <div>
                                          Estado: {t.doneChange.from} · {t.doneChange.to} ·{" "}
                                          <DateDisplay isoString={t.doneChange.created} />
                                        </div>
                                        {t.doneChange.author && (
                                          <Badge variant="destructive" className="ml-2 bg-red-500 text-white text-[10px]">
                                            {t.doneChange.author}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
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
      )}
    </section>
  );
}

export default function FinalizadosPorFecha({ sidebarOpen, setSidebarOpen }) {
  const { fetchSprintAnalysis, sprintDone306Grouped, sprintDone307Grouped, sprintAnalysisLoading } = useAppData();
  const { sprintDone306Title, sprintDone307Title } = useAppData();
  const [expandedMonth, setExpandedMonth] = useState({});
  const [expandedDate, setExpandedDate] = useState({});

  useEffect(() => {
    fetchSprintAnalysis();
  }, [fetchSprintAnalysis]);

  const toggleMonth = (key) => setExpandedMonth((s) => ({ ...s, [key]: !s[key] }));
  const toggleDate = (key) => setExpandedDate((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="page-header flex-shrink-0">
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Abrir panel"
            className="lg:hidden size-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0">
            <PanelLeftOpen size={16} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-heading navy-gradient-text">Finalizados por Fecha</h1>
            <p className="text-[10px] text-blue-400/60 font-medium tracking-wider uppercase">Tickets completados</p>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        <RenderGroups
          title={sprintDone306Title || "Finalizados — 3.10.6 Stable"}
          groups={sprintDone306Grouped}
          expandedMonth={expandedMonth}
          expandedDate={expandedDate}
          toggleMonth={toggleMonth}
          toggleDate={toggleDate}
          loading={sprintAnalysisLoading}
        />
        <RenderGroups
          title={sprintDone307Title || "Finalizados — 3.10.7"}
          groups={sprintDone307Grouped}
          expandedMonth={expandedMonth}
          expandedDate={expandedDate}
          toggleMonth={toggleMonth}
          toggleDate={toggleDate}
          loading={sprintAnalysisLoading}
        />
      </div>
    </div>
  );
}
