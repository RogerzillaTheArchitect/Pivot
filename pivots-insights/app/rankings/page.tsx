"use client";

import { useEffect, useState } from "react";
import { fetchAnalytics, RegionRow, SegmentRow } from "@/lib/analytics";
import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";

function RankingCard({ titulo, itens }: { titulo: string; itens: { nome: string; valor: string }[] }) {
  return (
    <div className="glass fade-in rounded-xl2 p-5">
      <div className="mb-4 text-sm text-ink">{titulo}</div>
      {itens.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="flex flex-col gap-2">
          {itens.map((it, i) => (
            <li key={it.nome} className="flex items-center justify-between border-b border-line/60 pb-2 text-sm last:border-none">
              <span className="text-muted">
                <span className="mr-2 text-ink/70">{i + 1}.</span>
                {it.nome}
              </span>
              <span className="text-ink">{it.valor}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function RankingsPage() {
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAnalytics<SegmentRow[]>("market"), fetchAnalytics<RegionRow[]>("regions")]).then(([m, r]) => {
      if (cancelled) return;
      setError(m.error ?? r.error ?? null);
      setSegments((m.data as SegmentRow[]) || []);
      setRegions((r.data as RegionRow[]) || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const topCategoriasTicket = [...segments]
    .sort((a, b) => Number(b.ticket_medio ?? 0) - Number(a.ticket_medio ?? 0))
    .slice(0, 10)
    .map((s) => ({ nome: s.segment, valor: `€${Number(s.ticket_medio ?? 0).toFixed(0)}` }));

  const topRegioesReceita = [...regions]
    .sort((a, b) => Number(b.receita_total ?? 0) - Number(a.receita_total ?? 0))
    .slice(0, 10)
    .map((r) => ({ nome: [r.country, r.state, r.city].filter(Boolean).join(" / "), valor: `€${Number(r.receita_total ?? 0).toFixed(0)}` }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-medium text-ink">Rankings</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankingCard titulo="Maior ticket médio (categoria)" itens={topCategoriasTicket} />
        <RankingCard titulo="Maior receita (região)" itens={topRegioesReceita} />
        <div className="glass fade-in rounded-xl2 p-5">
          <div className="mb-4 text-sm text-ink">Top cidades</div>
          <EmptyState description="Depende de geolocalização real por job, ainda pouco preenchida — ver seção Regiões." />
        </div>
        <div className="glass fade-in rounded-xl2 p-5">
          <div className="mb-4 text-sm text-ink">Maior crescimento</div>
          <EmptyState description="Precisa de pelo menos dois períodos comparáveis com volume anonimizável; hoje o histórico ainda é curto demais." />
        </div>
      </div>
    </div>
  );
}
