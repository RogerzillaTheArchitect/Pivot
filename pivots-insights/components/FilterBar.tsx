"use client";

import { useFiltros } from "@/lib/filters-context";
import { PERIODOS } from "@/lib/filters";

export function FilterBar({ regioes, categorias }: { regioes: string[]; categorias: string[] }) {
  const { filtros, setFiltros } = useFiltros();

  return (
    <div className="glass fade-in flex flex-wrap items-center gap-2 rounded-xl2 px-4 py-3">
      <input
        value={filtros.busca}
        onChange={(e) => setFiltros({ busca: e.target.value })}
        placeholder="Pesquisar…"
        className="w-48 rounded-lg border border-line bg-transparent px-3 py-1.5 text-sm text-ink placeholder:text-muted outline-none focus:border-white/20"
      />

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

      <select
        value={filtros.regiao ?? ""}
        onChange={(e) => setFiltros({ regiao: e.target.value || null })}
        className="rounded-lg border border-line bg-transparent px-3 py-1.5 text-sm text-ink outline-none focus:border-white/20"
      >
        <option value="" className="bg-panel">
          Todas as regiões
        </option>
        {regioes.map((r) => (
          <option key={r} value={r} className="bg-panel">
            {r}
          </option>
        ))}
      </select>

      <select
        value={filtros.categoria ?? ""}
        onChange={(e) => setFiltros({ categoria: e.target.value || null })}
        className="rounded-lg border border-line bg-transparent px-3 py-1.5 text-sm text-ink outline-none focus:border-white/20"
      >
        <option value="" className="bg-panel">
          Todas as categorias
        </option>
        {categorias.map((c) => (
          <option key={c} value={c} className="bg-panel">
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
