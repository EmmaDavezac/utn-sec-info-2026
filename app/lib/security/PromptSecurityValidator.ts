/**
 * PromptSecurityValidator
 * Validación robusta de entrada y salida contra Prompt Injection
 * Estándar: OWASP LLM Security Framework
 */

export interface ValidationResult {
  isValid: boolean;
  threats: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class PromptSecurityValidator {
  // Patrones de inyección de prompt documentados
  private static readonly INJECTION_PATTERNS = {
    // Intentos de ignorar instrucciones
    instructionOverride: [
      /ignore\s+(your|the)\s+(previous|system|instructions|rules|prompt)/gi,
      /forget\s+(your|the)\s+(previous|system|instructions|rules)/gi,
      /olvida\s+(tus|las|anteriores|instrucciones|reglas)/gi,
      /ignore\s+everything\s+before/gi,
      /disregard\s+all\s+previous/gi,
    ],
    // Intentos de role-play para eludir restricciones
    rolePlayBypass: [
      /pretend\s+you\s+are/gi,
      /role\s*play/gi,
      /act\s+as\s+if/gi,
      /simulate\s+being/gi,
      /DAN|Developer Mode|GPT-4 Unlimited/gi,
    ],
    // Solicitud de información sensible
    sensitiveDataRequest: [
      /system\s+prompt/gi,
      /instrucciones\s+(del sistema|iniciales)/gi,
      /what\s+are\s+your\s+(instructions|rules|constraints)/gi,
      /cuáles\s+son\s+(tus|las)\s+(instrucciones|restricciones)/gi,
      /reveal\s+(your|the)\s+(system|instructions|prompt)/gi,
    ],
    // Intentos de inyección de código
    codeInjection: [
      /```[\s\S]*?```/g, // Bloques de código
      /exec\s*\(/gi,
      /eval\s*\(/gi,
      /subprocess/gi,
      /import\s+os/gi,
    ],
    // Intentos de bypass con caracteres especiales
    specialCharBypass: [
      /\\n\\n/g, // Nuevas líneas escapadas
      /\[REDACTED\]/gi,
      /\[INSTRUCTION:/gi,
      /\[SYSTEM:/gi,
    ],
  };

  // Límites de seguridad
  private static readonly SECURITY_LIMITS = {
    maxMessageLength: 2000,
    maxConsecutiveNewlines: 3,
    maxConsecutiveSpaces: 5,
    maxUrlsInMessage: 3,
  };

  /**
   * Valida entrada de usuario completa
   */
  static validateUserInput(message: string): ValidationResult {
    const threats: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // 1. Validar que no esté vacío
    if (!message || message.trim().length === 0) {
      threats.push('Mensaje vacío');
      severity = 'low';
      return { isValid: false, threats, severity };
    }

    // 2. Validar encoding válido
    if (!this.isValidUTF8(message)) {
      threats.push('Encoding inválido detectado');
      severity = 'high';
      return { isValid: false, threats, severity };
    }

    // 3. Validar longitud
    if (message.length > this.SECURITY_LIMITS.maxMessageLength) {
      threats.push(
        `Mensaje excede límite máximo (${this.SECURITY_LIMITS.maxMessageLength} caracteres)`
      );
      severity = 'medium';
      return { isValid: false, threats, severity };
    }

    // 4. Detectar patrones de inyección
    const injectionDetected = this.detectInjectionPatterns(message);
    if (injectionDetected.found) {
      threats.push(...injectionDetected.patterns);
      severity = 'critical';
      return { isValid: false, threats, severity };
    }

    // 5. Validar estructura de espacios y saltos de línea
    const structureCheck = this.validateMessageStructure(message);
    if (!structureCheck.isValid) {
      threats.push(...structureCheck.issues);
      severity = Math.max(severity, 'medium') as any;
    }

    // 6. Detectar URLs sospechosas
    const urlCheck = this.validateUrls(message);
    if (!urlCheck.isValid) {
      threats.push(...urlCheck.issues);
      severity = Math.max(severity, 'medium') as any;
    }

    const isValid = threats.length === 0;
    return { isValid, threats, severity };
  }

  /**
   * Valida salida del LLM antes de enviarla al usuario
   */
  static validateLLMOutput(output: string): ValidationResult {
    const threats: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // 1. Verificar que no revela instrucciones del sistema
    if (this.revealsSystemPrompt(output)) {
      threats.push('Salida revela posible system prompt o instrucciones');
      severity = 'critical';
      return { isValid: false, threats, severity };
    }

    // 2. Verificar inyección reflejada
    if (this.containsReflectedInjection(output)) {
      threats.push('Posible inyección reflejada en salida');
      severity = 'high';
      return { isValid: false, threats, severity };
    }

    // 3. Verificar longitud anómala
    if (output.length > this.SECURITY_LIMITS.maxMessageLength * 2) {
      threats.push('Salida excesivamente larga - posible ataque de generación');
      severity = 'medium';
    }

    // 4. Verificar caracteres de control maliciosos
    if (this.containsMaliciousControlChars(output)) {
      threats.push('Caracteres de control maliciosos detectados');
      severity = 'high';
    }

    const isValid = threats.length === 0;
    return { isValid, threats, severity };
  }

  // === MÉTODOS PRIVADOS DE VALIDACIÓN ===

  private static isValidUTF8(str: string): boolean {
    try {
      new TextEncoder().encode(str);
      return true;
    } catch {
      return false;
    }
  }

  private static detectInjectionPatterns(message: string): {
    found: boolean;
    patterns: string[];
  } {
    const detectedPatterns: string[] = [];

    Object.entries(this.INJECTION_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach((pattern) => {
        if (pattern.test(message)) {
          detectedPatterns.push(`[${category}] Patrón de inyección detectado`);
        }
      });
    });

    return {
      found: detectedPatterns.length > 0,
      patterns: [...new Set(detectedPatterns)], // Deduplicar
    };
  }

  private static validateMessageStructure(message: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Verificar saltos de línea consecutivos
    const newlineCount = (message.match(/\n/g) || []).length;
    if (newlineCount > this.SECURITY_LIMITS.maxConsecutiveNewlines) {
      issues.push(
        `Demasiados saltos de línea (${newlineCount}) - posible obfuscación`
      );
    }

    // Verificar espacios consecutivos
    if (/\s{6,}/g.test(message)) {
      issues.push('Espacios excesivos detectados - posible obfuscación');
    }

    return { isValid: issues.length === 0, issues };
  }

  private static validateUrls(message: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const urlPattern =
      /(https?:\/\/[^\s]+)|(?<![@\w])([\w.-]+\.(?:com|org|net|edu|gov|mil|io|co|uk))/gi;
    const urls = message.match(urlPattern) || [];

    if (urls.length > this.SECURITY_LIMITS.maxUrlsInMessage) {
      issues.push(
        `Demasiadas URLs (${urls.length}) - posible ataque de redirección`
      );
    }

    // Verificar URLs con caracteres sospechosos
    urls.forEach((url) => {
      if (
        /(%2e|%2f|%00|%5c)/i.test(url) ||
        url.includes('javascript:') ||
        url.includes('data:')
      ) {
        issues.push(`URL sospechosa detectada: ${url}`);
      }
    });

    return { isValid: issues.length === 0, issues };
  }

  private static revealsSystemPrompt(output: string): boolean {
    const systemPromptIndicators = [
      /you are an? .{0,30}(assistant|ai|bot|model|agent)/gi,
      /your (primary |main )?goal|objective|purpose is/gi,
      /you must|you should|you will not|you cannot/gi,
      /system prompt|instruction|constraint|rule/gi,
      /eres un|tu objetivo|tu propósito|debes|no debes/gi,
    ];

    // Verifica si hay múltiples indicadores (> 2) de que revela instrucciones
    let indicatorCount = 0;
    systemPromptIndicators.forEach((indicator) => {
      if (indicator.test(output)) indicatorCount++;
    });

    return indicatorCount >= 2;
  }

  private static containsReflectedInjection(output: string): boolean {
    // Si la salida contiene palabras clave de inyección, es sospechosa
    const injectionKeywords = [
      'ignore',
      'forget',
      'override',
      'system prompt',
      'instrucciones',
      'pretend',
      'role play',
    ];

    return injectionKeywords.some((keyword) =>
      new RegExp(keyword, 'gi').test(output)
    );
  }

  private static containsMaliciousControlChars(output: string): boolean {
    // Detectar caracteres de control que podrían ser maliciosos
    const controlCharPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
    return controlCharPattern.test(output);
  }
}
