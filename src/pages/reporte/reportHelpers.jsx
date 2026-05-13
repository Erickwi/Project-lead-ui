import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function fmtHoras(h) {
  if (!h || h <= 0) return "N/A";
  if (h < 1) return `${Math.round(h * 60)}min`;
  return `${Math.round(h * 10) / 10}h`;
}

export function statusColor(status) {
  const s = (status || "").toLowerCase();
  if (/done|finaliz|complet|cerrado/.test(s)) return "bg-green-100 text-green-700 border-green-200";
  if (/qa interno|interno|review/.test(s)) return "bg-blue-100 text-blue-700 border-blue-200";
  if (/qa operativo|operativo|uat/.test(s)) return "bg-purple-100 text-purple-700 border-purple-200";
  if (/desarrollo|progress|doing|progreso/.test(s)) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (/bloqueado|blocked/.test(s)) return "bg-red-100 text-red-700 border-red-200";
  return "bg-zinc-100 text-zinc-600 border-zinc-200";
}

export function BarRow({ label, value, max, color = "bg-primary" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 truncate text-muted-foreground text-xs">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold">{value}</span>
    </div>
  );
}

export function KpiCard({ icon, label, value, sub, color = "border-l-primary" }) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {icon} {label}
        </p>
        <p className="text-3xl font-extrabold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// no default export needed
