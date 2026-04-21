"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "@/components/ui/button";

/* ── helpers ──────────────────────────────────────────────── */

function fmtFecha(iso) {
  if (!iso) return "—";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "dd/MM/yyyy") : iso;
}

function buildText({ titulo, fecha, horas, version, altreVersioni, cliente, servidor, responsable, estado, ids }) {
  const horasStr = (horas || []).filter(Boolean).join(" y ") || "—";
  const versionLine = version ? `Versión: ${version}${ids ? ` (${ids})` : ""}` : "Versión: —";
  return [
    titulo || "ACTUALIZACIÓN SERVIDOR",
    "",
    `Fecha: ${fmtFecha(fecha)} | Hora: ${horasStr}`,
    `Servidor: ${servidor || cliente || "—"}`,
    versionLine,
    `Responsable: ${responsable || "—"}`,
    `Estado: ${estado || "—"}`,
  ]
    .filter(Boolean)
    .join("\n");
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
    const ids = doneTickets
      .map((t) => (t.id ? t.id : t.key))
      .filter(Boolean)
      .join(", ");
    const servidorFromTickets = doneTickets[0]?.servidor || "";
    const responsableFromTickets = doneTickets[0]?.assignee || "";
    const estadoDefault = "OK.";
    // If there are no tickets, provide the explicit sample template from user.
    const sampleText = `ACTUALIZACIÓN SERVIDOR\n\nFecha: 16/04/2026 | Hora: 14:15 y 18:15\nServidor: FMA\nVersión: 3.10.6+3.10.7 (858, 927)\nResponsable: Jairo Proaño\nEstado: OK.`;

    const defaultText =
      doneTickets && doneTickets.length
        ? buildText({
            titulo: "ACTUALIZACIÓN SERVIDOR",
            fecha,
            horas,
            version,
            altreVersioni,
            cliente,
            servidor: servidorFromTickets,
            responsable: responsableFromTickets,
            estado: estadoDefault,
            ids,
          })
        : sampleText;

    try {
      const saved = localStorage.getItem("serverUpdate_previewText");
      setPreviewText(saved ?? defaultText);
    } catch (e) {
      setPreviewText(defaultText);
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
