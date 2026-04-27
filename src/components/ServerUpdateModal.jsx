"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "@/components/ui/button";

/* ── helpers ──────────────────────────────────────────────── */

function fmtFecha(iso) {
  if (!iso) return "—";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "dd/MM/yyyy") : iso;
}

function extractTicketNum(key) {
  if (!key) return null;
  const match = String(key).match(/[-](\d+)$/);
  return match ? match[1] : String(key);
}

function buildInitialText(doneTickets) {
  const firstWithDate = doneTickets.find((t) => t.dia_despliegue) || doneTickets[0] || {};
  const fecha = fmtFecha(firstWithDate.dia_despliegue || "");
  const servidor = doneTickets[0]?.cliente_nombre || "—";
  const responsable = doneTickets[0]?.assignee || "—";
  const nums = doneTickets.map((t) => extractTicketNum(t.key)).filter(Boolean);
  const idsStr = nums.join(", ");
  const versionLine = idsStr ? `— (${idsStr})` : "—";

  return [
    "ACTUALIZACIÓN SERVIDOR",
    "",
    `Fecha: ${fecha} | Hora: —`,
    `Servidor: ${servidor}`,
    `Versión: ${versionLine}`,
    `Responsable: ${responsable}`,
    `Estado: OK`,
  ].join("\n");
}

/* ── component ────────────────────────────────────────────── */

export default function ServerUpdateModal({ open, onClose, doneTickets = [] }) {
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    setText(buildInitialText(doneTickets));
  }, [open, doneTickets]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-full max-w-[560px] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-6 py-3 border-b flex-shrink-0">
          <DialogHeader className="text-left space-y-0.5">
            <DialogTitle className="text-base font-bold">🖥️ Actualización de Servidor</DialogTitle>
            <DialogDescription className="text-xs">
              Edita el texto directamente y copia cuando esté listo.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-muted border rounded-lg p-4 text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed resize-y min-h-[200px] focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />

          <div className="flex justify-end">
            <Button size="sm" onClick={handleCopy} className="text-xs h-8 px-4">
              {copied ? "✓ Copiado" : "📋 Copiar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
