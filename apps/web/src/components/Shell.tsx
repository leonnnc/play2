import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from '../store/app';
import { useAuth } from '../store/auth';
import { useLibrary } from '../store/library';
import { MobileNav } from './MobileNav';
import { PlayerBar } from './PlayerBar';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Toasts } from './ui';

function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-void-950" />
      <div className="aurora-blob -left-32 -top-40 h-[38rem] w-[38rem] animate-float bg-brand-600/25" />
      <div
        className="aurora-blob -right-24 top-1/4 h-[30rem] w-[30rem] animate-float bg-neon-cyan/15"
        style={{ animationDelay: '-4s' }}
      />
      <div
        className="aurora-blob bottom-0 left-1/3 h-[26rem] w-[26rem] animate-float bg-neon-rose/10"
        style={{ animationDelay: '-8s' }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black 20%, transparent 75%)',
        }}
      />
    </div>
  );
}

export function Shell() {
  const bootstrap = useApp((s) => s.bootstrap);
  const { init, user } = useAuth();
  const loadLibrary = useLibrary((s) => s.load);
  const resetLibrary = useLibrary((s) => s.reset);

  useEffect(() => {
    void bootstrap();
    void init();
  }, [bootstrap, init]);

  useEffect(() => {
    if (user) void loadLibrary();
    else resetLibrary();
  }, [user, loadLibrary, resetLibrary]);

  return (
    <div className="relative min-h-screen">
      <Aurora />
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="mx-auto w-full max-w-[1600px] px-4 pb-60 pt-5 sm:px-6 lg:px-8 lg:pb-44">
          <Outlet />
        </main>
      </div>
      <PlayerBar />
      <MobileNav />
      <Toasts />
    </div>
  );
}
