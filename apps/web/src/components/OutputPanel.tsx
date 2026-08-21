import type { ExecutionStatus } from '@online-code-sandbox/shared';

interface OutputPanelProps {
  status: ExecutionStatus | null;
  output: string | null;
  error: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  QUEUED: {
    label: 'Queued',
    classes: 'bg-(--color-accent)/15 text-(--color-accent-hover)',
  },
  RUNNING: {
    label: 'Running',
    classes: 'bg-(--color-accent)/15 text-(--color-accent-hover) animate-[pulse-opacity]',
  },
  COMPLETED: {
    label: 'Completed',
    classes: 'bg-(--color-success)/15 text-(--color-success)',
  },
  TIMEOUT: {
    label: 'Timeout',
    classes: 'bg-(--color-warning)/15 text-(--color-warning)',
  },
  RUNTIME_ERROR: {
    label: 'Error',
    classes: 'bg-(--color-error)/15 text-(--color-error)',
  },
  OUTPUT_LIMIT: {
    label: 'Output Limit',
    classes: 'bg-(--color-warning)/15 text-(--color-warning)',
  },
  CANCELLED: {
    label: 'Cancelled',
    classes: 'bg-(--color-bg-surface) text-(--color-text-muted)',
  },
};

/**
 * Output panel — displays execution status and results.
 * Renders from a growing output string so streaming works without changes.
 */
export function OutputPanel({ status, output, error }: OutputPanelProps) {
  const statusInfo = status ? STATUS_CONFIG[status] : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-(--color-border) bg-(--color-bg-secondary) px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-(--color-text-secondary)">
          Output
        </span>
        {statusInfo && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${statusInfo.classes}`}
          >
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto bg-(--color-bg-primary) p-4">
        {!status && (
          <p className="text-sm italic text-(--color-text-muted)">
            Run your code to see output here.
          </p>
        )}
        {output && (
          <pre className="m-0 whitespace-pre-wrap break-words font-(family-name:--font-mono) text-sm leading-relaxed text-(--color-text-primary)">
            {output}
          </pre>
        )}
        {error && !output && (
          <pre className="m-0 whitespace-pre-wrap break-words font-(family-name:--font-mono) text-sm leading-relaxed text-(--color-error)">
            {error}
          </pre>
        )}
      </div>
    </div>
  );
}
