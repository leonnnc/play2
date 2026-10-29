import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Heart,
  ListMusic,
  LogOut,
  Music4,
  Radio,
  Save,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SpotifyPanel } from '../components/SpotifyPanel';
import { EmptyState } from '../components/ui';
import { formatDate, initials, PROVIDER_LABEL } from '../lib/format';
import type { ProviderId } from '../lib/types';
import { useApp } from '../store/app';
import { useAuth } from '../store/auth';
import { useLibrary } from '../store/library';
import { useUI } from '../store/ui';

const ALL_PROVIDERS: ProviderId[] = ['itunes', 'youtube', 'spotify', 'soundcloud', 'vimeo'];

export function Account() {
  const { user, updatePrefs, logout } = useAuth();
  const { categories, providers, version } = useApp();
  const { clearHistory } = useLibrary();
  const toast = useUI((s) => s.toast);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [name, setName] = useState(user?.name ?? '');
  const [pickedCats, setPickedCats] = useState<string[]>(user?.prefs.categories ?? []);
  const [pickedProviders, setPickedProviders] = useState<ProviderId[]>(user?.prefs.providers ?? []);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPickedCats(user.prefs.categories);
    setPickedProviders(user.prefs.providers);
  }, [user]);

  // Resultado del callback OAuth de Spotify: /cuenta?spotify=ok|error&reason=...
  useEffect(() => {
    const result = searchParams.get('spotify');
    if (!result) return;

    if (result === 'ok') {
      toast('Cuenta de Spotify conectada', 'success');
    } else {
      const reason = searchParams.get('reason') ?? '';
      const friendly =
        reason === 'access_denied'
          ? 'Cancelaste la autorización en Spotify'
          : reason === 'missing_code'
            ? 'Spotify no devolvió el código de autorización'
            : reason === 'invalid_state'
              ? 'El enlace caducó (10 min). Inténtalo de nuevo'
              : reason.includes('invalid_client')
                ? 'Client Secret incorrecto: revísalo en .env y reinicia la API'
                : reason.includes('invalid_grant')
                  ? 'El código expiró o ya se usó. Inténtalo otra vez'
                  : reason.includes('redirect_uri')
                    ? 'El Redirect URI no coincide con el del dashboard de Spotify'
                    : reason || 'No se pudo completar la conexión';
      toast(`Spotify: ${friendly}`, 'error');
    }

    const next = new URLSearchParams(searchParams);
    next.delete('spotify');
    next.delete('reason');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, toast]);

  if (!user) {
    return (
      <EmptyState
        icon={<UserIcon className="h-8 w-8" />}
        title="Inicia sesión"
        description="Necesitas una cuenta para ver tu perfil."
      />
    );
  }

  const toggle = <T,>(list: T[], value: T, setter: (next: T[]) => void) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const save = async () => {
    setBusy(true);
    try {
      await updatePrefs({ categories: pickedCats, providers: pickedProviders }, name.trim());
      toast('Perfil actualizado', 'success');
    } catch {
      toast('No se pudo guardar el perfil', 'error');
    } finally {
      setBusy(false);
    }
  };

  const stats: { label: string; value: number; icon: typeof Heart }[] = [
    { label: 'Playlists', value: user.stats.playlists, icon: ListMusic },
    { label: 'Favoritos', value: user.stats.favorites, icon: Heart },
    { label: 'Reproducciones', value: user.stats.plays, icon: Radio },
  ];

  return (
    <div className="space-y-6 pb-4">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand-600/25 via-void-900/70 to-neon-cyan/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-500/25 blur-[90px]" />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-neon-cyan font-display text-xl font-bold text-void-950 shadow-glow">
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{user.name}</h1>
            <p className="text-sm text-white/50">{user.email}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-white/30">
              Miembro desde {formatDate(user.createdAt)} · Play2 v{version}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="btn-ghost sm:ml-auto"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 sm:max-w-lg">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <s.icon className="h-4 w-4 text-brand-300" />
              <p className="mt-2 font-display text-xl font-bold text-white">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-5 sm:p-6"
        >
          <h2 className="section-title">Perfil</h2>
          <p className="mt-1 text-sm text-white/45">Cómo te mostramos en la app.</p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="acc-name">
                Nombre
              </label>
              <input
                id="acc-name"
                className="input"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="acc-email">
                Correo
              </label>
              <input id="acc-email" className="input opacity-60" value={user.email} disabled />
            </div>

            <button onClick={save} disabled={busy || name.trim().length < 2} className="btn-primary">
              <Save className="h-4 w-4" /> {busy ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass p-5 sm:p-6"
        >
          <h2 className="section-title">Preferencias</h2>
          <p className="mt-1 text-sm text-white/45">
            Personaliza qué ves primero y qué fuentes usamos al buscar.
          </p>

          <div className="mt-4">
            <span className="label">Categorías favoritas</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggle(pickedCats, c.slug, setPickedCats)}
                  className={`chip ${pickedCats.includes(c.slug) ? 'chip-active' : ''}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <span className="label">Fuentes de búsqueda</span>
            <div className="space-y-2">
              {ALL_PROVIDERS.map((id) => {
                const status = providers.find((p) => p.id === id);
                const active = pickedProviders.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(pickedProviders, id, setPickedProviders)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? 'border-brand-400/50 bg-brand-500/15 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Music4 className="h-3.5 w-3.5 text-white/40" />
                      {PROVIDER_LABEL[id]}
                    </span>
                    {status ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider ${
                          status.configured ? 'text-neon-lime' : 'text-white/35'
                        }`}
                      >
                        {status.configured ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> activa
                          </>
                        ) : (
                          'sin key'
                        )}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-white/35">
              Las fuentes sin API key se omiten en la búsqueda. Configúralas en el archivo{' '}
              <code className="font-mono">.env</code> del proyecto.
            </p>
          </div>
        </motion.section>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SpotifyPanel />
      </motion.div>

      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <ShieldAlert className="h-4 w-4 text-neon-rose" /> Zona de datos
        </h2>
        <p className="mt-1 text-sm text-white/45">
          Tu historial alimenta el ranking de la comunidad. Puedes borrarlo cuando quieras.
        </p>
        <button
          onClick={() => void clearHistory()}
          className="btn-ghost mt-3 text-neon-rose hover:border-neon-rose/40 hover:text-neon-rose"
        >
          Borrar historial de reproducción
        </button>
      </section>
    </div>
  );
}
