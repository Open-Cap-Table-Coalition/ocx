/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
/* Because this package uses and wraps the "any[]" behavior of console,
 * we disable @typescript-eslint/no-explicit-any/no-explicit-any.
 * This package is also the one place we are "allowed" to write to the
 * console, so we disable no-console.
 */

/* For OCX logging we deliberately restrict to the following methods
 * supported by `console` for now.
 */
interface UnderlyingLogger {
  debug: typeof console.debug;
  info: typeof console.info;
  warn: typeof console.warn;
  error: typeof console.error;
}

class DefaultConsoleLogger implements UnderlyingLogger {
  public debug(...data: any[]) {
    const [first, ...rest] = data;
    console.debug(`[DEBUG] ${first?.toString()}`, ...rest);
  }

  public info(...data: any[]) {
    console.info(...data);
  }

  public warn(...data: any[]) {
    const [first, ...rest] = data;
    console.warn(`[ WARN] ${first?.toString()}`, ...rest);
  }

  public error(...data: any[]) {
    const [first, ...rest] = data;
    console.error(`[ERROR] ${first?.toString()}`, ...rest);
  }
}

/* The Logger supports the restricted subset of `console` methods above and
 * requires a string as the first parameter.
 *
 * `console` is the default logging method, but can be replaced by supplying
 * an alternate implementation to `logUsing`.
 *
 * Anybody incorporating OCX code into their project will most likely want
 * to use their own logging solution, so it did not seem wise or worthwhile
 * to pull in a full-fledged logging library.
 */
export class Logger {
  private debug_ = this.noop;
  private logger_: UnderlyingLogger = new DefaultConsoleLogger();

  public debug(message: string, ...optionalParams: any[]) {
    this.debug_(message, ...optionalParams);
    return this;
  }

  public info(message: string, ...optionalParams: any[]) {
    this.logger_.info(message, ...optionalParams);
    return this;
  }

  public warn(message: string, ...optionalParams: any[]) {
    this.logger_.warn(message, ...optionalParams);
    return this;
  }

  public error(message: string, ...optionalParams: any[]) {
    this.logger_.error(message, ...optionalParams);
    return this;
  }

  public enableDebug() {
    this.debug_ = this.logDebug;
  }

  public logUsing(alternateLogger: UnderlyingLogger) {
    this.logger_ = alternateLogger;
  }

  // This function is the default 'no-op' version of `logDebug` to
  // avoid if checks in `debug`. The args are unused as a result.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private noop(message: string, ...meta: any[]) {
    return this;
  }

  // This function is only called after `enableDebug` has turned on
  // debug logging.
  private logDebug(message: string, ...meta: any[]) {
    this.logger_.debug(message, ...meta);
    return this;
  }
}

const logger = new Logger();

export default logger;
