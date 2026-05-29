import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import TicketRow from "./TicketRow";
import SprintAnalysisSection from "./SprintAnalysisSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const EQUIPO_DEV = new Set(["Jairo Proaño", "Jerson Andino", "Mateo Congo", "Erick Ramírez", "Fabio Enríquez"]);
const EQUIPO_QA = new Set(["Diego Rosales", "Samuel López", "ALEXANDER ANDAGOYA", "Ana Cristina Catucuamba"]);

const QA_KEYWORDS_LOWER = new Set(["operativas", "pruebas"]);

function loadStyle(horas) {
  if (horas > 32) return { badge: "bg-red-100 text-red-700 border-red-200", bar: "bg-red-500" };
  if (horas >= 16) return { badge: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-400" };
  return { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" };
}

function DevCard({ nombre, tickets, onUpdate }) {
  const [open, setOpen] = useState(true);
  const totalHoras = tickets.reduce((s, t) => s + (t.horas || 0), 0);
  const style = loadStyle(totalHoras);

  const sorted = tickets.toSorted((a, b) => a.priorityOrder - b.priorityOrder);
  const totalSubtasks = tickets.reduce((s, t) => s + (t.subtasks?.length || 0), 0);
  const totalItems = tickets.length + totalSubtasks;

  return (
    <Card className="navy-card mb-4 overflow-hidden">
      <CardHeader className="p-0">
        <Button
          variant="ghost"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-50/30 rounded-none h-auto text-left group">
          <div className="flex items-center gap-3">
            <span className={`text-blue-300/40 text-sm transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </span>
            <div className="size-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-600">
              {nombre.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-navy-800 text-sm">{nombre}</span>
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200 text-xs rounded-full font-medium">
              {totalItems} {totalItems === 1 ? "ticket" : "tickets"}
            </Badge>
          </div>
          <Badge className={cn("text-xs font-bold border", style.badge)}>Carga: {totalHoras}h</Badge>
        </Button>
      </CardHeader>

      {open && (
        <CardContent className="p-0 border-t border-blue-100/50 animate-fade-in">
          <div className="overflow-x-auto">
            <div className="divide-y divide-blue-50 min-w-[700px]">
              {sorted.map((t) => (
                <TicketRow key={t.key} ticket={t} onUpdate={onUpdate} />
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function deployStatusBadge(status) {
  if (status === "confirmado")
    return (
      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs border">✓ Confirmado</Badge>
    );
  if (status === "notificado")
    return (
      <Badge className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50 text-xs border">⏳ Notificado</Badge>
    );
  return (
    <Badge variant="outline" className="text-xs text-blue-400/60 border-blue-200 bg-blue-50/30">
      Pendiente
    </Badge>
  );
}

export default function DevAccordion({ tickets, onUpdate, onUpdateDeployStatus, onOpenDeployModal }) {
  const devMap = {};
  const qaMap = {};

  for (const ticket of tickets) {
    const name = ticket.assignee;
    const st = ticket.status.toLowerCase();

    if (EQUIPO_QA.has(name) || QA_KEYWORDS_LOWER.has(st) || st.includes("operativas") || st.includes("pruebas")) {
      if (!qaMap[name]) qaMap[name] = [];
      qaMap[name].push(ticket);
    } else {
      if (!devMap[name]) devMap[name] = [];
      devMap[name].push(ticket);
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-blue-400/60">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-200 mb-4">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
        </svg>
        <p className="text-lg font-semibold text-navy-600">No hay tickets activos en este sprint</p>
        <p className="text-sm mt-1">Presiona "Sincronizar Jira" para cargar los datos.</p>
      </div>
    );
  }

  return (
    <div>
      {Object.keys(devMap).length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-7 rounded-full bg-blue-100 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-600">
                <polyline points="16 3 21 3 21 8"/><path d="M4 14a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M15.7 8.3 21 3"/><path d="M11 21H3"/>
              </svg>
            </div>
            <h2 className="section-title">Área Desarrollo</h2>
            <Separator className="flex-1 bg-blue-100/50" />
          </div>
          {Object.entries(devMap).map(([nombre, tks]) => (
            <DevCard key={nombre} nombre={nombre} tickets={tks} onUpdate={onUpdate} />
          ))}
        </section>
      )}

      {Object.keys(qaMap).length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-7 rounded-full bg-purple-100 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-600">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </div>
            <h2 className="section-title text-purple-400">Área Pruebas (QA / Ops)</h2>
            <Separator className="flex-1 bg-purple-100/30" />
          </div>
          {Object.entries(qaMap).map(([nombre, tks]) => (
            <DevCard key={nombre} nombre={nombre} tickets={tks} onUpdate={onUpdate} />
          ))}
        </section>
      )}

      <SprintAnalysisSection />
    </div>
  );
}
