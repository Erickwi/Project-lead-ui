import { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { parseISO, format, isValid } from "date-fns";

function fmtDate(iso) {
  if (!iso) return "Sin fecha";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "dd/MM/yyyy") : iso;
}

export default function DeployDrawer({ open, onClose, onOpenServerUpdate }) {
  const [plan, setPlan] = useState({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(() => ({})); // { key: true }

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/deploy-plan");
      setPlan(data.plan || {});
    } catch (err) {
      console.error("Error cargando plan de despliegue:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadPlan();
  }, [open, loadPlan]);

  const clientes = Object.keys(plan).sort();
  const hasData = clientes.length > 0;

  const toggle = (key) => setSelected((s) => ({ ...s, [key]: !s[key] }));

  const selectAllForDay = (diaArr, flag = true) => {
    const next = { ...selected };
    diaArr.forEach((t) => {
      next[t.key] = flag;
    });
    setSelected(next);
  };

  const openWithSelectedForClient = (cliente) => {
    const dias = plan[cliente] || {};
    const all = Object.values(dias).flat();
    const chosen = all.filter((t) => selected[t.key]).map((t) => ({ ...t, cliente_nombre: cliente }));
    if (chosen.length === 0) return; // nothing selected
    onOpenServerUpdate && onOpenServerUpdate(chosen);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose && onClose();
      }}>
      <DrawerContent side="right" className="p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground flex-shrink-0">
          <div>
            <DrawerHeader className="text-left space-y-0">
              <DrawerTitle className="text-primary-foreground font-bold text-lg">📅 Plan de Despliegue</DrawerTitle>
              <DrawerDescription className="text-primary-foreground/60 text-xs mt-0.5">
                Tickets agrupados por cliente y día
              </DrawerDescription>
            </DrawerHeader>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadPlan}
            title="Recargar"
            className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 h-8 w-8">
            🔄
          </Button>
        </div>

        {/* Contenido */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 min-w-0">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground text-sm">Cargando plan...</p>
              </div>
            )}

            {!loading && !hasData && (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                <p className="text-4xl mb-3">🗓️</p>
                <p className="font-medium">Sin tickets asignados a clientes</p>
                <p className="text-sm mt-1 max-w-xs leading-relaxed">
                  Abre cualquier ticket en la vista principal y asígnale un cliente y un día de despliegue.
                </p>
              </div>
            )}

            {!loading &&
              hasData &&
              clientes.map((cliente) => {
                const dias = plan[cliente];
                const totalTickets = Object.values(dias).reduce((s, arr) => s + arr.length, 0);
                return (
                  <div key={cliente} className="mb-6">
                    {/* Cabecera cliente */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-foreground/30 flex-shrink-0" />
                      <h3 className="font-bold text-foreground text-sm flex-auto min-w-0 truncate">{cliente}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs rounded-full">
                          {totalTickets} ticket{totalTickets !== 1 ? "s" : ""}
                        </Badge>
                        {/* count selected for this client */}
                        {(() => {
                          const dias = plan[cliente] || {};
                          const all = Object.values(dias).flat();
                          const selectedCount = all.filter((t) => selected[t.key]).length;
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {selectedCount > 0
                                  ? `${selectedCount} seleccionad${selectedCount > 1 ? "os" : "o"}`
                                  : ""}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openWithSelectedForClient(cliente)}
                                className="ml-2 text-xs"
                                disabled={selectedCount === 0}>
                                Abrir seleccionados
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Días */}
                    {Object.keys(dias)
                      .sort((a, b) => (a === "Sin fecha" ? 1 : a.localeCompare(b)))
                      .map((dia) => (
                        <div key={dia} className="mb-3 ml-4">
                          <div className="flex flex-wrap items-center justify-between mb-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {fmtDate(dia)}
                            </p>
                            <div className="flex items-center gap-2">
                              {/* Day-level quick actions removed: keep UI compact. */}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {dias[dia].map((t) => (
                              <div
                                key={t.key}
                                className="flex flex-wrap items-center gap-2 bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 border transition-colors min-w-0">
                                <input
                                  type="checkbox"
                                  checked={!!selected[t.key]}
                                  onChange={() => toggle(t.key)}
                                  className="mr-2"
                                />
                                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-foreground font-bold text-xs w-24 flex-shrink-0">
                                      {t.key}
                                    </span>
                                    <span
                                      className="text-sm text-foreground/80 flex-1 truncate overflow-hidden"
                                      title={t.summary}>
                                      {t.summary}
                                    </span>
                                  </div>
                                  {/* assignee and per-ticket quick actions removed per user request */}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                    <Separator className="mt-4" />
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
