# Seguridad de los Sistemas de Información 2026
## Trabajo Práctico Integrador — Avances

**Grupo:** DDV

| Integrante |
|:---|
| Emmanuel Davezac |
| Agustín Vergara |
| Nicolás Villanueva |

---

Este documento detalla el avance del Trabajo Práctico Integrador a través de las distintas fases, los requerimientos establecidos por los profesores y cómo se implementó la solución.

---

## Instrucciones de Instalación y Ejecución
1. Clonar el repositorio

```bash
git clone https://github.com/EmmaDavezac/utn-sec-info-2026.git
cd utn-sec-info-2026
```

2. Instalar dependencias
```bash
npm install
```

3. Crear el archivo de variables de entorno
Completar los valores en .env según corresponda

```bash
cp example.env .env
```

4. Iniciar el servidor de desarrollo
```bash
npm run dev
```

Luego acceder desde el navegador a **http://localhost:3000**

---

## Requisitos Técnicos Obligatorios

Para la aprobación del proyecto, la aplicación final deberá demostrar:

1. **Protección de Rutas** — El chat solo debe ser accesible por usuarios autenticados.
2. **Seguridad en el Cliente** — Prevención de ataques XSS mediante el uso de contextos seguros para el token de sesión.
3. **Seguridad en el Servidor** — La API Key de la IA nunca debe viajar al frontend ni estar presente en el repositorio de código.
4. **Auditoría de IA** — Implementación de un System Prompt que limite el alcance de la IA a temas académicos, resistiendo intentos de manipulación.

---

## Entrega 1 — Fecha: 10/04

**Requerimiento Técnico:** Hardening de API & Entorno

**Conceptos Clave:** Migración de secretos a `.env`, implementación de autenticación (OIDC) y autorización (OAuth).

---

### Resolución

#### 1. Migración de secretos a `.env`

Para satisfacer este requisito se crearon dos archivos: `.env` y `.env.example`.

- **`.env`** almacena los datos sensibles del sistema: API keys, contraseñas, direcciones internas e información de la base de datos.
- **`.env.example`** es una plantilla con la estructura esperada, pensada para que otros desarrolladores puedan crear su propio `.env` sin exponer credenciales reales.

El archivo `.env` fue añadido al `.gitignore` para garantizar que nunca sea subido al repositorio. De lo contrario, un simple `push` podría filtrar todas las credenciales, habilitando desde ataques externos hasta el consumo no autorizado de las API keys.

---

#### 2. Autenticación (OIDC) y Autorización (OAuth)

##### Base de datos

Se implementó **SQLite** como motor de base de datos. 

La base de datos cuenta con tres tablas principales:

**Tabla `users`** — Almacena los usuarios del sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | TEXT | Identificador único del usuario |
| `name` | TEXT | Nombre completo |
| `email` | TEXT | Correo electrónico (único) |
| `password_hash` | TEXT | Contraseña cifrada con bcrypt |
| `role` | TEXT | `Administrador`, `Profesor` o `Estudiante` |
| `provider` | TEXT | `credentials` o `google` |
| `active` | INTEGER | `1` activo, `0` baja lógica |

**Tabla `reset_tokens`** — Almacena tokens temporales para recuperación de contraseña.

| Campo | Tipo | Descripción |
|---|---|---|
| `token` | TEXT | Token opaco único (UUID) |
| `user_id` | TEXT | ID del usuario que solicitó el reset |
| `expires_at` | INTEGER | Timestamp de expiración (1 hora) |

**Tabla `login_logs`** — Registra cada inicio de sesión para auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER | Identificador autoincremental |
| `user_id` | TEXT | ID del usuario que inició sesión |
| `email` | TEXT | Correo utilizado |
| `provider` | TEXT | `credentials` o `google` |
| `ip` | TEXT | Dirección IP del cliente |
| `user_agent` | TEXT | Navegador y sistema operativo |
| `timestamp` | DATETIME | Fecha y hora del acceso |

##### Usuarios iniciales

La base de datos se inicializa con tres usuarios de prueba, todos con la contraseña `password123`. **Se recomienda cambiarla tras el primer inicio de sesión.**

| Email | Rol |
|---|---|
| `admin@example.com` | Administrador |
| `profesor@example.com` | Profesor |
| `estudiante@example.com` | Estudiante |

---

### Consideraciones de Implementación

**Registro y acceso:**
- Todo usuario debe registrarse para acceder al sistema.
- Se implementaron vistas y endpoints para: inicio de sesión, registro, recuperación de contraseña (`forgot-password`) y restablecimiento (`reset-password`).
- Los usuarios registrados mediante el formulario o mediante Google reciben automáticamente el rol `Estudiante`.
- Los administradores pueden crear usuarios con cualquier rol desde el panel de administración.

**Control de acceso por rol:**

| Vista | Estudiante | Profesor | Administrador |
|---|:---:|:---:|:---:|
| Chat | ✓ | ✓ | ✓ |
| Perfil | ✓ | ✓ | ✓ |
| Estudiantes | — | ✓ | ✓ |
| Panel de administración | — | — | ✓ |

- Los únicos endpoints accesibles sin autenticación son los de `auth`, `forgot-password` y `reset-password`.
- Los intentos de acceso no autorizado devuelven un mensaje **`403 — Acceso denegado`**.

**Gestión de sesiones:**
- Se utiliza **NextAuth** para la autenticación. Los JWT de sesión se almacenan en cookies del navegador.
- Google está configurado como proveedor alternativo de inicio de sesión.
- Un usuario dado de baja no puede iniciar sesión, incluso si posee un JWT válido en su dispositivo: NextAuth verifica el estado `active` antes de validar la sesión.

**Auditoría:**
- Se registra cada inicio de sesión en una tabla de la base de datos, permitiendo auditorías posteriores (por ejemplo, detectar accesos no autorizados).

**Recuperación de contraseña:**
- Se implementó un **reset token temporal** con validez de 1 hora.
- Es un token opaco (cadena aleatoria sin información intrínseca), enviado al usuario por correo electrónico como enlace de restablecimiento.

**Validaciones de contraseña (frontend):**
- Mínimo 8 caracteres.
- Al menos un carácter especial.

---

### Justificación de Tecnologías y Decisiones de Seguridad
 
Esta sección explica el razonamiento detrás de cada tecnología adoptada y cada decisión de seguridad tomada durante la implementación. 
 
 
#### NextAuth para autenticación
 
Se eligió NextAuth por ser la solución de autenticación estándar del ecosistema Next.js. Gestiona de forma segura el ciclo de vida de la sesión, la generación y validación de JWT, y la integración con proveedores externos como Google. Implementar este mecanismo desde cero hubiera introducido riesgos innecesarios: NextAuth está auditado por la comunidad y sigue las recomendaciones de OWASP para manejo de sesiones.
 
Se optó por la estrategia **JWT** (en lugar de sesiones en base de datos) para evitar una consulta adicional por cada request.
 
#### SQLite con better-sqlite3
 
Se eligió **SQLite** por su simplicidad operativa: no requiere un servidor de base de datos separado.
Para producción, se recomienda migrar a **PostgreSQL** o **MySQL**, que ofrecen mejor soporte para concurrencia, backups y cifrado en reposo.
 
#### bcrypt para el hash de contraseñas
 
Las contraseñas nunca se almacenan en texto plano. Se utiliza **bcrypt** con un factor de costo de 10, lo que hace que cada hash tome aproximadamente 100ms en calcularse. Esto es intencional: dificulta los ataques de fuerza bruta y de diccionario, ya que un atacante que obtenga la base de datos no puede probar millones de contraseñas por segundo. MD5 y SHA-1 fueron descartados por ser inseguros para este propósito.
 
#### Variables de entorno para secretos
 
Ninguna credencial, API key ni secreto está hardcodeado en el código fuente. Todos se leen desde variables de entorno, siguiendo el principio de los [Twelve-Factor Apps](https://12factor.net/config). Esto garantiza que el repositorio pueda ser público sin exponer información sensible, y que cada entorno (desarrollo, staging, producción) pueda tener sus propios valores sin modificar el código.
 
#### Baja lógica en lugar de eliminación física
 
Cuando un administrador elimina un usuario, el registro no se borra de la base de datos: se marca como `active = 0`. Esta decisión tiene dos fundamentos. Primero, preserva la integridad referencial con la tabla `login_logs`, que contiene el historial de accesos del usuario. Segundo, permite auditar qué usuarios existieron en el sistema, lo cual es relevante en contextos donde se investigan incidentes de seguridad.
 
#### Tokens opacos para recuperación de contraseña
 
El mecanismo de reset de contraseña utiliza tokens opacos (aleatorios sin información intrínseca), en lugar de JWT firmados. Esta decisión es deliberada: un JWT podría ser decodificado por cualquiera para obtener el ID del usuario o la fecha de expiración. Un token opaco no revela ningún dato y solo tiene validez si existe en la base de datos, lo que permite revocarlo de forma inmediata una vez utilizado.
 
#### Logging de accesos
 
Se registra cada inicio de sesión con IP, user agent, proveedor y timestamp. Esto permite detectar patrones anómalos como múltiples intentos fallidos, accesos desde IPs inusuales o inicios de sesión en horarios fuera de lo normal. Es una práctica recomendada por estándares como ISO 27001.
 
#### Control de acceso por rol
 
El control de acceso por rol garantiza que cada usuario solo pueda acceder a las funcionalidades que corresponden a su rol. Los estudiantes no pueden ver el panel de administración ni la lista de estudiantes; los profesores no pueden gestionar usuarios. Todos los endpoints verifican el rol del token JWT en el servidor antes de procesar cualquier solicitud, por lo que la restricción no depende únicamente del frontend.
 
---


### Trabajo Futuro

Elementos identificados que no pudieron implementarse por limitaciones de tiempo:

- Generación aleatoria de contraseñas para usuarios creados por administradores, sin que el administrador la conozca, o bien contraseñas de un solo uso.
- Autenticación de doble factor (2FA) como opción para los usuarios.
- Limitar la cantidad de peticiones al servidor para proteger de metodos de fuerza bruta y denegación de servicios.
- Poner un periodo de enfriamiento o verificación vía captcha luego de varios intentos fallidos de inicio de sesión .

## Entrega 2 — Fecha: 17/04

**Requerimiento Técnico:** Configuración WAF Rules

**Conceptos Clave:** Diseñar e implementar al menos 3 reglas de Firewall en Vercel.

---

### Resolución

## Criterio de Selección de Reglas

Las reglas implementadas fueron seleccionadas considerando las caracteristicas de la aplicación y cuales reglas son indespensables en la actualidad . Se priorizaron tres vectores de ataque principales:

- **Abuso del servicio de IA:** Un endpoint que consume una API 
  externa de LLM representa un costo económico real por cada request. 
  Sin rate limiting, un atacante puede agotar la cuota o generar gastos elevados sin necesidad de explotar ninguna vulnerabilidad de código.

- **Reconocimiento automatizado:** La mayoría de los ataques reales comienzan con una fase de escaneo automatizado. Bloquear herramientas conocidas de pentesting  y bots sin User-Agent en una etapa temprana reduce drásticamente la superficie expuesta antes de que el atacante identifique vulnerabilidades explotables.

- **Inyección en URL** son unas de las vulnerabilidades mas explotadas. Debemos interceptar el ataque antes de que el request llegue al servidor, esto agrega una capa de defensa independiente del código.



#### Reglas de Firewall Implementadas
 
##### Regla 1 — Rate Limit en API 
 
**Nombre:** Rate Limit API Endpoints  
**Acción:** Deny 429 (Too Many Requests)
 
**Descripción:**  
Limita la cantidad de requests que una misma IP puede realizar al conjunto de endpoints `/api/` a un máximo de 30 solicitudes cada 60 segundos. Esta regla es crítica en una aplicación que integra un proveedor de LLM externo, ya que sin ella cualquier hacker podría generar un ataque masivo de llamadas a la IA, ocasionando costos económicos elevados o dejando el servicio inaccesible.
Protege de ataquees DOS.

---

### Regla 2 — Bloquear Scanner Bots y User-Agent Vacío
 
**Nombre:** Block Scanner Bots  
**Acción:** Deny 404 (Not Found)
 
**Descripción:**  
Bloquea herramientas de pentesting automático y scanners que buscan vulnerabilidades, detectándolos por su User-Agent característico. Adicionalmente bloquea requests con User-Agent vacío, ya que los navegadores legítimos siempre se identifican. Responder con 404 en lugar de 403 evita revelar la existencia del firewall al atacante.
 
**Condiciones aplicadas:**
 
| Condición | Valor | Tipo de herramienta |
|-----------|-------|---------------------|
| User Agent Contains | `sqlmap` | Inyección SQL automatizada |
| User Agent Contains | `nikto` | Scanner de vulnerabilidades web |
| User Agent Contains | `nmap` | Scanner de puertos y servicios |
| User Agent Contains | `masscan` | Scanner masivo de puertos |
| User Agent Equals | `""` | Bot sin identificación |
 
---

### Regla 3 — Bloquear Inyección en URL 
 
**Nombre:** Block SQL and Script Injection in URL  
**Acción:** Deny 403 (Forbidden)
 
**Descripción:**  
Esta regla intercepta y bloquea requests cuya URL contenga patrones característicos de ataques de inyección antes de que lleguen al servidor. Se detectan keywords de SQL Injection (`select`, `union`) en formato URL-encoded, intentos de Cross-Site Scripting (`<script>`, `javascript:`) y secuencias de Path Traversal (`../`) usadas para escapar del directorio raíz del servidor y acceder a archivos del sistema operativo.
 
---

# test
