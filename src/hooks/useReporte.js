import { useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';

export function useReporte() {
  const {
    datos, datosBasicos, datosChangelogs, pausas,
    reporteLoading: loading,
    reporteLoadingBasicos: loadingBasicos,
    reporteLoadingChangelogs: loadingChangelogs,
    reporteError: error,
    fetchDatos: fetchDatosCtx,
    fetchDatosBasicos,
    fetchDatosChangelogs,
    crearPausa,
    eliminarPausa,
  } = useAppData();

  // Carga progresiva: primero datos básicos y luego changelogs
  useEffect(() => {
    fetchDatosBasicos();
    // Cargar changelogs después de un breve delay para no bloquear la UI
    const timer = setTimeout(() => {
      fetchDatosChangelogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchDatosBasicos, fetchDatosChangelogs]);

  return {
    datos,
    datosBasicos,
    datosChangelogs,
    pausas,
    loading,
    loadingBasicos,
    loadingChangelogs,
    loadingPausas: false,
    error,
    fetchDatos: () => fetchDatosCtx(true),
    crearPausa,
    eliminarPausa,
  };
}
