type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m',
  info:  '\x1b[36m',
  warn:  '\x1b[33m',
  error: '\x1b[31m',
};

const RESET = '\x1b[0m';

function timestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const color = LEVEL_COLORS[level];
  const tag = level.toUpperCase().padEnd(5);
  return `${color}[${timestamp()}] ${tag}${RESET} ${message} ${args.length ? JSON.stringify(args) : ''}`;
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, ...args));
    }
  },

  info(message: string, ...args: unknown[]): void {
    console.info(formatMessage('info', message, ...args));
  },

  warn(message: string, ...args: unknown[]): void {
    console.warn(formatMessage('warn', message, ...args));
  },

  error(message: string, ...args: unknown[]): void {
    console.error(formatMessage('error', message, ...args));
  },
};
