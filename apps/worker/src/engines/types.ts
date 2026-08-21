/**
 * ExecutionEngine interface — abstracts sandbox execution.
 *
 * The worker calls engine.execute() without knowing whether the
 * implementation uses Docker, Firecracker, gVisor, or a remote service.
 * Swap implementations without changing worker logic.
 */

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  outputTruncated: boolean;
}

export interface ExecutionParams {
  executionId: string;
  language: string;
  source: string;
  timeoutMs: number;
  maxOutputBytes: number;
}

export interface ExecutionEngine {
  execute(params: ExecutionParams): Promise<ExecutionResult>;
}
