interface LanguageSelectorProps {
  languages: readonly string[];
  selected: string;
  onChange: (language: string) => void;
  disabled?: boolean;
}

/**
 * Language dropdown — extensible for future multi-language support.
 */
export function LanguageSelector({
  languages,
  selected,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <select
      className="cursor-pointer rounded-md border border-(--color-border) bg-(--color-bg-elevated) px-3 py-1.5 text-sm text-(--color-text-primary) outline-none transition-colors hover:border-(--color-border-active) focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/20"
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label="Select programming language"
    >
      {languages.map((lang) => (
        <option key={lang} value={lang}>
          {lang.charAt(0).toUpperCase() + lang.slice(1)}
        </option>
      ))}
    </select>
  );
}
