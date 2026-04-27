import { useState, useEffect } from "react";
import { useReporte } from "../hooks/useReporte";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// ─── Helpers ────────────────────────────────────────────────

function fmtHoras(h) {
  if (!h || h <= 0) return "—";
  if (h < 1) return `${Math.round(h * 60)}min`;
  return `${Math.round(h * 10) / 10}h`;
}

function statusColor(status) {
  const s = (status || "").toLowerCase();
  if (/done|finaliz|complet|cerrado/.test(s)) return "bg-green-100 text-green-700 border-green-200";
  if (/qa interno|interno|review/.test(s)) return "bg-blue-100 text-blue-700 border-blue-200";
  if (/qa operativo|operativo|uat/.test(s)) return "bg-purple-100 text-purple-700 border-purple-200";
  if (/desarrollo|progress|doing|progreso/.test(s)) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (/bloqueado|blocked/.test(s)) return "bg-red-100 text-red-700 border-red-200";
  return "bg-zinc-100 text-zinc-600 border-zinc-200";
}

function BarRow({ label, value, max, color = "bg-primary" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 truncate text-muted-foreground text-xs">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold">{value}</span>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color = "border-l-primary" }) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {icon} {label}
        </p>
        <p className="text-3xl font-extrabold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Sección: Distribución de estados ───────────────────────
function StatusDistribucion({ statusCounts }) {
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

// ─── Sección: QA Interno vs Operativo ───────────────────────
function QABreakdownSection({ qaBreakdown }) {
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
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
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

// ─── Sección: Revisores ─────────────────────────────────────
function RevisoresSection({ revInternoStats, revOperativoStats }) {
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

// ─── Sección: Análisis por Desarrollador ────────────────────
function DevStatsSection({ devStats }) {
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
        <div className="rounded-lg border overflow-auto">
          <table className="w-full text-xs whitespace-nowrap">
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
                // Usar rebotesQAReal si está disponible, si no retornosTotal del changelog
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
          ★ <strong>Rebotes QA</strong>: tomado del campo "Contador Revisiones QA Interno" de Jira (valor − 1). Indica
          cuántas veces el ticket fue regresado por errores encontrados en revisión interna.
        </p>
      </CardContent>
    </Card>
  );
}

// Nombres parciales de los desarrolladores reales (mismo criterio que el backend)
const DEV_NAME_PATTERNS = ["jerson", "fabio", "mateo", "jairo", "erick"];
function isDeveloper(name) {
  if (!name) return false;
  const n = name.toLowerCase();
  return DEV_NAME_PATTERNS.some((p) => n.includes(p));
}

// ─── Sección: QA Interno vs Operativo — conteo de revisiones ─
function QADevParidadSection({ timelineTickets }) {
  // Clasificar ticket según qué revisores tiene (basado en contadores reales)
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
          rondasInternoAmbos: 0, // rondas solo en tickets con Ambos revisores
          rondasOperativoAmbos: 0,
          ticketsList: [],
        };
      }
      const d = devMap[dev];
      d.total++;
      d[cat]++;
      d.rondasInterno += t.contadorQAInterno ?? 0;
      d.rondasOperativo += t.contadorQAOperativo ?? 0;
      if (cat === "ambos") {
        d.rondasInternoAmbos += t.contadorQAInterno ?? 0;
        d.rondasOperativoAmbos += t.contadorQAOperativo ?? 0;
      }
      if (!d.ticketsList.find((x) => x.key === t.key)) d.ticketsList.push(t);
    }
  }

  const entries = Object.entries(devMap).sort((a, b) => b[1].total - a[1].total);
  if (entries.length === 0) return null;

  // Balance: solo aplica a tickets "Ambos"
  function balanceTag(rondasInt, rondasOp) {
    const diff = rondasInt - rondasOp;
    if (diff === 0) return { label: "Igualado ✓", cls: "text-green-700 bg-green-50 border-green-300" };
    if (diff > 0 && diff <= 2) return { label: `Int. +${diff}`, cls: "text-yellow-700 bg-yellow-50 border-yellow-300" };
    if (diff < 0 && diff >= -2)
      return { label: `Op. +${Math.abs(diff)}`, cls: "text-yellow-700 bg-yellow-50 border-yellow-300" };
    if (diff > 2) return { label: `Int. supera +${diff}`, cls: "text-red-700 bg-red-50 border-red-300" };
    return { label: `Op. supera +${Math.abs(diff)}`, cls: "text-purple-700 bg-purple-50 border-purple-300" };
  }

  // Totales globales
  const totalSoloInt = entries.reduce((s, [, d]) => s + d.soloInterno, 0);
  const totalSoloOp = entries.reduce((s, [, d]) => s + d.soloOperativo, 0);
  const totalAmbos = entries.reduce((s, [, d]) => s + d.ambos, 0);
  const totalSinQA = entries.reduce((s, [, d]) => s + d.sinQA, 0);
  const globalAmbosInt = entries.reduce((s, [, d]) => s + d.rondasInternoAmbos, 0);
  const globalAmbosOp = entries.reduce((s, [, d]) => s + d.rondasOperativoAmbos, 0);

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">
          ⚖️ QA Interno vs QA Operativo — Conteo de Revisiones por Dev
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tickets clasificados por cobertura QA: <strong className="text-blue-600">Solo Int.</strong> (QA interno pero
          no operativo) · <strong className="text-purple-600">Solo Op.</strong> (QA operativo pero no interno) ·{" "}
          <strong className="text-green-600">Ambos</strong> (ambos revisores). La comparación de rondas aplica{" "}
          <u>solo a tickets Ambos</u>.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border text-blue-700 bg-blue-50 border-blue-300">
            Solo Int.: {totalSoloInt}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border text-purple-700 bg-purple-50 border-purple-300">
            Solo Op.: {totalSoloOp}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border text-green-700 bg-green-50 border-green-300">
            Ambos: {totalAmbos}
          </span>
          {totalSinQA > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border text-muted-foreground bg-muted">
              Sin QA: {totalSinQA}
            </span>
          )}
          {totalAmbos > 0 && (
            <>
              <span className="text-xs font-semibold text-blue-500 ml-2">Rondas Int. (Ambos): {globalAmbosInt}</span>
              <span className="text-xs font-semibold text-purple-500">Rondas Op. (Ambos): {globalAmbosOp}</span>
              {globalAmbosInt !== globalAmbosOp && (
                <span className="text-xs font-semibold text-orange-600">
                  Dif. global:{" "}
                  {globalAmbosInt > globalAmbosOp
                    ? `+${globalAmbosInt - globalAmbosOp} más en Interno`
                    : `+${globalAmbosOp - globalAmbosInt} más en Operativo`}
                </span>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Tabla resumen por dev */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-background sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Desarrollador</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Total</th>
                <th className="text-center px-3 py-2 font-medium text-blue-600">Solo Int.</th>
                <th className="text-center px-3 py-2 font-medium text-purple-600">Solo Op.</th>
                <th className="text-center px-3 py-2 font-medium text-green-600">Ambos</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Sin QA</th>
                <th className="text-center px-3 py-2 font-medium text-blue-500">Int. (Ambos)</th>
                <th className="text-center px-3 py-2 font-medium text-purple-500">Op. (Ambos)</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Diferencia</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map(([dev, d]) => {
                const diff = d.rondasInternoAmbos - d.rondasOperativoAmbos;
                const tag = balanceTag(d.rondasInternoAmbos, d.rondasOperativoAmbos);
                const hasAmbos = d.ambos > 0;
                return (
                  <tr key={dev} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium max-w-[160px] truncate">{dev}</td>
                    <td className="px-3 py-2 text-center text-muted-foreground">{d.total}</td>
                    <td className="px-3 py-2 text-center">
                      {d.soloInterno > 0 ? (
                        <span className="font-bold text-blue-600">{d.soloInterno}</span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {d.soloOperativo > 0 ? (
                        <span className="font-bold text-purple-600">{d.soloOperativo}</span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {d.ambos > 0 ? (
                        <span className="font-bold text-green-600">{d.ambos}</span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {d.sinQA > 0 ? (
                        <span className="font-semibold text-muted-foreground">{d.sinQA}</span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {hasAmbos ? (
                        <span className="font-bold text-blue-500">{d.rondasInternoAmbos}</span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {hasAmbos ? (
                        <span className="font-bold text-purple-500">{d.rondasOperativoAmbos}</span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold">
                      {!hasAmbos ? (
                        <span className="text-muted-foreground/30">—</span>
                      ) : diff === 0 ? (
                        <span className="text-green-600">—</span>
                      ) : diff > 0 ? (
                        <span className="text-blue-500">Int. +{diff}</span>
                      ) : (
                        <span className="text-purple-500">Op. +{Math.abs(diff)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {hasAmbos ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${tag.cls}`}>
                          {tag.label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detalle por dev: chips de categoría + barras + tabla de tickets */}
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
              {/* Cabecera con chips de clasificación */}
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

              {/* Barras comparativas (rondas totales del dev) */}
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

              {/* Tabla de tickets — ordenada: Ambos, Solo Int., Solo Op., Sin QA */}
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
const HORAS_TARGET_DEVS = ["jerson", "fabio", "mateo", "jairo"];

const HORAS_STATUS_GROUPS = [
  {
    key: "finalizados",
    label: "Finalizados",
    icon: "✅",
    regex: /done|finaliz|complet|cerrado|terminado/i,
    headerCls: "bg-green-50 border-green-200",
    badgeCls: "bg-green-100 text-green-700 border-green-200",
    barCls: "bg-green-500",
  },
  {
    key: "ajustes",
    label: "Ajustes",
    icon: "🔧",
    regex: /ajuste/i,
    headerCls: "bg-orange-50 border-orange-200",
    badgeCls: "bg-orange-100 text-orange-700 border-orange-200",
    barCls: "bg-orange-500",
  },
  {
    key: "desarrollo",
    label: "En Desarrollo",
    icon: "💻",
    regex: /desarrollo|in progress|en progreso|doing|progreso/i,
    headerCls: "bg-blue-50 border-blue-200",
    badgeCls: "bg-blue-100 text-blue-700 border-blue-200",
    barCls: "bg-blue-500",
  },
  {
    key: "porHacer",
    label: "Por Hacer",
    icon: "📋",
    regex: /to do|por hacer|backlog|abierto|sin iniciar|open/i,
    headerCls: "bg-zinc-50 border-zinc-200",
    badgeCls: "bg-zinc-100 text-zinc-600 border-zinc-200",
    barCls: "bg-zinc-400",
  },
  {
    key: "enPausa",
    label: "En Pausa",
    icon: "⏸️",
    regex: /pausa|pausado|hold|bloqueado|blocked/i,
    headerCls: "bg-yellow-50 border-yellow-200",
    badgeCls: "bg-yellow-100 text-yellow-700 border-yellow-200",
    barCls: "bg-yellow-500",
  },
];

function HorasEstadoSection({ timelineTickets }) {
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Filtrar solo tickets de los 4 devs objetivo
  const devTickets = (timelineTickets || []).filter((t) => {
    const devs = t.desarrolladores || [];
    return devs.some((d) => HORAS_TARGET_DEVS.some((p) => (d || "").toLowerCase().includes(p)));
  });

  if (devTickets.length === 0) return null;

  const totalEstimadoGlobal = devTickets.reduce((s, t) => s + (t.horas || 0), 0);

  // Agrupar por categoría de estado
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
        {/* Tabla resumen por estado */}
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

        {/* Detalle expandible por grupo */}
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
function RebotesQASection({ timelineTickets }) {
  const tickets = (timelineTickets || [])
    .filter((t) => t.contadorQAInterno !== null && t.contadorQAInterno !== undefined)
    .sort((a, b) => (b.rebotesQAInterno ?? 0) - (a.rebotesQAInterno ?? 0));

  if (tickets.length === 0) return null;

  const conRebotes = tickets.filter((t) => t.rebotesQAInterno > 0);
  const sinRebotes = tickets.filter((t) => t.rebotesQAInterno === 0);
  const totalRebotes = tickets.reduce((acc, t) => acc + (t.rebotesQAInterno ?? 0), 0);
  const maxContador = tickets[0]?.contadorQAInterno || 1;

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
          Rebotes = contador real de rondas QA Interno de Jira. Cuantos más rebotes, más veces regresó el ticket a
          desarrollo.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Barra visual por ticket */}
        <div className="space-y-2">
          {tickets.map((t) => {
            const barColor =
              t.rebotesQAInterno > 2 ? "bg-red-500" : t.rebotesQAInterno > 0 ? "bg-yellow-400" : "bg-green-400";
            const pct = Math.round((t.contadorQAInterno / maxContador) * 100);
            return (
              <div key={t.key} className="flex items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-primary w-20 flex-shrink-0">{t.key}</span>
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`Contador QA: ${t.contadorQAInterno}`}
                  />
                </div>
                <span className="w-20 text-left text-muted-foreground truncate">{t.assignee?.split(" ")[0]}</span>
                <span className="w-24 text-muted-foreground">
                  {t.revInterno !== "N/A" ? t.revInterno?.split(" ")[0] : "—"}
                </span>
                <span
                  className={`w-20 text-center font-semibold ${t.rebotesQAInterno > 0 ? "text-red-600" : "text-green-600"}`}>
                  {t.rebotesQAInterno > 0
                    ? `${t.rebotesQAInterno} rebote${t.rebotesQAInterno !== 1 ? "s" : ""}`
                    : "✓ OK"}
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

        {/* Leyenda columnas */}
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

// ─── Sección: Timeline detallado por ticket ─────────────────
function TimelineSection({ timelineTickets }) {
  const [filtro, setFiltro] = useState("");

  const tickets = (timelineTickets || [])
    .filter((t) => {
      if (!filtro) return true;
      const f = filtro.toLowerCase();
      return (
        t.key.toLowerCase().includes(f) || t.summary.toLowerCase().includes(f) || t.assignee.toLowerCase().includes(f)
      );
    })
    .sort((a, b) => (b.rebotesQAInterno ?? b.retornos ?? 0) - (a.rebotesQAInterno ?? a.retornos ?? 0));

  // Collect all unique status names for columns
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
                const rebotes = t.rebotesQAInterno ?? t.retornos ?? 0;
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
          ★ Rebotes QA del contador real de Jira · Retraso = fecha fin real vs estimada · Dur. Real = días corridos
          entre inicio real y fin real
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Sección: Pausas / Interrupciones ───────────────────────
const TIPO_CFG = {
  Interrupcion: { badge: "bg-red-100 text-red-700 border-red-200", icon: "🚨" },
  Reunion: { badge: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "📅" },
  Bloqueado: { badge: "bg-orange-100 text-orange-700 border-orange-200", icon: "🔒" },
  Planeacion: { badge: "bg-blue-100 text-blue-700 border-blue-200", icon: "📋" },
  Otro: { badge: "bg-zinc-100 text-zinc-600 border-zinc-200", icon: "📌" },
};

const PAUSA_EMPTY = {
  descripcion: "",
  tipo: "Otro",
  responsable: "",
  fecha_inicio: "",
  fecha_fin: "",
  ticket_relacionado: "",
};

function PausasSection({ pausas, crearPausa, eliminarPausa }) {
  const [form, setForm] = useState(PAUSA_EMPTY);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descripcion.trim()) return;
    setSaving(true);
    try {
      await crearPausa({
        ...form,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        ticket_relacionado: form.ticket_relacionado || null,
        responsable: form.responsable || null,
      });
      setForm(PAUSA_EMPTY);
      setFormOpen(false);
    } catch (err) {
      console.error("Error guardando pausa:", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">⏸️ Pausas e Interrupciones al Desarrollo</CardTitle>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setFormOpen((o) => !o)}>
            {formOpen ? "✕ Cancelar" : "+ Registrar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Actividades no planificadas que pausaron o retrasaron el desarrollo de esta versión.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Formulario */}
        {formOpen && (
          <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-muted/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs">Descripción *</Label>
                <Textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Ej: Reunión urgente de cliente que suspendió sprint por 2 días..."
                  className="text-xs mt-1 min-h-[60px]"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(TIPO_CFG).map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {TIPO_CFG[t].icon} {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Responsable / Área</Label>
                <Input
                  value={form.responsable}
                  onChange={(e) => setForm((p) => ({ ...p, responsable: e.target.value }))}
                  placeholder="Ej: Juan, Área de QA..."
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Fecha inicio</Label>
                <Input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Fecha fin</Label>
                <Input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Ticket relacionado (opcional)</Label>
                <Input
                  value={form.ticket_relacionado}
                  onChange={(e) => setForm((p) => ({ ...p, ticket_relacionado: e.target.value }))}
                  placeholder="Ej: ECO-123"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={saving} className="text-xs h-7">
                {saving ? "Guardando..." : "Guardar Pausa"}
              </Button>
            </div>
          </form>
        )}

        {/* Lista de pausas */}
        {pausas.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No hay pausas registradas. ¡Genial! 🎉</p>
        ) : (
          <div className="space-y-2">
            {pausas.map((p) => {
              const cfg = TIPO_CFG[p.tipo] || TIPO_CFG.Otro;
              return (
                <div
                  key={p.id}
                  className={`border-l-4 rounded-r-lg p-3 bg-muted/20 flex gap-3 ${cfg.badge.includes("red") ? "border-l-red-400" : cfg.badge.includes("yellow") ? "border-l-yellow-400" : cfg.badge.includes("orange") ? "border-l-orange-400" : cfg.badge.includes("blue") ? "border-l-blue-400" : "border-l-zinc-300"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-xs ${cfg.badge}`}>
                        {cfg.icon} {p.tipo}
                      </Badge>
                      {p.responsable && <span className="text-xs text-muted-foreground">👤 {p.responsable}</span>}
                      {p.ticket_relacionado && (
                        <span className="text-xs font-mono text-primary">{p.ticket_relacionado}</span>
                      )}
                      {(p.fecha_inicio || p.fecha_fin) && (
                        <span className="text-xs text-muted-foreground">
                          📅{" "}
                          {p.fecha_inicio
                            ? new Date(p.fecha_inicio).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
                            : "?"}{" "}
                          {p.fecha_fin
                            ? `→ ${new Date(p.fecha_fin).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`
                            : "→ en curso"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{p.descripcion}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-red-500 flex-shrink-0"
                    onClick={() => eliminarPausa(p.id)}
                    title="Eliminar">
                    🗑️
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Página principal ────────────────────────────────────────
export default function ReporteVersion() {
  const { datos, pausas, loading, error, fetchDatos, crearPausa, eliminarPausa } = useReporte();

  // fetchDatos is now handled inside useReporte on mount (cached)
  // The useEffect below is removed to avoid double-fetch

  const t = datos?.totales || {};
  const maxKpi = Math.max(t.soloInterno || 0, t.soloOperativo || 0, t.ambosQA || 0, 1);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Top bar */}
      <header className="bg-background border-b px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 flex-shrink-0 shadow-sm">
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-xl font-bold tracking-tight leading-tight">
            📈 Reporte de Versión — Project Lead
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sprint: Versión 3.10.6.1 stable · Proyecto Ecomex 360
            {datos?.generadoEn && (
              <>
                {" "}
                · Generado:{" "}
                {new Date(datos.generadoEn).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDatos}
          disabled={loading}
          className="text-xs sm:text-sm whitespace-nowrap">
          {loading ? "⏳ Analizando..." : "🔄 Actualizar Reporte"}
        </Button>
      </header>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Estado de carga inicial */}
        {loading && !datos && (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <div className="text-4xl mb-4 animate-pulse">📋</div>
            <p className="text-base font-medium">Analizando versión...</p>
            <p className="text-sm mt-1">Descargando tickets y historial de Jira</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-destructive text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-destructive">Error al generar el reporte</p>
                <p className="text-sm text-destructive/80 mt-1 font-mono break-all">{error}</p>
                <Button variant="link" onClick={fetchDatos} className="mt-2 p-0 h-auto text-sm font-bold">
                  Reintentar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Contenido del reporte */}
        {datos && (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <KpiCard
                icon="🎫"
                label="Total Tickets"
                value={t.total || 0}
                sub={`${t.activos || 0} activos · ${t.finalizados || 0} finalizados`}
                color="border-l-primary"
              />
              <KpiCard
                icon="🔵"
                label="Solo QA Interno"
                value={t.soloInterno || 0}
                sub="Sin revisión operativa"
                color="border-l-blue-400"
              />
              <KpiCard
                icon="🟣"
                label="Solo QA Operativo"
                value={t.soloOperativo || 0}
                sub="Sin revisión interna"
                color="border-l-purple-400"
              />
              <KpiCard
                icon="✅"
                label="Ambos QA"
                value={t.ambosQA || 0}
                sub="Interno + Operativo"
                color="border-l-green-400"
              />
              <KpiCard
                icon="✔️"
                label="Finalizados"
                value={t.finalizados || 0}
                sub={`${t.total ? Math.round((t.finalizados / t.total) * 100) : 0}% del total`}
                color="border-l-emerald-500"
              />
            </div>

            {/* ── Distribución de estados ── */}
            <StatusDistribucion statusCounts={datos.statusCounts} />

            {/* ── QA Breakdown ── */}
            <QABreakdownSection qaBreakdown={datos.qaBreakdown} />

            {/* ── Revisores ── */}
            <RevisoresSection revInternoStats={datos.revInternoStats} revOperativoStats={datos.revOperativoStats} />

            {/* ── Dev Stats ── */}
            <DevStatsSection devStats={datos.devStats} />

            {/* ── Horas Estimadas por Estado ── */}
            <HorasEstadoSection timelineTickets={datos.timelineTickets} />

            {/* ── QA Interno vs Operativo por Dev ── */}
            <QADevParidadSection timelineTickets={datos.timelineTickets} />

            {/* ── Rebotes QA por ticket ── */}
            <RebotesQASection timelineTickets={datos.timelineTickets} />

            {/* ── Timeline por ticket ── */}
            <TimelineSection timelineTickets={datos.timelineTickets} />

            {/* ── Pausas ── */}
            <PausasSection pausas={pausas} crearPausa={crearPausa} eliminarPausa={eliminarPausa} />
          </>
        )}
      </main>
    </div>
  );
}
