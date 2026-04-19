import { useState } from 'react';
import { useRecordatorios } from '../hooks/useRecordatorios';

const PRIORITY_CFG = {
  Alta:  { border: 'border-l-red-500',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500'    },
  Media: { border: 'border-l-yellow-400', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  Baja:  { border: 'border-l-green-500',  badge: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
};

const EMPTY_FORM = { descripcion: '', prioridad: 'Media', fecha: '' };

export default function Sidebar() {
  const { recordatorios, loading, crear, actualizar, eliminar } = useRecordatorios();
  const [modal, setModal]       = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModal(true);
  };

  const openEdit = (rec) => {
    setForm({
      descripcion: rec.descripcion,
      prioridad:   rec.prioridad,
      fecha:       rec.fecha ? rec.fecha.split('T')[0] : '',
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
      console.error('Error guardando recordatorio:', err.message);
    }
  };

  return (
    <>
      <aside className="w-72 flex-shrink-0 flex flex-col bg-slate-900 h-screen overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">
            📋 Notas & Recordatorios
          </h2>
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            + Nuevo
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && (
            <p className="text-slate-500 text-xs text-center mt-6">Cargando...</p>
          )}
          {!loading && recordatorios.length === 0 && (
            <p className="text-slate-600 text-xs text-center mt-8 leading-relaxed">
              Sin recordatorios aún.<br />Crea el primero con el botón +
            </p>
          )}
          {recordatorios.map(rec => {
            const cfg = PRIORITY_CFG[rec.prioridad] || PRIORITY_CFG.Media;
            return (
              <div
                key={rec.id}
                className={`bg-slate-800 border-l-4 ${cfg.border} rounded-r-lg p-3 group transition-all hover:bg-slate-750`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-200 flex-1 leading-snug break-words">
                    {rec.descripcion}
                  </p>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-0.5">
                    <button
                      onClick={() => openEdit(rec)}
                      title="Editar"
                      className="text-slate-400 hover:text-blue-400 text-sm leading-none"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => eliminar(rec.id)}
                      title="Eliminar"
                      className="text-slate-400 hover:text-red-400 text-sm leading-none"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
                    {rec.prioridad}
                  </span>
                  {rec.fecha && (
                    <span className="text-xs text-slate-500">
                      {new Date(rec.fecha).toLocaleDateString('es-ES', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer version */}
        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-xs text-slate-600 text-center">Sprint v3.10.6.1 · Ecomex 360</p>
        </div>
      </aside>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-800">
              {editingId ? '✏️ Editar Recordatorio' : '➕ Nuevo Recordatorio'}
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe la tarea o nota importante..."
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                <select
                  value={form.prioridad}
                  onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Alta</option>
                  <option>Media</option>
                  <option>Baja</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha límite</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {editingId ? 'Guardar cambios' : 'Crear recordatorio'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
