import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ReporteVersion from "./pages/ReporteVersion";
import FinalizadosPorFecha from "./pages/FinalizadosPorFecha";
import Sidebar from "./components/Sidebar";
import { AppDataProvider } from "./context/AppDataContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

export default function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const currentPage =
    location.pathname === "/reporte" ? "reporte" : location.pathname === "/finalizados" ? "finalizados" : "dashboard";

  const handleToggleCollapsed = (value) => {
    setCollapsed(value);
    localStorage.setItem("sidebar-collapsed", value);
  };

  return (
    <AppDataProvider>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-muted/30 font-sans">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}
          <div
            className={`fixed lg:relative z-50 lg:z-auto h-full ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} transition-[transform,width] duration-200 ${collapsed ? "w-12" : "w-72"}`}>
            <Sidebar
              currentPage={currentPage}
              collapsed={collapsed}
              onToggleCollapsed={handleToggleCollapsed}
              onCloseMobile={() => setSidebarOpen(false)}
            />
          </div>
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
              <Route
                path="/dashboard"
                element={<Dashboard sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
              />
              <Route
                path="/reporte"
                element={<ReporteVersion sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
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
