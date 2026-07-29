// Cliente fino para os endpoints anônimos e agregados do backend do Pivot.
// Nunca consulta o banco operacional diretamente — só a Edge Function `analytics`,
// que só devolve materialized views já filtradas por limiar de anonimato.

const BASE_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || "";
const ANON_KEY = process.env.NEXT_PUBLIC_ANALYTICS_ANON_KEY || "";

export type AnalyticsResource = "dashboard" | "market" | "regions" | "trends";

export interface AnalyticsResponse<T> {
  resource: AnalyticsResource;
  insufficient: boolean;
  data: T | null;
  error?: string;
}

export async function fetchAnalytics<T = unknown>(
  resource: AnalyticsResource,
  params: Record<string, string> = {},
): Promise<AnalyticsResponse<T>> {
  if (!BASE_URL) {
    return { resource, insufficient: true, data: null, error: "NEXT_PUBLIC_ANALYTICS_URL não configurada" };
  }
  const qs = new URLSearchParams({ resource, ...params }).toString();
  try {
    const res = await fetch(`${BASE_URL}?${qs}`, {
      headers: ANON_KEY ? { apikey: ANON_KEY } : undefined,
      cache: "no-store",
    });
    if (!res.ok) {
      return { resource, insufficient: true, data: null, error: `HTTP ${res.status}` };
    }
    return (await res.json()) as AnalyticsResponse<T>;
  } catch (e) {
    return { resource, insufficient: true, data: null, error: e instanceof Error ? e.message : "erro de rede" };
  }
}

export interface DashboardKpis {
  ticket_medio: number | null;
  receita_media: number | null;
  lucro_medio: number | null;
  contratos_analisados: number;
  segmentos_analisados: number;
  regioes_analisadas: number;
  workspaces_distintos: number;
}

export interface SegmentRow {
  segment: string;
  contratos: number;
  ticket_medio: number | null;
  receita_total: number | null;
  despesas_total: number | null;
  workspaces_distintos: number;
}

export interface RegionRow {
  country: string;
  state: string | null;
  city: string | null;
  contratos: number;
  ticket_medio: number | null;
  receita_total: number | null;
  workspaces_distintos: number;
}

export interface TrendRow {
  dia: string;
  event_type: "job_created" | "payment_received" | "expense_added";
  eventos: number;
  valor_total: number | null;
  valor_medio: number | null;
  workspaces_distintos: number;
}
