"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchAnalytics, DashboardKpis, SegmentRow } from "@/lib/analytics";
import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";
import { KpiCard } from "@/components/KpiCard";

function fmtMoeda(v: number | null) {
  if (v === null) return null;
  return v.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export default function FinanceiroPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [insufficient, setInsufficient] = useState(false);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAnalytics<DashboardKpis>("dashboard"), fetchAnalytics<SegmentRow[]>("market")]).then(
      ([d, m]) => {
        if (cancelled) return;
        setError(d.error ?? m.error ?? null);
        setInsufficient(d.insufficient);
        setKpis(d.data);
        setSegments((m.data as SegmentRow[]) || []);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const margem = kpis && kpis.receita_media ? (kpis.lucro_medio! / kpis.receita_media) * 100 : null;
  const gastosPorCategoria = segments
    .filter((s) => Number(s.despesas_total ?? 0) > 0)
    .map((s) => ({ nome: s.segment, valor: Number(s.despesas_total ?? 0) }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-medium text-ink">Financeiro</h1>

      {insufficient ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Receita média" value={fmtMoeda(kpis!.receita_media)} />
          <KpiCard label="Lucro médio" value={fmtMoeda(kpis!.lucro_medio)} />
          <KpiCard label="Margem média" value={margem !== null ? margem.toFixed(1) : null} suffix="%" />
          <KpiCard label="Contratos analisados" value={kpis!.contratos_analisados} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass fade-in rounded-xl2 p-5">
          <div className="mb-4 text-sm text-ink">Gastos por categoria</div>
          {gastosPorCategoria.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={gastosPorCategoria}>
                <CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} />
                <XAxis dataKey="nome" stroke="#8A8A8A" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8A8A8A" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#EDEDED" }} />
                <Bar dataKey="valor" fill="#5B8CFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass fade-in rounded-xl2 p-5">
          <div className="mb-4 text-sm text-ink">Gastos por profissão</div>
          <EmptyState
            title="Ainda não capturado"
            description="O Pivot não guarda a profissão do prestador como campo estruturado hoje — só a categoria do trabalho (segment). Adicionar 'profissão' exigiria um novo campo no cadastro do workspace antes de existir aqui."
          />
        </div>
      </div>
    </div>
  );
}
