import { useEffect, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TicketRowSimple({ t }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a
            href={`https://${import.meta.env.VITE_JIRA_DOMAIN || "tu-dominio.atlassian.net"}/browse/${t.key}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-primary hover:underline">
            {t.key}
          </a>
          <span className="text-sm truncate">{t.summary}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {t.assignee} {t.cliente_nombre ? `· 🏢 ${t.cliente_nombre}` : ""} · {t.priority}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{t.status}</div>
    </div>
  );
}

export default function FinalizadosPorFecha() {
  const { fetchSprintAnalysis, sprintDone306Grouped, sprintDone307Grouped, sprintAnalysisLoading } = useAppData();
  const [expandedMonth, setExpandedMonth] = useState({});
  const [expandedDate, setExpandedDate] = useState({});

  useEffect(() => {
    fetchSprintAnalysis();
  }, [fetchSprintAnalysis]);

  const toggleMonth = (key) => setExpandedMonth((s) => ({ ...s, [key]: !s[key] }));
  const toggleDate = (key) => setExpandedDate((s) => ({ ...s, [key]: !s[key] }));

  const groupByMonth = (groups) => {
    if (!groups || groups.length === 0) return [];
    const months = {};
    for (const g of groups) {
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
      const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
      const label = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(d);
      months[monthKey] = months[monthKey] || { label: label.charAt(0).toUpperCase() + label.slice(1), dates: [] };
      months[monthKey].dates.push(g);
    }
    return Object.entries(months)
      .map(([k, v]) => ({ key: k, label: v.label, dates: v.dates.sort((a, b) => b.date.localeCompare(a.date)) }))
      .sort((a, b) => b.key.localeCompare(a.key));
  };

  const RenderGroups = ({ title, groups }) => {
    const months = groupByMonth(groups);
    if (sprintAnalysisLoading) {
      return (
        <section className="mb-6">
          <h3 className="text-sm font-semibold mb-3">{title}</h3>
          <div className="space-y-3">
            <Card className="p-3">
              <Skeleton className="h-5 w-1/3 bg-slate-200 dark:bg-zinc-700 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-12 bg-slate-200 dark:bg-zinc-700" />
                <Skeleton className="h-12 bg-slate-200 dark:bg-zinc-700" />
              </div>
            </Card>
            <Card className="p-3">
              <Skeleton className="h-5 w-1/3 bg-slate-200 dark:bg-zinc-700 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-12 bg-slate-200 dark:bg-zinc-700" />
                <Skeleton className="h-12 bg-slate-200 dark:bg-zinc-700" />
              </div>
            </Card>
          </div>
        </section>
      );
    }

    return (
      <section className="mb-6">
        <h3 className="text-sm font-semibold mb-3">{title}</h3>
        {!months || months.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay elementos.</div>
        ) : (
          <div className="space-y-3">
            {months.map((m) => (
              <div key={m.key}>
                <Card className="mb-2 p-0">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/10">
                    <div className="text-sm font-medium">{m.label}</div>
                    <Button size="sm" variant="ghost" onClick={() => toggleMonth(m.key)}>
                      {expandedMonth[m.key] ? "Ocultar" : `Ver (${m.dates.reduce((s, d) => s + d.items.length, 0)})`}
                    </Button>
                  </div>
                  {expandedMonth[m.key] && (
                    <CardContent className="p-0">
                      <div className="space-y-2">
                        {m.dates.map((g) => (
                          <Card key={g.date} className="p-0">
                            <div className="flex items-center justify-between px-4 py-2 bg-muted/20">
                              <div className="text-xs font-medium">{g.date}</div>
                              <Button size="sm" variant="ghost" onClick={() => toggleDate(g.date)}>
                                {expandedDate[g.date] ? "Ocultar" : `Ver (${g.items.length})`}
                              </Button>
                            </div>
                            {expandedDate[g.date] && (
                              <CardContent className="p-0">
                                <div className="divide-y">
                                  {g.items.map((t) => (
                                    <div key={t.key}>
                                      <TicketRowSimple t={t} />
                                      {t.doneChange && (
                                        <div className="px-6 pb-3 text-xs text-muted-foreground">
                                          Estado: {t.doneChange.from} → {t.doneChange.to} ·{" "}
                                          {new Date(t.doneChange.created).toLocaleString()}
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
  };

  return (
    <div className="p-6 overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Finalizados por fecha</h2>
      <RenderGroups title="Finalizados — 3.10.6 Stable" groups={sprintDone306Grouped} />
      <RenderGroups title="Finalizados — 3.10.7" groups={sprintDone307Grouped} />
    </div>
  );
}
