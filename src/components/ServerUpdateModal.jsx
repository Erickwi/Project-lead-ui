"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "@/components/ui/button";

/* ── helpers ──────────────────────────────────────────────── */

function fmtFecha(iso) {
  if (!iso) return "—";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "dd/MM/yyyy") : iso;
}

function buildText({ titulo, fecha, horas, version, altreVersioni, cliente, servidor, responsable, estado }) {
  const horasStr = (horas || []).filter(Boolean).join(" y ") || "—";
  return [
    titulo || "ACTUALIZACIÓN SERVIDOR",
    "",
    `Fecha: ${fmtFecha(fecha)} | Hora: ${horasStr}`,
    `Cliente: ${cliente || "—"}`,
    `Servidor: ${servidor || "—"}`,
    `Versión: ${version || "—"}`,
    altreVersioni ? `Otras versiones: ${altreVersioni}` : "",
    `Responsable: ${responsable || "—"}`,
    `Estado: ${estado || "—"}`,
  ].filter(Boolean).join("\n");
}

/* ── component ────────────────────────────────────────────── */

/**
 * ServerUpdateModal
 *
 * Props:
 *   open         bool
 *   onClose      () => void
 *   doneTickets  array   — finalized tickets to show as context
 */
export default function ServerUpdateModal({ open, onClose, doneTickets = [] }) {
  const [copied, setCopied] = useState(false);
  const [previewText, setPreviewText] = useState("");

  useEffect(() => {
    if (!open) return;
    const first = doneTickets.find((t) => t.dia_despliegue) || {};
    const cliente = doneTickets[0]?.cliente_nombre || "";
    const fecha = first?.dia_despliegue || "";
    const horas = [""];
    const altreVersioni = doneTickets
      .filter((t) => t.otrasVersiones)
      .map((t) => t.otrasVersiones)
      .filter(Boolean)
      .join(", ");
    const version = doneTickets
      .map((t) => {
        if (!t.key) return null;
        if (typeof t.key === "string" && t.key.startsWith("E3-")) {
          return t.key.split("-")[1] || null;
        }
        return t.key;
      })
      .filter(Boolean)
      .join(", ");
    const defaultText = buildText({ titulo: "ACTUALIZACIÓN SERVIDOR", fecha, horas, version, altreVersioni, cliente });
    try {
      const saved = localStorage.getItem("serverUpdate_previewText");
      setPreviewText(saved ?? "[poner texto]");
    } catch (e) {
      setPreviewText("[poner texto]");
    }
  }, [open, doneTickets]);

  // persist previewText to localStorage (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem("serverUpdate_previewText", previewText);
      } catch (e) {}
    }, 500);
    return () => clearTimeout(id);
  }, [previewText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(previewText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl w-full max-w-[640px] max-h-[70vh] flex flex-col p-0 gap-0">
        {/* ── Header ── */}
        <div className="px-6 py-3 border-b flex-shrink-0">
          <DialogHeader className="text-left space-y-0.5">
            <DialogTitle className="text-base font-bold">🖥️ Actualización de Servidor</DialogTitle>
            <DialogDescription className="text-xs">
              Completa los datos del despliegue, luego copia el aviso listo para enviar
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 flex flex-col p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vista previa editable
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleCopy} className="text-xs h-7 px-3">
                {copied ? "✓ Copiado" : "📋 Copiar"}
              </Button>
            </div>
          </div>

          <textarea
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="flex-1 w-full bg-muted border rounded-lg p-4 text-sm font-mono whitespace-pre-wrap break-words text-foreground leading-relaxed resize-y min-h-[220px]"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
