import { LogIn, Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { initials } from '../lib/format';
import { useAuth } from '../store/auth';
import { useUI } from '../store/ui';
import { Logo } from './Sidebar';

export function TopBar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const { user } = useAuth();
  const focusSearch = useUI((s) => s.searchFocus);

  useEffect(() => {
    setQ(params.get('q') ?? '');
  }, [params]);

  useEffect(() => {
    if (focusSearch) document.getElementById('global-search')?.focus();
  }, [focusSearch]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/buscar?q=${encodeURIComponent(term)}` : '/buscar');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-void-950/60 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="lg:hidden">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <form onSubmit={submit} className="relative hidden flex-1 sm:block lg:max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            id="global-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca alabanzas, artistas, prédicas..."
            className="input py-2.5 pl-10 pr-24"
            aria-label="Buscar música cristiana"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/60 transition-colors hover:bg-white/20 hover:text-white"
          >
            Buscar
          </button>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/buscar"
            className="btn-icon sm:hidden"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </Link>

          <Link to="/ranking" className="chip hidden md:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-neon-amber" />
            Top semanal
          </Link>

          {user ? (
            <Link
              to="/cuenta"
              className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-neon-cyan text-xs font-bold text-void-950"
              aria-label="Mi cuenta"
            >
              {initials(user.name)}
            </Link>
          ) : (
            <Link to="/login" className="btn-ghost hidden px-3 py-2 text-xs sm:inline-flex">
              <LogIn className="h-3.5 w-3.5" />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
