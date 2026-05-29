import { useState, useEffect, useRef } from "react";
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
  Highest: "bg-red-50 text-red-600 border-red-200",
  High: "bg-orange-50 text-orange-600 border-orange-200",
  Medium: "bg-amber-50 text-amber-600 border-amber-200",
  Low: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Lowest: "bg-blue-50 text-blue-400 border-blue-200",
};

const JIRA_BASE = `https://${import.meta.env.VITE_JIRA_DOMAIN}/browse/`;

function normalizeDate(val) {
  if (!val) return "";
  const d = parseISO(val);
  return isValid(d) ? val : "";
}

function LocalDateDisplay({ isoString }) {
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    setDateStr(
      new Date(isoString).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }, [isoString]);
  return <span suppressHydrationWarning>{dateStr}</span>;
}

export default function TicketRow({ ticket, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [cliente, setCliente] = useState(() => ticket.cliente_nombre || "");
  const [dia, setDia] = useState(() => normalizeDate(ticket.dia_despliegue));
  const [otrasVersiones, setOtrasVersiones] = useState(() => ticket.otrasVersiones || "");
  const [mostrarClienteDespliegue, setMostrarClienteDespliegue] = useState(
    () => ticket.mostrarClienteDespliegue !== false,
  );
  const [servidor, setServidor] = useState(() => ticket.servidor || "");

  const prevTicketRef = useRef(null);
  useEffect(() => {
    if (prevTicketRef.current?.key !== ticket.key) {
      setCliente(ticket.cliente_nombre || "");
      setDia(normalizeDate(ticket.dia_despliegue));
      setOtrasVersiones(ticket.otrasVersiones || "");
      setMostrarClienteDespliegue(ticket.mostrarClienteDespliegue !== false);
      setServidor(ticket.servidor || "");
    }
    prevTicketRef.current = ticket;
  }, [ticket]);

  const persist = (updates) => {
    onUpdate(ticket.key, {
      cliente_nombre: updates.cliente_nombre,
      dia_despliegue: updates.dia_despliegue,
      estado_entrega: ticket.estado_entrega,
      otrasVersiones: updates.otrasVersiones,
      mostrarClienteDespliegue: updates.mostrarClienteDespliegue,
      servidor: updates.servidor,
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
    persist({ cliente_nombre: cliente, dia_despliegue: dia, otrasVersiones: val, mostrarClienteDespliegue, servidor });
  };

  const handleChangeMostrarClienteDespliegue = (val) => {
    const newVal = val === "si";
    setMostrarClienteDespliegue(newVal);
    persist({
      cliente_nombre: cliente,
      dia_despliegue: dia,
      otrasVersiones,
      mostrarClienteDespliegue: newVal,
      servidor,
    });
  };

  const handleChangeServidor = (val) => {
    setServidor(val);
    persist({ cliente_nombre: cliente, dia_despliegue: dia, otrasVersiones, mostrarClienteDespliegue, servidor: val });
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
    <div className="border-b border-blue-50 last:border-0">
      <div
        role="button"
        tabIndex={0}
        className="flex items-center gap-2 px-4 py-3 hover:bg-blue-50/30 cursor-pointer transition-colors select-none"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <span className={`text-blue-300/50 text-xs w-3 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </span>

        <a
          href={`${JIRA_BASE}${ticket.key}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 font-bold text-xs hover:underline w-28 flex-shrink-0"
        >
          {ticket.key}
        </a>

        <Badge className={cn("text-xs font-semibold flex-shrink-0 border", badgeClass)}>{ticket.priority}</Badge>

        {ticket.isSubtask && (
          <Badge variant="outline" className="text-xs flex-shrink-0 text-purple-600 border-purple-200 bg-purple-50">
            ↳ subtask
          </Badge>
        )}
        {!ticket.isSubtask && ticket.subtasks?.length > 0 && (
          <Badge variant="outline" className="text-xs flex-shrink-0 text-blue-600 border-blue-200 bg-blue-50">
            ⊞ {ticket.subtasks.length} sub
          </Badge>
        )}

        <span className="flex-1 text-sm truncate min-w-0 text-navy-700" title={ticket.summary}>
          {ticket.summary}
        </span>

        {ticket.otrasVersiones && (
          <span
            className="text-xs text-blue-400/60 flex-shrink-0"
            title={`Otras versiones: ${ticket.otrasVersiones}`}
          >
            📌 {ticket.otrasVersiones}
          </span>
        )}
        {ticket.servidor && (
          <Badge variant="outline" className="text-xs flex-shrink-0 ml-2 border-blue-200 text-blue-500 bg-blue-50/50">
            🖥️ {ticket.servidor}
          </Badge>
        )}

        <span
          className={cn(
            "text-xs flex-shrink-0",
            ticket.esUrgente ? "text-red-500 font-bold" : "text-blue-400/60",
          )}
        >
          {ticket.esUrgente && "🚨 "}
          {fechaDisplay}
        </span>

        {ticket.numComentarios > 0 && (
          <Badge
            variant="outline"
            role="button"
            tabIndex={0}
            className="flex-shrink-0 text-xs cursor-pointer border-blue-200 text-blue-500 bg-blue-50/50"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
              }
            }}
            title={`${ticket.numComentarios} comentarios`}
          >
            💬 {ticket.numComentarios}
          </Badge>
        )}

        <span className="text-xs text-blue-400/60 flex-shrink-0 w-10 text-right font-medium">{ticket.horas}h</span>
      </div>

      {open && (
        <div className="px-6 pb-5 pt-3 bg-blue-50/20 border-t border-blue-100/50 animate-fade-in">
          {ticket.isSubtask && ticket.parent && (
            <div className="mb-4 flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <span className="text-xs text-purple-500 font-semibold uppercase tracking-wider">Parent</span>
              <a
                href={`${JIRA_BASE}${ticket.parent.key}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {ticket.parent.key}
              </a>
              <span className="text-xs text-blue-400/60 truncate">{ticket.parent.summary}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Revisores</p>
              <p className="text-sm mb-1">
                <span className="text-blue-400/60">QA:</span>{" "}
                <span className="font-medium text-navy-700">{ticket.revInterno}</span>
              </p>
              <p className="text-sm">
                <span className="text-blue-400/60">Ops:</span>{" "}
                <span className="font-medium text-navy-700">{ticket.revOperativo}</span>
              </p>
            </div>

            {mostrarClienteDespliegue && (
              <div>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Despliegue</p>
                <Select value={cliente || "__none__"} onValueChange={handleChangeCliente}>
                  <SelectTrigger className="mb-2 h-8 text-sm border-blue-200 bg-white" onClick={(e) => e.stopPropagation()}>
                    <SelectValue placeholder="Cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin cliente</SelectItem>
                    {CLIENTES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DatePicker value={dia} onChange={handleChangeDia} placeholder="Fecha de despliegue..." />
                <Input
                  placeholder="Servidor (ej: prod-web-1)"
                  value={servidor}
                  onChange={(e) => handleChangeServidor(e.target.value)}
                  className="mt-2 h-8 text-sm border-blue-200"
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <Separator className="mb-3 bg-blue-100/50" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                  Otras versiones
                </p>
                <Input
                  placeholder="Ej: APP-123, WEB-456"
                  value={otrasVersiones}
                  onChange={(e) => handleChangeOtrasVersiones(e.target.value)}
                  className="h-8 text-sm border-blue-200"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                  Mostrar cliente y despliegue
                </p>
                <Select
                  value={mostrarClienteDespliegue ? "si" : "no"}
                  onValueChange={handleChangeMostrarClienteDespliegue}
                >
                  <SelectTrigger className="h-8 text-sm border-blue-200 bg-white">
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

          {!ticket.isSubtask && ticket.subtasks?.length > 0 && (
            <div className="mt-4">
              <Separator className="mb-3 bg-blue-100/50" />
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                ⊞ Subtareas ({ticket.subtasks.length})
              </p>
              <div className="space-y-1.5">
                {ticket.subtasks.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 bg-white border border-blue-100 rounded-lg px-3 py-2">
                    <a
                      href={`${JIRA_BASE}${s.key}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-600 hover:underline flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {s.key}
                    </a>
                    <span className="text-xs flex-1 truncate text-navy-700">{s.summary}</span>
                    {s.assignee && <span className="text-xs text-blue-400/60 flex-shrink-0">👤 {s.assignee}</span>}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs flex-shrink-0",
                        s.status === "Done" || s.status === "Finalizado"
                          ? "border-emerald-200 text-emerald-600 bg-emerald-50"
                          : s.status === "In Progress" || s.status === "En progreso"
                            ? "border-blue-200 text-blue-600 bg-blue-50"
                            : "text-blue-400/60 border-blue-100",
                      )}
                    >
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ticket.comentarios.length > 0 && (
            <div className="mt-4">
              <Separator className="mb-3 bg-blue-100/50" />
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                💬 Ultimas observaciones
              </p>
              <div className="space-y-2">
                {ticket.comentarios.map((c, i) => (
                  <div key={`${c.autor}-${c.fecha || i}`} className="bg-white rounded-lg p-3 border border-blue-100/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-navy-700">{c.autor}</span>
                      <span className="text-xs text-blue-400/60">
                        <LocalDateDisplay isoString={c.fecha} />
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
