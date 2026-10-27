import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Shell } from './components/Shell';
import { useAuth } from './store/auth';
import { Account } from './pages/Account';
import { CategoryPage } from './pages/CategoryPage';
import { Favorites } from './pages/Favorites';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { PlaylistDetail } from './pages/PlaylistDetail';
import { Playlists } from './pages/Playlists';
import { Ranking } from './pages/Ranking';
import { Register } from './pages/Register';
import { SearchPage } from './pages/SearchPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="buscar" element={<SearchPage />} />
        <Route path="categoria/:slug" element={<CategoryPage />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="playlists" element={<RequireAuth><Playlists /></RequireAuth>} />
        <Route path="playlists/:id" element={<RequireAuth><PlaylistDetail /></RequireAuth>} />
        <Route path="favoritos" element={<RequireAuth><Favorites /></RequireAuth>} />
        <Route path="cuenta" element={<RequireAuth><Account /></RequireAuth>} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
