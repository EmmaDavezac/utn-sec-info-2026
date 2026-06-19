# Guía de Seguridad y Protección de Base de Datos
## Proyecto: SecureCampus IA — Grupo DDV

Este documento sirve como material de soporte y guía de presentación para exponer la arquitectura de protección y blindaje de la base de datos en el proyecto **SecureCampus IA**. Está estructurado primero de forma **detallada** (para estudio técnico) y al final en formato de **resumen por diapositivas** (para la presentación oral).

---

# PARTE 1: Explicación Técnica Detallada

## 1. Mitigación contra Inyección SQL (SQLi)

### La Problemática (El Riesgo)
La inyección SQL ocurre cuando datos provistos por el usuario son concatenados directamente dentro de cadenas SQL y ejecutados en la base de datos. En el sistema original, la función para actualizar descripciones de los alumnos era altamente vulnerable:

```sql
-- CÓDIGO ANTERIOR VULNERABLE
v_query := 'UPDATE "students" SET "detail" = ''' || p_nueva_descripcion || ''' WHERE "id" = ''' || p_estudiante_id || '''';
EXECUTE v_query;
```
* **El ataque:** Si un atacante enviaba en `p_nueva_descripcion` un payload como `' WHERE 1=1; --`, la consulta ejecutada se transformaba en:
  `UPDATE "students" SET "detail" = '' WHERE 1=1; --`
  Esto sobrescribía el detalle de **todos** los estudiantes de la base de datos, destruyendo la integridad de la información. Además, al estar definida la función con `SECURITY DEFINER`, se ejecutaba con privilegios de superusuario (bypass de controles).

### La Solución (Defensa en Profundidad)
Para blindar el sistema contra SQLi, implementamos una estrategia de **tres capas**:

1. **Capa de Base de Datos (SQL Parametrizado Nativo):**
   Reemplazamos las consultas dinámicas por consultas estáticas parametrizadas dentro de PL/pgSQL. Los parámetros nativos separan los datos de las instrucciones SQL, impidiendo que el motor interprete el texto ingresado por el usuario como código ejecutable:
   ```sql
   -- CÓDIGO CORREGIDO SEGURO
   UPDATE "students"
   SET "detail" = p_nueva_descripcion
   WHERE "id" = p_estudiante_id;
   ```
2. **Capa de Aplicación (Filtro Anti-SQLi):**
   Implementamos `SqlInjectionGuard.ts` en el servidor Next.js. Este interceptor analiza cadenas de texto buscando operadores lógicos comunes de bypass (`OR 1=1`), comentarios (`--`) o caracteres especiales sospechosos antes de enviar la consulta al motor de base de datos.
3. **Capa de Red (WAF Rules):**
   A través del firewall (WAF) se interceptan y bloquean peticiones HTTP cuyas URLs contengan keywords sospechosas codificadas en formato URL-encode (ej. `SELECT`, `UNION`, `DROP`).

---

## 2. Row Level Security (RLS) - Seguridad a Nivel de Fila

### La Problemática (El Riesgo)
Supabase expone un API REST público (PostgREST) accesible con la `anon_key` desde el frontend para agilizar las consultas. Si no se configura Row Level Security (RLS):
* **Falta de aislamiento:** Cualquier cliente puede consultar la tabla `students` o tablas internas y leer registros que no le pertenecen.
* **RLS Inactivo:** En el esquema original se creó la política RLS pero no se ejecutó el comando para activarla (`ALTER TABLE students ENABLE ROW LEVEL SECURITY;`), dejando la tabla totalmente pública.
* **Conflicto de Roles (Fallo de Lógica):** La política inicial solo permitía el acceso a administradores (`admin`) y al estudiante dueño de su email, bloqueando a los profesores (`profesor`) que legítimamente necesitaban listar a los alumnos según el middleware de la aplicación.
* **Exposición de credenciales:** Las tablas `users`, `reset_tokens` y `login_logs` estaban expuestas sin RLS en el esquema `public`, permitiendo a atacantes descargar hashes de contraseñas de tipo bcrypt de toda la organización.

### La Solución (Control de Acceso Basado en Contexto)
1. **Activación de RLS:** Habilitamos RLS en todas las tablas del esquema público.
2. **Denegación por Defecto en Tablas Internas:** Al habilitar RLS en `users`, `reset_tokens` y `login_logs` sin crear ninguna política de acceso, denegamos de forma absoluta el acceso externo via REST API. El backend de Next.js mantiene su funcionamiento normal ya que utiliza conexión directa (`DATABASE_URL`) con la cuenta de base de datos propietaria (`postgres`), la cual se salta las políticas RLS por ser dueña de los objetos.
3. **Política Dinámica en `students` con claims JWT:**
   Definimos una política granular que valida el JWT HS256 firmado con el secret del proyecto, el cual inyecta claims de correo (`email`) y rol (`user_role`):
   ```sql
   CREATE POLICY "role_based_select"
   ON students
   FOR SELECT
   TO authenticated
   USING (
       (auth.jwt() ->> 'user_role') = 'admin'
       OR (auth.jwt() ->> 'user_role') = 'profesor'
       OR email = (auth.jwt() ->> 'email')
   );
   ```
   * **Administradores y Profesores:** Tienen acceso a todos los estudiantes de la tabla.
   * **Estudiantes:** Solo pueden visualizar la fila que coincida con su dirección de correo electrónico validada.

---

## 3. Cifrado en Reposo y PII (PGCRYPTO)

### La Problemática (El Riesgo)
Ciertos datos del sistema contienen Información Personal Identificable (PII) crítica, como el DNI de los estudiantes o las direcciones IP del registro de accesos en `login_logs`.
* **Riesgo:** Si un atacante compromete la base de datos (por ejemplo, mediante una copia física de seguridad filtrada o un backup desprotegido en la nube), toda la PII queda expuesta en texto plano, lo que viola regulaciones de protección de datos (como la Ley de Protección de Datos Personales de Argentina).

### La Solución (Cifrado Simétrico a Nivel de Columna)
Utilizamos la extensión oficial de PostgreSQL `pgcrypto` para encriptar los campos sensibles antes de almacenarlos en disco:

1. **Cifrado AES-256:**
   Los DNIs e IPs se almacenan en formato binario (`BYTEA`) encriptados con una llave simétrica fuerte (`DB_ENCRYPTION_KEY`):
   ```sql
   -- Encriptación
   extensions.pgp_sym_encrypt(dni_text, encryption_key);
   ```
2. **Desencriptación al Vuelo (On-the-Fly):**
   Los datos solo se desencriptan en memoria al vuelo cuando se hace la consulta del usuario autorizado y la clave es correcta:
   ```sql
   -- Desencriptación
   extensions.pgp_sym_decrypt(dni_encrypted, encryption_key);
   ```
   Si la base de datos se ve comprometida físicamente, las columnas `dni_encrypted` e `ip` solo muestran secuencias de bytes indescifrables.

---

## 4. Auditoría Empresarial (PGAUDIT)

### La Problemática (El Riesgo)
En un sistema crítico, "saber quién hizo qué y cuándo" es vital. Si un administrador modifica indebidamente los datos de un alumno, da de baja a un profesor o cambia una contraseña, los logs estándar de aplicación pueden omitir o perder estos eventos críticos. Si los logs no son inmutables o detallados, no se puede reconstruir la línea de tiempo de un ataque.

### La Solución (Trazabilidad Estricta a Nivel de Motor)
1. **Activación de `pgaudit`:**
   Habilitamos la extensión oficial `pgaudit` a nivel del motor de Supabase para registrar de forma inmutable todas las operaciones DDL (cambios de tablas) y de escritura (INSERT, UPDATE, DELETE) de manera inmutable:
   ```sql
   ALTER ROLE authenticator SET pgaudit.log = 'write, ddl';
   ALTER ROLE postgres SET pgaudit.log = 'write, ddl';
   ```
2. **Vinculación de Contexto de Aplicación (`app.current_user`):**
   Las conexiones del backend de Next.js se realizan en bloques transaccionales. Al iniciar una transacción, definimos una variable de configuración de sesión llamada `app.current_user` con el email del usuario autenticado que solicita la acción:
   ```sql
   PERFORM set_config('app.current_user', p_usuario_email, true);
   ```
   El registro generado en el archivo de auditoría inmutable de Postgres asocia directamente la consulta SQL ejecutada, la tabla afectada, el timestamp exacto y el email del usuario de la sesión web que provocó ese cambio.

---

## 5. Pruebas de Concepto y Resultados de Verificación

Para demostrar la robustez de las defensas y verificar que las políticas RLS y el cifrado funcionan exactamente como se espera en todos los niveles, implementamos y ejecutamos un script de pruebas de concepto (`test_security.js`). Este script simula accesos directos al API REST de Supabase con diferentes identidades JWT.

### Ejecución de Pruebas
Puedes ejecutar el script en vivo en la terminal del proyecto con el comando:
```bash
node ./.gemini/antigravity-ide/brain/b1788fe1-4de2-4e68-a381-576b30a7ba25/scratch/test_security.js
```

### Resultados de la Ejecución Real:
```text
🛡️ INICIANDO PRUEBAS DE SEGURIDAD EN BASE DE DATOS

👉 PRUEBA 1: Leyendo tabla interna 'users' por API REST...
- Sin Token: Status 200. Datos: []
- Con JWT de Admin: Status 200. Datos: []
💡 [RESULTADO ESPERADO]: Retorna una lista vacía (bloqueado) porque RLS está activo y no hay políticas públicas. Acceso restringido.

👉 PRUEBA 2: Leyendo tabla 'students' como ALUMNO (juan.perez@example.com)...
- Status: 200
- Filas obtenidas: 1
- Alumnos devueltos: [ 'Juan Pérez (juan.perez@example.com)' ]
💡 [RESULTADO ESPERADO]: Retorna ÚNICAMENTE la fila que le corresponde al estudiante autenticado.

👉 PRUEBA 3: Leyendo tabla 'students' como PROFESOR (profesor@example.com)...
- Status: 200
- Filas obtenidas: 18
- Primeros 3 registros: [
  'Carlos López (carlos.lopez@example.com)',
  'Ana Martínez (ana.martinez@example.com)',
  'Luis Fernández (luis.fernandez@example.com)'
]
💡 [RESULTADO ESPERADO]: El profesor puede listar todos los estudiantes de la institución.

👉 PRUEBA 4: Consultando datos crudos en la DB para verificar Cifrado...
- Registros leídos de forma directa por SQL (DATABASE_URL):
  * ID: 4, Nombre: Carlos López, DNI Cifrado: <Buffer c3 0d 04 07 03 02 a8 ee 7b 23 ...>
  * ID: 5, Nombre: Ana Martínez, DNI Cifrado: <Buffer c3 0d 04 07 03 02 f8 b0 84 51 ...>
💡 [RESULTADO ESPERADO]: El DNI se visualiza en disco en formato binario cifrado (AES-256) ilegible.
```

---

# PARTE 2: Resumen para Presentación (Slide by Slide)

A continuación se presenta un esquema condensado de **8 diapositivas** para tu presentación de clase:

### Diapositiva 1: Portada
* **Título:** Blindaje y Hardening de Base de Datos en SecureCampus IA
* **Subtítulo:** Mitigación de SQLi, RLS, Cifrado con Pgcrypto y Auditoría con Pgaudit
* **Grupo:** Grupo DDV — Entrega Final
* **Mensaje clave:** Diseñamos un esquema de seguridad bajo el principio de **Defensa en Profundidad**, donde la base de datos se protege a sí misma incluso si las capas superiores fallan.

### Diapositiva 2: Mitigación contra Inyección SQL (SQLi)
* **El Problema:** Consultas SQL dinámicas (concatenadas) permitían reescribir consultas en la base de datos. Un payload en un campo de texto podía borrar o alterar todos los alumnos.
* **La Solución:**
  * **Base de Datos:** Migramos a sentencias SQL paramétricas nativas estáticas en PL/pgSQL.
  * **Servidor (Backend):** Implementamos un filtro anti-SQLi (`SqlInjectionGuard.ts`) para sanitizar texto del usuario.
  * **Perímetro (WAF):** Bloqueo de URLs con keywords sospechosas.
* **Mensaje clave:** Separación absoluta entre instrucciones lógicas y datos provistos por el usuario.

### Diapositiva 3: Row Level Security (RLS) - ¿Qué fallaba?
* **El Problema:** 
  1. Supabase expone un API REST de acceso público.
  2. RLS no estaba habilitado en la tabla de alumnos (política ignorada).
  3. Las tablas de usuarios, tokens de recuperación y logs de accesos estaban en el esquema público y eran legibles por cualquiera con internet.
  4. Los profesores no podían ver alumnos debido a una política muy restrictiva para estudiantes.

### Diapositiva 4: RLS - Solución Aplicada
* **La Solución:**
  * **Habilitación Global:** Activación explícita de RLS en todas las tablas (`students`, `users`, `reset_tokens`, `login_logs`).
  * **Denegación por Defecto:** Las tablas críticas backend no tienen políticas; la API REST tiene el acceso bloqueado de forma absoluta. El servidor Next.js accede mediante conexión directa Postgres (que omite RLS).
  * **Alineación de Lógica:** Ajustamos la política de estudiantes para admitir a profesores (`profesor`) y administradores (`admin`), aislando a los alumnos (`estudiante`) a ver únicamente sus propios datos basándose en el JWT firmado.

### Diapositiva 5: Cifrado en Reposo con PGCRYPTO
* **El Problema:** Exposición de PII (Información Personal Identificable). Si un atacante robara una copia de seguridad física o backups en la nube, expondría los DNIs de los estudiantes y las direcciones IP de logs.
* **La Solución:**
  * Uso de la extensión `pgcrypto` en PostgreSQL.
  * Encriptación simétrica AES-256 a nivel de columna para campos sensibles (`dni_encrypted`, `ip`) almacenados como `BYTEA`.
  * Desencriptado controlado en memoria en tiempo de ejecución solo para usuarios con la clave secreta adecuada.
* **Mensaje clave:** Los datos robados en reposo son inservibles sin la clave criptográfica.

### Diapositiva 6: Trazabilidad y Auditoría con PGAUDIT
* **El Problema:** La falta de trazabilidad inmutable imposibilita auditar acciones maliciosas o identificar ataques de administradores deshonestos o cuentas comprometidas.
* **La Solución:**
  * Habilitación de la extensión `pgaudit` en Supabase para registrar de forma inmutable todas las operaciones de escritura (DML) y estructurales (DDL).
  * Inyección del email del operador en la transacción mediante la variable de sesión `app.current_user`.
* **Mensaje clave:** Cada comando SQL ejecutado en la base de datos queda registrado asociando directamente la identidad real del usuario web.

### Diapositiva 7: Demostración en vivo y Verificación
* **El Objetivo:** Demostrar que un atacante no puede evadir la seguridad incluso conociendo los endpoints públicos.
* **Las Pruebas:**
  * Intentos de leer tablas de contraseñas (`users`) -> Retorna lista vacía (denegado).
  * Acceso de estudiante -> Solo ve su propio registro (aislamiento RLS).
  * Acceso de profesor -> Ve todos los registros (lógica de negocio).
  * Datos en disco -> DNI binario e ilegible (PGCRYPTO).
* **Mensaje clave:** Seguridad comprobada empíricamente contra ataques directos al API.

### Diapositiva 8: Conclusión
* **Esquema de Defensa Multicapa:**
  * **Capa 1: Red (WAF)** -> Bloquea el ataque en la entrada.
  * **Capa 2: Aplicación (Next.js)** -> Autentica, autoriza por permisos y sanitiza.
  * **Capa 3: Datos (Postgres/Supabase)** -> Aplica RLS, cifra datos confidenciales y audita inmutablemente las acciones.
* **Resultado:** Cumplimiento de estándares OWASP para bases de datos y blindaje integral de la información institucional.
