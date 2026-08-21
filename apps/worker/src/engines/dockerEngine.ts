import { execFile } from 'node:child_process';
import { writeFile, unlink, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { config } from '../config.js';
import { enforceOutputLimit } from '../limits.js';
import type { ExecutionEngine, ExecutionParams, ExecutionResult } from './types.js';

/**
 * Docker-based execution engine.
 *
 * Runs submitted code inside a Docker container with:
 *   --network none    (no internet access)
 *   --memory=256m     (memory cap)
 *   --user sandbox    (non-root)
 *   --read-only mount (source file)
 *   --rm              (auto-remove container)
 *
 * Uses child_process.execFile (not shell) for security.
 */
export class DockerEngine implements ExecutionEngine {
  async execute(params: ExecutionParams): Promise<ExecutionResult> {
    const { source, timeoutMs, maxOutputBytes } = params;
    let tempDir: string | null = null;

    try {
      // Write source to a temp file
      tempDir = await mkdtemp(join(tmpdir(), 'sandbox-'));
      const sourceFile = join(tempDir, 'main.py');
      await writeFile(sourceFile, source, 'utf-8');

      // Build docker run arguments
      const args = [
        'run',
        '--rm',
        '--network',
        'none',
        '--memory=256m',
        '--pids-limit=64',
        '--user',
        'sandbox',
        '--read-only',
        '--tmpfs',
        '/tmp:size=16m',
        '-v',
        `${sourceFile}:/sandbox/main.py:ro`,
        config.sandboxImage,
      ];

      // Execute with timeout via AbortController
      const result = await this.runDocker(args, timeoutMs);

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
    } finally {
      // Always clean up temp files
      if (tempDir) {
        try {
          const sourceFile = join(tempDir, 'main.py');
          await unlink(sourceFile).catch(() => {});
          const { rmdir } = await import('node:fs/promises');
          await rmdir(tempDir).catch(() => {});
        } catch {
          // Best-effort cleanup
        }
      }
    }
  }

  private runDocker(
    args: string[],
    timeoutMs: number,
  ): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
    return new Promise((resolve) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      execFile(
        'docker',
        args,
        {
          signal: controller.signal,
          maxBuffer: 1024 * 1024, // 1MB buffer
          timeout: timeoutMs + 1000, // extra second as safety net
        },
        (error, stdout, stderr) => {
          clearTimeout(timer);

          if (error && 'killed' in error && error.killed) {
            resolve({ stdout, stderr, exitCode: -1, timedOut: true });
            return;
          }

          if (error && error.name === 'AbortError') {
            resolve({ stdout, stderr, exitCode: -1, timedOut: true });
            return;
          }

          const exitCode = error && 'code' in error ? ((error.code as number) ?? 1) : 0;
          resolve({ stdout, stderr, exitCode, timedOut: false });
        },
      );
    });
  }
}
