import { createContext, useContext, useState, useCallback, useRef } from "react";
import api from "../api/client";

const AppDataContext = createContext(null);

// ─── Tickets cache ────────────────────────────────────────────────────────────

function useTicketsState() {
  const [tickets, setTickets] = useState([]);
  const [doneTickets, setDoneTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  const fetchTickets = useCallback(async (force = false) => {
    if (hasFetched.current && !force) return; // use cache
    setLoading(true);
    setError(null);
    try {
      const [active, done] = await Promise.all([api.get("/tickets"), api.get("/tickets/done")]);
      setTickets(active.data.tickets);
      setDoneTickets(done.data.tickets);
      hasFetched.current = true;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTicketInfo = useCallback(async (key, info) => {
    setTickets((prev) => prev.map((t) => (t.key === key ? { ...t, ...info } : t)));
    setDoneTickets((prev) => prev.map((t) => (t.key === key ? { ...t, ...info } : t)));
    try {
      await api.put(`/ticket-info/${key}`, info);
    } catch (err) {
      console.error("Error al guardar info del ticket:", err.message);
    }
  }, []);

  const updateDeployStatus = useCallback(async (key, deploy_status) => {
    try {
      await api.patch(`/ticket-info/${key}/deploy-status`, { deploy_status });
      setDoneTickets((prev) => prev.map((t) => (t.key === key ? { ...t, deploy_status } : t)));
    } catch (err) {
      console.error("Error al actualizar deploy_status:", err.message);
    }
  }, []);

  return {
    tickets,
    doneTickets,
    ticketsLoading: loading,
    ticketsError: error,
    fetchTickets,
    updateTicketInfo,
    updateDeployStatus,
  };
}

// ─── Reporte cache ────────────────────────────────────────────────────────────

function useReporteState() {
  const [datos, setDatos] = useState(null);
  const [pausas, setPausas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  const fetchDatos = useCallback(async (force = false) => {
    if (hasFetched.current && !force) return; // use cache
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/reporte/datos");
      setDatos(res.data);
      setPausas(res.data.pausas || []);
      hasFetched.current = true;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearPausa = useCallback(async (pausa) => {
    const res = await api.post("/reporte/pausas", pausa);
    setPausas((prev) => [res.data.pausa, ...prev]);
    return res.data.pausa;
  }, []);

  const eliminarPausa = useCallback(async (id) => {
    await api.delete(`/reporte/pausas/${id}`);
    setPausas((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    datos,
    pausas,
    reporteLoading: loading,
    reporteError: error,
    fetchDatos,
    crearPausa,
    eliminarPausa,
  };
}

// ─── Sprint Analysis cache ────────────────────────────────────────────────────

function useSprintAnalysisState() {
  const [movedTickets, setMovedTickets] = useState([]);
  const [done306, setDone306] = useState([]);
  const [done307, setDone307] = useState([]);
  const [configured, setConfigured] = useState({ moved: false, done306: false, done307: false });
  const [queryErrors, setQueryErrors] = useState({ moved: null, done306: null, done307: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  const fetchSprintAnalysis = useCallback(async (force = false) => {
    if (hasFetched.current && !force) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/tickets/sprint-analysis");
      setMovedTickets(res.data.movedTickets || []);
      setDone306(res.data.done306 || []);
      setDone307(res.data.done307 || []);
      setConfigured(res.data.configured || { moved: false, done306: false, done307: false });
      setQueryErrors(res.data.errors || { moved: null, done306: null, done307: null });
      hasFetched.current = true;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sprintMovedTickets: movedTickets,
    sprintDone306: done306,
    sprintDone307: done307,
    sprintConfigured: configured,
    sprintQueryErrors: queryErrors,
    sprintAnalysisLoading: loading,
    sprintAnalysisError: error,
    fetchSprintAnalysis,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppDataProvider({ children }) {
  const ticketsState = useTicketsState();
  const reporteState = useReporteState();
  const sprintState = useSprintAnalysisState();

  return (
    <AppDataContext.Provider value={{ ...ticketsState, ...reporteState, ...sprintState }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
