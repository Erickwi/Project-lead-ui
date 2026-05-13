import { useReporte } from "../hooks/useReporte";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/pages/reporte/reportHelpers";
import {
  StatusDistribucion,
  ModuloPorTipoSection,
  HorasEstadoSection,
  QADevParidadSection,
  RebotesQASection,
} from "@/pages/reporte/ReporteSections";
import QABreakdownSection from "@/pages/reporte/QABreakdownSection";
import RevisoresSection from "@/pages/reporte/RevisoresSection";
import DevStatsSection from "@/pages/reporte/DevStatsSection";
import TimelineSectionImported from "@/pages/reporte/TimelineSection";
import PausasSection from "@/pages/reporte/PausasSection";
import { PanelLeftOpen, RefreshCw } from "lucide-react";
import { useEffect } from "react";

const DONE_RE = /done|cerrado|finalizado|completado/i;

function ReporteSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col lg:flex-row items-stretch gap-2">
        <Card className="lg:w-48 flex-shrink-0">
          <CardContent className="pt-4 pb-3 px-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
        <div className="flex-1 rounded-xl border border-dashed p-3 space-y-3">
          <Skeleton className="h-3 w-40" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={`skeleton-card-${i}`}>
                <CardContent className="pt-4 pb-3 px-4 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={`skeleton-section-${i}`}>
            <CardContent className="pt-6 pb-4 px-4 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ReporteVersion({ sidebarOpen, setSidebarOpen }) {
  const [refreshing, setRefreshing] = useState(false);
  const {
    datos,
    datosBasicos,
    datosChangelogs,
    pausas,
    loading,
    loadingBasicos,
    loadingChangelogs,
    error,
    crearPausa,
    eliminarPausa,
    fetchDatos,
  } = useReporte();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDatos(true);
    } catch (e) {
      console.error("Error al refrescar reporte:", e.message || e);
    } finally {
      setRefreshing(false);
    }
  };

  // Mostrar skeleton solo mientras cargan los datos básicos
  if (loadingBasicos || !datosBasicos) return <ReporteSkeleton />;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-destructive text-2xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-bold text-destructive">Error al cargar el reporte</p>
              <p className="text-sm text-destructive/80 mt-1 font-mono">{error}</p>
              <Button variant="link" onClick={() => fetchDatos(true)} className="mt-2 p-0 h-auto text-sm font-bold">
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Datos básicos (ya cargados)
  const totales = datosBasicos.totales || {};
  const qaBreakdown = datosBasicos.qaBreakdown || {};
  const t = {
    total: totales.total || 0,
    activos: totales.activos || 0,
    finalizados: totales.finalizados || 0,
    soloInterno: qaBreakdown.soloInterno?.length || 0,
    soloOperativo: qaBreakdown.soloOperativo?.length || 0,
    ambosQA: qaBreakdown.ambos?.length || 0,
    sinQA: qaBreakdown.sinQA?.length || 0,
  };
  const qaSum = t.soloInterno + t.soloOperativo + t.ambosQA + t.sinQA;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header móvil con botón sidebar */}
      <header className="bg-background border-b px-4 py-3 flex items-center gap-3 lg:hidden flex-shrink-0">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Abrir panel"
          className="size-8 bg-primary/10 hover:bg-primary/20 text-primary rounded-md shadow-sm ring-1 ring-primary/25 flex items-center justify-center flex-shrink-0">
          <PanelLeftOpen size={16} />
        </button>
        <h1 className="text-base font-bold tracking-tight">📈 Reporte de Versión</h1>
        <div className="ml-auto">
          <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={refreshing || loading}>
            {refreshing || loading ? "⏳" : <RefreshCw size={14} />}
          </Button>
        </div>
      </header>
      {/* Header escritorio: título + refresh */}
      <div className="hidden lg:flex items-center justify-between px-4 pt-4">
        <h1 className="text-lg font-semibold">📈 Reporte de Version</h1>
        <div>
          <Button size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
            {refreshing || loading ? "Recargando..." : "Refrescar"}
          </Button>
        </div>
      </div>
      <div className="space-y-6 p-3 sm:p-6">
        <div className="flex flex-col lg:flex-row items-stretch gap-2">
          <Card className="shadow-sm lg:w-48 flex-shrink-0">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">🎫 Total Tickets</p>
              <p className="text-3xl font-semibold mt-1">{t.total || 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.activos || 0} activos · {t.finalizados || 0} finalizados
              </p>
            </CardContent>
          </Card>

          <div className="hidden lg:flex flex-col items-center justify-center gap-1 text-muted-foreground/60 px-0.5 flex-shrink-0">
            <span className="text-[9px] font-medium text-center leading-tight">
              divide
              <br />
              en
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>

          <div className="flex lg:hidden items-center justify-center gap-1.5 text-muted-foreground text-xs py-0.5">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="m5 12 7 7 7-7" />
            </svg>
            <span>distribución por cobertura QA</span>
          </div>

          <div className="flex-1 min-w-0 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Cobertura de QA por ticket
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  qaSum === (t.total || 0)
                    ? "text-green-700 border-green-300 bg-green-50 dark:bg-green-950/40 dark:border-green-700 dark:text-green-300"
                    : "text-orange-700 border-orange-300 bg-orange-50"
                }`}>
                {qaSum} / {t.total || 0} {qaSum === (t.total || 0) ? "✓" : "⚠"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <KpiCard
                icon="🔵"
                label="Solo QA Interno"
                value={t.soloInterno || 0}
                sub="Sin rev. operativa"
                color="border-l-blue-400"
              />
              <KpiCard
                icon="🟣"
                label="Solo QA Operativo"
                value={t.soloOperativo || 0}
                sub="Sin rev. interna"
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
                icon="⬜"
                label="Sin QA"
                value={t.sinQA || 0}
                sub="Sin revisor asignado"
                color="border-l-zinc-400"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-2">
          <div className="hidden lg:block lg:w-48 flex-shrink-0" aria-hidden="true" />

          <div className="hidden lg:flex flex-col items-center justify-start gap-1 text-muted-foreground/60 px-0.5 flex-shrink-0 pt-3">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            <span className="text-[9px] font-medium text-center leading-tight">
              avance
              <br />
              sprint
            </span>
          </div>

          <div className="flex lg:hidden items-center justify-center gap-1.5 text-muted-foreground text-xs py-0.5">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="m5 12 7 7 7-7" />
            </svg>
            <span>avance del sprint</span>
          </div>

          <div className="rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20 p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <KpiCard
              icon="✔️"
              label="Finalizados"
              value={t.finalizados || 0}
              sub={`${t.total ? Math.round((t.finalizados / t.total) * 100) : 0}% del total`}
              color="border-l-emerald-500"
            />
            <div className="flex items-baseline gap-1.5 pl-1 text-sm text-muted-foreground">
              <span className="text-2xl font-extrabold text-emerald-600">{t.finalizados || 0}</span>
              <span>de</span>
              <span className="text-2xl font-extrabold text-foreground">{t.total || 0}</span>
              <span>tickets totales</span>
            </div>
          </div>
        </div>

        <StatusDistribucion statusCounts={datosBasicos.statusCounts} />
        <ModuloPorTipoSection moduloStats={datosBasicos.moduloStats} />
        <QABreakdownSection qaBreakdown={datosBasicos.qaBreakdown} />

        {/* Secciones pesadas - se cargan progresivamente */}
        {loadingChangelogs && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="animate-spin">⏳</span>
              Cargando datos detallados (timeline, desarrolladores, revisores)...
            </div>
            {[1, 2, 3].map((i) => (
              <Card key={`changelog-skel-${i}`}>
                <CardContent className="pt-6 pb-4 px-4 space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {datosChangelogs && (
          <>
            <RevisoresSection
              revInternoStats={datosChangelogs.revInternoStats}
              revOperativoStats={datosChangelogs.revOperativoStats}
            />
            <DevStatsSection devStats={datosChangelogs.devStats} />
            <HorasEstadoSection timelineTickets={datosChangelogs.timelineTickets} />
            <QADevParidadSection timelineTickets={datosChangelogs.timelineTickets} />
            <RebotesQASection timelineTickets={datosChangelogs.timelineTickets} />
            <TimelineSectionImported timelineTickets={datosChangelogs.timelineTickets} />
          </>
        )}

        <PausasSection pausas={pausas} crearPausa={crearPausa} eliminarPausa={eliminarPausa} />
      </div>
    </div>
  );
}
