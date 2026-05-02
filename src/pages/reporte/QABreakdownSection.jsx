import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statusColor } from "./reportHelpers";

export default function QABreakdownSection({ qaBreakdown }) {
  const { soloInterno = [], soloOperativo = [], ambos = [], sinQA = [] } = qaBreakdown || {};

  function QAGroup({ titulo, items, badgeClass }) {
    const [open, setOpen] = useState(true);
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <button className="flex items-center gap-2 w-full text-left mb-1" onClick={() => setOpen((o) => !o)}>
          <span className="text-xs text-muted-foreground">{open ? "▼" : "▶"}</span>
          <span className="text-sm font-semibold">{titulo}</span>
          <Badge variant="outline" className={`text-xs ${badgeClass}`}>
            {items.length}
          </Badge>
        </button>
         {open && (
           <div className="rounded-lg border overflow-x-auto">
             <table className="w-full text-xs min-w-[640px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Ticket</th>
                  <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Dev</th>
                  <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Rev. Interno</th>
                  <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Rev. Operativo</th>
                  <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((t) => (
                  <tr key={t.key} className="hover:bg-muted/30">
                    <td className="px-3 py-1.5 font-mono font-semibold text-primary">{t.key}</td>
                    <td className="px-3 py-1.5 text-muted-foreground max-w-[120px] truncate">{t.assignee}</td>
                    <td className="px-3 py-1.5">
                      {t.revInterno && t.revInterno !== "N/A" ? (
                        <span className="text-blue-600 font-medium">{t.revInterno}</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      {t.revOperativo && t.revOperativo !== "N/A" ? (
                        <span className="text-purple-600 font-medium">{t.revOperativo}</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <Badge variant="outline" className={`text-xs ${statusColor(t.status)}`}>
                        {t.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">🔍 Cobertura de QA por Ticket</CardTitle>
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="text-xs text-blue-600 font-medium">Solo Interno: {soloInterno.length}</span>
          <span className="text-xs text-purple-600 font-medium">Solo Operativo: {soloOperativo.length}</span>
          <span className="text-xs text-green-600 font-medium">Ambos: {ambos.length}</span>
          <span className="text-xs text-muted-foreground">Sin QA asignado: {sinQA.length}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <QAGroup titulo="✅ Ambos (Interno + Operativo)" items={ambos} badgeClass="text-green-700 border-green-200" />
        <QAGroup titulo="🔵 Solo QA Interno" items={soloInterno} badgeClass="text-blue-700 border-blue-200" />
        <QAGroup titulo="🟣 Solo QA Operativo" items={soloOperativo} badgeClass="text-purple-700 border-purple-200" />
        <QAGroup titulo="⬜ Sin QA asignado" items={sinQA} badgeClass="text-zinc-500 border-zinc-200" />
      </CardContent>
    </Card>
  );
}
