import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { statusColor, BarRow } from "@/pages/reporte/reportHelpers";
import {
  isDeveloper,
  tipoColor,
  MODULE_COLORS,
  HORAS_TARGET_DEVS,
  HORAS_STATUS_GROUPS,
} from "@/pages/reporte/reportSectionHelpers";

// ─── Sección: Distribución de estados ───────────────────────
export function StatusDistribucion({ statusCounts }) {
  const entries = Object.entries(statusCounts || {}).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] || 1;
  const COLORS = [
    "bg-primary",
    "bg-blue-400",
    "bg-purple-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-red-400",
    "bg-pink-400",
    "bg-indigo-400",
  ];
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">📊 Distribución por Estado Actual</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {entries.length === 0 && <p className="text-xs text-muted-foreground">Sin datos</p>}
        {entries.map(([estado, cnt], i) => (
          <BarRow key={estado} label={estado} value={cnt} max={max} color={COLORS[i % COLORS.length]} />
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Sección: QA Interno vs Operativo — conteo de revisiones ─
export function QADevParidadSection({ timelineTickets }) {
  function classifyTicket(t) {
    const hasInt = (t.contadorQAInterno ?? 0) > 0;
    const hasOp = (t.contadorQAOperativo ?? 0) > 0;
    if (hasInt && hasOp) return "ambos";
    if (hasInt) return "soloInterno";
    if (hasOp) return "soloOperativo";
    return "sinQA";
  }

  function catBadge(cat) {
    switch (cat) {
      case "ambos":
        return { label: "Ambos", cls: "text-green-700 bg-green-50 border-green-300" };
      case "soloInterno":
        return { label: "Solo Int.", cls: "text-blue-700 bg-blue-50 border-blue-300" };
      case "soloOperativo":
        return { label: "Solo Op.", cls: "text-purple-700 bg-purple-50 border-purple-300" };
      default:
        return { label: "Sin QA", cls: "text-muted-foreground bg-muted border-border" };
    }
  }

  const devMap = {};
  for (const t of timelineTickets || []) {
    const devs =
      Array.isArray(t.desarrolladores) && t.desarrolladores.length > 0
        ? t.desarrolladores.filter(isDeveloper)
        : isDeveloper(t.assignee)
          ? [t.assignee]
          : [];
    if (devs.length === 0) continue;
    const cat = classifyTicket(t);

    for (const dev of devs) {
      if (!devMap[dev]) {
        devMap[dev] = {
          total: 0,
          soloInterno: 0,
          soloOperativo: 0,
          ambos: 0,
          sinQA: 0,
          rondasInterno: 0,
          rondasOperativo: 0,
          ticketsList: [],
        };
      }
      const d = devMap[dev];
      d.total += 1;
      if (cat === "ambos") d.ambos += 1;
      else if (cat === "soloInterno") d.soloInterno += 1;
      else if (cat === "soloOperativo") d.soloOperativo += 1;
      else d.sinQA += 1;
      d.rondasInterno += t.contadorQAInterno ?? 0;
      d.rondasOperativo += t.contadorQAOperativo ?? 0;
      d.ticketsList.push(t);
    }
  }

  const entries = Object.entries(devMap).sort((a, b) => b[1].total - a[1].total);

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">👥 Rondas por Desarrollador</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {entries.length === 0 && <p className="text-xs text-muted-foreground">Sin datos</p>}

        {entries.map(([dev, d]) => {
          const max = Math.max(d.rondasInterno, d.rondasOperativo, 1);
          const pctInt = Math.round((d.rondasInterno / max) * 100);
          const pctOp = Math.round((d.rondasOperativo / max) * 100);
          const ORDER = { ambos: 0, soloInterno: 1, soloOperativo: 2, sinQA: 3 };
          const sortedTickets = d.ticketsList
            .slice()
            .sort((a, b) => ORDER[classifyTicket(a)] - ORDER[classifyTicket(b)]);
          return (
            <div key={dev} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{dev}</span>
                <span className="text-xs text-muted-foreground">({d.total} tickets)</span>
                {d.soloInterno > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full border font-semibold text-blue-700 bg-blue-50 border-blue-300">
                    {d.soloInterno} Solo Int.
                  </span>
                )}
                {d.soloOperativo > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full border font-semibold text-purple-700 bg-purple-50 border-purple-300">
                    {d.soloOperativo} Solo Op.
                  </span>
                )}
                {d.ambos > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full border font-semibold text-green-700 bg-green-50 border-green-300">
                    {d.ambos} Ambos
                  </span>
                )}
                {d.sinQA > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full border font-semibold text-muted-foreground bg-muted">
                    {d.sinQA} Sin QA
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-28 text-blue-600 font-medium text-right flex-shrink-0">QA Interno</span>
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-400 transition-all"
                      style={{ width: `${pctInt}%`, minWidth: d.rondasInterno > 0 ? "1.5rem" : "0" }}
                    />
                  </div>
                  <span className="w-12 text-right font-bold text-blue-600">{d.rondasInterno} rev.</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-28 text-purple-600 font-medium text-right flex-shrink-0">QA Operativo</span>
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-400 transition-all"
                      style={{ width: `${pctOp}%`, minWidth: d.rondasOperativo > 0 ? "1.5rem" : "0" }}
                    />
                  </div>
                  <span className="w-12 text-right font-bold text-purple-600">{d.rondasOperativo} rev.</span>
                </div>
              </div>

              <div className="rounded border overflow-hidden mt-1">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-2 py-1 font-medium text-muted-foreground">Ticket</th>
                      <th className="text-center px-2 py-1 font-medium text-muted-foreground">Dev(s)</th>
                      <th className="text-center px-2 py-1 font-medium text-muted-foreground">Categoría</th>
                      <th className="text-center px-2 py-1 font-medium text-blue-600">Int.</th>
                      <th className="text-center px-2 py-1 font-medium text-muted-foreground">Rev. Int.</th>
                      <th className="text-center px-2 py-1 font-medium text-purple-600">Op.</th>
                      <th className="text-center px-2 py-1 font-medium text-muted-foreground">Rev. Op.</th>
                      <th className="text-center px-2 py-1 font-medium text-muted-foreground">Dif.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sortedTickets.map((t) => {
                      const rInt = t.contadorQAInterno ?? 0;
                      const rOp = t.contadorQAOperativo ?? 0;
                      const cat = classifyTicket(t);
                      const tdiff = rInt - rOp;
                      const badge = catBadge(cat);
                      const devList =
                        Array.isArray(t.desarrolladores) && t.desarrolladores.length > 0
                          ? t.desarrolladores
                          : [t.assignee];
                      return (
                        <tr key={t.key} className={`hover:bg-muted/20 ${cat === "sinQA" ? "opacity-50" : ""}`}>
                          <td className="px-2 py-1 font-mono font-semibold text-primary">{t.key}</td>
                          <td className="px-2 py-1 text-center text-muted-foreground">
                            {devList.map((n) => n?.split(" ")[0]).join(" + ")}
                          </td>
                          <td className="px-2 py-1 text-center">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full border font-semibold ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-center">
                            <span
                              className={`font-bold ${rInt > 1 ? "text-blue-600" : rInt === 1 ? "text-blue-400" : "text-muted-foreground/40"}`}>
                              {rInt}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-center">
                            {t.revInterno && t.revInterno !== "N/A" ? (
                              <span className="text-blue-600">{t.revInterno.split(" ")[0]}</span>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-center">
                            <span
                              className={`font-bold ${rOp > 1 ? "text-purple-600" : rOp === 1 ? "text-purple-400" : "text-muted-foreground/40"}`}>
                              {rOp}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-center">
                            {t.revOperativo && t.revOperativo !== "N/A" ? (
                              <span className="text-purple-600">{t.revOperativo.split(" ")[0]}</span>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-center font-semibold">
                            {cat !== "ambos" ? (
                              <span className="text-muted-foreground/30">—</span>
                            ) : tdiff === 0 ? (
                              <span className="text-green-500">=</span>
                            ) : tdiff > 0 ? (
                              <span className="text-blue-500">+{tdiff}</span>
                            ) : (
                              <span className="text-purple-500">+{Math.abs(tdiff)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground border-t pt-2">
          <strong>Solo Int.</strong>: revisado internamente pero aún no llegó a QA Operativo ·<strong> Solo Op.</strong>
          : llegó a QA Operativo sin pasar por QA Interno ·<strong> Ambos</strong>: pasó por los dos revisores — aquí
          aplica la comparación de rondas · La columna <em>Dif.</em> muestra cuántas rondas más tuvo un lado, solo para
          tickets <em>Ambos</em>.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Sección: Horas Estimadas por Estado ────────────────────
export function HorasEstadoSection({ timelineTickets }) {
  const [expandedGroup, setExpandedGroup] = useState(null);

  const devTickets = (timelineTickets || []).filter((t) => {
    const devs = t.desarrolladores || [];
    return devs.some((d) => HORAS_TARGET_DEVS.some((p) => (d || "").toLowerCase().includes(p)));
  });

  if (devTickets.length === 0) return null;

  const totalEstimadoGlobal = devTickets.reduce((s, t) => s + (t.horas || 0), 0);

  const grupos = HORAS_STATUS_GROUPS.map((sg) => {
    const statusTickets = devTickets.filter((t) => sg.regex.test(t.status || ""));
    const totalEstimado = Math.round(statusTickets.reduce((s, t) => s + (t.horas || 0), 0) * 10) / 10;
    const totalRestante =
      Math.round(
        statusTickets.reduce((s, t) => s + (t.horasRestantes != null ? t.horasRestantes : t.horas || 0), 0) * 10,
      ) / 10;

    const perDev = HORAS_TARGET_DEVS.map((devPattern) => {
      const dt = statusTickets.filter((t) =>
        (t.desarrolladores || []).some((d) => (d || "").toLowerCase().includes(devPattern)),
      );
      const est = Math.round(dt.reduce((s, t) => s + (t.horas || 0), 0) * 10) / 10;
      const rest =
        Math.round(dt.reduce((s, t) => s + (t.horasRestantes != null ? t.horasRestantes : t.horas || 0), 0) * 10) / 10;
      return { dev: devPattern, tickets: dt, estimado: est, restante: rest };
    }).filter((d) => d.tickets.length > 0);

    return { ...sg, tickets: statusTickets, totalEstimado, totalRestante, perDev };
  }).filter((g) => g.tickets.length > 0);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base font-bold">⏱️ Horas Estimadas por Estado</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Tickets de {HORAS_TARGET_DEVS.join(", ")} — estimado vs. tiempo restante en Jira.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Total tickets:</span>
            <span className="font-bold">{devTickets.length}</span>
            <span className="text-muted-foreground">Total estimado:</span>
            <span className="font-bold text-primary">{Math.round(totalEstimadoGlobal * 10) / 10}h</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-4 space-y-3">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                <th className="px-3 py-2 text-left font-medium">Estado</th>
                <th className="px-3 py-2 text-center font-medium">Tickets</th>
                {HORAS_TARGET_DEVS.map((d) => (
                  <th key={d} className="px-3 py-2 text-center font-medium capitalize">
                    {d}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-medium">Total Est.</th>
                <th className="px-3 py-2 text-center font-medium">Restante</th>
                <th className="px-3 py-2 text-center font-medium">% Usado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {grupos.map((g) => {
                const pctUsado =
                  g.totalEstimado > 0 ? Math.round(((g.totalEstimado - g.totalRestante) / g.totalEstimado) * 100) : 0;
                return (
                  <tr
                    key={g.key}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setExpandedGroup(expandedGroup === g.key ? null : g.key)}>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${g.badgeCls}`}>
                        {g.icon} {g.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center font-semibold">{g.tickets.length}</td>
                    {HORAS_TARGET_DEVS.map((devPattern) => {
                      const dg = g.perDev.find((d) => d.dev === devPattern);
                      return (
                        <td key={devPattern} className="px-3 py-2 text-center">
                          {dg ? (
                            <div className="flex flex-col items-center leading-tight">
                              <span className="font-semibold text-foreground">{dg.estimado}h</span>
                              <span className="text-[10px] text-muted-foreground">
                                {dg.restante < dg.estimado ? (
                                  <span className="text-green-600">
                                    −{Math.round((dg.estimado - dg.restante) * 10) / 10}h
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/50">—</span>
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-bold text-primary">{g.totalEstimado}h</td>
                    <td className="px-3 py-2 text-center font-semibold">
                      {g.totalRestante < g.totalEstimado ? (
                        <span className="text-orange-600">{g.totalRestante}h</span>
                      ) : (
                        <span className="text-muted-foreground">{g.totalRestante}h</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center gap-1.5 justify-center">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${g.barCls}`} style={{ width: `${pctUsado}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pctUsado}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 font-semibold text-sm border-t-2">
                <td className="px-3 py-2 text-muted-foreground uppercase text-xs">Total</td>
                <td className="px-3 py-2 text-center">{devTickets.length}</td>
                {HORAS_TARGET_DEVS.map((devPattern) => {
                  const devTotal = devTickets.filter((t) =>
                    (t.desarrolladores || []).some((d) => (d || "").toLowerCase().includes(devPattern)),
                  );
                  const est = Math.round(devTotal.reduce((s, t) => s + (t.horas || 0), 0) * 10) / 10;
                  const rest =
                    Math.round(
                      devTotal.reduce((s, t) => s + (t.horasRestantes != null ? t.horasRestantes : t.horas || 0), 0) *
                        10,
                    ) / 10;
                  return (
                    <td key={devPattern} className="px-3 py-2 text-center">
                      <div className="flex flex-col items-center leading-tight">
                        <span className="font-bold">{est}h</span>
                        <span className="text-[10px] text-orange-600">rest: {rest}h</span>
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center text-primary font-bold">
                  {Math.round(totalEstimadoGlobal * 10) / 10}h
                </td>
                <td className="px-3 py-2 text-center text-orange-600 font-bold">
                  {Math.round(
                    devTickets.reduce((s, t) => s + (t.horasRestantes != null ? t.horasRestantes : t.horas || 0), 0) *
                      10,
                  ) / 10}
                  h
                </td>
                <td className="px-3 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>

        {expandedGroup &&
          (() => {
            const g = grupos.find((x) => x.key === expandedGroup);
            if (!g) return null;
            return (
              <div className={`rounded-md border p-3 ${g.headerCls} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    {g.icon} {g.label} — {g.tickets.length} ticket{g.tickets.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setExpandedGroup(null)}>
                    ✕ Cerrar
                  </button>
                </div>
                <div className="overflow-x-auto rounded border bg-background">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 text-[10px] text-muted-foreground uppercase">
                        <th className="px-2 py-1.5 text-left">Ticket</th>
                        <th className="px-2 py-1.5 text-left">Resumen</th>
                        <th className="px-2 py-1.5 text-left">Dev(s)</th>
                        <th className="px-2 py-1.5 text-center">Estimado</th>
                        <th className="px-2 py-1.5 text-center">Restante</th>
                        <th className="px-2 py-1.5 text-center">Usado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {g.tickets.map((t) => {
                        const usado = (t.horas || 0) - (t.horasRestantes != null ? t.horasRestantes : t.horas || 0);
                        const pct = t.horas > 0 ? Math.round((usado / t.horas) * 100) : 0;
                        const devsStr = (t.desarrolladores || [t.assignee]).join(", ");
                        return (
                          <tr key={t.key} className="hover:bg-muted/20">
                            <td className="px-2 py-1.5 font-mono text-primary whitespace-nowrap">{t.key}</td>
                            <td className="px-2 py-1.5 max-w-xs truncate text-foreground" title={t.summary}>
                              {t.summary}
                            </td>
                            <td className="px-2 py-1.5 text-muted-foreground">{devsStr}</td>
                            <td className="px-2 py-1.5 text-center font-semibold">{t.horas || 16}h</td>
                            <td className="px-2 py-1.5 text-center">
                              {t.horasRestantes != null ? (
                                <span
                                  className={
                                    t.horasRestantes > 0
                                      ? "text-orange-600 font-semibold"
                                      : "text-green-600 font-semibold"
                                  }>
                                  {t.horasRestantes}h
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              {t.horasRestantes != null ? (
                                <span className={pct >= 100 ? "text-green-600 font-bold" : "text-muted-foreground"}>
                                  {pct}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        <p className="text-xs text-muted-foreground">
          Haz clic en una fila de estado para ver el detalle de tickets. <strong>Restante</strong> = tiempo pendiente
          registrado en Jira.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Sección: Análisis de Rebotes QA por Ticket ─────────────
export function RebotesQASection({ timelineTickets }) {
  const tickets = (timelineTickets || [])
    .filter(
      (t) =>
        (t.contadorQAInterno !== null && t.contadorQAInterno !== undefined) ||
        (t.contadorQAOperativo !== null && t.contadorQAOperativo !== undefined),
    )
    .sort((a, b) => (b.rebotesQATotal ?? 0) - (a.rebotesQATotal ?? 0));

  if (tickets.length === 0) return null;

  const conRebotes = tickets.filter((t) => (t.rebotesQATotal ?? 0) > 0);
  const sinRebotes = tickets.filter((t) => (t.rebotesQATotal ?? 0) === 0);
  const totalRebotes = tickets.reduce((acc, t) => acc + (t.rebotesQATotal ?? 0), 0);
  const maxContador = tickets[0] ? (tickets[0].contadorQAInterno ?? 0) + (tickets[0].contadorQAOperativo ?? 0) || 1 : 1;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">🔄 Análisis de Rebotes QA por Ticket</CardTitle>
        <div className="flex flex-wrap gap-4 mt-1">
          <span className="text-xs text-red-600 font-medium">🔴 Con rebotes: {conRebotes.length} tickets</span>
          <span className="text-xs text-green-600 font-medium">✅ Sin rebotes: {sinRebotes.length} tickets</span>
          <span className="text-xs text-muted-foreground">
            Total rebotes acumulados: <strong>{totalRebotes}</strong>
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Rebotes = contador real de rondas QA (Interno + Operativo) de Jira. Cuantos más rebotes, más veces regresó el
          ticket a desarrollo.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <div className="space-y-2">
          {tickets.map((t) => {
            const rebotes = t.rebotesQATotal ?? 0;
            const barColor = rebotes > 2 ? "bg-red-500" : rebotes > 0 ? "bg-yellow-400" : "bg-green-400";
            const contadorTotal = (t.contadorQAInterno ?? 0) + (t.contadorQAOperativo ?? 0);
            const pct = Math.round((contadorTotal / maxContador) * 100);
            return (
              <div key={t.key} className="flex items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-primary w-20 flex-shrink-0">{t.key}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all`}
                        style={{ width: `${pct}%` }}
                        title={`Contador QA: ${(t.contadorQAInterno ?? 0) + (t.contadorQAOperativo ?? 0)}`}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    <div className="flex flex-col text-xs text-background">
                      <div className="font-medium">Desglose QA</div>
                      <div className="pt-1">
                        QA Interno: <strong>{t.contadorQAInterno ?? 0}</strong>
                      </div>
                      <div>
                        QA Operativo: <strong>{t.contadorQAOperativo ?? 0}</strong>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
                <span className="w-20 text-left text-muted-foreground truncate">{t.assignee?.split(" ")[0]}</span>
                <span className="w-24 text-muted-foreground">
                  {t.revInterno !== "N/A" ? t.revInterno?.split(" ")[0] : "—"}
                </span>
                <span className={`w-20 text-center font-semibold ${rebotes > 0 ? "text-red-600" : "text-green-600"}`}>
                  {rebotes > 0 ? `${rebotes} rebote${rebotes !== 1 ? "s" : ""}` : "✓ OK"}
                </span>
                {t.retraso_dias !== null && (
                  <span
                    className={`w-16 text-center text-xs ${t.retraso_dias > 0 ? "text-orange-500 font-semibold" : t.retraso_dias < 0 ? "text-green-500" : "text-muted-foreground"}`}>
                    {t.retraso_dias > 0 ? `+${t.retraso_dias}d` : t.retraso_dias < 0 ? `${t.retraso_dias}d` : "0d"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t">
          <span>🟥 = &gt;2 rebotes (problemático)</span>
          <span>🟨 = 1–2 rebotes (atención)</span>
          <span>🟩 = sin rebotes (correcto)</span>
          <span>La columna naranja = retraso real respecto a fecha estimada</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sub-componente: tabla de tipos reutilizable ─────────────
function TipoTabla({ tiposData, totalUniverso, modColorMap, labelTotal }) {
  const [expandido, setExpandido] = useState(null);
  const tiposEntries = Object.entries(tiposData || {});
  if (tiposEntries.length === 0) return <p className="text-xs text-muted-foreground">Sin datos</p>;
  const maxTotal = tiposEntries[0]?.[1]?.total || 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tiposEntries.map(([tipo, d]) => {
          const c = tipoColor(tipo);
          return (
            <button
              key={tipo}
              onClick={() => setExpandido(expandido === tipo ? null : tipo)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                expandido === tipo ? c.badge + " ring-2 ring-offset-1 ring-current" : c.badge + " hover:opacity-80"
              }`}>
              {tipo}
              <span className="font-extrabold">{d.total}</span>
              <span className="opacity-60">· {d.porcentaje}%</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tipo</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Total</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">% de {labelTotal}</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground w-32">Barra</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Módulos principales</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tiposEntries.map(([tipo, d]) => {
              const c = tipoColor(tipo);
              const topMods = Object.entries(d.modulos).slice(0, 4);
              const barW = maxTotal > 0 ? Math.round((d.total / maxTotal) * 100) : 0;
              return (
                <tr
                  key={tipo}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => setExpandido(expandido === tipo ? null : tipo)}>
                  <td className="px-3 py-2 font-semibold">
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${c.badge}`}>{tipo}</span>
                  </td>
                  <td className="px-3 py-2 text-center text-xl font-extrabold">{d.total}</td>
                  <td className="px-3 py-2 text-center font-bold">{d.porcentaje}%</td>
                  <td className="px-3 py-2">
                    <div className="bg-muted rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${barW}%` }} />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {topMods.map(([mod, mdata]) => (
                        <span
                          key={mod}
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white ${modColorMap[mod] || "bg-zinc-400"}`}>
                          {mod} ({mdata.count})
                        </span>
                      ))}
                      {Object.keys(d.modulos).length > 4 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{Object.keys(d.modulos).length - 4} más
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted/30 border-t">
            <tr>
              <td className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">TOTAL</td>
              <td className="px-3 py-1.5 text-center text-sm font-extrabold">{totalUniverso}</td>
              <td className="px-3 py-1.5 text-center text-xs text-muted-foreground">100%</td>
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {expandido &&
        tiposData[expandido] &&
        (() => {
          const d = tiposData[expandido];
          const c = tipoColor(expandido);
          const modsEntries = Object.entries(d.modulos);
          const maxMod = modsEntries[0]?.[1]?.count || 1;
          return (
            <div className={`rounded-xl border p-4 space-y-3 ${c.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${c.badge}`}>
                    {expandido}
                  </span>
                  <span className="text-sm font-bold">
                    {d.total} tickets · {d.porcentaje}% de {labelTotal}
                  </span>
                </div>
                <button
                  onClick={() => setExpandido(null)}
                  className="text-xs text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Desglose por módulo
                </p>
                {modsEntries.map(([mod, mdata]) => (
                  <div key={mod} className="flex items-center gap-3 text-xs">
                    <span className="w-28 truncate text-right flex-shrink-0 text-muted-foreground">{mod}</span>
                    <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all ${modColorMap[mod] || "bg-zinc-400"}`}
                        style={{ width: `${Math.round((mdata.count / maxMod) * 100)}%`, minWidth: "2rem" }}
                      />
                      <span className="absolute inset-0 flex items-center pl-2 text-[10px] font-bold text-white">
                        {mdata.count} · {mdata.porcentajeTipo}% del tipo
                      </span>
                    </div>
                    <span className="w-6 text-right font-extrabold flex-shrink-0">{mdata.count}</span>
                  </div>
                ))}
              </div>

              <details>
                <summary className="text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  Ver los {d.total} tickets ▶
                </summary>
                <div className="mt-2 rounded-lg border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Ticket</th>
                        <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Módulo</th>
                        <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Dev</th>
                        <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Estado</th>
                        <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Resumen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {modsEntries.flatMap(([mod, mdata]) =>
                        mdata.tickets.map((tk) => (
                          <tr key={tk.key} className="hover:bg-muted/30">
                            <td className="px-3 py-1.5 font-mono font-semibold text-primary">{tk.key}</td>
                            <td className="px-3 py-1.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white ${modColorMap[mod] || "bg-zinc-400"}`}>
                                {mod}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground max-w-[110px] truncate">{tk.assignee}</td>
                            <td className="px-3 py-1.5">
                              <Badge variant="outline" className={`text-xs ${statusColor(tk.status)}`}>
                                {tk.status}
                              </Badge>
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground max-w-[200px] truncate">{tk.summary}</td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          );
        })()}
    </div>
  );
}

// ─── Sección: Clasificación por Tipo y Módulo ───────────────
export function ModuloPorTipoSection({ moduloStats }) {
  const [vista, setVista] = useState("todos");

  if (!moduloStats) return null;

  const { tipos = {}, tiposFinalizado = {}, totalTickets = 0, totalFinalizado = 0 } = moduloStats;

  const allMods = Array.from(
    new Set([
      ...Object.values(tipos).flatMap((d) => Object.keys(d.modulos)),
      ...Object.values(tiposFinalizado).flatMap((d) => Object.keys(d.modulos)),
    ]),
  );
  const modColorMap = Object.fromEntries(allMods.map((m, i) => [m, MODULE_COLORS[i % MODULE_COLORS.length]]));

  const isFinalizados = vista === "finalizados";
  const tiposActivos = isFinalizados ? tiposFinalizado : tipos;
  const universo = isFinalizados ? totalFinalizado : totalTickets;
  const labelTotal = isFinalizados ? `${totalFinalizado} finalizados` : `${totalTickets} del sprint`;

  function generarParrafos(tiposData, total, scope) {
    if (!total || Object.keys(tiposData).length === 0) return [];
    const entries = Object.entries(tiposData).sort((a, b) => b[1].total - a[1].total);
    const parrafos = [];

    const resumenTipos = entries
      .map(([tipo, d]) => `**${tipo}** (${d.total} ticket${d.total !== 1 ? "s" : ""}, ${d.porcentaje}%)`)
      .join(", ");
    parrafos.push(
      `En ${scope} se registran **${total} tickets** en total, distribuidos entre los siguientes tipos: ${resumenTipos}.`,
    );

    const [tipoPrincipal, dprincipal] = entries[0];
    const topModsPrincipal = Object.entries(dprincipal.modulos)
      .slice(0, 3)
      .map(([mod, m]) => `${mod} (${m.count})`)
      .join(", ");
    parrafos.push(
      `El tipo de ticket más frecuente es **${tipoPrincipal}** con **${dprincipal.total} tickets** (${dprincipal.porcentaje}% ${scope}), concentrado principalmente en los módulos: ${topModsPrincipal}.`,
    );

    for (const [tipo, d] of entries.slice(1)) {
      const topMods = Object.entries(d.modulos)
        .slice(0, 3)
        .map(([mod, m]) => `${mod} (${m.count})`)
        .join(", ");
      const moduloStr = topMods ? `, distribuyéndose en los módulos ${topMods}` : "";
      parrafos.push(
        `**${tipo}** representa **${d.total} ticket${d.total !== 1 ? "s" : ""}** (${d.porcentaje}% ${scope})${moduloStr}.`,
      );
    }

    const moduloAcum = {};
    for (const [, d] of entries) {
      for (const [mod, m] of Object.entries(d.modulos)) {
        moduloAcum[mod] = (moduloAcum[mod] || 0) + m.count;
      }
    }
    const modulosSorted = Object.entries(moduloAcum).sort((a, b) => b[1] - a[1]);
    if (modulosSorted.length > 0) {
      const [modTop, cntTop] = modulosSorted[0];
      const pctMod = total > 0 ? Math.round((cntTop / total) * 1000) / 10 : 0;
      parrafos.push(
        `Considerando todos los tipos, el módulo con mayor carga de trabajo es **${modTop}** con **${cntTop} ticket${cntTop !== 1 ? "s" : ""}** (${pctMod}% de ${scope}).`,
      );
    }

    return parrafos;
  }

  const parrafos = generarParrafos(tiposActivos, universo, isFinalizados ? "los tickets finalizados" : "el sprint");

  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">📦 Tickets por Tipo y Módulo</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clasificación según el tipo de trabajo (Bug, Mejoras, etc.) y el módulo del sistema afectado.
            </p>
          </div>
          <div className="flex rounded-lg border overflow-hidden text-xs font-semibold flex-shrink-0">
            <button
              onClick={() => setVista("todos")}
              className={`px-4 py-1.5 transition-colors ${
                !isFinalizados ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              }`}>
              🗂 Todos ({totalTickets})
            </button>
            <button
              onClick={() => setVista("finalizados")}
              className={`px-4 py-1.5 transition-colors border-l ${
                isFinalizados ? "bg-emerald-600 text-white" : "hover:bg-muted text-muted-foreground"
              }`}>
              ✅ Finalizados ({totalFinalizado})
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-5 space-y-5">
        <TipoTabla
          key={vista}
          tiposData={tiposActivos}
          totalUniverso={universo}
          modColorMap={modColorMap}
          labelTotal={labelTotal}
        />

        {parrafos.length > 0 && (
          <div className="rounded-xl border bg-muted/30 px-5 py-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>📝</span> Análisis en texto
            </p>
            {parrafos.map((p, i) => (
              <p key={i} className="text-sm text-foreground leading-relaxed">
                {p.split(/\*\*(.+?)\*\*/g).map((part, j) =>
                  j % 2 === 1 ? (
                    <strong key={j} className="font-semibold text-foreground">
                      {part}
                    </strong>
                  ) : (
                    part
                  ),
                )}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
