import { useEffect, useState, useCallback } from "react";
import api from "../api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen } from "lucide-react";

const DONE_RE = /done|cerrado|finalizado|completado/i;

const JIRA_BASE = import.meta.env.VITE_JIRA_DOMAIN ? `https://${import.meta.env.VITE_JIRA_DOMAIN}/browse` : null;

function ticketUrl(key) {
  return JIRA_BASE ? `${JIRA_BASE}/${key}` : null;
}

function StatusBadge({ status }) {
  const s = (status || "").toUpperCase();
  let cls = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ";
  if (DONE_RE.test(s) || s.includes("FINALIZADO")) cls += "bg-emerald-500 text-white";
  else if (s.includes("DESARROLLO") || s.includes("PROGRESS") || s.includes("IN PROGRESS"))
    cls += "bg-blue-500 text-white";
  else if (s.includes("REVIISION") || s.includes("REVISIÓN") || s.includes("REVIEW") || s.includes("QA"))
    cls += "bg-purple-500 text-white";
  else if (s.includes("BLOQUEADO") || s.includes("BLOCKED")) cls += "bg-red-500 text-white";
  else if (s.includes("ELIMINADO") || s.includes("DUPLICADO")) cls += "bg-zinc-500 text-white";
  else cls += "bg-amber-500 text-white";
  return <span className={cls}>{status}</span>;
}

function PriorityBadge({ priority }) {
  const p = (priority || "").toLowerCase();
  let cls = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ";
  if (p.includes("highest") || p.includes("blocker") || p.includes("critical") || p.includes("high"))
    cls += "bg-red-600 text-white";
  else if (p.includes("medium") || p.includes("med")) cls += "bg-amber-500 text-white";
  else if (p.includes("low") || p.includes("lowest")) cls += "bg-emerald-500 text-white";
  else cls += "bg-zinc-600 text-white";
  return <span className={cls}>{priority || "—"}</span>;
}
export default function SprintProgressFrederick({ sidebarOpen, setSidebarOpen }) {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [sprintName, setSprintName] = useState("Desarrollos pasantía Frederick");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/tickets/sprint-frederick");
      setTickets(res.data.tickets || []);
      if (res.data.sprintName) setSprintName(res.data.sprintName);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = tickets.length;
  const finished = tickets.filter((t) => DONE_RE.test(t.status || "")).length;
  const percent = total ? Math.round((finished / total) * 100) : 0;

  const PRIORITY_ORDER = { highest: 0, blocker: 0, critical: 1, high: 2, medium: 3, low: 4, lowest: 5 };
  const sortedTickets = [...tickets].sort((a, b) => {
    const pa = PRIORITY_ORDER[(a.priority || "").toLowerCase()] ?? 99;
    const pb = PRIORITY_ORDER[(b.priority || "").toLowerCase()] ?? 99;
    return pa - pb;
  });

  const byStatus = {};
  for (const t of tickets) {
    const s = t.status || "Sin estado";
    byStatus[s] = (byStatus[s] || 0) + 1;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header móvil con botón sidebar — fuera del scroll para evitar rebotes */}
      <header className="bg-background border-b px-4 py-3 flex items-center gap-3 lg:hidden flex-shrink-0">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Abrir panel"
          className="h-8 w-8 bg-primary/10 hover:bg-primary/20 text-primary rounded-md shadow-sm ring-1 ring-primary/25 flex items-center justify-center flex-shrink-0">
          <PanelLeftOpen size={16} />
        </button>
        <h1 className="text-base font-bold tracking-tight truncate">🏃 Sprint Frederick</h1>
      </header>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">Sprint: {sprintName}</h1>
          <Button onClick={load} disabled={loading}>
            {loading ? "⏳ Cargando..." : "Sincronizar"}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-900/40 border border-red-700 text-sm text-red-300">
            <strong>Error:</strong> {error}
            {error.toLowerCase().includes("sprint") && (
              <p className="mt-1 text-xs text-red-400">
                Verifica que <code>JIRA_SPRINT_FREDERICK</code> en el <code>.env</code> del backend coincida exactamente
                con el nombre del sprint en Jira.
              </p>
            )}
          </div>
        )}

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground">Avance</p>
                <p className="text-2xl font-extrabold">{percent}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Finalizados</p>
                <p className="text-xl font-semibold">
                  {finished} / {total}
                </p>
              </div>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden mt-4">
              <div
                className="h-3 transition-all"
                style={{
                  width: `${percent}%`,
                  background: `linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {loading && <p className="text-sm text-zinc-500 text-center py-8">Cargando tickets desde Jira...</p>}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold mb-2">Estados</h2>
                {Object.keys(byStatus).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No se encontraron tickets en este sprint.</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(byStatus).map(([st, cnt]) => (
                      <li key={st} className="flex items-center justify-between">
                        <StatusBadge status={st} />
                        <span className="text-sm font-semibold">{cnt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold mb-2">Tickets ({total})</h2>
                <div className="max-h-96 overflow-auto">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="border-b border-zinc-700 text-xs text-muted-foreground">
                          <th className="text-left py-1 pr-3 font-medium whitespace-nowrap">Ticket</th>
                          <th className="text-left py-1 pr-3 font-medium">Título</th>
                          <th className="text-left py-1 pr-3 font-medium whitespace-nowrap">Asignado</th>
                          <th className="text-left py-1 pr-3 font-medium whitespace-nowrap">Prioridad</th>
                          <th className="text-left py-1 font-medium whitespace-nowrap">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {sortedTickets.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-muted-foreground">
                              Sin tickets.
                            </td>
                          </tr>
                        )}
                        {sortedTickets.map((t) => (
                          <tr key={t.key || t.id} className="hover:bg-zinc-800/40">
                            <td className="py-2 pr-3 font-medium whitespace-nowrap">
                              {ticketUrl(t.key) ? (
                                <a
                                  href={ticketUrl(t.key)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline text-primary">
                                  {t.key}
                                </a>
                              ) : (
                                <span>{t.key}</span>
                              )}
                            </td>
                            <td className="py-2 pr-3">{t.summary || "Sin título"}</td>
                            <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted-foreground">
                              {t.assignee || "—"}
                            </td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              <PriorityBadge priority={t.priority} />
                            </td>
                            <td className="py-2 whitespace-nowrap">
                              <StatusBadge status={t.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
