"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchAnalytics, RegionRow, SegmentRow, TrendRow } from "@/lib/analytics";
import { useFiltros } from "@/lib/filters-context";
import { PERIODOS } from "@/lib/filters";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";

const CHART_LINE = "rgba(255,255,255,0.12)";
const CHART_INK = "#EDEDED";
const CHART_MUTED = "#8A8A8A";
const CHART_ACCENT = "#5B8CFF";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass fade-in rounded-xl2 p-5">
      <div className="mb-4 text-sm text-ink">{title}</div>
      {children}
    </div>
  );
}

export default function MercadoPage() {
  const { filtros } = useFiltros();
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [trends, setTrends] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const dias = PERIODOS.find((p) => p.id === filtros.periodo)?.dias ?? 90;
    Promise.all([
      fetchAnalytics<SegmentRow[]>("market"),
      fetchAnalytics<RegionRow[]>("regions"),
      fetchAnalytics<TrendRow[]>("trends", { days: String(dias) }),
    ]).then(([m, r, t]) => {
      if (cancelled) return;
      setError(m.error ?? r.error ?? t.error ?? null);
      setSegments((m.data as SegmentRow[]) || []);
      setRegions((r.data as RegionRow[]) || []);
      setTrends((t.data as TrendRow[]) || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filtros.periodo]);

  const categorias = segments.map((s) => s.segment);
  const regioes = regions.map((r) => r.country);

  const ticketPorCategoria = segments
    .filter((s) => !filtros.categoria || s.segment === filtros.categoria)
    .map((s) => ({ nome: s.segment, valor: Number(s.ticket_medio ?? 0) }));

  const ticketPorRegiao = regions
    .filter((r) => !filtros.regiao || r.country === filtros.regiao)
    .map((r) => ({ nome: [r.country, r.state, r.city].filter(Boolean).join(" / "), valor: Number(r.ticket_medio ?? 0) }));

  const receitaSerie = trends
    .filter((t) => t.event_type === "payment_received")
    .map((t) => ({ dia: t.dia, valor: Number(t.valor_total ?? 0) }));

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="flex flex-col gap-6">
      <FilterBar categorias={categorias} regioes={regioes} />
      <h1 className="text-lg font-medium text-ink">Mercado</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Ticket médio por categoria">
          {ticketPorCategoria.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ticketPorCategoria}>
                <CartesianGrid stroke={CHART_LINE} vertical={false} />
                <XAxis dataKey="nome" stroke={CHART_MUTED} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_MUTED} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: CHART_INK }} />
                <Bar dataKey="valor" fill={CHART_ACCENT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Ticket médio por região">
          {ticketPorRegiao.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ticketPorRegiao}>
                <CartesianGrid stroke={CHART_LINE} vertical={false} />
                <XAxis dataKey="nome" stroke={CHART_MUTED} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_MUTED} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: CHART_INK }} />
                <Bar dataKey="valor" fill={CHART_ACCENT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Crescimento por período (receita)">
          {receitaSerie.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={receitaSerie}>
                <CartesianGrid stroke={CHART_LINE} vertical={false} />
                <XAxis dataKey="dia" stroke={CHART_MUTED} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_MUTED} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: CHART_INK }} />
                <Line type="monotone" dataKey="valor" stroke={CHART_ACCENT} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Serviços mais utilizados">
          <EmptyState title="Ainda não capturado" description="O evento de analytics atual não distingue 'serviço específico' dentro de uma categoria — só a categoria (segment). Adicionar essa granularidade exige capturar um novo campo no Pivot antes de exibir aqui." />
        </SectionCard>
      </div>
    </div>
  );
}
