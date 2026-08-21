/** Languages currently supported for execution. Add new languages here. */
const SUPPORTED_LANGUAGES = ['python'] as const;

/** Maximum source code size in bytes. */
const MAX_SOURCE_BYTES = 65536; // 64KB

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates an execution request.
 * Returns { valid: true, errors: [] } if the request is acceptable,
 * or { valid: false, errors: [...] } with human-readable error messages.
 */
export function validateExecutionRequest(request: unknown): ValidationResult {
  const errors: string[] = [];

  if (!request || typeof request !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object.'] };
  }

  const { language, source } = request as Record<string, unknown>;

  // Validate language
  if (typeof language !== 'string' || language.trim().length === 0) {
    errors.push('Field "language" is required and must be a non-empty string.');
  } else if (!SUPPORTED_LANGUAGES.includes(language as (typeof SUPPORTED_LANGUAGES)[number])) {
    errors.push(
      `Unsupported language "${language}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}.`,
    );
  }

  // Validate source code
  if (typeof source !== 'string') {
    errors.push('Field "source" is required and must be a string.');
  } else if (source.trim().length === 0) {
    errors.push('Field "source" must not be empty.');
  } else if (new TextEncoder().encode(source).byteLength > MAX_SOURCE_BYTES) {
    errors.push(`Source code exceeds maximum size of ${MAX_SOURCE_BYTES} bytes.`);
  }

  return { valid: errors.length === 0, errors };
}
