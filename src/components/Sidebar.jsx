import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  BarChart2,
  Plus,
  Activity,
  Package,
  StickyNote,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const PRIORITY_CFG = {
  Alta: { border: "border-l-red-400", badge: "bg-red-500/20 text-red-300", dot: "bg-red-400" },
  Media: { border: "border-l-amber-400", badge: "bg-amber-500/20 text-amber-300", dot: "bg-amber-400" },
  Baja: { border: "border-l-emerald-400", badge: "bg-emerald-500/20 text-emerald-300", dot: "bg-emerald-400" },
};

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const EMPTY_FORM = { descripcion: "", prioridad: "Media", fecha: getTodayDate(), enviar_telegram: false };

function SidebarDateDisplay({ fecha }) {
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    setDateStr(
      new Date(fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    );
  }, [fecha]);
  return (
    <span className="text-xs text-blue-300/60" suppressHydrationWarning>
      {dateStr}
    </span>
  );
}

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
      role="button"
      aria-label={`recordatorio-${rec.id}`}
      tabIndex={0}
      className={`bg-white/5 border-l-[3px] ${cfg.border} rounded-lg p-3 group transition-all hover:bg-white/[0.08] cursor-grab active:cursor-grabbing touch-none`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-blue-100/90 leading-snug break-all whitespace-pre-wrap max-h-20 overflow-auto">
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
            className="size-6 text-blue-400/50 hover:text-blue-200 hover:bg-white/5 cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
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
            className="size-6 text-blue-400/50 hover:text-red-300 hover:bg-white/5 cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge}`}>{rec.prioridad}</span>
        {rec.fecha && <SidebarDateDisplay fecha={rec.fecha} />}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "reporte", label: "Reporte", icon: BarChart2 },
  { id: "finalizados", label: "Finalizados", icon: Package },
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

  const sortedRecordatorios = recordatorios.toSorted((a, b) => (a.posicion || 0) - (b.posicion || 0));
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

  if (collapsed) {
    return (
      <aside className="w-full h-full flex-shrink-0 flex flex-col items-center bg-navy-950 border-r border-navy-800/50 py-4 gap-3 z-10">
        <button
          onClick={() => onToggleCollapsed(false)}
          title="Expandir panel"
          className="size-9 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-200 hover:bg-white/5 transition-colors"
        >
          <ChevronRight size={16} />
        </button>

        <div className="flex flex-col gap-2 mt-2 w-full px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id === "dashboard" ? "/" : `/${item.id}`)}
                title={item.label}
                className={`w-full flex items-center justify-center h-9 rounded-lg transition-all ${
                  currentPage === item.id
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-blue-400/60 hover:text-blue-200 hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
              </button>
            );
          })}
          <button
            onClick={() => handleNavigate("/sprint/frederick")}
            title="Sprint Frederick"
            className={`w-full flex items-center justify-center h-9 rounded-lg transition-all ${
              currentPage === "sprint"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                : "text-blue-400/60 hover:text-blue-200 hover:bg-white/5"
            }`}
          >
            <Activity size={16} />
          </button>
        </div>

        <div className="mt-auto mb-2">
          <button
            onClick={openCreate}
            title="Nueva nota"
            className="size-9 flex items-center justify-center rounded-lg text-blue-400/60 hover:text-blue-200 hover:bg-white/5 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full h-full flex flex-col bg-navy-950 overflow-hidden border-r border-navy-800/50">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-navy-800/30">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm shadow-blue-600/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight">Ecomex 360</h1>
            <p className="text-[10px] text-blue-300/50 font-medium tracking-wider uppercase">Project Lead</p>
          </div>
        </div>
        <button
          onClick={() => onToggleCollapsed(true)}
          title="Colapsar panel"
          className="size-7 flex items-center justify-center rounded-md text-blue-400/40 hover:text-blue-200 hover:bg-white/5 transition-colors"
        >
          <PanelLeftClose size={14} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 pt-4 pb-2">
        <p className="section-title px-3 mb-2">Navegación</p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id === "dashboard" ? "/" : `/${item.id}`)}
                className={`sidebar-link w-full text-left ${
                  currentPage === item.id ? "active" : ""
                }`}
              >
                <Icon size={16} className={currentPage === item.id ? "text-blue-400" : ""} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => handleNavigate("/sprint/frederick")}
            className={`sidebar-link w-full text-left ${
              currentPage === "sprint" ? "active" : ""
            }`}
          >
            <Activity size={16} className={currentPage === "sprint" ? "text-blue-400" : ""} />
            <span>Sprint Frederick</span>
          </button>
        </div>
      </nav>

      {/* Notes section */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between border-t border-navy-800/30 mt-1">
        <div className="flex items-center gap-2">
          <StickyNote size={14} className="text-blue-400/60" />
          <h2 className="text-xs font-semibold tracking-wider text-blue-200/80 uppercase">Notas</h2>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={filterTelegram}
            onCheckedChange={(v) => setFilterTelegram(!!v)}
            className="scale-75 data-[state=checked]:bg-blue-600"
          />
          <span className="text-[10px] text-blue-300/50 font-medium">TG</span>
          <Button
            size="sm"
            onClick={openCreate}
            className="h-7 w-7 p-0 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/20"
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 pb-2 overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedRecordatorios.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-y-2 pt-1">
              {loading && (
                <div className="space-y-2 mt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={`skeleton-${i}`} className="bg-white/5 rounded-lg p-3 space-y-2">
                      <Skeleton className="h-3 w-full bg-white/10" />
                      <Skeleton className="h-3 w-3/4 bg-white/10" />
                      <div className="flex items-center gap-2 mt-2">
                        <Skeleton className="h-4 w-12 rounded-full bg-white/10" />
                        <Skeleton className="h-3 w-14 bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loading && recordatorios.length === 0 && (
                <p className="text-blue-300/40 text-xs text-center mt-8 leading-relaxed">
                  Sin notas aún.
                  <br />
                  Crea la primera con el botón +
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
      <div className="px-5 py-3 border-t border-navy-800/30">
        <p className="text-[10px] text-blue-300/30 text-center font-medium tracking-wider">
          {currentSprintTitle || "Sprint Activo"} · Ecomex 360
        </p>
      </div>

      {/* Modal */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-md bg-navy-900 border-navy-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-blue-100 font-heading text-xl">
              {editingId ? "Editar Nota" : "Nueva Nota"}
            </DialogTitle>
            <DialogDescription className="sr-only">Formulario para crear o editar nota</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="descripcion" className="text-blue-200/80 text-sm">
                Descripción <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="descripcion"
                required
                rows={3}
                autosize
                placeholder="Describe la tarea o nota importante..."
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="resize-none bg-navy-800 border-navy-600 text-blue-100 placeholder:text-blue-300/30 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-blue-200/80 text-sm">Prioridad</Label>
                <Select value={form.prioridad} onValueChange={(val) => setForm((f) => ({ ...f, prioridad: val }))}>
                  <SelectTrigger className="bg-navy-800 border-navy-600 text-blue-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-800 border-navy-600 text-blue-100">
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fecha" className="text-blue-200/80 text-sm">Fecha límite</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                  className="bg-navy-800 border-navy-600 text-blue-100 [color-scheme:dark]"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-blue-200/70">
              <input
                type="checkbox"
                checked={!!form.enviar_telegram}
                onChange={(e) => setForm((f) => ({ ...f, enviar_telegram: e.target.checked }))}
                className="size-4 rounded border-navy-600 bg-navy-800 accent-blue-600"
              />
              Enviar por Telegram
            </label>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setModal(false)} disabled={submitting}
                className="text-blue-200/60 hover:text-blue-100 hover:bg-white/5">
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white">
                {editingId
                  ? submitting ? "Guardando..." : "Guardar cambios"
                  : submitting ? "Creando..." : "Crear nota"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
