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
    const newRec = data.recordatorio || data;
    setRecordatorios(prev => [...prev, newRec]);
  };

  const actualizar = async (id, rec) => {
    const idNum = Number(id);
    await api.put(`/recordatorios/${idNum}`, rec);
    setRecordatorios(prev =>
      prev.map(r => (Number(r.id) === idNum ? { ...r, ...rec } : r))
    );
  };

  const eliminar = async (id) => {
    const idNum = Number(id);
    // Optimistic update: archive deleted item to localStorage history
    setRecordatorios(prev => {
      const toDelete = prev.find(r => Number(r.id) === idNum);
      if (toDelete) {
        try {
          const hist = JSON.parse(localStorage.getItem('deletedRecordatoriosHistory') || '[]');
          hist.unshift({ ...toDelete, deletedAt: new Date().toISOString() });
          localStorage.setItem('deletedRecordatoriosHistory', JSON.stringify(hist.slice(0, 100)));
        } catch (err) {
          console.error('Error archivando historial:', err.message);
        }
      }
      return prev.filter(r => Number(r.id) !== idNum);
    });

    try {
      await api.delete(`/recordatorios/${idNum}`);
    } catch (err) {
      console.error('Error eliminando recordatorio:', err.message);
      // rollback by refetching
      fetchAll();
    }
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
