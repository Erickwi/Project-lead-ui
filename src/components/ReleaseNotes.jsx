import { useState, useEffect } from "react";
import api from "../api/client";

const SPRINT_LABEL = "Versión 3.10.6.1 stable";

export default function ReleaseNotes({ open, onClose }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/tickets/done")
      .then(({ data }) => setTickets(data.tickets || []))
      .catch((err) => console.error("Error cargando done tickets:", err.message))
      .finally(() => setLoading(false));
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const generateText = () => {
    const divider = "═".repeat(56);
    const header = [
      `RELEASE NOTES — Sprint ${SPRINT_LABEL}`,
      divider,
      `Generado: ${new Date().toLocaleString("es-ES")}`,
      `Total de items: ${tickets.length}`,
      "",
    ].join("\n");

    const lines = tickets
      .map((t, i) =>
        [
          `${i + 1}. [${t.key}] ${t.summary}`,
          `   → Desarrollador : ${t.assignee}`,
          `   → Cliente       : ${t.cliente_nombre || "N/A"}`,
          `   → Día despliegue: ${t.dia_despliegue || "N/A"}`,
          `   → Estado        : ${t.status}`,
        ].join("\n"),
      )
      .join("\n\n");

    return header + lines;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">📝 Release Notes</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} finalizado{tickets.length !== 1 ? "s" : ""} ·{" "}
              {SPRINT_LABEL}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && tickets.length > 0 && (
              <button
                onClick={handleCopy}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                  copied ? "bg-green-500 text-white scale-95" : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}>
                {copied ? "✓ ¡Copiado!" : "📋 Copiar texto"}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none transition-colors"
              aria-label="Cerrar">
              ✕
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && <p className="text-slate-400 text-center mt-10">Cargando tickets finalizados...</p>}

          {!loading && tickets.length === 0 && (
            <div className="text-center text-slate-400 mt-10">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-medium">No hay tickets en estado Done aún.</p>
            </div>
          )}

          {!loading && tickets.length > 0 && (
            <pre className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed border border-slate-200 overflow-x-auto">
              {generateText()}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
