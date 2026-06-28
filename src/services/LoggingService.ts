import { Clock } from './Clock';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  AUDIT = 'AUDIT'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: 'BusinessEvent' | 'ValidationError' | 'WorkflowTransition' | 'Import' | 'Export' | 'AuditEvent';
  message: string;
  context?: Record<string, any>;
}

export interface ILogger {
  log(entry: LogEntry): void;
}

export class ConsoleLogger implements ILogger {
  public log(entry: LogEntry): void {
    const formatted = `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}`;
    if (entry.level === LogLevel.ERROR) {
      console.error(formatted, entry.context);
    } else if (entry.level === LogLevel.WARN) {
      console.warn(formatted, entry.context);
    } else {
      console.log(formatted, entry.context);
    }
  }
}

/**
 * Enterprise Logging Service coordinating centralized structured telemetry logs
 * on downstream audits and runtime performance behaviors.
 */
export class LoggingService {
  private static instance: LoggingService;
  private loggers: ILogger[] = [];

  private constructor() {
    this.loggers.push(new ConsoleLogger());
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  public registerLogger(logger: ILogger): void {
    this.loggers.push(logger);
  }

  private writeLog(level: LogLevel, category: LogEntry['category'], message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: Clock.now().toISOString(),
      level,
      category,
      message,
      context
    };
    this.loggers.forEach(l => {
      try {
        l.log(entry);
      } catch (err) {
        console.error('Logger failed to write log entry:', err);
      }
    });
  }

  public info(category: LogEntry['category'], message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.INFO, category, message, context);
  }

  public warn(category: LogEntry['category'], message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.WARN, category, message, context);
  }

  public error(category: LogEntry['category'], message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.ERROR, category, message, context);
  }

  public audit(message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.AUDIT, 'AuditEvent', message, context);
  }
}
