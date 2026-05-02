import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const TIPO_CFG = {
  Interrupcion: { badge: "bg-red-100 text-red-700 border-red-200", icon: "🚨" },
  Reunion: { badge: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "📅" },
  Bloqueado: { badge: "bg-orange-100 text-orange-700 border-orange-200", icon: "🔒" },
  Planeacion: { badge: "bg-blue-100 text-blue-700 border-blue-200", icon: "📋" },
  Otro: { badge: "bg-zinc-100 text-zinc-600 border-zinc-200", icon: "📌" },
};

const PAUSA_EMPTY = {
  descripcion: "",
  tipo: "Otro",
  responsable: "",
  fecha_inicio: "",
  fecha_fin: "",
  ticket_relacionado: "",
};

export default function PausasSection({ pausas = [], crearPausa, eliminarPausa }) {
  const [form, setForm] = useState(PAUSA_EMPTY);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descripcion.trim()) return;
    setSaving(true);
    try {
      await crearPausa({
        ...form,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        ticket_relacionado: form.ticket_relacionado || null,
        responsable: form.responsable || null,
      });
      setForm(PAUSA_EMPTY);
      setFormOpen(false);
    } catch (err) {
      console.error("Error guardando pausa:", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">⏸️ Pausas e Interrupciones al Desarrollo</CardTitle>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setFormOpen((o) => !o)}>
            {formOpen ? "✕ Cancelar" : "+ Registrar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Actividades no planificadas que pausaron o retrasaron el desarrollo de esta versión.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {formOpen && (
          <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-muted/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs">Descripción *</Label>
                <Textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Ej: Reunión urgente de cliente que suspendió sprint por 2 días..."
                  className="text-xs mt-1 min-h-[60px]"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(TIPO_CFG).map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {TIPO_CFG[t].icon} {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Responsable / Área</Label>
                <Input
                  value={form.responsable}
                  onChange={(e) => setForm((p) => ({ ...p, responsable: e.target.value }))}
                  placeholder="Ej: Juan, Área de QA..."
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Fecha inicio</Label>
                <Input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Fecha fin</Label>
                <Input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Ticket relacionado (opcional)</Label>
                <Input
                  value={form.ticket_relacionado}
                  onChange={(e) => setForm((p) => ({ ...p, ticket_relacionado: e.target.value }))}
                  placeholder="Ej: ECO-123"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={saving} className="text-xs h-7">
                {saving ? "Guardando..." : "Guardar Pausa"}
              </Button>
            </div>
          </form>
        )}

        {pausas.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No hay pausas registradas. ¡Genial! 🎉</p>
        ) : (
          <div className="space-y-2">
            {pausas.map((p) => {
              const cfg = TIPO_CFG[p.tipo] || TIPO_CFG.Otro;
              return (
                <div
                  key={p.id}
                  className={`border-l-4 rounded-r-lg p-3 bg-muted/20 flex gap-3 ${cfg.badge.includes("red") ? "border-l-red-400" : cfg.badge.includes("yellow") ? "border-l-yellow-400" : cfg.badge.includes("orange") ? "border-l-orange-400" : cfg.badge.includes("blue") ? "border-l-blue-400" : "border-l-zinc-300"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-xs ${cfg.badge}`}>
                        {cfg.icon} {p.tipo}
                      </Badge>
                      {p.responsable && <span className="text-xs text-muted-foreground">👤 {p.responsable}</span>}
                      {p.ticket_relacionado && (
                        <span className="text-xs font-mono text-primary">{p.ticket_relacionado}</span>
                      )}
                      {(p.fecha_inicio || p.fecha_fin) && (
                        <span className="text-xs text-muted-foreground">
                          📅{" "}
                          {p.fecha_inicio
                            ? new Date(p.fecha_inicio).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
                            : "?"}{" "}
                          {p.fecha_fin
                            ? `→ ${new Date(p.fecha_fin).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`
                            : "→ en curso"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{p.descripcion}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-red-500 flex-shrink-0"
                    onClick={() => eliminarPausa(p.id)}
                    title="Eliminar">
                    🗑️
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
