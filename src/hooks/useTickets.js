import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useTickets() {
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/tickets');
      setTickets(data.tickets);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  /**
   * Actualiza cliente/día/estado de un ticket en la API y refleja el cambio
   * localmente de forma optimista.
   */
  const updateTicketInfo = useCallback(async (key, info) => {
    try {
      await api.put(`/ticket-info/${key}`, info);
      setTickets(prev =>
        prev.map(t => (t.key === key ? { ...t, ...info } : t))
      );
    } catch (err) {
      console.error('Error al guardar info del ticket:', err.message);
    }
  }, []);

  return { tickets, loading, error, refetch: fetchTickets, updateTicketInfo };
}
