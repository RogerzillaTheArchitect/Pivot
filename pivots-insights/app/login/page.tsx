export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="glass fade-in w-full max-w-sm rounded-xl2 p-8">
        <div className="mb-6 text-center">
          <div className="text-sm font-medium text-ink">Pivots Insights</div>
          <div className="mt-1 text-xs text-muted">Inteligência de mercado</div>
        </div>
        <form className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            className="rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-white/20"
          />
          <input
            type="password"
            placeholder="Palavra-passe"
            className="rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-white/20"
          />
          <button
            type="submit"
            disabled
            className="mt-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-ink opacity-60"
            title="Autenticação real ainda não implementada — este é só o layout de entrada."
          >
            Entrar
          </button>
        </form>
        <p className="mt-4 text-center text-[11px] text-muted">
          Ecrã de login provisório — autenticação real (equipa Pivot) ainda por implementar.
        </p>
      </div>
    </div>
  );
}
