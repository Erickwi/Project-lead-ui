import { useState, useEffect } from "react";
import { parseISO, isValid } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { MarkdownText } from "@/components/ui/markdown-text";
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

// Returns value only if it is a valid ISO date string (YYYY-MM-DD), otherwise ""
const normalizeDate = (val) => {
  if (!val) return "";
  const d = parseISO(val);
  return isValid(d) ? val : "";
};

export default function TicketRow({ ticket, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [cliente, setCliente] = useState(ticket.cliente_nombre || "");
  const [dia, setDia] = useState(normalizeDate(ticket.dia_despliegue));

  useEffect(() => {
    setCliente(ticket.cliente_nombre || "");
    setDia(normalizeDate(ticket.dia_despliegue));
  }, [ticket.cliente_nombre, ticket.dia_despliegue]);

  const persist = (newCliente, newDia) => {
    onUpdate(ticket.key, {
      cliente_nombre: newCliente,
      dia_despliegue: newDia,
      estado_entrega: ticket.estado_entrega,
    });
  };

  const handleChangeCliente = (val) => {
    const newVal = val === "__none__" ? "" : val;
    setCliente(newVal);
    persist(newVal, dia);
  };

  const handleChangeDia = (val) => {
    setDia(val);
    persist(cliente, val);
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

        {/* Resumen */}
        <span className="flex-1 text-sm truncate min-w-0" title={ticket.summary}>
          {ticket.summary}
        </span>

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

            {/* Despliegue */}
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
          </div>

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
