import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useTickets() {
  const [tickets, setTickets]         = useState([]);
  const [doneTickets, setDoneTickets] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [active, done] = await Promise.all([
        api.get('/tickets'),
        api.get('/tickets/done'),
      ]);
      setTickets(active.data.tickets);
      setDoneTickets(done.data.tickets);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const updateTicketInfo = useCallback(async (key, info) => {
    // Optimistic update first — before the API call
    setTickets(prev => prev.map(t => (t.key === key ? { ...t, ...info } : t)));
    setDoneTickets(prev => prev.map(t => (t.key === key ? { ...t, ...info } : t)));
    try {
      await api.put(`/ticket-info/${key}`, info);
    } catch (err) {
      console.error('Error al guardar info del ticket:', err.message);
    }
  }, []);

  const updateDeployStatus = useCallback(async (key, deploy_status) => {
    try {
      await api.patch(`/ticket-info/${key}/deploy-status`, { deploy_status });
      setDoneTickets(prev =>
        prev.map(t => (t.key === key ? { ...t, deploy_status } : t))
      );
    } catch (err) {
      console.error('Error al actualizar deploy_status:', err.message);
    }
  }, []);

  return { tickets, doneTickets, loading, error, refetch: fetchTickets, updateTicketInfo, updateDeployStatus };
}
