interface RunButtonProps {
  onClick: () => void;
  onCancel: () => void;
  isRunning: boolean;
  disabled?: boolean;
}

/**
 * Run/Cancel button with animated states.
 */
export function RunButton({ onClick, onCancel, isRunning, disabled = false }: RunButtonProps) {
  if (isRunning) {
    return (
      <button
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-gradient-to-br from-red-500 to-red-600 px-4 py-1.5 text-sm font-semibold text-white outline-none transition-all hover:from-red-600 hover:to-red-700"
        onClick={onCancel}
        type="button"
      >
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        <span>Cancel</span>
      </button>
    );
  }

  return (
    <button
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-gradient-to-br from-green-500 to-green-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm outline-none transition-all hover:-translate-y-px hover:from-green-600 hover:to-green-700 hover:shadow-md hover:shadow-green-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
        <path d="M8 5v14l11-7z" />
      </svg>
      <span>Run</span>
    </button>
  );
}
