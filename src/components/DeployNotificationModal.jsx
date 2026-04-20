import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

function fmtDate(iso) {
  if (!iso) return "Sin fecha";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "d 'de' MMMM yyyy", { locale: es }) : iso;
}

function buildTemplate(tickets, cliente) {
  const lines = [
    `📦 *NOTIFICACIÓN DE DESPLIEGUE*`,
    `Cliente: *${cliente || "General"}*`,
    `Fecha: ${fmtDate(tickets[0]?.dia_despliegue)}`,
    ``,
    `Los siguientes cambios están listos para ser desplegados:`,
    ``,
    ...tickets.map((t, i) => `${i + 1}. [${t.key}] ${t.summary}\n   → Desarrollador: ${t.assignee}`),
    ``,
    `Por favor confirmar la recepción y el despliegue correspondiente.`,
    `Gracias 🙏`,
  ];
  return lines.join("\n");
}

/**
 * DeployNotificationModal
 *
 * Props:
 *   open              bool
 *   onClose           () => void
 *   tickets           array of done tickets
 *   onUpdateStatus    (key, status) => void
 */
export default function DeployNotificationModal({ open, onClose, tickets, onUpdateStatus }) {
  const [copied, setCopied] = useState(null); // cliente key that was copied

  // Group by client
  const grouped = {};
  for (const t of tickets) {
    const c = t.cliente_nombre || "Sin cliente asignado";
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(t);
  }

  const handleCopy = (cliente) => {
    const template = buildTemplate(grouped[cliente], cliente);
    navigator.clipboard.writeText(template).then(() => {
      setCopied(cliente);
      setTimeout(() => setCopied(null), 3000);
    });
  };

  const handleMarkNotified = (cliente) => {
    grouped[cliente].forEach((t) => onUpdateStatus(t.key, "notificado"));
  };

  const handleConfirm = (cliente) => {
    grouped[cliente].forEach((t) => onUpdateStatus(t.key, "confirmado"));
  };

  const handleReset = (cliente) => {
    grouped[cliente].forEach((t) => onUpdateStatus(t.key, null));
  };

  const hasTickets = tickets.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <DialogHeader className="text-left space-y-0.5">
            <DialogTitle className="text-lg font-bold">🚀 Gestión de Despliegues</DialogTitle>
            <DialogDescription className="text-xs">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} finalizado{tickets.length !== 1 ? "s" : ""} ·
              Agrupa por cliente para notificar y confirmar
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {!hasTickets && (
              <div className="text-center text-muted-foreground py-10">
                <p className="text-4xl mb-3">✅</p>
                <p className="font-medium">No hay tickets finalizados pendientes de despliegue.</p>
              </div>
            )}

            {Object.entries(grouped).map(([cliente, tks]) => {
              const allNotified = tks.every(
                (t) => t.deploy_status === "notificado" || t.deploy_status === "confirmado",
              );
              const allConfirmed = tks.every((t) => t.deploy_status === "confirmado");
              const anyNotified = tks.some((t) => t.deploy_status === "notificado");

              return (
                <div key={cliente} className="border rounded-lg overflow-hidden">
                  {/* Cliente header */}
                  <div className="px-4 py-3 bg-muted/40 border-b space-y-2">
                    {/* Row 1: nombre + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">🏢 {cliente}</span>
                      <Badge variant="secondary" className="text-xs rounded-full">
                        {tks.length} ticket{tks.length !== 1 ? "s" : ""}
                      </Badge>
                      {allConfirmed && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs">
                          ✓ Confirmado
                        </Badge>
                      )}
                      {!allConfirmed && allNotified && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs">
                          ⏳ Notificado
                        </Badge>
                      )}
                    </div>

                    {/* Row 2: acciones */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => handleCopy(cliente)} className="text-xs h-7">
                        {copied === cliente ? "✓ Copiado" : "📋 Copiar plantilla"}
                      </Button>
                      {!allNotified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkNotified(cliente)}
                          className="text-xs h-7">
                          📤 Marcar notificado
                        </Button>
                      )}
                      {(allNotified || anyNotified) && !allConfirmed && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(cliente)}
                          className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white">
                          ✅ Confirmar despliegue
                        </Button>
                      )}
                      {(allNotified || allConfirmed) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReset(cliente)}
                          className="text-xs h-7 text-muted-foreground">
                          Resetear
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tickets list */}
                  <div className="divide-y">
                    {tks.map((t) => (
                      <div key={t.key} className="flex items-start gap-3 px-4 py-2.5">
                        <span
                          className={
                            t.deploy_status === "confirmado"
                              ? "text-green-500 text-sm mt-0.5"
                              : t.deploy_status === "notificado"
                                ? "text-amber-500 text-sm mt-0.5"
                                : "text-muted-foreground text-sm mt-0.5"
                          }>
                          {t.deploy_status === "confirmado" ? "✓" : t.deploy_status === "notificado" ? "◷" : "○"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-primary mr-2">{t.key}</span>
                          <span className="text-sm">{t.summary}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {t.dia_despliegue && (
                            <span className="text-xs text-muted-foreground">{fmtDate(t.dia_despliegue)}</span>
                          )}
                          <span className="text-xs text-muted-foreground">{t.assignee}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Preview de plantilla */}
                  {copied === cliente && (
                    <div className="border-t bg-muted/20 p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Plantilla copiada:</p>
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground">
                        {buildTemplate(tks, cliente)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
