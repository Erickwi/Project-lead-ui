import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useRecordatorios() {
  const [recordatorios, setRecordatorios] = useState([]);
  const [loading, setLoading]             = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/recordatorios');
      setRecordatorios(data.recordatorios);
    } catch (err) {
      console.error('Error al cargar recordatorios:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const crear = async (rec) => {
    const { data } = await api.post('/recordatorios', rec);
    setRecordatorios(prev => [...prev, data]);
  };

  const actualizar = async (id, rec) => {
    await api.put(`/recordatorios/${id}`, rec);
    setRecordatorios(prev =>
      prev.map(r => (r.id === id ? { ...r, ...rec } : r))
    );
  };

  const eliminar = async (id) => {
    await api.delete(`/recordatorios/${id}`);
    setRecordatorios(prev => prev.filter(r => r.id !== id));
  };

  const reorder = (orden) => {
    const intOrden = orden.map(id => Number(id));
    // Actualizar estado inmediatamente (optimistic)
    setRecordatorios(prev => {
      const sorted = [...prev].sort((a, b) => {
        const idxA = intOrden.indexOf(Number(a.id));
        const idxB = intOrden.indexOf(Number(b.id));
        return idxA - idxB;
      });
      return sorted.map((r, i) => ({ ...r, posicion: i + 1 }));
    });
    // Llamada API en background
    api.put('/recordatorios/reorder', { orden: intOrden }).catch(err => {
      console.error('Error reorder:', err.message);
    });
  };

  return { recordatorios, loading, crear, actualizar, eliminar, reorder };
}
