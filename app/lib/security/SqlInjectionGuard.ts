import { SecurityLogger, LogSeverity } from './SecurityLogger';

export interface SqlValidationResult {
  isValid: boolean;
  threats: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SqlInjectionGuard {
  // Patrones comunes de inyección SQL
  private static readonly SQLI_PATTERNS = {
    // Comentarios SQL típicos que truncan la query
    sqlComments: /(--|\/\*|\*\/|#)/g,
    
    // Inyección de unión de tablas para extracción de datos
    unionSelect: /union\s+(all\s+)?select/gi,
    
    // Bypass de autenticación por evaluación lógica verdadera (e.g., OR 1=1)
    booleanBypass: /\b(or|and)\s+(\d+=\d+|'[^']*'='[^']*'|"[^"]*"="[^"]*")/gi,
    
    // Ejecución de múltiples comandos mediante delimitador de sentencias
    stackedQueries: /;\s*(drop|delete|truncate|insert|update|alter|create|select)\b/gi,
    
    // Llamadas a comandos del sistema o procedimientos almacenados
    storedProcedures: /\b(xp_cmdshell|exec|execute)\b/gi
  };

  /**
   * Valida un campo de texto libre para prevenir SQL Injection a nivel de aplicación.
   * Si detecta patrones sospechosos, los registra en el log de auditoría y retorna inválido.
   */
  static validateInput(
    value: string,
    fieldName: string,
    userId?: string
  ): SqlValidationResult {
    const threats: string[] = [];
    
    if (!value || typeof value !== 'string') {
      return { isValid: true, threats, severity: 'low' };
    }

    const trimmedValue = value.trim();

    // Buscar coincidencia en cada uno de los patrones SQLi
    Object.entries(this.SQLI_PATTERNS).forEach(([category, regex]) => {
      if (regex.test(trimmedValue)) {
        threats.push(`[SQLi] Patrón sospechoso detectado en '${fieldName}': ${category}`);
      }
    });

    if (threats.length > 0) {
      // Registrar el ataque en los logs de seguridad
      SecurityLogger.logSecurityEvent(
        LogSeverity.CRITICAL,
        'SQL_INJECTION_ATTEMPT',
        {
          fieldName,
          valueLength: trimmedValue.length,
          valuePreview: trimmedValue.substring(0, 100),
          threatsDetected: threats,
          blockedAt: 'APPLICATION_SQLI_GUARD'
        },
        userId
      );

      return {
        isValid: false,
        threats,
        severity: 'critical'
      };
    }

    return {
      isValid: true,
      threats,
      severity: 'low'
    };
  }
}
