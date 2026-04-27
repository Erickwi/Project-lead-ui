import { Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ReporteVersion from "./pages/ReporteVersion";
import Sidebar from "./components/Sidebar";
import { AppDataProvider } from "./context/AppDataContext";

export default function App() {
  const location = useLocation();
  const currentPage = location.pathname === "/reporte" ? "reporte" : "dashboard";

  return (
    <AppDataProvider>
      <div className="flex h-screen overflow-hidden bg-muted/30 font-sans">
        <Sidebar currentPage={currentPage} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reporte" element={<ReporteVersion />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </AppDataProvider>
  );
}
