import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { enforceOutputLimit } from '../limits.js';
import type { ExecutionEngine, ExecutionParams, ExecutionResult } from './types.js';

const LANGUAGE_CONFIG: Record<string, { image: string; args: string[] }> = {
  python: {
    image: 'sandbox-python',
    args: ['--entrypoint', 'python', 'sandbox-python'],
  },
  javascript: {
    image: 'sandbox-javascript',
    args: ['--entrypoint', 'node', 'sandbox-javascript'],
  },
  cpp: {
    image: 'sandbox-cpp',
    args: [
      '--entrypoint',
      'bash',
      'sandbox-cpp',
      '-c',
      'cat > main.cpp && g++ -O2 -std=c++20 main.cpp -o main && ./main',
    ],
  },
  c: {
    image: 'sandbox-c',
    args: [
      '--entrypoint',
      'bash',
      'sandbox-c',
      '-c',
      'cat > main.c && gcc -O2 -std=c11 main.c -o main && ./main',
    ],
  },
  java: {
    image: 'sandbox-java',
    args: ['--entrypoint', 'bash', 'sandbox-java', '-c', 'cat > code.java && java code.java'],
  },
};

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
    const { source, timeoutMs, maxOutputBytes, language } = params;

    const langConfig = LANGUAGE_CONFIG[language];
    if (!langConfig) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const containerName = `sandbox-${crypto.randomUUID()}`;

    // Docker run args — pipe source via stdin
    const args = [
      'run',
      '--name',
      containerName,
      '--rm',
      '-i',
      '--network',
      'none',
      '--memory=256m',
      '--pids-limit=64',
      ...langConfig.args,
    ];

    const result = await this.runDocker(args, source, timeoutMs, containerName);

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
    containerName: string,
  ): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const child = spawn('docker', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      child.stdin.write(_source);
      child.stdin.end();

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Timeout enforcement
      const timer = setTimeout(() => {
        timedOut = true;
        spawn('docker', ['rm', '-f', containerName]);
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
    });
  }
}
