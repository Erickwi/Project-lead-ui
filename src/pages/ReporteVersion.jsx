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
import { PanelLeftOpen, RefreshCw, BarChart } from "lucide-react";
import { useEffect } from "react";

const DONE_RE = /done|cerrado|finalizado|completado/i;

function ReporteSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row items-stretch gap-2">
        <Card className="navy-card lg:w-48 flex-shrink-0">
          <CardContent className="pt-4 pb-3 px-4 space-y-2">
            <Skeleton className="h-3 w-24 bg-blue-100/50" />
            <Skeleton className="h-8 w-16 bg-blue-100/50" />
            <Skeleton className="h-3 w-32 bg-blue-100/50" />
          </CardContent>
        </Card>
        <div className="flex-1 rounded-xl border border-dashed border-blue-200/60 p-3 space-y-3 bg-blue-50/20">
          <Skeleton className="h-3 w-40 bg-blue-100/50" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={`skeleton-card-${i}`} className="navy-card">
                <CardContent className="pt-4 pb-3 px-4 space-y-2">
                  <Skeleton className="h-3 w-20 bg-blue-100/50" />
                  <Skeleton className="h-8 w-12 bg-blue-100/50" />
                  <Skeleton className="h-3 w-24 bg-blue-100/50" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={`skeleton-section-${i}`} className="navy-card">
            <CardContent className="pt-6 pb-4 px-4 space-y-3">
              <Skeleton className="h-5 w-48 bg-blue-100/50" />
              <Skeleton className="h-3 w-full bg-blue-100/50" />
              <Skeleton className="h-3 w-3/4 bg-blue-100/50" />
              <Skeleton className="h-20 w-full bg-blue-100/50 rounded-lg" />
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

  if (loadingBasicos || !datosBasicos) return <ReporteSkeleton />;

  if (error) {
    return (
      <div className="p-8 animate-fade-in">
        <div className="navy-card border-red-200/80 bg-red-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-800">Error al cargar el reporte</p>
              <p className="text-sm text-red-600/80 mt-1 font-mono">{error}</p>
              <button onClick={() => fetchDatos(true)} className="btn-ghost text-sm mt-2 p-0 h-auto font-semibold text-red-600 hover:text-red-700">
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <header className="page-header flex-shrink-0">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Abrir panel"
              className="lg:hidden size-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0"
            >
              <PanelLeftOpen size={16} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-heading navy-gradient-text">Reporte de Versión</h1>
              <p className="text-[10px] text-blue-400/60 font-medium tracking-wider uppercase">Métricas y análisis</p>
            </div>
          </div>
          <button onClick={handleRefresh} disabled={refreshing || loading} className="btn-outline text-xs">
            <RefreshCw size={13} className={refreshing || loading ? "animate-spin" : ""} />
            {refreshing || loading ? "Cargando..." : "Refrescar"}
          </button>
        </div>
      </header>

      <div className="space-y-6 p-3 sm:p-6">
        <div className="flex flex-col lg:flex-row items-stretch gap-2 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <Card className="navy-card lg:w-48 flex-shrink-0 border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="section-title flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
                Total Tickets
              </p>
              <p className="stat-value text-navy-800 mt-1">{t.total || 0}</p>
              <p className="text-xs text-blue-400/70 mt-0.5">
                {t.activos || 0} activos · {t.finalizados || 0} finalizados
              </p>
            </CardContent>
          </Card>

          <div className="hidden lg:flex flex-col items-center justify-center gap-1 text-blue-300/40 px-0.5 flex-shrink-0">
            <span className="text-[9px] font-medium text-center leading-tight uppercase tracking-wider">divide<br />en</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </div>

          <div className="flex lg:hidden items-center justify-center gap-1.5 text-blue-400/60 text-xs py-0.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="m5 12 7 7 7-7" />
            </svg>
            <span className="font-medium">distribución por cobertura QA</span>
          </div>

          <div className="flex-1 min-w-0 rounded-xl border border-dashed border-blue-200/60 p-3 space-y-2.5 bg-blue-50/30">
            <div className="flex items-center justify-between">
              <span className="section-title">Cobertura de QA por ticket</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  qaSum === (t.total || 0)
                    ? "badge-green"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
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
                color="border-l-emerald-400"
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

        <div className="flex flex-col lg:flex-row items-start gap-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="hidden lg:block lg:w-48 flex-shrink-0" aria-hidden="true" />

          <div className="hidden lg:flex flex-col items-center justify-start gap-1 text-blue-300/40 px-0.5 flex-shrink-0 pt-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
            <span className="text-[9px] font-medium text-center leading-tight uppercase tracking-wider">avance<br />sprint</span>
          </div>

          <div className="flex lg:hidden items-center justify-center gap-1.5 text-blue-400/60 text-xs py-0.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="m5 12 7 7 7-7" />
            </svg>
            <span className="font-medium">avance del sprint</span>
          </div>

          <div className="rounded-xl border border-dashed border-emerald-200/80 bg-emerald-50/40 p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
            <KpiCard
              icon="✔️"
              label="Finalizados"
              value={t.finalizados || 0}
              sub={`${t.total ? Math.round((t.finalizados / t.total) * 100) : 0}% del total`}
              color="border-l-emerald-500"
            />
            <div className="flex items-baseline gap-1.5 pl-1 text-sm text-blue-400/60">
              <span className="stat-value text-emerald-600">{t.finalizados || 0}</span>
              <span>de</span>
              <span className="stat-value text-navy-800">{t.total || 0}</span>
              <span>tickets totales</span>
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <StatusDistribucion statusCounts={datosBasicos.statusCounts} />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <ModuloPorTipoSection moduloStats={datosBasicos.moduloStats} />
        </div>
        {datosChangelogs && (
          <div className="mt-3 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <Card className="navy-card border-l-4 border-l-amber-400">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="section-title flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                  </svg>
                  Sin observaciones — paso directo a Finalizado
                </p>
                <p className="stat-value text-amber-600 mt-1">{datosChangelogs.singleStepNoCommentsCount || 0}</p>
                <p className="text-xs text-blue-400/70 mt-0.5">
                  Tickets sin comentarios y con una sola transición a finalizado
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <QABreakdownSection qaBreakdown={datosBasicos.qaBreakdown} />
        </div>

        {loadingChangelogs && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-blue-400/70">
              <RefreshCw size={14} className="animate-spin" />
              Cargando datos detallados...
            </div>
            {[1, 2, 3].map((i) => (
              <Card key={`changelog-skel-${i}`} className="navy-card">
                <CardContent className="pt-6 pb-4 px-4 space-y-3">
                  <Skeleton className="h-5 w-48 bg-blue-100/50" />
                  <Skeleton className="h-3 w-full bg-blue-100/50" />
                  <Skeleton className="h-20 w-full bg-blue-100/50 rounded-lg" />
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
