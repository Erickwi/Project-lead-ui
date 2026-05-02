export function isDeveloper(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return !/jira|automation|bot|system|qa|tester|revisor|operativo|product owner|po |scrum master|sm /i.test(lower);
}

export function tipoColor(tipo) {
  const t = (tipo || "").toLowerCase();
  if (/bug|error|defecto/.test(t))
    return { bar: "bg-red-400", badge: "bg-red-50 text-red-700 border-red-300", border: "border-red-200" };
  if (/mejora|improvement|story/.test(t))
    return { bar: "bg-cyan-400", badge: "bg-cyan-50 text-cyan-700 border-cyan-300", border: "border-cyan-200" };
  if (/task|tarea/.test(t))
    return { bar: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-300", border: "border-amber-200" };
  if (/epic/.test(t))
    return {
      bar: "bg-purple-400",
      badge: "bg-purple-50 text-purple-700 border-purple-300",
      border: "border-purple-200",
    };
  return { bar: "bg-zinc-400", badge: "bg-zinc-100 text-zinc-600 border-zinc-300", border: "border-zinc-200" };
}

export const MODULE_COLORS = [
  "bg-indigo-400",
  "bg-teal-400",
  "bg-orange-400",
  "bg-pink-400",
  "bg-lime-500",
  "bg-sky-400",
  "bg-violet-400",
  "bg-rose-400",
  "bg-emerald-400",
  "bg-fuchsia-400",
];

export const HORAS_TARGET_DEVS = ["jerson", "fabio", "mateo", "jairo"];

export const HORAS_STATUS_GROUPS = [
  {
    key: "finalizados",
    label: "Finalizados",
    icon: "✅",
    regex: /done|finaliz|complet|cerrado|terminado/i,
    headerCls: "bg-green-50 border-green-200",
    badgeCls: "bg-green-100 text-green-700 border-green-200",
    barCls: "bg-green-500",
  },
  {
    key: "ajustes",
    label: "Ajustes",
    icon: "🔧",
    regex: /ajuste/i,
    headerCls: "bg-orange-50 border-orange-200",
    badgeCls: "bg-orange-100 text-orange-700 border-orange-200",
    barCls: "bg-orange-500",
  },
  {
    key: "desarrollo",
    label: "En Desarrollo",
    icon: "💻",
    regex: /desarrollo|in progress|en progreso|doing|progreso/i,
    headerCls: "bg-blue-50 border-blue-200",
    badgeCls: "bg-blue-100 text-blue-700 border-blue-200",
    barCls: "bg-blue-500",
  },
  {
    key: "porHacer",
    label: "Por Hacer",
    icon: "📋",
    regex: /to do|por hacer|backlog|abierto|sin iniciar|open/i,
    headerCls: "bg-zinc-50 border-zinc-200",
    badgeCls: "bg-zinc-100 text-zinc-600 border-zinc-200",
    barCls: "bg-zinc-400",
  },
  {
    key: "enPausa",
    label: "En Pausa",
    icon: "⏸️",
    regex: /pausa|pausado|hold|bloqueado|blocked/i,
    headerCls: "bg-yellow-50 border-yellow-200",
    badgeCls: "bg-yellow-100 text-yellow-700 border-yellow-200",
    barCls: "bg-yellow-500",
  },
];
