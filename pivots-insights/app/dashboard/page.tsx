"use client";

import { useEffect, useState } from "react";
import { fetchAnalytics, DashboardKpis, SegmentRow, RegionRow } from "@/lib/analytics";
import { useFiltros } from "@/lib/filters-context";
import { FilterBar } from "@/components/FilterBar";
import { KpiCard } from "@/components/KpiCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";

function fmtMoeda(v: number | null) {
  if (v === null) return null;
  return v.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export default function DashboardPage() {
  const { filtros } = useFiltros();
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [insufficient, setInsufficient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [regions, setRegions] = useState<RegionRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchAnalytics<DashboardKpis>("dashboard"),
      fetchAnalytics<SegmentRow[]>("market"),
      fetchAnalytics<RegionRow[]>("regions"),
    ]).then(([d, m, r]) => {
      if (cancelled) return;
      setError(d.error ?? null);
      setInsufficient(d.insufficient);
      setKpis(d.data);
      setSegments((m.data as SegmentRow[]) || []);
      setRegions((r.data as RegionRow[]) || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // filtros ainda não afetam agregados globais do dashboard — reservado para quando
    // os endpoints suportarem parâmetros de região/categoria/período no server.
  }, [filtros.periodo]);

  const categorias = segments.map((s) => s.segment);
  const regioes = regions.map((r) => r.country);

  return (
    <div className="flex flex-col gap-6">
      <FilterBar categorias={categorias} regioes={regioes} />

      <h1 className="text-lg font-medium text-ink">Dashboard</h1>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : insufficient ? (
        <EmptyState title="Dados insuficientes" description="É preciso um volume mínimo de workspaces distintos (anonimato) antes de exibir KPIs globais do mercado. À medida que mais contratos reais forem registados no Pivot, este painel passa a preencher sozinho." />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Ticket médio" value={fmtMoeda(kpis!.ticket_medio)} />
          <KpiCard label="Receita média" value={fmtMoeda(kpis!.receita_media)} />
          <KpiCard label="Lucro médio" value={fmtMoeda(kpis!.lucro_medio)} />
          <KpiCard label="Contratos analisados" value={kpis!.contratos_analisados} />
          <KpiCard label="Categorias analisadas" value={kpis!.segmentos_analisados} />
          <KpiCard label="Regiões analisadas" value={kpis!.regioes_analisadas} />
        </div>
      )}
    </div>
  );
}
