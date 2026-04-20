"use client";

import { useState, useEffect } from "react";
import { useRecordatorios } from "../hooks/useRecordatorios";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "@/components/ui/button";

/* ── helpers ──────────────────────────────────────────────── */

function fmtFecha(iso) {
  if (!iso) return "—";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "dd/MM/yyyy") : iso;
}

function buildText({ titulo, fecha, horas, version, cliente, servidor, responsable, estado }) {
  const horasStr = (horas || []).filter(Boolean).join(" y ") || "—";
  return [
    titulo || "ACTUALIZACIÓN SERVIDOR",
    "",
    `Fecha: ${fmtFecha(fecha)} | Hora: ${horasStr}`,
    `Cliente: ${cliente || "—"}`,
    `Servidor: ${servidor || "—"}`,
    `Versión: ${version || "—"}`,
    `Responsable: ${responsable || "—"}`,
    `Estado: ${estado || "—"}`,
  ].join("\n");
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
    const defaultText = buildText({ titulo: "ACTUALIZACIÓN SERVIDOR", fecha, horas, version, cliente });
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

  // notes collapse state persisted in localStorage
  const [notesOpen, setNotesOpen] = useState(false);
  // recordatorios hook (reuse Sidebar logic)
  const { recordatorios, loading: recLoading, crear, actualizar, eliminar } = useRecordatorios();
  const [recModal, setRecModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const EMPTY_FORM = { descripcion: "", prioridad: "Media", fecha: "" };
  const [form, setForm] = useState(EMPTY_FORM);
  useEffect(() => {
    try {
      const v = localStorage.getItem("serverUpdate_notesOpen");
      setNotesOpen(v === "true");
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleNotes = () => {
    setNotesOpen((s) => {
      const next = !s;
      try {
        localStorage.setItem("serverUpdate_notesOpen", next ? "true" : "false");
      } catch (e) {}
      return next;
    });
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setRecModal(true);
  };

  const openEdit = (rec) => {
    setForm({
      descripcion: rec.descripcion,
      prioridad: rec.prioridad,
      fecha: rec.fecha ? rec.fecha.split("T")[0] : "",
    });
    setEditingId(rec.id);
    setRecModal(true);
  };

  const handleRecSubmit = async (e) => {
    e && e.preventDefault();
    try {
      if (editingId) {
        await actualizar(editingId, form);
      } else {
        await crear(form);
      }
      setRecModal(false);
    } catch (err) {
      console.error("Error guardando recordatorio:", err.message);
    }
  };

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
        {/* Notes / Recordatorios collapsible */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Notas y recordatorios</p>
            <Button
              variant="default"
              size="sm"
              onClick={toggleNotes}
              className="text-xs"
              aria-expanded={notesOpen}
              aria-controls="server-notes">
              {notesOpen ? "Ocultar notas" : "Mostrar notas"}
            </Button>
          </div>
          <div id="server-notes" className="mt-3" hidden={!notesOpen} aria-hidden={!notesOpen}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Notas & Recordatorios</h3>
              <div className="flex items-center gap-2">
                <Badge className="text-xs">{recordatorios.length} items</Badge>
                <Button size="sm" onClick={openCreate} className="text-xs">
                  + Nuevo
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {recLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
                {!recLoading && recordatorios.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin recordatorios aún.</p>
                )}
                {recordatorios.map((rec) => (
                  <div key={rec.id} className="p-2 rounded-md border flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <p className="text-sm break-words">{rec.descripcion}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-xs">{rec.prioridad}</Badge>
                        {rec.fecha && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(rec.fecha).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(rec)}>
                        ✏️
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => eliminar(rec.id)}>
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* inline modal for create/edit (reuse dialog content) */}
            {recModal && (
              <div className="mt-3 bg-popover p-3 rounded">
                <form onSubmit={handleRecSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="rec-des">Descripción</Label>
                    <Textarea
                      id="rec-des"
                      rows={2}
                      value={form.descripcion}
                      onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Prioridad</Label>
                      <Select
                        value={form.prioridad}
                        onValueChange={(val) => setForm((f) => ({ ...f, prioridad: val }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Media">Media</SelectItem>
                          <SelectItem value="Baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rec-fecha">Fecha</Label>
                      <Input
                        id="rec-fecha"
                        type="date"
                        value={form.fecha}
                        onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setRecModal(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingId ? "Guardar" : "Crear"}</Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
