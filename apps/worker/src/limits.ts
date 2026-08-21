/**
 * Output and timeout enforcement utilities.
 */

const TRUNCATION_MARKER = '\n... output truncated ...';

/**
 * Truncate output to maxBytes, appending a marker if truncated.
 * Returns { output, truncated }.
 */
export function enforceOutputLimit(
  output: string,
  maxBytes: number,
): { output: string; truncated: boolean } {
  const bytes = Buffer.byteLength(output, 'utf-8');
  if (bytes <= maxBytes) {
    return { output, truncated: false };
  }

  // Find the last complete character boundary within maxBytes
  const buf = Buffer.from(output, 'utf-8');
  const trimmed = buf.subarray(0, maxBytes).toString('utf-8');

  return {
    output: trimmed + TRUNCATION_MARKER,
    truncated: true,
  };
}
