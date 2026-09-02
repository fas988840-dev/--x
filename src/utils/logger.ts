/**
 * Small logging boundary for the API and command-line entry points.
 * Keeping direct console access here prevents accidental console calls in
 * application services while preserving logs on the process streams.
 */
export const logger = {
  info(message: string, ...details: unknown[]): void {
    // eslint-disable-next-line no-console
    console.log(message, ...details);
  },
  warn(message: string, ...details: unknown[]): void {
    // eslint-disable-next-line no-console
    console.warn(message, ...details);
  },
  error(message: string, ...details: unknown[]): void {
    // eslint-disable-next-line no-console
    console.error(message, ...details);
  },
};
