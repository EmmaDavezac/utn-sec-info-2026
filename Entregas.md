# Seguridad de los sistemas de información 202
## Avances del Trabajo Práctico Integrador
### Grupo DDV

**Integrantes**
    * Emmanuel Davezac
    * Agustin Vergara
    * Nicolas Villanueva

Este documento detalla el avance del Trabajo Práctico Integrador a traves de las distintas fases, los requerimientos establecidos por los profesores y como implementamos la solución.

**Requisitos Técnicos Obligatorios**
Para la aprobación del proyecto, la aplicación final deberá demostrar:
1. Protección de Rutas: El chat solo debe ser accesible por usuarios autenticados.

2. Seguridad en el Cliente: Prevención de ataques XSS mediante el uso de contextos seguros para el token de sesión.

3. Seguridad en el Servidor: La API Key de la IA nunca debe viajar al frontend ni estar presente en el repositorio de código.

4. Auditoría de IA: Implementación de un System Prompt que limite el alcance de la IA a temas académicos, resistiendo intentos de manipulación.

## Entrega 1 Fecha 10/04

**Requerimiento Técnico**
Hardening de API & Entorno

**Conceptos Clave**
Migración de secretos a .env, implementación de autenticación (OIDC) y autorización (OAuth)

### Resolucion
#### Migración de secretos a .env
Para sastifacer este requisito creamos dos archivos .env y Example.env, en el primero guardamos los datos sensibles del sistema como pueden ser api keys, contraseñas, direcciones sensibles, información de la base de datos y el segundo es un archivo con una estructura de ejemplo para crear el archivo .env, ya que este no se sube a github para proteger esta información sensible. Agregamos el archivo .env al .gitignore para asegurarnos que el mismo nunca se suba, de caso contrario con un push al repositorio se filtrarian todas nuestras credenciales, permitiendo desde ataques externos, filtraciones de informacion y hasta consumo con nuestras api keys.

#### implementación de autenticación (OIDC) y autorización (OAuth)
primero creamos una base de datos con sqlite, aqui guardaremos la información de los usuarios. Elegimos este tipo de base de datos ya que el mismo backend se encarga de la base de datos, no es necesario un motor externo y es para fines de prueba. En casos de mayor trafico o produccion podriamos implementar MySQL o PostreSQL.
Definimos la tabla user con los siguientes atributos.

        id: Identificador del usuario.

        name: Nombre completo del usuario.

        email: Correo electrónico (unique).

        password_hash: La contraseña cifrada.

        role: Define si es Administrador, Profesor o Estudiante tal como lo definimos en la entrega anterior.

        provider: Indica si el usuario se registro por  (email/password) o 'google.

        active: Un booleano para baja logica del usuario.
    
Inicializasmos la base de datos con los siguientes tres usuarios:
*   admin@example.com (Administrador)
*    profesor@example.com (Profesor)
*    estudiante@example.com (Estudiante)
Todos con la contraseña password123, se recomienda cambiar la contraseña luego del primer inicio de sesión.

**Consideracion**
* Una persona debe obligatoriamente registrarse para usar el sistema.
* Se implemento la vista y el endpoint Auth para que iniciar sesión y registrar. 
* Se implemento forgot-password y reset-password para recuperar la contraseña.
* Todo Usuario que se registra en AUTH tiene el rol estudiante
* Todo usuario que se regristra con Google tiene el rol estudiante.
* Se implemento la vista panel de administracion para que los administradores gestiones usuarios y roles. Ellos pueden registrar usuarios con cualquier rol.

Los usuarios tienen acceso a las siguientes vistas:
* Estudiante: 
    * Chat
    * Perfil:Añadimos esta vista para que cada usuario pueda modificar sus datos.

* Profesor: 
    * Chat
    * Perfil:Añadimos esta vista para que cada usuario pueda modificar sus datos.
    * Estudiantes: Pueden ver la lista de estudiantes activos.

* Administrador: 
    * Chat
    * Perfil:Añadimos esta vista para que cada usuario pueda modificar sus datos.
    * Estudiantes: Pueden ver la lista de estudiantes activos.
    * Panel de administración


* Los unicos endpoints accesibles sin logearse son los auth, forgot-password, reset-password.Lo mismo con las vistas correspondientes.
* cuando un usuario intenta acceder a una vista prohibida se muestra el mensaje *403 - Acceso denegado*
Todo intento de acceso a un en 403 - Acceso denegado

* Utilizamos la libreria de autenticación NextAuth, la misma qcrea JWT de sesión que se guarda en una cookie del navegador.
Configuramos google como provider para que un usuario pueda iniciar sesión con google en lugar de registrarse.


* Hicimos un log de inicio de sesion, de modo que cuando un usuario inicia sesion, se guarda la información en una tabla de base de datos. Esto sirve en caso de hacer una auditoria.Por ejemplo saber si una persona que no deberia entrar al sistema lo hace.

* Un usario dado de baja no puede iniciar sesion en el sistema, por mas que tenga el jwt en su dispositivo, porque nextauth verifica que el usuario este activo antes de validar la sesion.

* Se implemento un reset token temporal (1 hora) para que un usuario pueda recuperar su contraseña. Este es un token opaco, porque es una cadena aleatoria que no contiene informacion por si misma. Se envia un link de restablecimiento al usuario via mail.

* Pusimos validaciones en el fronten para que la contraseñas sean mas robustas, deben tener al menos 8 caracteres y al menos un caracter especial.

Notas a futuro: hau varias cosas que nos gustaria implementar pero por falta de tiempo no alcanzamos a hacerlo, por ejemplo
* nos justaria implementar que la contraseña de los usuarios creados por los administradores se genere aleatoreamente sin que el administrador la vea. O que sea una contraseña de un solo uso.
* Implementar autenticacion de doble factor opcional para los usuarios.