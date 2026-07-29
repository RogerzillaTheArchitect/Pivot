import { EmptyState } from "./EmptyState";

export function SectionPlaceholder({
  titulo,
  cards,
}: {
  titulo: string;
  cards: { titulo: string; nota?: string }[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-medium text-ink">{titulo}</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {cards.map((c) => (
          <div key={c.titulo} className="glass fade-in rounded-xl2 p-5">
            <div className="mb-4 text-sm text-ink">{c.titulo}</div>
            <EmptyState title="Estrutura pronta, sem dados ainda" description={c.nota ?? "Esta visualização está com o layout final, mas aguarda o endpoint de agregação correspondente no backend do Pivot."} />
          </div>
        ))}
      </div>
    </div>
  );
}
