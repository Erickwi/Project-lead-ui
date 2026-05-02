import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fmtHoras } from "@/pages/reporte/reportHelpers";

export default function TimelineSection({ timelineTickets }) {
  const [filtro, setFiltro] = useState("");

  const tickets = (timelineTickets || [])
    .filter((t) => {
      if (!filtro) return true;
      const f = filtro.toLowerCase();
      return (
        t.key.toLowerCase().includes(f) || t.summary.toLowerCase().includes(f) || t.assignee.toLowerCase().includes(f)
      );
    })
    .sort((a, b) => (b.rebotesQATotal ?? b.retornos ?? 0) - (a.rebotesQATotal ?? a.retornos ?? 0));

  const allStatuses = [...new Set(tickets.flatMap((t) => Object.keys(t.tiemposPorEstado || {})))].sort();

  if (tickets.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">⏱️ Tiempo por Estado (por Ticket)</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ordenado por mayor cantidad de rebotes. Retraso = fecha fin real − estimada.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Input
          placeholder="Filtrar por ticket, título o desarrollador..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="mb-3 h-8 text-xs"
        />
        <div className="rounded-lg border overflow-auto max-h-96">
          <table className="w-full text-xs whitespace-nowrap">
            <thead className="bg-background sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground sticky left-0 bg-background z-30">
                  Ticket
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Dev</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Rev. Interno</th>
                <th className="text-center px-3 py-2 font-medium text-red-600">Rebotes QA ★</th>
                <th className="text-center px-3 py-2 font-medium text-orange-500">Retraso</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Dur. Real</th>
                {allStatuses.map((s) => (
                  <th key={s} className="text-center px-3 py-2 font-medium text-muted-foreground">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {tickets.map((t) => {
                const rebotes = t.rebotesQATotal ?? t.retornos ?? 0;
                const rebotesBadge =
                  rebotes > 2 ? "bg-red-100 text-red-700" : rebotes > 0 ? "bg-yellow-100 text-yellow-700" : "";
                return (
                  <tr key={t.key} className="hover:bg-muted/30">
                    <td className="px-3 py-1.5 font-mono font-semibold text-primary sticky left-0 bg-background">
                      {t.key}
                    </td>
                    <td className="px-3 py-1.5 max-w-[120px] truncate text-muted-foreground">{t.assignee}</td>
                    <td className="px-3 py-1.5">
                      {t.revInterno !== "N/A" ? (
                        <span className="text-blue-600">{t.revInterno}</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {rebotes > 0 ? (
                        <Badge className={`text-xs ${rebotesBadge}`}>{rebotes}</Badge>
                      ) : (
                        <span className="text-green-500">✓</span>
                      )}
                    </td>
                    <td
                      className={`px-3 py-1.5 text-center font-semibold ${t.retraso_dias > 0 ? "text-orange-500" : t.retraso_dias < 0 ? "text-green-500" : "text-muted-foreground"}`}>
                      {t.retraso_dias !== null && t.retraso_dias !== undefined
                        ? t.retraso_dias > 0
                          ? `+${t.retraso_dias}d`
                          : t.retraso_dias < 0
                            ? `${t.retraso_dias}d`
                            : "0d"
                        : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-center text-muted-foreground">
                      {t.duracion_real_dias !== null && t.duracion_real_dias !== undefined
                        ? `${t.duracion_real_dias}d`
                        : "—"}
                    </td>
                    {allStatuses.map((s) => (
                      <td key={s} className="px-3 py-1.5 text-center text-muted-foreground">
                        {t.tiemposPorEstado?.[s] ? fmtHoras(t.tiemposPorEstado[s]) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ★ Rebotes QA del contador real de Jira (Interno + Operativo) · Retraso = fecha fin real vs estimada · Dur.
          Real = días corridos entre inicio real y fin real
        </p>
      </CardContent>
    </Card>
  );
}
