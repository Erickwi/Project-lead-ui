import { useState, useEffect } from "react";
import { parseISO, isValid } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { MarkdownText } from "@/components/ui/markdown-text";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CLIENTES = ["OCA", "Rocalvi", "FMA", "Chavez", "Pacustoms", "Lopez Mena"];

const PRIORITY_BADGE = {
  Highest: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  High: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  Low: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  Lowest: "bg-muted text-muted-foreground border-border hover:bg-muted",
};

const JIRA_BASE = "https://qualitysoftec.atlassian.net/browse/";

const normalizeDate = (val) => {
  if (!val) return "";
  const d = parseISO(val);
  return isValid(d) ? val : "";
};

export default function TicketRow({ ticket, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [cliente, setCliente] = useState(ticket.cliente_nombre || "");
  const [dia, setDia] = useState(normalizeDate(ticket.dia_despliegue));
  const [otrasVersiones, setOtrasVersiones] = useState(ticket.otrasVersiones || "");
  const [mostrarClienteDespliegue, setMostrarClienteDespliegue] = useState(ticket.mostrarClienteDespliegue !== false);

  useEffect(() => {
    setCliente(ticket.cliente_nombre || "");
    setDia(normalizeDate(ticket.dia_despliegue));
    setOtrasVersiones(ticket.otrasVersiones || "");
    setMostrarClienteDespliegue(ticket.mostrarClienteDespliegue !== false);
  }, [ticket.cliente_nombre, ticket.dia_despliegue, ticket.otrasVersiones, ticket.mostrarClienteDespliegue]);

  const persist = (updates) => {
    onUpdate(ticket.key, {
      cliente_nombre: updates.cliente_nombre,
      dia_despliegue: updates.dia_despliegue,
      estado_entrega: ticket.estado_entrega,
      otrasVersiones: updates.otrasVersiones,
      mostrarClienteDespliegue: updates.mostrarClienteDespliegue,
    });
  };

  const handleChangeCliente = (val) => {
    const newVal = val === "__none__" ? "" : val;
    setCliente(newVal);
    persist({ cliente_nombre: newVal, dia_despliegue: dia, otrasVersiones, mostrarClienteDespliegue });
  };

  const handleChangeDia = (val) => {
    setDia(val);
    persist({ cliente_nombre: cliente, dia_despliegue: val, otrasVersiones, mostrarClienteDespliegue });
  };

  const handleChangeOtrasVersiones = (val) => {
    setOtrasVersiones(val);
    persist({ cliente_nombre: cliente, dia_despliegue: dia, otrasVersiones: val, mostrarClienteDespliegue });
  };

  const handleChangeMostrarClienteDespliegue = (val) => {
    const newVal = val === "si";
    setMostrarClienteDespliegue(newVal);
    persist({ cliente_nombre: cliente, dia_despliegue: dia, otrasVersiones, mostrarClienteDespliegue: newVal });
  };

  const badgeClass = PRIORITY_BADGE[ticket.priority] || PRIORITY_BADGE.Medium;

  const fechaDisplay = ticket.fechaFin
    ? new Date(ticket.fechaFin).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Sin fecha";

  return (
    <div className="border-b last:border-0">
      {/* ── Fila clickeable ── */}
      <div
        className="flex items-center gap-2 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors select-none"
        onClick={() => setOpen((o) => !o)}>
        {/* Caret */}
        <span className="text-muted-foreground/50 text-xs w-3 flex-shrink-0">{open ? "▼" : "▶"}</span>

        {/* Key + enlace Jira */}
        <a
          href={`${JIRA_BASE}${ticket.key}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-primary font-bold text-xs hover:underline w-28 flex-shrink-0">
          {ticket.key}
        </a>

        {/* Badge prioridad */}
        <Badge className={cn("text-xs font-semibold flex-shrink-0 border", badgeClass)}>{ticket.priority}</Badge>

        {/* Indicador subtask o hijos */}
        {ticket.isSubtask && (
          <Badge variant="outline" className="text-xs flex-shrink-0 text-violet-600 border-violet-300 bg-violet-50">
            ↳ subtask
          </Badge>
        )}
        {!ticket.isSubtask && ticket.subtasks?.length > 0 && (
          <Badge variant="outline" className="text-xs flex-shrink-0 text-blue-600 border-blue-300 bg-blue-50">
            ⊞ {ticket.subtasks.length} sub
          </Badge>
        )}

        {/* Resumen */}
        <span className="flex-1 text-sm truncate min-w-0" title={ticket.summary}>
          {ticket.summary}
        </span>

        {/* Otras versiones (compact) */}
        {ticket.otrasVersiones && (
          <span
            className="text-xs text-muted-foreground flex-shrink-0"
            title={`Otras versiones: ${ticket.otrasVersiones}`}>
            📌 {ticket.otrasVersiones}
          </span>
        )}

        {/* Fecha + urgencia */}
        <span
          className={cn(
            "text-xs flex-shrink-0",
            ticket.esUrgente ? "text-destructive font-bold animate-pulse" : "text-muted-foreground",
          )}>
          {ticket.esUrgente && "🚨 "}
          {fechaDisplay}
        </span>

        {/* Comentarios */}
        {ticket.numComentarios > 0 && (
          <Badge
            variant="outline"
            className="flex-shrink-0 text-xs cursor-default"
            onClick={(e) => e.stopPropagation()}
            title={`${ticket.numComentarios} comentarios`}>
            💬 {ticket.numComentarios}
          </Badge>
        )}

        {/* Horas */}
        <span className="text-xs text-muted-foreground flex-shrink-0 w-10 text-right">{ticket.horas}h</span>
      </div>

      {/* ── Panel expandido ── */}
      {open && (
        <div className="px-6 pb-5 pt-3 bg-muted/30 border-t animate-in fade-in-0 slide-in-from-top-2 duration-150">
          {/* Padre (si es subtask) */}
          {ticket.isSubtask && ticket.parent && (
            <div className="mb-4 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
              <span className="text-xs text-violet-500 font-semibold uppercase tracking-wider">Parent</span>
              <a
                href={`${JIRA_BASE}${ticket.parent.key}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}>
                {ticket.parent.key}
              </a>
              <span className="text-xs text-muted-foreground truncate">{ticket.parent.summary}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            {/* Revisores */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Revisores</p>
              <p className="text-sm mb-1">
                <span className="text-muted-foreground">QA:</span>{" "}
                <span className="font-medium">{ticket.revInterno}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Ops:</span>{" "}
                <span className="font-medium">{ticket.revOperativo}</span>
              </p>
            </div>

            {/* Despliegue - solo se muestra si mostrarClienteDespliegue es true */}
            {mostrarClienteDespliegue && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Despliegue</p>
                <Select value={cliente || "__none__"} onValueChange={handleChangeCliente}>
                  <SelectTrigger className="mb-2 h-8 text-sm" onClick={(e) => e.stopPropagation()}>
                    <SelectValue placeholder="Cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin cliente</SelectItem>
                    {CLIENTES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DatePicker value={dia} onChange={handleChangeDia} placeholder="Fecha de despliegue..." />
              </div>
            )}
          </div>

          {/* Otras versiones ySwitch mostrar cliente */}
          <div className="mt-4">
            <Separator className="mb-3" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Otras versiones (tickets de otras aplicaciones)
                </p>
                <Input
                  placeholder="Ej: APP-123, WEB-456"
                  value={otrasVersiones}
                  onChange={(e) => handleChangeOtrasVersiones(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Mostrar cliente y despliegue
                </p>
                <Select
                  value={mostrarClienteDespliegue ? "si" : "no"}
                  onValueChange={handleChangeMostrarClienteDespliegue}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Subtareas */}
          {!ticket.isSubtask && ticket.subtasks?.length > 0 && (
            <div className="mt-4">
              <Separator className="mb-3" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                ⊞ Subtareas ({ticket.subtasks.length})
              </p>
              <div className="space-y-1.5">
                {ticket.subtasks.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2">
                    <a
                      href={`${JIRA_BASE}${s.key}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-primary hover:underline flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}>
                      {s.key}
                    </a>
                    <span className="text-xs flex-1 truncate text-foreground">{s.summary}</span>
                    {s.assignee && <span className="text-xs text-muted-foreground flex-shrink-0">👤 {s.assignee}</span>}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs flex-shrink-0",
                        s.status === "Done" || s.status === "Finalizado"
                          ? "border-green-300 text-green-700 bg-green-50"
                          : s.status === "In Progress" || s.status === "En progreso"
                            ? "border-blue-300 text-blue-700 bg-blue-50"
                            : "text-muted-foreground",
                      )}>
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comentarios */}
          {ticket.comentarios.length > 0 && (
            <div className="mt-4">
              <Separator className="mb-3" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                💬 Últimas observaciones
              </p>
              <div className="space-y-2">
                {ticket.comentarios.map((c, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold">{c.autor}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.fecha).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <MarkdownText text={c.texto} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
