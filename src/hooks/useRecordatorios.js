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

  return { recordatorios, loading, crear, actualizar, eliminar };
}
