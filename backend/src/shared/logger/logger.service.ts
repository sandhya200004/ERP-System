import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  log(message: string, context?: string) {
    this.write('INFO', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.write('ERROR', message, context, trace);
  }

  warn(message: string, context?: string) {
    this.write('WARN', message, context);
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.write('DEBUG', message, context);
    }
  }

  verbose(message: string, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.write('VERBOSE', message, context);
    }
  }

  private write(level: string, message: string, context?: string, trace?: string) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const output = `${timestamp} ${level} ${contextStr} ${message}`;
    
    if (level === 'ERROR') {
      console.error(output);
      if (trace) console.error(trace);
    } else if (level === 'WARN') {
      console.warn(output);
    } else {
      console.log(output);
    }

    // In production, you would send logs to a service like CloudWatch, DataDog, etc.
    // Example: await this.sendToLogService({ timestamp, level, message, context, trace });
  }
}
