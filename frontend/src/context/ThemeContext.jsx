import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Aplica o quita la clase "dark" en <html> para que todas las utilidades
// dark: de Tailwind reaccionen en toda la app.
const applyThemeClass = (theme) => {
  const root = window.document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('turnotech-theme');
    if (saved) return saved;
    // Si no hay preferencia guardada, respeta el sistema operativo del usuario
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    applyThemeClass(theme);
    localStorage.setItem('turnotech-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
