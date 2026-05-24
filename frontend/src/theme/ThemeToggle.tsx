import { useTheme, type ThemePreference } from './ThemeProvider';

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

const LABELS: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

const ICONS: Record<ThemePreference, string> = {
  system: '◐',
  light: '☀',
  dark: '☾',
};

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  const cyclePreference = () => {
    const currentIndex = ORDER.indexOf(preference);
    const next = ORDER[(currentIndex + 1) % ORDER.length];
    setPreference(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cyclePreference}
      aria-label={`Theme: ${LABELS[preference]}. Click to change.`}
      title={`Theme: ${LABELS[preference]}`}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {ICONS[preference]}
      </span>
      <span>{LABELS[preference]}</span>
    </button>
  );
}
