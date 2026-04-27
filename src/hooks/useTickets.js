import { useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';

export function useTickets() {
  const {
    tickets, doneTickets,
    ticketsLoading: loading,
    ticketsError: error,
    fetchTickets,
    updateTicketInfo,
    updateDeployStatus,
  } = useAppData();

  // Load on first use if not already fetched
  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return {
    tickets,
    doneTickets,
    loading,
    error,
    refetch: () => fetchTickets(true), // force=true bypasses cache
    updateTicketInfo,
    updateDeployStatus,
  };
}
