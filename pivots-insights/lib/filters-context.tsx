"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { FILTROS_VAZIOS, Filtros } from "./filters";

interface FiltrosContextValue {
  filtros: Filtros;
  setFiltros: (f: Partial<Filtros>) => void;
}

const FiltrosContext = createContext<FiltrosContextValue | null>(null);

export function FiltrosProvider({ children }: { children: React.ReactNode }) {
  const [filtros, setFiltrosState] = useState<Filtros>(FILTROS_VAZIOS);

  const value = useMemo<FiltrosContextValue>(
    () => ({
      filtros,
      setFiltros: (f) => setFiltrosState((prev) => ({ ...prev, ...f })),
    }),
    [filtros],
  );

  return <FiltrosContext.Provider value={value}>{children}</FiltrosContext.Provider>;
}

export function useFiltros() {
  const ctx = useContext(FiltrosContext);
  if (!ctx) throw new Error("useFiltros precisa estar dentro de <FiltrosProvider>");
  return ctx;
}
