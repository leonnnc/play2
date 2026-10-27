import {
  Heart,
  Home,
  ListMusic,
  LogIn,
  Search,
  Trophy,
  User,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../store/app';
import { useAuth } from '../store/auth';
import { initials } from '../lib/format';
import { CategoryIcon } from './CategoryIcon';

const NAV = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/buscar', label: 'Buscar', icon: Search },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/playlists', label: 'Playlists', icon: ListMusic },
  { to: '/favoritos', label: 'Favoritos', icon: Heart },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-400 to-neon-cyan shadow-glow-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-void-950" fill="currentColor">
          <path d="M9 18V6.8c0-.8.9-1.3 1.6-.8l9 5.2c.7.4.7 1.4 0 1.8l-9 5.2c-.7.5-1.6 0-1.6-.8V18Z" />
        </svg>
      </div>
      {!compact ? (
        <div>
          <p className="font-display text-base font-bold leading-none tracking-tight text-white">
            Play<span className="text-brand-300">2</span>
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/35">Música cristiana</p>
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar() {
  const { categories, version, online } = useApp();
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/5 bg-void-950/70 px-4 py-6 backdrop-blur-2xl lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-8 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500/25 to-transparent text-white shadow-[inset_2px_0_0_0_#a78bfa]'
                  : 'text-white/55 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
        Categorías
      </div>
      <div className="no-scrollbar flex-1 space-y-0.5 overflow-y-auto pr-1">
        {categories.map((c) => (
          <NavLink
            key={c.slug}
            to={`/categoria/${c.slug}`}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-all ${
                isActive ? 'bg-white/[0.07] text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/90'
              }`
            }
          >
            <span
              className="grid h-6 w-6 place-items-center rounded-lg"
              style={{ background: `linear-gradient(135deg, ${c.accent[0]}33, ${c.accent[1]}22)` }}
            >
              <CategoryIcon name={c.icon} className="h-3.5 w-3.5" style={{ color: c.accent[0] }} />
            </span>
            <span className="clamp-1">{c.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="mt-4 border-t border-white/5 pt-4">
        {user ? (
          <NavLink
            to="/cuenta"
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-neon-cyan text-xs font-bold text-void-950">
              {initials(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="clamp-1 block text-sm font-medium text-white">{user.name}</span>
              <span className="clamp-1 block text-[11px] text-white/40">{user.email}</span>
            </span>
            <User className="h-4 w-4 text-white/30" />
          </NavLink>
        ) : (
          <NavLink to="/login" className="btn-ghost w-full">
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </NavLink>
        )}

        <div className="mt-3 flex items-center justify-between px-2 text-[10px] text-white/30">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-neon-lime' : 'bg-neon-rose'}`}
            />
            {online ? 'Conectado' : 'Sin servidor'}
          </span>
          <span>v{version}</span>
        </div>
      </div>
    </aside>
  );
}
