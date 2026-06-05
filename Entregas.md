# Seguridad de los Sistemas de Información
## Avances del Trabajo Práctico Integrador — SecureCampus IA
### Grupo DDV

**Integrantes**
* Emmanuel Davezac
* Agustín Vergara
* Nicolás Villanueva

Este documento detalla el avance cronológico del Trabajo Práctico Integrador a través de las distintas fases, especificando cómo se implementó cada requisito y las decisiones tomadas para robustecer la seguridad del sistema.

---

## Requisitos Técnicos Obligatorios (Estado Final)

| Requisito | Descripción | Estado |
|-----------|-------------|--------|
| Protección de Rutas | El chat y las vistas administrativas solo son accesibles con rol/sesión autorizada. | ✅ |
| Seguridad en el Cliente | Prevención XSS con cookies seguras (HttpOnly, Secure) para tokens NextAuth. | ✅ |
| Seguridad en el Servidor | API Keys de Groq/Supabase en el servidor. Nunca expuestas en frontend ni git. | ✅ |
| Auditoría de IA | System Prompt restrictivo y auditoría de Prompt Injection en entrada/salida. | ✅ |
| Hardening de Base de Datos | Parcheo de SQLi, encriptación AES-256 en reposo e inmutabilidad de logs. | ✅ |

---

## Entrega 1: Hardening de API & Entorno (SQLite & Control de Acceso por Roles)

### 1. Gestión de Entorno y Secretos
* **Archivos `.env` y `example.env`:** Separación estricta de credenciales de desarrollo. `.env` fue incorporado a `.gitignore` para prevenir fugas accidentales de API Keys (Groq, base de datos) y passwords.

### 2. Persistencia de Datos Inicial (SQLite)
* Inicialmente el proyecto contemplaba **SQLite local** (mediante `better-sqlite3`) como motor de base de datos por su simplicidad operativa para el desarrollo rápido y local del proyecto.

### 3. Autenticación y Autorización por Roles (RBAC Simple)
* **NextAuth:** Configurado con JWT firmados en cookies seguras.
* **Control de Acceso por Roles (RBAC):** Definición de tres roles ("Estudiante", "Profesor", "Administrador"). Los endpoints son validados en el servidor mediante el middleware `withPermission.ts` para denegar accesos no autorizados con código `403 Forbidden`.
* **Baja Lógica (`active = 0`):** Los usuarios inactivos ven denegadas sus credenciales inmediatamente antes de validar su sesión NextAuth.

---

## Entrega 2: Despliegue en Vercel, Migración a Neon y Reglas WAF

### 1. Despliegue en la Nube y Migración a Neon (PostgreSQL)
* **Migración a Neon:** SQLite utiliza un archivo local y las plataformas serverless como **Vercel** tienen sistemas de archivos efímeros y de solo lectura, lo que imposibilita su uso. Por esta razón, migramos la base de datos de **SQLite** a **PostgreSQL** alojado en la plataforma cloud **Neon**.
* **Alojamiento:** La aplicación se desplegó en **Vercel**, conectándose de forma segura a la base de datos remota de Neon.

### 2. Configuración de Reglas WAF (Web Application Firewall)
Para proteger la infraestructura de ataques directos y mapeos maliciosos, se configuraron reglas WAF en Vercel:
* **Regla 1 — Rate Limit en API (Too Many Requests):** Límite estricto de 30 peticiones cada 60 segundos por IP a cualquier endpoint bajo `/api/` para prevenir ataques de denegación de servicio (DoS) y abusos económicos en la API de la IA.
* **Regla 2 — Bloqueo de Herramientas de Pentesting y Bots (User-Agent Filter):** Bloquea de inmediato las peticiones cuyo `User-Agent` corresponda a herramientas automatizadas de escaneo (`sqlmap`, `nikto`, `nmap`, `masscan`) o que se presenten sin User-Agent, retornando un `404 Not Found` para simular que el servidor no existe.
* **Regla 3 — Bloqueo de Inyección en URL:** Bloquea cadenas con caracteres especiales sospechosos (`../`, `<script>`, `UNION SELECT`, `javascript:`) en la query string de la URL antes de que alcancen el backend, respondiendo con `403 Forbidden`. **Esto constituyó la primera barrera protectora contra inyección SQL (SQLi) a nivel de Firewall.**

---

## Entrega 3: Prevención de Prompt Injection y Semgrep

### 1. Defensa Multicapa de IA
Para mitigar ataques contra el LLM (como *Instruction Override*, *Role-Play Bypass* e inyección de código), diseñamos un pipeline de seguridad en la carpeta `app/lib/security/`:
* **`PromptSecurityValidator`:** Analiza la entrada del usuario y la salida de la IA mediante expresiones regulares que detectan solicitudes de system prompt y patrones anómalos.
* **`PromptSanitizer`:** Sanitiza URLs maliciosas (`javascript:`, `data:`, etc.) y elimina espacios o saltos de línea repetidos que intenten evadir la detección.
* **`SecurityLogger`:** Registra en consola y memoria los intentos fallidos con nivel de severidad `CRITICAL` para auditorías.
* **System Prompt Fijo:** Definido como constante del lado del servidor, previniendo que sea manipulado al concatenarlo con inputs de usuario.

### 2. Análisis Estático de Código con Semgrep
* Implementamos reglas de **Semgrep** en el ciclo de desarrollo para detectar vulnerabilidades en el código de forma estática antes del despliegue (SAST), escaneando el código en busca de secretos hardcodeados, uso de regex inseguras y llamadas dinámicas a base de datos propensas a SQLi.

---

## Entrega 4: Hardening de Base de Datos, Migración a Supabase y Control de Acceso por Roles y Permisos

### 1. Migración a Supabase (PostgreSQL)
* De acuerdo con los nuevos requerimientos y las consignas del TP, migramos la base de datos de **Neon** a **Supabase (PostgreSQL)**, permitiendo centralizar la autenticación, habilitar políticas avanzadas de Row Level Security (RLS), encriptación por hardware/software y auditorías robustas basadas en base de datos.
* Se estructuraron los cambios del esquema mediante migraciones versionadas bajo control de Git en la carpeta `supabase/migrations/`.

### 2. Control de Acceso por Roles y Permisos (RBAC + Permisos)
* Evolucionamos el control de acceso por roles (RBAC) simple de la Entrega 1 a un modelo de **control de acceso basado en roles y permisos** específicos. Esto permite una granularidad mucho más fina al validar los accesos a los endpoints y vistas en el middleware `withPermission.ts`.

### 3. Hardening contra Inyección SQL (SQLi)
* **A nivel de Base de Datos:** Parcheamos la función dinámica `actualizar_descripcion_vulnerable` introducida previamente en Supabase. Se reemplazó la concatenación de variables y el uso de `EXECUTE` por un comando estático parametrizado nativo de PL/pgSQL. De esta forma, el motor procesa el parámetro estrictamente como dato, haciendo la consulta inmune a SQLi.
* **A nivel de Aplicación:** Desarrollamos la clase [`SqlInjectionGuard.ts`](file:///c:/Users/Janex/Desktop/utn-sec-info-2026/app/lib/security/SqlInjectionGuard.ts) para validar datos de entrada HTTP. La aplicamos en los endpoints clave de actualización de perfil, registro de usuarios y actualización de detalles de estudiantes, bloqueando payloads maliciosos y registrando el ataque en el `SecurityLogger`.
* **A nivel de Firewall (WAF):** Cabe destacar que esta protección de doble capa (aplicación y base de datos) complementa la **regla de mitigación a nivel de firewall** ya implementada en la Entrega 2 (que filtra e intercepta payloads SQLi en la URL), conformando un sistema robusto de defensa en profundidad.

### 4. Cifrado de Datos en Reposo (PGCRYPTO)
* **Cifrado de DNI:** Empleamos la extensión `pgcrypto` en Supabase para cifrar simétricamente con AES-256 el DNI de los estudiantes en la base de datos (mediante la función `extensions.pgp_sym_encrypt`). Solo es desencriptado en memoria para usuarios autorizados, protegiendo la confidencialidad de la información ante accesos no autorizados a la persistencia.
* **Cifrado de IP de Auditoría:** Para robustecer la protección de Información Personal Identificable (PII), implementamos `pgcrypto` para encriptar la columna `ip` en la tabla `login_logs` (historial de accesos). Al guardar un log de inicio de sesión, la IP se encripta mediante `encrypt_ip` y solo se desencripta en memoria para el panel de administración usando `decrypt_ip`, evitando que un atacante que acceda directamente a los datos en reposo pueda perfilar o rastrear la ubicación de los usuarios.

### 5. Auditoría de Actividad (PGAUDIT)
* Habilitamos la extensión `pgaudit` en Supabase mediante una nueva migración de esquema.
* Configuramos `pgaudit.log = 'write, ddl'` para los roles operativos (`authenticator` y `postgres`). Esto asegura la creación de logs inmutables y persistentes en el servidor de base de datos para todas las operaciones que modifiquen datos o alteren la estructura del esquema, garantizando el cumplimiento de estándares de auditoría.