import { useState } from "react";
import { useRecordatorios } from "../hooks/useRecordatorios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const PRIORITY_CFG = {
  Alta: { border: "border-l-red-500", badge: "bg-red-100 text-red-700 hover:bg-red-100", dot: "bg-red-500" },
  Media: {
    border: "border-l-yellow-400",
    badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    dot: "bg-yellow-400",
  },
  Baja: { border: "border-l-green-500", badge: "bg-green-100 text-green-700 hover:bg-green-100", dot: "bg-green-500" },
  Verde: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    dot: "bg-emerald-500",
  },
};

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const EMPTY_FORM = { descripcion: "", prioridad: "Media", fecha: getTodayDate() };

function SortableItem({ rec, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rec.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  const cfg = PRIORITY_CFG[rec.prioridad] || PRIORITY_CFG.Media;
  const isVerde = rec.prioridad === "Verde";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-zinc-900 border-l-4 ${cfg.border} rounded-r-lg p-3 group transition-all hover:bg-zinc-800 ${isVerde ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-zinc-100 flex-1 leading-snug break-words">{rec.descripcion}</p>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              console.debug("Sidebar edit clicked", rec.id);
              onEdit(rec);
            }}
            title="Editar"
            className="h-6 w-6 text-zinc-400 hover:text-zinc-100 hover:bg-transparent">
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              console.debug("Sidebar delete clicked", rec.id);
              onDelete(rec.id);
            }}
            title="Eliminar"
            className="h-6 w-6 text-zinc-400 hover:text-red-400 hover:bg-transparent">
            🗑️
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge className={`text-xs font-semibold ${cfg.badge}`}>{rec.prioridad}</Badge>
        {rec.fecha && (
          <span className="text-xs text-zinc-500">
            {new Date(rec.fecha).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "dashboard", label: "📊 Dashboard", title: "Centro de Mando" },
  { id: "reporte", label: "📈 Reporte", title: "Reporte de Versión" },
];

export default function Sidebar({ currentPage = "dashboard", onNavigate = () => {} }) {
  const { recordatorios, loading, crear, actualizar, eliminar, reorder } = useRecordatorios();
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortedRecordatorios = [...recordatorios].sort((a, b) => {
    if (a.prioridad === "Verde" && b.prioridad !== "Verde") return 1;
    if (a.prioridad !== "Verde" && b.prioridad === "Verde") return -1;
    return (a.posicion || 0) - (b.posicion || 0);
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedRecordatorios.findIndex((r) => r.id === active.id);
    const newIndex = sortedRecordatorios.findIndex((r) => r.id === over.id);

    const newSorted = arrayMove(sortedRecordatorios, oldIndex, newIndex);
    const newIds = newSorted.map((r) => Number(r.id));

    // Optimistic update - reorder hace la llamada API sin await
    reorder(newIds);
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, fecha: getTodayDate() });
    setEditingId(null);
    setModal(true);
  };

  const openEdit = (rec) => {
    setForm({
      descripcion: rec.descripcion,
      prioridad: rec.prioridad,
      fecha: rec.fecha ? rec.fecha.split("T")[0] : getTodayDate(),
    });
    setEditingId(rec.id);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await actualizar(editingId, form);
      } else {
        await crear(form);
      }
      setModal(false);
    } catch (err) {
      console.error("Error guardando recordatorio:", err.message);
    }
  };

  return (
    <>
      <aside className="w-72 flex-shrink-0 flex flex-col bg-zinc-950 h-screen overflow-hidden">
        {/* Navegación principal */}
        <nav className="px-3 pt-3 pb-2 border-b border-zinc-800 flex gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={item.title}
              className={`flex-1 text-xs font-semibold py-1.5 px-2 rounded transition-colors ${
                currentPage === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Header */}
        <div className="px-4 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider text-zinc-100 uppercase">📋 Notas & Recordatorios</h2>
          <Button
            size="sm"
            onClick={openCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold">
            + Nuevo
          </Button>
        </div>

        {/* Lista */}
        <ScrollArea className="flex-1 p-3 overflow-y-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedRecordatorios.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {loading && <p className="text-zinc-500 text-xs text-center mt-6">Cargando...</p>}
                {!loading && recordatorios.length === 0 && (
                  <p className="text-zinc-500 text-xs text-center mt-8 leading-relaxed">
                    Sin recordatorios aún.
                    <br />
                    Crea el primero con el botón +
                  </p>
                )}
                {sortedRecordatorios.map((rec) => (
                  <SortableItem
                    key={rec.id}
                    rec={rec}
                    onEdit={openEdit}
                    onDelete={async (id) => {
                      const ok = confirm("¿Estás seguro que quieres eliminar esta nota?");
                      if (!ok) return;
                      try {
                        await eliminar(id);
                      } catch (err) {
                        console.error("Error al eliminar desde Sidebar:", err.message);
                      }
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>

        {/* Footer version */}
        <div className="px-4 py-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-600 text-center">Sprint v3.10.6.1 · Ecomex 360</p>
        </div>
      </aside>

      {/* Modal */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{editingId ? "✏️ Editar Recordatorio" : "➕ Nuevo Recordatorio"}</DialogTitle>
            <DialogDescription className="sr-only">Formulario para crear o editar recordatorio</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="descripcion">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="descripcion"
                required
                rows={3}
                placeholder="Describe la tarea o nota importante..."
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <Select value={form.prioridad} onValueChange={(val) => setForm((f) => ({ ...f, prioridad: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                    <SelectItem value="Verde">Verde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fecha">Fecha límite</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingId ? "Guardar cambios" : "Crear recordatorio"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
