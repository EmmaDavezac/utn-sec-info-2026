/**
 * PromptSanitizer
 * Sanitización de entrada antes de enviar a LLM
 * Estándar: OWASP Input Sanitization
 */

export class PromptSanitizer {
  /**
   * Sanitiza mensaje de entrada de manera segura
   * Preserva contenido legítimo, elimina patrones maliciosos
   */
  static sanitizeUserInput(message: string): string {
    let sanitized = message;

    // 1. Normalizar espacios en blanco
    sanitized = this.normalizeWhitespace(sanitized);

    // 2. Remover caracteres de control
    sanitized = this.removeControlCharacters(sanitized);

    // 3. Escapar delimitadores peligrosos
    sanitized = this.escapeDelimiters(sanitized);

    // 4. Remover intentos de inyección de sistema prompt
    sanitized = this.removeSystemPromptInjection(sanitized);

    // 5. Limpiar URLs sospechosas
    sanitized = this.sanitizeUrls(sanitized);

    return sanitized.trim();
  }

  /**
   * Prepara mensaje para enviar a LLM con contexto seguro
   */
  static prepareMessageForLLM(message: string): string {
    const sanitized = this.sanitizeUserInput(message);

    // Envolver en comillas para delimitar claramente el contenido del usuario
    // Esto previene que el modelo interprete el contenido como instrucciones
    return `Pregunta del usuario: "${sanitized}"`;
  }

  /**
   * Sanitiza salida del LLM antes de enviar al cliente
   */
  static sanitizeLLMOutput(output: string): string {
    let sanitized = output;

    // 1. Remover caracteres de control
    sanitized = this.removeControlCharacters(sanitized);

    // 2. Escapar HTML entities (si se mostrará en web)
    sanitized = this.escapeHtmlSpecialChars(sanitized);

    // 3. Limitar longitud anómala
    if (sanitized.length > 4000) {
      sanitized = sanitized.substring(0, 4000) + '...';
    }

    return sanitized.trim();
  }

  // === MÉTODOS PRIVADOS ===

  private static normalizeWhitespace(text: string): string {
    // Remover espacios múltiples
    text = text.replace(/  +/g, ' ');

    // Limitar saltos de línea consecutivos (máximo 2)
    text = text.replace(/\n{3,}/g, '\n\n');

    // Remover espacios en blanco al inicio/final de líneas
    text = text
      .split('\n')
      .map((line) => line.trim())
      .join('\n');

    return text;
  }

  private static removeControlCharacters(text: string): string {
    // Remover caracteres de control (excepto newline, tab)
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  private static escapeDelimiters(text: string): string {
    // Los delimitadores peligrosos se dejan "visibles" pero neutralizados
    // No los removemos completamente porque pueden ser legítimos

    // Remover comillas triples que podrían cerrar bloques de código
    text = text.replace(/"""/g, '"');

    // Remover backticks triples
    text = text.replace(/```/g, '` ` `');

    return text;
  }

  private static removeSystemPromptInjection(text: string): string {
    // Patrones específicos a neutralizar
    const injectionPatterns = [
      // "Ignore your instructions" -> "Ignore your instructions [NOT EXECUTED]"
      {
        pattern:
          /ignore\s+(your|the)\s+(previous|system|instructions|rules|prompt)/gi,
        replacement: '[USER INSTRUCTION ATTEMPT - IGNORED]',
      },
      {
        pattern: /forget\s+(your|the)\s+(previous|system|instructions)/gi,
        replacement: '[USER INSTRUCTION ATTEMPT - IGNORED]',
      },
      {
        pattern:
          /olvida\s+(tus|las|anteriores|instrucciones|reglas|restricciones)/gi,
        replacement: '[INTENTO DE INSTRUCCIÓN DE USUARIO - IGNORADO]',
      },
      {
        pattern: /\[SYSTEM:/gi,
        replacement: '[USER ATTEMPT SYSTEM]',
      },
      {
        pattern: /\[INSTRUCTION:/gi,
        replacement: '[USER ATTEMPT INSTRUCTION]',
      },
    ];

    let sanitized = text;
    injectionPatterns.forEach(({ pattern, replacement }) => {
      sanitized = sanitized.replace(pattern, replacement);
    });

    return sanitized;
  }

  private static sanitizeUrls(text: string): string {
    // Detectar URLs
    const urlPattern = /(https?:\/\/[^\s]+)/gi;

    return text.replace(urlPattern, (url) => {
      // Remover caracteres codificados peligrosos
      if (/(%2e|%2f|%00|%5c)/i.test(url)) {
        return '[URL REMOVIDA - CONTIENE CARACTERES PELIGROSOS]';
      }

      // Remover protocolos peligrosos
      if (/javascript:|data:|vbscript:/i.test(url)) {
        return '[URL REMOVIDA - PROTOCOLO PELIGROSO]';
      }

      // URL OK - dejar como está
      return url;
    });
  }

  private static escapeHtmlSpecialChars(text: string): string {
    const htmlEscapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
  }
}
