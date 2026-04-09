/** Default max input tokens - based on Claude claude-sonnet-4-20250514 context window */
export const DEFAULT_MAX_INPUT_TOKENS = 64_000;

/** Default max output tokens - conservative limit for cost control */
export const DEFAULT_MAX_OUTPUT_TOKENS = 4_096;

/** Max messages retained in context window per request */
export const DEFAULT_MAX_CONTEXT_MESSAGES = 20;

/** Cost estimate per token - approximate blended rate across providers */
export const COST_PER_TOKEN = 0.000_002;
