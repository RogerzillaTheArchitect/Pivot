"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchAnalytics, TrendRow } from "@/lib/analytics";
import { useFiltros } from "@/lib/filters-context";
import { PERIODOS } from "@/lib/filters";
import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";

const SERIES: { tipo: TrendRow["event_type"]; label: string }[] = [
  { tipo: "job_created", label: "Contratos" },
  { tipo: "payment_received", label: "Receita" },
  { tipo: "expense_added", label: "Despesas" },
];

export default function TendenciasPage() {
  const { filtros, setFiltros } = useFiltros();
  const [trends, setTrends] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const dias = PERIODOS.find((p) => p.id === filtros.periodo)?.dias ?? 90;
    fetchAnalytics<TrendRow[]>("trends", { days: String(dias) }).then((res) => {
      if (cancelled) return;
      setError(res.error ?? null);
      setTrends((res.data as TrendRow[]) || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filtros.periodo]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-ink">Tendências</h1>
        <select
          value={filtros.periodo}
          onChange={(e) => setFiltros({ periodo: e.target.value as typeof filtros.periodo })}
          className="rounded-lg border border-line bg-transparent px-3 py-1.5 text-sm text-ink outline-none focus:border-white/20"
        >
          {PERIODOS.map((p) => (
            <option key={p.id} value={p.id} className="bg-panel">
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {SERIES.map(({ tipo, label }) => {
          const serie = trends.filter((t) => t.event_type === tipo).map((t) => ({ dia: t.dia, valor: Number(t.valor_total ?? 0) }));
          return (
            <div key={tipo} className="glass fade-in rounded-xl2 p-5">
              <div className="mb-4 text-sm text-ink">{label}</div>
              {serie.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={serie}>
                    <CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} />
                    <XAxis dataKey="dia" stroke="#8A8A8A" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8A8A8A" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#EDEDED" }} />
                    <Line type="monotone" dataKey="valor" stroke="#5B8CFF" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
