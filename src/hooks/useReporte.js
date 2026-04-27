import { useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';

export function useReporte() {
  const {
    datos, pausas,
    reporteLoading: loading,
    reporteError: error,
    fetchDatos: fetchDatosCtx,
    crearPausa,
    eliminarPausa,
  } = useAppData();

  // Load on first use if not already fetched (uses cache)
  useEffect(() => { fetchDatosCtx(); }, [fetchDatosCtx]);

  return {
    datos,
    pausas,
    loading,
    loadingPausas: false,
    error,
    fetchDatos: () => fetchDatosCtx(true), // force refresh on manual button
    crearPausa,
    eliminarPausa,
  };
}
