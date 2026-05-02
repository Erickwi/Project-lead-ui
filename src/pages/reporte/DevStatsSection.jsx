import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtHoras } from "@/pages/reporte/reportHelpers";

export default function DevStatsSection({ devStats }) {
  const entries = Object.entries(devStats || {})
    .filter(([dev]) => !/sin asignar/i.test(dev))
    .sort((a, b) => b[1].tickets.length - a[1].tickets.length);

  if (entries.length === 0) return null;

  const maxTickets = entries[0]?.[1]?.tickets.length || 1;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">👤 Análisis por Desarrollador</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tiempos del historial de transiciones · Rebotes QA del contador real de Jira · Retrasos reales vs fecha
          estimada
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
         <div className="rounded-lg border overflow-x-auto">
           <table className="w-full text-xs whitespace-nowrap min-w-[900px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Desarrollador</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Tickets</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Finalizados</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">H. Estimadas</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">T. Desarrollo</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">T. en QA</th>
                <th className="text-center px-3 py-2 font-medium text-red-600">Rebotes QA ★</th>
                <th className="text-center px-3 py-2 font-medium text-orange-500">Con Retraso</th>
                <th className="text-center px-3 py-2 font-medium text-orange-500">Retraso Prom.</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Carga</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map(([dev, s]) => {
                const pct = Math.round((s.tickets.length / maxTickets) * 100);
                const rebotes = s.rebotesQAReal ?? s.retornosTotal;
                const rebotesBadge =
                  rebotes > 3
                    ? "bg-red-100 text-red-700"
                    : rebotes > 1
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700";
                const retrasoColor = s.ticketsConRetraso > 0 ? "text-orange-600 font-semibold" : "text-green-600";
                return (
                  <tr key={dev} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium max-w-[160px] truncate">{dev}</td>
                    <td className="px-3 py-2 text-center font-bold">{s.tickets.length}</td>
                    <td className="px-3 py-2 text-center text-green-600 font-semibold">{s.finalizados}</td>
                    <td className="px-3 py-2 text-center text-muted-foreground">{fmtHoras(s.totalHorasEstimadas)}</td>
                    <td className="px-3 py-2 text-center">{fmtHoras(s.totalDevTime)}</td>
                    <td className="px-3 py-2 text-center text-purple-600">{fmtHoras(s.totalQATime)}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge className={`text-xs ${rebotesBadge}`}>{rebotes}</Badge>
                    </td>
                    <td className={`px-3 py-2 text-center ${retrasoColor}`}>{s.ticketsConRetraso}</td>
                    <td
                      className={`px-3 py-2 text-center ${s.retrasoPromedioDias > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                      {s.retrasoPromedioDias > 0 ? `+${s.retrasoPromedioDias}d` : "—"}
                    </td>
                    <td className="px-3 py-2 min-w-[80px]">
                      <div className="bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ★ <strong>Rebotes QA</strong>: tomado de los campos "Contador Revisiones QA Interno" y "Contador Revisiones QA
          Operativo" de Jira (suma). Indica cuántas veces el ticket fue regresado por errores detectados en QA.
        </p>
      </CardContent>
    </Card>
  );
}
