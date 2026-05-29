import { useEffect, useState, useCallback } from "react";
import api from "../api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, Activity, RefreshCw } from "lucide-react";

const DONE_RE = /done|cerrado|finalizado|completado/i;

const JIRA_BASE = import.meta.env.VITE_JIRA_DOMAIN ? `https://${import.meta.env.VITE_JIRA_DOMAIN}/browse` : null;

function ticketUrl(key) {
  return JIRA_BASE ? `${JIRA_BASE}/${key}` : null;
}

function StatusBadge({ status }) {
  const s = (status || "").toUpperCase();
  let cls = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ";
  if (DONE_RE.test(s) || s.includes("FINALIZADO")) cls += "bg-emerald-500/20 text-emerald-600 border border-emerald-200";
  else if (s.includes("DESARROLLO") || s.includes("PROGRESS") || s.includes("IN PROGRESS"))
    cls += "bg-blue-500/20 text-blue-600 border border-blue-200";
  else if (s.includes("REVIISION") || s.includes("REVISIÓN") || s.includes("REVIEW") || s.includes("QA"))
    cls += "bg-purple-500/20 text-purple-600 border border-purple-200";
  else if (s.includes("BLOQUEADO") || s.includes("BLOCKED")) cls += "bg-red-500/20 text-red-600 border border-red-200";
  else if (s.includes("ELIMINADO") || s.includes("DUPLICADO")) cls += "bg-zinc-100 text-zinc-500 border border-zinc-200";
  else cls += "bg-amber-500/20 text-amber-600 border border-amber-200";
  return <span className={cls}>{status}</span>;
}

function PriorityBadge({ priority }) {
  const p = (priority || "").toLowerCase();
  let cls = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ";
  if (p.includes("highest") || p.includes("blocker") || p.includes("critical") || p.includes("high"))
    cls += "bg-red-50 text-red-600 border-red-200";
  else if (p.includes("medium") || p.includes("med")) cls += "bg-amber-50 text-amber-600 border-amber-200";
  else if (p.includes("low") || p.includes("lowest")) cls += "bg-emerald-50 text-emerald-600 border-emerald-200";
  else cls += "bg-blue-50 text-blue-500 border-blue-200";
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
  const sortedTickets = tickets.toSorted((a, b) => {
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
      <header className="page-header flex-shrink-0">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Abrir panel"
              className="lg:hidden size-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0">
              <PanelLeftOpen size={16} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-heading navy-gradient-text">Sprint Frederick</h1>
              <p className="text-[10px] text-blue-400/60 font-medium tracking-wider uppercase">{sprintName}</p>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="btn-outline text-xs">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {loading ? "Cargando..." : "Sincronizar"}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <strong>Error:</strong> {error}
            {error.toLowerCase().includes("sprint") && (
              <p className="mt-1 text-xs text-red-500/80">
                Verifica que <code className="text-red-600 font-mono bg-red-100/50 px-1 rounded">JIRA_SPRINT_FREDERICK</code> en el <code className="text-red-600 font-mono bg-red-100/50 px-1 rounded">.env</code> del backend coincida exactamente
                con el nombre del sprint en Jira.
              </p>
            )}
          </div>
        )}

        <Card className="navy-card mb-4 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="section-title">Avance del Sprint</p>
                <p className="stat-value text-navy-800 mt-0.5">{percent}%</p>
              </div>
              <div className="text-right">
                <p className="section-title">Finalizados</p>
                <p className="stat-value text-navy-800 mt-0.5">
                  {finished} <span className="text-lg font-sans text-blue-400/60">/ {total}</span>
                </p>
              </div>
            </div>
            <div className="w-full bg-blue-100/50 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${percent}%`,
                  background: "linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)",
                }}
              />
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={20} className="text-blue-400 animate-spin" />
            <span className="ml-2 text-sm text-blue-400/70 font-medium">Cargando tickets desde Jira...</span>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="navy-card lg:col-span-2">
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  Estados
                </h2>
                {Object.keys(byStatus).length === 0 ? (
                  <p className="text-sm text-blue-400/60">No se encontraron tickets en este sprint.</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(byStatus).map(([st, cnt]) => (
                      <li key={st} className="flex items-center justify-between py-1">
                        <StatusBadge status={st} />
                        <span className="text-sm font-bold text-navy-700">{cnt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="navy-card lg:col-span-3">
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
                  </svg>
                  Tickets ({total})
                </h2>
                <div className="max-h-96 overflow-auto rounded-lg border border-blue-100/60">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="bg-blue-50/50 border-b border-blue-100 text-xs text-blue-400/80">
                          <th className="text-left py-2.5 px-3 font-semibold whitespace-nowrap">Ticket</th>
                          <th className="text-left py-2.5 px-3 font-semibold">Título</th>
                          <th className="text-left py-2.5 px-3 font-semibold whitespace-nowrap">Asignado</th>
                          <th className="text-left py-2.5 px-3 font-semibold whitespace-nowrap">Prioridad</th>
                          <th className="text-left py-2.5 px-3 font-semibold whitespace-nowrap">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-50">
                        {sortedTickets.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-blue-400/60">
                              Sin tickets.
                            </td>
                          </tr>
                        )}
                        {sortedTickets.map((t) => (
                          <tr key={t.key || t.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                              {ticketUrl(t.key) ? (
                                <a
                                  href={ticketUrl(t.key)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 hover:underline text-xs">
                                  {t.key}
                                </a>
                              ) : (
                                <span className="text-xs text-navy-700">{t.key}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-navy-700">{t.summary || "Sin título"}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-xs text-blue-400/70">
                              {t.assignee || "—"}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <PriorityBadge priority={t.priority} />
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
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
