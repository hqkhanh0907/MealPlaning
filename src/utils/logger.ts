// Structured logging utility — single point to swap for Sentry/remote later (Open/Closed)

interface LogContext {
  component: string;
  action: string;
  /** Optional correlation ID to trace logs across a single user action flow */
  traceId?: string;
}

const formatPrefix = (ctx: LogContext): string => {
  const trace = ctx.traceId ? ` [trace:${ctx.traceId}]` : '';
  return `[${ctx.component}] ${ctx.action}${trace}`;
};

const sanitizeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  return { raw: error };
};

export const logger = {
  /** Verbose output — only emitted in development builds. */
  debug(ctx: LogContext, message: string): void {
    if (import.meta.env.DEV) {
      console.debug(formatPrefix(ctx), message);
    }
  },

  error(ctx: LogContext, error: unknown): void {
    console.error(formatPrefix(ctx), sanitizeError(error));
  },

  warn(ctx: LogContext, message: string): void {
    console.warn(formatPrefix(ctx), message);
  },

  info(ctx: LogContext, message: string): void {
    console.info(formatPrefix(ctx), message);
  },
};

/** Generate a short random trace ID for correlating logs within a user action flow. */
export const generateTraceId = (): string =>
  crypto.randomUUID().slice(0, 8);
