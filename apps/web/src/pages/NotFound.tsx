import { motion } from 'framer-motion';
import { Compass, Home as HomeIcon, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center text-center"
    >
      <div className="relative mb-6 grid h-24 w-24 place-items-center rounded-3xl border border-white/10 bg-gradient-to-br from-brand-600/30 to-neon-cyan/15">
        <Compass className="h-10 w-10 text-brand-300" />
        <div className="absolute inset-0 -z-10 animate-pulse-ring rounded-3xl border border-brand-400/40" />
      </div>
      <p className="font-display text-5xl font-bold tracking-tight text-white">404</p>
      <h1 className="mt-3 font-display text-xl font-semibold text-white">Esta página no existe</h1>
      <p className="mt-2 text-sm text-white/50">
        Puede que el enlace haya cambiado. Vuelve al inicio o busca tu música favorita.
      </p>
      <div className="mt-6 flex gap-2">
        <Link to="/" className="btn-primary">
          <HomeIcon className="h-4 w-4" /> Ir al inicio
        </Link>
        <Link to="/buscar" className="btn-ghost">
          <Search className="h-4 w-4" /> Buscar
        </Link>
      </div>
    </motion.div>
  );
}
