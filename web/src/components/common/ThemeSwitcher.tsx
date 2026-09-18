import { useTheme } from '../../hooks/useTheme';

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-control">
      <label htmlFor="theme-select">theme</label>
      <select
        id="theme-select"
        value={theme}
        onChange={(event) => setTheme(event.target.value as 'dark' | 'light')}
      >
        <option value="dark">dark terminal</option>
        <option value="light">light terminal</option>
      </select>
    </div>
  );
}

export default ThemeSwitcher;