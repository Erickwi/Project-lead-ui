import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import ReporteVersion from "./pages/ReporteVersion";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30 font-sans">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {page === "dashboard" ? <Dashboard /> : <ReporteVersion />}
      </div>
    </div>
  );
}
