import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Lock, Mail, Music4, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export function AuthAside() {
  return (
    <div className="relative hidden overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand-600/30 via-void-900/70 to-neon-cyan/10 p-8 lg:block">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/30 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-neon-cyan/20 blur-[80px]" />
      <div className="relative flex h-full flex-col justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
            <Music4 className="h-3 w-3 text-neon-lime" /> Play2
          </span>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight text-white">
            Tu adoración,
            <br />
            <span className="bg-gradient-to-r from-brand-300 via-neon-cyan to-neon-lime bg-clip-text text-transparent">
              siempre contigo.
            </span>
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55">
            Con una cuenta guardas tus playlists, favoritos e historial en la nube y participas del
            ranking de la comunidad.
          </p>
        </div>

        <ul className="mt-8 space-y-3 text-sm text-white/65">
          {[
            'Playlists ilimitadas por momento y ánimo',
            'Favoritos sincronizados entre dispositivos',
            'Ranking con lo más escuchado de la semana',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neon-lime" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-neon-rose/30 bg-neon-rose/10 px-4 py-3 text-sm text-neon-rose">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function Login() {
  const { login, busy, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch {
      /* el error ya vive en el store */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto grid max-w-5xl gap-5 py-4 lg:grid-cols-[1fr_0.9fr]"
    >
      <div className="glass p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Inicia sesión</h1>
        <p className="mt-1 text-sm text-white/50">
          Entra para recuperar tus playlists y seguir construyendo tu biblioteca.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Correo
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="input pl-11"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-11"
              />
            </div>
          </div>

          <AuthError message={error} />

          <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
            {busy ? 'Entrando...' : 'Entrar'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/45">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-brand-300 hover:text-white">
            Crear una gratis
          </Link>
        </p>
      </div>

      <AuthAside />
    </motion.div>
  );
}
