import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtHoras } from "@/pages/reporte/reportHelpers";

export default function RevisoresSection({ revInternoStats, revOperativoStats }) {
  function RevisorTable({ titulo, stats, color }) {
    const entries = Object.entries(stats || {}).sort((a, b) => b[1].total - a[1].total);
    const maxTotal = entries[0]?.[1]?.total || 1;
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{titulo}</p>
        {entries.length === 0 && <p className="text-xs text-muted-foreground">Sin datos</p>}
        <div className="space-y-3">
          {entries.map(([nombre, s]) => (
            <div key={nombre} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium truncate max-w-[140px]">{nombre}</span>
                <span className="text-muted-foreground">
                  {s.total} ticket{s.total !== 1 ? "s" : ""} · {fmtHoras(s.tiempoQA)} en QA
                </span>
              </div>
              <div className="bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all`}
                  style={{ width: `${Math.round((s.total / maxTotal) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">👥 Revisores QA</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <RevisorTable titulo="QA Interno" stats={revInternoStats} color="bg-blue-400" />
        <RevisorTable titulo="QA Operativo" stats={revOperativoStats} color="bg-purple-400" />
      </CardContent>
    </Card>
  );
}
