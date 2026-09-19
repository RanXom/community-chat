import { useTheme } from '../../hooks/useTheme';

const THEMES: { value: string; label: string }[] = [
  { value: 'dark', label: 'dark terminal' },
  { value: 'light', label: 'light terminal' },
  { value: 'catppuccin-mocha', label: 'catppuccin mocha' },
  { value: 'catppuccin-latte', label: 'catppuccin latte' },
  { value: 'tokyo-night', label: 'tokyo night' },
  { value: 'gruvbox-dark', label: 'gruvbox dark' },
  { value: 'gruvbox-light', label: 'gruvbox light' },
  { value: 'nord', label: 'nord' },
  { value: 'nord-light', label: 'nord light' },
];

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-control">
      <label htmlFor="theme-select">theme</label>
      <select id="theme-select" value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)}>
        {THEMES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ThemeSwitcher;