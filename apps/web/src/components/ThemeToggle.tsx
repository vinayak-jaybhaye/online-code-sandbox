import type { Theme } from '../hooks/useTheme.js';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: (theme: Theme) => void;
}

/**
 * Theme toggle button — cycles through light → dark → system.
 */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const next: Record<Theme, Theme> = {
    light: 'dark',
    dark: 'system',
    system: 'light',
  };

  const icons: Record<Theme, { path: string; label: string }> = {
    light: {
      path: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
      label: 'Light mode',
    },
    dark: {
      path: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
      label: 'Dark mode',
    },
    system: {
      path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      label: 'System theme',
    },
  };

  const current = icons[theme];

  return (
    <button
      className="rounded-md border border-(--color-border) bg-(--color-bg-elevated) p-1.5 text-(--color-text-secondary) transition-colors hover:border-(--color-border-active) hover:text-(--color-text-primary)"
      onClick={() => onToggle(next[theme])}
      title={current.label}
      aria-label={current.label}
      type="button"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={current.path} />
      </svg>
    </button>
  );
}
