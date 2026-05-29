import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ReporteVersion from "./pages/ReporteVersion";
import SprintProgressFrederick from "./pages/SprintProgressFrederick";
import FinalizadosPorFecha from "./pages/FinalizadosPorFecha";
import Sidebar from "./components/Sidebar";
import { AppDataProvider } from "./context/AppDataContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { Menu } from "lucide-react";

export default function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const currentPage =
    location.pathname === "/reporte"
      ? "reporte"
      : location.pathname === "/finalizados"
        ? "finalizados"
        : location.pathname.startsWith("/sprint")
          ? "sprint"
          : "dashboard";

  const handleToggleCollapsed = (value) => {
    setCollapsed(value);
    localStorage.setItem("sidebar-collapsed", value);
  };

  return (
    <AppDataProvider>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-[#f2f6fc] font-sans">
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <div
            className={`fixed lg:relative z-50 lg:z-auto h-full transition-all duration-300 ease-out
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
              ${collapsed ? "lg:w-16" : "lg:w-72"}`}
          >
            <Sidebar
              currentPage={currentPage}
              collapsed={collapsed}
              onToggleCollapsed={handleToggleCollapsed}
              onCloseMobile={() => setSidebarOpen(false)}
            />
          </div>
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {!collapsed && (
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="Abrir panel"
                className="fixed bottom-6 left-6 z-30 lg:hidden size-12 rounded-full bg-navy-900 text-white shadow-lg shadow-navy-900/30 flex items-center justify-center hover:bg-navy-800 transition-all active:scale-95"
              >
                <Menu size={20} />
              </button>
            )}
            <Routes>
              <Route
                path="/"
                element={<Dashboard sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
              />
              <Route
                path="/dashboard"
                element={<Dashboard sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
              />
              <Route
                path="/reporte"
                element={<ReporteVersion sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
              />
              <Route
                path="/sprint/frederick"
                element={<SprintProgressFrederick sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
              />
              <Route
                path="/finalizados"
                element={<FinalizadosPorFecha sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </TooltipProvider>
    </AppDataProvider>
  );
}
