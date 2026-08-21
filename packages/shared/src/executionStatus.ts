/**
 * Execution status enum — single source of truth for all status values.
 * Imported by API, Worker, and Frontend.
 *
 * Status transitions:
 *   QUEUED → RUNNING → COMPLETED
 *                    → TIMEOUT
 *                    → RUNTIME_ERROR
 *                    → OUTPUT_LIMIT
 *   CANCELLED (from QUEUED or RUNNING)
 */
export const ExecutionStatus = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  TIMEOUT: 'TIMEOUT',
  RUNTIME_ERROR: 'RUNTIME_ERROR',
  OUTPUT_LIMIT: 'OUTPUT_LIMIT',
  CANCELLED: 'CANCELLED',
} as const;

export type ExecutionStatus = (typeof ExecutionStatus)[keyof typeof ExecutionStatus];

/** Set of statuses that indicate execution has finished (no further transitions). */
export const TERMINAL_STATUSES: ReadonlySet<ExecutionStatus> = new Set([
  ExecutionStatus.COMPLETED,
  ExecutionStatus.TIMEOUT,
  ExecutionStatus.RUNTIME_ERROR,
  ExecutionStatus.OUTPUT_LIMIT,
  ExecutionStatus.CANCELLED,
]);

/** Returns true if the given status is a terminal (final) state. */
export function isTerminalStatus(status: ExecutionStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
