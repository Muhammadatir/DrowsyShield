interface ErrorContext {
  userId?: string;
  route?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ErrorLog {
  message: string;
  stack?: string;
  context: ErrorContext;
}

class ErrorTracker {
  private errors: ErrorLog[] = [];
  private maxErrors = 50;

  captureError(error: Error, context: Partial<ErrorContext> = {}): void {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      context: {
        route: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        severity: 'medium',
        ...context,
      },
    };

    this.errors.push(errorLog);
    
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    console.error('Error captured:', errorLog);

    // In production, you would send this to an error tracking service
    // like Sentry, LogRocket, or Rollbar
    this.sendToErrorService(errorLog);
  }

  private sendToErrorService(errorLog: ErrorLog): void {
    // Placeholder for error tracking service integration
    // Example: Sentry.captureException(error, { extra: errorLog.context });
    console.log('Would send to error service:', errorLog);
  }

  getErrors(severity?: ErrorContext['severity']): ErrorLog[] {
    if (severity) {
      return this.errors.filter(e => e.context.severity === severity);
    }
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  getErrorCount(): number {
    return this.errors.length;
  }
}

export const errorTracker = new ErrorTracker();

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.captureError(event.error, {
      severity: 'high',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.captureError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      {
        severity: 'high',
      }
    );
  });
}

export const captureException = (
  error: Error,
  context?: Partial<ErrorContext>
): void => {
  errorTracker.captureError(error, context);
};
