import { useEffect, useState, useCallback } from "react";
import api from "../api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default function SprintProgressFrederick() {
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

  const byStatus = {};
  for (const t of tickets) {
    const s = t.status || "Sin estado";
    byStatus[s] = (byStatus[s] || 0) + 1;
  }

  return (
    <div className="p-6">
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
              <div className="space-y-2 max-h-96 overflow-auto">
                {tickets.length === 0 && <p className="text-sm text-muted-foreground">Sin tickets.</p>}
                {tickets.map((t) => (
                  <div key={t.key || t.id} className="p-2 border border-zinc-700 rounded bg-white-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {ticketUrl(t.key) ? (
                            <a
                              href={ticketUrl(t.key)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline mr-1">
                              {t.key}
                            </a>
                          ) : (
                            <span className="mr-1">{t.key}</span>
                          )}
                          — {t.summary || "Sin título"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{t.assignee || "—"}</div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
