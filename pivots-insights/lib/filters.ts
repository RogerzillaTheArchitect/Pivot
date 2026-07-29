export type Periodo = "7d" | "30d" | "90d" | "12m" | "tudo";

export const PERIODOS: { id: Periodo; label: string; dias: number }[] = [
  { id: "7d", label: "7 dias", dias: 7 },
  { id: "30d", label: "30 dias", dias: 30 },
  { id: "90d", label: "90 dias", dias: 90 },
  { id: "12m", label: "12 meses", dias: 365 },
  { id: "tudo", label: "Todo período", dias: 3650 },
];

export interface Filtros {
  busca: string;
  periodo: Periodo;
  regiao: string | null;
  categoria: string | null;
}

export const FILTROS_VAZIOS: Filtros = {
  busca: "",
  periodo: "90d",
  regiao: null,
  categoria: null,
};
