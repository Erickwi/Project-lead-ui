import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const SPRINT_LABEL = "Versión 3.10.6.1 stable";

export default function ReleaseNotes({ open, onClose }) {
  const [tickets, setTickets] = useState([]);
  const [orderedTickets, setOrderedTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const dragIndexRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/tickets/done")
      .then(({ data }) => setTickets(data.tickets || []))
      .catch((err) => console.error("Error cargando done tickets:", err.message))
      .finally(() => setLoading(false));
  }, [open]);

  // keep a local ordered copy so users can reorder via drag-and-drop
  useEffect(() => {
    setOrderedTickets(tickets || []);
  }, [tickets]);

  const generateText = () => {
    const divider = "═".repeat(56);
    const header = [
      `RELEASE NOTES — Sprint ${SPRINT_LABEL}`,
      divider,
      `Generado: ${new Date().toLocaleString("es-ES")}`,
      `Total de items: ${tickets.length}`,
      "",
    ].join("\n");

    const lines = (orderedTickets.length ? orderedTickets : tickets)
      .map((t, i) =>
        [
          `${i + 1}. [${t.key}] ${t.summary}`,
          `   → Desarrollador : ${t.assignee}`,
          `   → Cliente       : ${t.cliente_nombre || "N/A"}`,
          `   → Día despliegue: ${t.dia_despliegue || "N/A"}`,
          `   → Estado        : ${t.status}`,
        ].join("\n"),
      )
      .join("\n\n");

    return header + lines;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <DialogHeader className="text-left space-y-0.5">
            <DialogTitle className="text-lg font-bold">📝 Release Notes</DialogTitle>
            <DialogDescription className="text-xs">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} finalizado{tickets.length !== 1 ? "s" : ""} ·{" "}
              {SPRINT_LABEL}
            </DialogDescription>
          </DialogHeader>
          {!loading && tickets.length > 0 && (
            <Button
              onClick={handleCopy}
              variant={copied ? "secondary" : "default"}
              className={copied ? "scale-95 transition-transform" : ""}>
              {copied ? "✓ ¡Copiado!" : "📋 Copiar texto"}
            </Button>
          )}
        </div>

        {/* Contenido */}
        <ScrollArea className="flex-1 min-h-0 p-6">
          {loading && <p className="text-muted-foreground text-center mt-10">Cargando tickets finalizados...</p>}

          {!loading && tickets.length === 0 && (
            <div className="text-center text-muted-foreground mt-10">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-medium">No hay tickets en estado Done aún.</p>
            </div>
          )}

          {!loading && tickets.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold">Arrastra para reordenar</p>
                <div className="space-y-1">
                  {(orderedTickets.length ? orderedTickets : tickets).map((t, idx) => (
                    <div
                      key={t.key}
                      draggable
                      onDragStart={(e) => {
                        dragIndexRef.current = idx;
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = dragIndexRef.current;
                        const to = idx;
                        if (from == null) return;
                        const copy = Array.from(orderedTickets.length ? orderedTickets : tickets);
                        const [moved] = copy.splice(from, 1);
                        copy.splice(to, 0, moved);
                        setOrderedTickets(copy);
                        dragIndexRef.current = null;
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded bg-muted/30 hover:bg-muted/40 cursor-move"
                    >
                      <div className="w-6 text-xs text-muted-foreground">≡</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold">{t.key}</div>
                        <div className="text-sm text-foreground/80 truncate" title={t.summary}>{t.summary}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{t.assignee}</div>
                    </div>
                  ))}
                </div>
              </div>

              <pre className="rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap break-words font-mono leading-relaxed border bg-muted/40 w-full">
                {generateText()}
              </pre>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
