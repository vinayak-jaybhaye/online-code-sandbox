import { spawn } from 'node:child_process';
import { config } from '../config.js';
import { enforceOutputLimit } from '../limits.js';
import type { ExecutionEngine, ExecutionParams, ExecutionResult } from './types.js';

/**
 * Docker-based execution engine.
 *
 * Runs submitted code inside a Docker container with:
 *   --network none    (no internet access)
 *   --memory=256m     (memory cap)
 *   --pids-limit=64   (fork bomb protection)
 *   -i                (read source from stdin)
 *   --rm              (auto-remove container)
 *
 * Source code is piped via stdin — avoids volume mount issues
 * when the worker runs inside a container (Docker-in-Docker).
 */
export class DockerEngine implements ExecutionEngine {
  async execute(params: ExecutionParams): Promise<ExecutionResult> {
    const { source, timeoutMs, maxOutputBytes } = params;

    // Docker run args — pipe source via stdin using `python -c`
    const args = [
      'run',
      '--rm',
      '-i',
      '--network',
      'none',
      '--memory=256m',
      '--pids-limit=64',
      '--entrypoint',
      'python',
      config.sandboxImage,
      '-c',
      source,
    ];

    const result = await this.runDocker(args, source, timeoutMs);

    // Enforce output limit
    const combined = result.stdout + (result.stderr ? '\n' + result.stderr : '');
    const { output, truncated } = enforceOutputLimit(combined, maxOutputBytes);

    return {
      stdout: output,
      stderr: result.stderr,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      outputTruncated: truncated,
    };
  }

  private runDocker(
    args: string[],
    _source: string,
    timeoutMs: number,
  ): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const child = spawn('docker', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Timeout enforcement
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
          timedOut,
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr: err.message,
          exitCode: 1,
          timedOut: false,
        });
      });

      // Close stdin since we pass source via -c argument
      child.stdin.end();
    });
  }
}
