export function EmptyState({
  title = "Dados insuficientes",
  description = "Ainda não há volume suficiente de contratos anonimizados nesta segmentação para exibir uma estatística confiável, sem arriscar identificar um workspace específico.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="glass fade-in flex flex-col items-center justify-center gap-2 rounded-xl2 px-6 py-14 text-center">
      <div className="text-sm text-ink">{title}</div>
      <div className="max-w-sm text-xs text-muted">{description}</div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="glass fade-in flex flex-col items-center justify-center gap-2 rounded-xl2 border-red-500/20 px-6 py-14 text-center">
      <div className="text-sm text-ink">Erro de conexão</div>
      <div className="max-w-sm text-xs text-muted">{message}</div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="glass fade-in flex items-center justify-center rounded-xl2 px-6 py-14">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
    </div>
  );
}
