import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className="relative flex items-center w-14 h-8 rounded-full px-1 transition-colors duration-300
                 bg-institucional-800/60 hover:bg-institucional-800 dark:bg-institucional-950
                 border border-white/10 focus-visible:outline-none"
    >
      <span
        className={`absolute top-1 left-1 flex items-center justify-center w-6 h-6 rounded-full
                    bg-white shadow-soft transition-transform duration-300 ease-out
                    ${isDark ? 'translate-x-6' : 'translate-x-0'}`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-institucional-700" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-turquesa-600" />
        )}
      </span>
    </button>
  );
};
