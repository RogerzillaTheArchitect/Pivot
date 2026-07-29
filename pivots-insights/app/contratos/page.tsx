import { SectionPlaceholder } from "@/components/SectionPlaceholder";

export default function ContratosPage() {
  return (
    <SectionPlaceholder
      titulo="Contratos"
      cards={[
        { titulo: "Contratos mais utilizados" },
        {
          titulo: "Cláusulas mais utilizadas",
          nota: "O Pivot registra blocos de contrato (BIBLIOTECA_BLOCOS) por workspace, mas hoje não emite um evento anônimo agregável para 'bloco usado'. Precisa de um novo evento no backend antes de existir dado real aqui.",
        },
        { titulo: "Percentual médio de entrada" },
        { titulo: "Formas de pagamento mais utilizadas" },
        { titulo: "Parcelamento médio" },
      ]}
    />
  );
}
