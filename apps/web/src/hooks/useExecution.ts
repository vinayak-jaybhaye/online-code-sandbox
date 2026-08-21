import { useState, useRef, useCallback, useEffect } from 'react';
import { isTerminalStatus } from '@online-code-sandbox/shared';
import type { ExecutionStatus } from '@online-code-sandbox/shared';
import {
  submitExecution,
  getExecutionStatus,
  cancelExecution as cancelApi,
} from '../services/executionApi.js';

/**
 * Custom hook for managing code execution lifecycle.
 *
 * This is the swap point for streaming: replace polling with
 * WebSocket subscription here. Components don't change.
 */

const POLL_INTERVAL_MS = 1500;

interface UseExecutionReturn {
  execute: (language: string, source: string) => Promise<void>;
  cancel: () => Promise<void>;
  status: ExecutionStatus | null;
  output: string | null;
  error: string | null;
  isRunning: boolean;
  executionId: string | null;
}

export function useExecution(): UseExecutionReturn {
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();

      pollRef.current = setInterval(async () => {
        try {
          const state = await getExecutionStatus(id);
          setStatus(state.status);
          setOutput(state.output);
          setError(state.error);

          if (isTerminalStatus(state.status)) {
            stopPolling();
            setIsRunning(false);
          }
        } catch {
          // Polling errors are transient — keep trying
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  const execute = useCallback(
    async (language: string, source: string) => {
      stopPolling();
      setOutput(null);
      setError(null);
      setIsRunning(true);

      try {
        const { executionId: id } = await submitExecution(language, source);
        setExecutionId(id);
        setStatus('QUEUED' as ExecutionStatus);
        startPolling(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Submission failed');
        setIsRunning(false);
      }
    },
    [stopPolling, startPolling],
  );

  const cancel = useCallback(async () => {
    if (!executionId) return;
    try {
      await cancelApi(executionId);
      stopPolling();
      setStatus('CANCELLED' as ExecutionStatus);
      setIsRunning(false);
    } catch {
      // Best effort
    }
  }, [executionId, stopPolling]);

  return { execute, cancel, status, output, error, isRunning, executionId };
}
