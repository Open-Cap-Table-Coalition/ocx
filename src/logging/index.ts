/* eslint-disable @typescript-eslint/no-explicit-any */

/* For OCX logging we deliberately restrict to the following methods
 * supported by `console`.
 */
interface UnderlyingLogger {
  debug: typeof console.debug;
  info: typeof console.info;
  warn: typeof console.warn;
  error: typeof console.error;
}

/* The Logger supports the restricted subset of `console` methods above.
 * `console` is the default logging method, but can be replaced by supplying
 * an alternate implementation to `logUsing`.
 */
export class Logger {
  private debug_ = this.noop;
  private logger_: UnderlyingLogger = console;

  public debug(message: string, ...meta: any[]) {
    this.debug_(message, ...meta);
    return this;
  }

  public info(message: string, ...meta: any[]) {
    this.logger_.info(message, ...meta);
    return this;
  }

  public warn(message: string, ...meta: any[]) {
    this.logger_.warn(`[ WARN] ${message}`, ...meta);
    return this;
  }

  public error(message: string, ...meta: any[]) {
    this.logger_.error(`[ERROR] ${message}`, ...meta);
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
    this.logger_.debug(`[DEBUG] ${message}`, ...meta);
    return this;
  }
}

const logger = new Logger();

export default logger;
