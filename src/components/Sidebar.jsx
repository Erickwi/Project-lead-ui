import { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { useNavigate } from "react-router-dom";
import { useRecordatorios } from "../hooks/useRecordatorios";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ChevronLeft, ChevronRight, LayoutDashboard, BarChart2, Plus } from "lucide-react";

const PRIORITY_CFG = {
  Alta: { border: "border-l-red-500", badge: "bg-red-100 text-red-700 hover:bg-red-100", dot: "bg-red-500" },
  Media: {
    border: "border-l-yellow-400",
    badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    dot: "bg-yellow-400",
  },
  Baja: { border: "border-l-green-500", badge: "bg-green-100 text-green-700 hover:bg-green-100", dot: "bg-green-500" },
};

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const EMPTY_FORM = { descripcion: "", prioridad: "Media", fecha: getTodayDate(), enviar_telegram: false };

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-zinc-900 border-l-4 ${cfg.border} rounded-r-lg p-3 group transition-all hover:bg-zinc-800 cursor-grab active:cursor-grabbing touch-none`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-100 leading-snug break-all whitespace-pre-wrap max-h-20 overflow-auto">
            {rec.descripcion}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(rec);
            }}
            title="Editar"
            className="h-6 w-6 text-zinc-400 hover:text-zinc-100 hover:bg-transparent cursor-pointer">
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(rec.id);
            }}
            title="Eliminar"
            className="h-6 w-6 text-zinc-400 hover:text-red-400 hover:bg-transparent cursor-pointer">
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
  { id: "finalizados", label: "📦 Finalizados", title: "Finalizados por Fecha" },
];

export default function Sidebar({ currentPage = "dashboard", collapsed, onToggleCollapsed, onCloseMobile }) {
  const navigate = useNavigate();
  const { recordatorios, loading, crear, actualizar, eliminar, reorder } = useRecordatorios();
  const { currentSprintTitle } = useAppData();
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortedRecordatorios = [...recordatorios].sort((a, b) => (a.posicion || 0) - (b.posicion || 0));
  const [filterTelegram, setFilterTelegram] = useState(false);
  const displayRecordatorios = filterTelegram
    ? sortedRecordatorios.filter((r) => !!(r.enviar_telegram === true || Number(r.enviar_telegram) === 1))
    : sortedRecordatorios;

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
      enviar_telegram: rec.enviar_telegram ? Boolean(Number(rec.enviar_telegram)) : false,
    });
    setEditingId(rec.id);
    setModal(true);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await actualizar(editingId, form);
      } else {
        await crear(form);
      }
      setModal(false);
    } catch (err) {
      console.error("Error guardando recordatorio:", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Sidebar colapsado: strip vertical fino ── */}
      {collapsed && (
        <aside className="w-full flex-shrink-0 flex flex-col items-center bg-zinc-950 h-screen border-r border-zinc-800 py-3 gap-3 z-10">
          {/* Botón expandir */}
          <button
            onClick={() => onToggleCollapsed(false)}
            title="Mostrar panel"
            className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
            <ChevronRight size={16} />
          </button>

          {/* Nav icons */}
          <div className="flex flex-col gap-2 mt-1">
            <button
              onClick={() => handleNavigate("/")}
              title="Dashboard"
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                currentPage === "dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
              }`}>
              <LayoutDashboard size={15} />
            </button>
            <button
              onClick={() => handleNavigate("/reporte")}
              title="Reporte"
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                currentPage === "reporte"
                  ? "bg-primary text-primary-foreground"
                  : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
              }`}>
              <BarChart2 size={15} />
            </button>
          </div>

          {/* Nueva nota (solo icono) */}
          <div className="mt-auto mb-1">
            <button
              onClick={() => {
                openCreate();
              }}
              title="Nueva nota"
              className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
              <Plus size={15} />
            </button>
          </div>
        </aside>
      )}

      {/* ── Sidebar expandido ── */}
      {!collapsed && (
        <aside className="w-full flex-shrink-0 flex flex-col bg-zinc-950 h-screen overflow-hidden">
          {/* Navegación principal + botón colapsar */}
          <nav className="px-3 pt-3 pb-2 border-b border-zinc-800 flex gap-1 items-center">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id === "dashboard" ? "/" : `/${item.id}`)}
                title={item.title}
                className={`flex-1 text-xs font-semibold py-1.5 px-2 rounded transition-colors ${
                  currentPage === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}>
                {item.label}
              </button>
            ))}
            {/* Colapsar */}
            <button
              onClick={() => onToggleCollapsed(true)}
              title="Ocultar panel"
              className="ml-1 w-7 h-7 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors flex-shrink-0">
              <ChevronLeft size={15} />
            </button>
          </nav>

          {/* Header */}
          <div className="px-4 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wider text-zinc-100 uppercase">📋 Notas & Recordatorios</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={filterTelegram} onCheckedChange={(v) => setFilterTelegram(!!v)} />
                <span className="text-xs text-zinc-300">Telegram</span>
              </div>

              <Button
                size="sm"
                onClick={openCreate}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold">
                + Nuevo
              </Button>
            </div>
          </div>

          {/* Lista */}
          <ScrollArea className="flex-1 p-3 overflow-y-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedRecordatorios.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {loading && (
                    <div className="space-y-2 mt-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-zinc-900 border-l-4 border-l-zinc-700 rounded-r-lg p-3 space-y-2">
                          <Skeleton className="h-3 w-full bg-zinc-800/50" />
                          <Skeleton className="h-3 w-3/4 bg-zinc-800/50" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-14 rounded-full bg-zinc-800/50" />
                            <Skeleton className="h-3 w-16 bg-zinc-800/50" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!loading && recordatorios.length === 0 && (
                    <p className="text-zinc-500 text-xs text-center mt-8 leading-relaxed">
                      Sin recordatorios aún.
                      <br />
                      Crea el primero con el botón +
                    </p>
                  )}
                  {displayRecordatorios.map((rec) => (
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
            <p className="text-xs text-zinc-600 text-center">{currentSprintTitle || "Sprint v— · Ecomex 360"}</p>
          </div>
        </aside>
      )}

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
                autosize
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
              <div className="space-y-1.5 flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.enviar_telegram}
                    onChange={(e) => setForm((f) => ({ ...f, enviar_telegram: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-zinc-300">Enviar por Telegram</span>
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setModal(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {editingId
                  ? submitting
                    ? "Guardando..."
                    : "Guardar cambios"
                  : submitting
                    ? "Creando..."
                    : "Crear recordatorio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
