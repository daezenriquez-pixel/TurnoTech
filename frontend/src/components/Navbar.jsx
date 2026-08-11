import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { LogOut, ChevronDown, MonitorSmartphone } from 'lucide-react';

const roleLabel = (role) => {
  if (role === 'super_admin') return 'Superusuario';
  if (role === 'room_admin') return 'Admin de Sala';
  return 'Docente';
};

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Cierra el menú de perfil al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <nav
      className="sticky top-0 z-40 bg-institucional-700 dark:bg-institucional-950
                 border-b border-white/10 shadow-soft-lg backdrop-blur
                 transition-colors duration-300"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo + título de la plataforma */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0
                       bg-gradient-to-br from-turquesa-400 to-institucional-500
                       shadow-soft"
          >
            <MonitorSmartphone className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-white leading-tight tracking-tight truncate">
              TurnoTech
            </p>
            <p className="hidden sm:block text-[11px] text-institucional-200/80 leading-tight truncate">
              Reserva de Salas de Cómputo
            </p>
          </div>
        </div>

        {/* Tema + Perfil */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 pl-2 pr-1 sm:pr-3 py-1.5 rounded-full
                         bg-white/10 hover:bg-white/15 transition-colors duration-200
                         focus-visible:outline-none"
            >
              <span
                className="flex items-center justify-center w-8 h-8 rounded-full
                           bg-turquesa-400 text-institucional-900 font-display font-bold text-sm shrink-0"
              >
                {initials(user.name) || 'U'}
              </span>
              <span className="hidden sm:block text-left leading-tight">
                <span className="block text-sm font-semibold text-white truncate max-w-[9rem]">
                  {user.name}
                </span>
                <span className="block text-[11px] text-turquesa-200">
                  {roleLabel(user.role)}
                </span>
              </span>
              <ChevronDown
                className={`hidden sm:block w-4 h-4 text-institucional-200 transition-transform duration-200 ${
                  open ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Menú desplegable */}
            <div
              className={`absolute right-0 mt-2 w-52 origin-top-right rounded-2xl overflow-hidden
                          bg-white dark:bg-institucional-800 shadow-soft-lg
                          border border-slate-100 dark:border-white/10
                          transition-all duration-150 ease-out
                          ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 sm:hidden">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-institucional-200">{roleLabel(user.role)}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium
                           text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10
                           transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
