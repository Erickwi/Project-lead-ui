import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useReporte() {
  const [datos, setDatos] = useState(null);
  const [pausas, setPausas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPausas, setLoadingPausas] = useState(false);
  const [error, setError] = useState(null);

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reporte/datos');
      setDatos(res.data);
      setPausas(res.data.pausas || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPausas = useCallback(async () => {
    setLoadingPausas(true);
    try {
      const res = await api.get('/reporte/pausas');
      setPausas(res.data.pausas || []);
    } catch (err) {
      console.error('Error cargando pausas:', err.message);
    } finally {
      setLoadingPausas(false);
    }
  }, []);

  const crearPausa = useCallback(async (pausa) => {
    const res = await api.post('/reporte/pausas', pausa);
    setPausas(prev => [res.data.pausa, ...prev]);
    return res.data.pausa;
  }, []);

  const eliminarPausa = useCallback(async (id) => {
    await api.delete(`/reporte/pausas/${id}`);
    setPausas(prev => prev.filter(p => p.id !== id));
  }, []);

  return {
    datos,
    pausas,
    loading,
    loadingPausas,
    error,
    fetchDatos,
    fetchPausas,
    crearPausa,
    eliminarPausa,
  };
}
