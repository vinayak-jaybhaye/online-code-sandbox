import type { ExecutionState, CreateExecutionResponse } from '@online-code-sandbox/shared';

/**
 * HTTP API client for the execution service.
 *
 * This is the swap point for streaming: replace these functions
 * with WebSocket equivalents without changing any components.
 */

const API_BASE = '/api';

export async function submitExecution(
  language: string,
  source: string,
): Promise<CreateExecutionResponse> {
  const res = await fetch(`${API_BASE}/executions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, source }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { details?: string[] }).details?.join('; ') ?? `Request failed (${res.status})`,
    );
  }

  return (await res.json()) as CreateExecutionResponse;
}

export async function getExecutionStatus(executionId: string): Promise<ExecutionState> {
  const res = await fetch(`${API_BASE}/executions/${executionId}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch execution status (${res.status})`);
  }

  return (await res.json()) as ExecutionState;
}

export async function cancelExecution(executionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/executions/${executionId}/cancel`, {
    method: 'POST',
  });

  if (!res.ok && res.status !== 409) {
    throw new Error(`Failed to cancel execution (${res.status})`);
  }
}
