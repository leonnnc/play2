import { Heart, Home, ListMusic, Search, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/buscar', label: 'Buscar', icon: Search },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/playlists', label: 'Playlists', icon: ListMusic },
  { to: '/favoritos', label: 'Favoritos', icon: Heart },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-void-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
      <div className="flex items-stretch justify-around">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-300' : 'text-white/40'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(167,139,250,0.7)]' : ''}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
