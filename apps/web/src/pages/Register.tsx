import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORY_FALLBACK } from '../lib/categories';
import { useAuth } from '../store/auth';
import { useUI } from '../store/ui';
import { AuthAside, AuthError } from './Login';

export function Register() {
  const { register, updatePrefs, busy, error } = useAuth();
  const navigate = useNavigate();
  const toast = useUI((s) => s.toast);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [picked, setPicked] = useState<string[]>(['alabanzas', 'adoraciones']);
  const [localError, setLocalError] = useState<string | null>(null);

  const toggle = (slug: string) =>
    setPicked((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (password.length < 6) {
      setLocalError('La contraseña necesita al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }
    try {
      await register(name.trim(), email.trim(), password);
      if (picked.length) {
        await updatePrefs({ categories: picked }).catch(() => undefined);
      }
      toast('¡Bienvenido a Play2!', 'success');
      navigate('/', { replace: true });
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
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-white/50">
          Gratis. Sin tarjetas. Solo música que edifica.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Nombre
            </label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                id="name"
                required
                minLength={2}
                maxLength={60}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="input pl-11"
              />
            </div>
          </div>

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

          <div className="grid gap-3 sm:grid-cols-2">
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6"
                  className="input pl-11"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="confirm">
                Repetir
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite la clave"
                  className="input pl-11"
                />
              </div>
            </div>
          </div>

          <div>
            <span className="label">¿Qué te gusta escuchar?</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_FALLBACK.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggle(c.slug)}
                  className={`chip ${picked.includes(c.slug) ? 'chip-active' : ''}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-white/35">
              Lo usamos para personalizar tu inicio. Puedes cambiarlo luego en tu cuenta.
            </p>
          </div>

          <AuthError message={localError ?? error} />

          <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
            {busy ? 'Creando cuenta...' : 'Crear cuenta'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/45">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-300 hover:text-white">
            Inicia sesión
          </Link>
        </p>
      </div>

      <AuthAside />
    </motion.div>
  );
}
