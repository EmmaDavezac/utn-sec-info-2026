/**
 * SecurityLogger
 * Auditoría y logging de eventos de seguridad
 * Estándar: OWASP Logging Level
 */

export enum LogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface AuditLogEntry {
  timestamp: string;
  severity: LogSeverity;
  userId?: string;
  action: string;
  details: Record<string, any>;
  threat?: string;
}

export class SecurityLogger {
  private static auditLogs: AuditLogEntry[] = [];

  /**
   * Log de evento de seguridad
   */
  static logSecurityEvent(
    severity: LogSeverity,
    action: string,
    details: Record<string, any>,
    userId?: string
  ): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      userId,
      action,
      details,
    };

    // Agregar a en memoria
    this.auditLogs.push(entry);

    // Log por consola
    const logLevel =
      severity === LogSeverity.CRITICAL
        ? 'error'
        : severity === LogSeverity.ERROR
          ? 'error'
          : severity === LogSeverity.WARNING
            ? 'warn'
            : 'log';

    console[logLevel as any](
      `[${severity}] ${action}`,
      JSON.stringify({ ...entry, details }, null, 2)
    );

    // Mantener historial limitado (últimas 1000 entradas)
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
  }

  /**
   * Log de intento de prompt injection
   */
  static logPromptInjectionAttempt(
    userId: string | undefined,
    message: string,
    threats: string[]
  ): void {
    this.logSecurityEvent(
      LogSeverity.CRITICAL,
      'PROMPT_INJECTION_ATTEMPT',
      {
        messageLength: message.length,
        messagePreview: message.substring(0, 100),
        threatsDetected: threats,
        blockedAt: 'INPUT_VALIDATION',
      },
      userId
    );
  }

  /**
   * Log de validación exitosa
   */
  static logValidationSuccess(userId: string | undefined, messageLength: number): void {
    this.logSecurityEvent(
      LogSeverity.INFO,
      'MESSAGE_VALIDATION_SUCCESS',
      {
        messageLength,
        validationPassed: true,
      },
      userId
    );
  }

  /**
   * Log de problema en salida del LLM
   */
  static logLLMOutputIssue(
    userId: string | undefined,
    threats: string[],
    outputLength: number
  ): void {
    this.logSecurityEvent(
      LogSeverity.WARNING,
      'LLM_OUTPUT_VALIDATION_ISSUE',
      {
        outputLength,
        issues: threats,
        blockedAt: 'OUTPUT_VALIDATION',
      },
      userId
    );
  }

  /**
   * Log de error en procesamiento
   */
  static logProcessingError(
    userId: string | undefined,
    step: string,
    error: string
  ): void {
    this.logSecurityEvent(
      LogSeverity.ERROR,
      'PROCESSING_ERROR',
      {
        step,
        error,
      },
      userId
    );
  }

  /**
   * Obtener historial de auditoría
   */
  static getAuditLog(limit?: number): AuditLogEntry[] {
    if (limit) {
      return this.auditLogs.slice(-limit);
    }
    return this.auditLogs;
  }

  /**
   * Obtener resumen de intentos maliciosos
   */
  static getSecuritySummary(hoursBack: number = 24): {
    totalAttempts: number;
    injectionAttempts: number;
    uniqueUsers: Set<string>;
  } {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const filtered = this.auditLogs.filter(
      (log) => new Date(log.timestamp) > cutoffTime
    );

    const injectionAttempts = filtered.filter(
      (log) => log.action === 'PROMPT_INJECTION_ATTEMPT'
    ).length;

    const uniqueUsers = new Set(
      filtered
        .filter((log) => log.userId)
        .map((log) => log.userId as string)
    );

    return {
      totalAttempts: filtered.length,
      injectionAttempts,
      uniqueUsers,
    };
  }
}
