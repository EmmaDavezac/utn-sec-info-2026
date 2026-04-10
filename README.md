# Seguridad de los Sistemas de Información 202
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

Se implementó **SQLite** como motor de base de datos. Se eligió este enfoque porque el propio backend gestiona la base de datos sin necesidad de un motor externo, siendo adecuado para fines de prueba. Para entornos de mayor tráfico o producción se recomienda migrar a **MySQL** o **PostgreSQL**.

La tabla `users` contiene los siguientes atributos:

| Campo | Descripción |
|---|---|
| `id` | Identificador único del usuario |
| `name` | Nombre completo |
| `email` | Correo electrónico (único) |
| `password_hash` | Contraseña cifrada |
| `role` | `Administrador`, `Profesor` o `Estudiante` |
| `provider` | `email/password` o `google` |
| `active` | Booleano para baja lógica |

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

### Trabajo Futuro

Elementos identificados que no pudieron implementarse por limitaciones de tiempo:

- Generación aleatoria de contraseñas para usuarios creados por administradores, sin que el administrador la conozca, o bien contraseñas de un solo uso.
- Autenticación de doble factor (2FA) como opción para los usuarios.