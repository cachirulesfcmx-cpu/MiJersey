# 003 -- Authentication & Authorization

## Engineering Specification

Version: 1.0

> Este documento define el sistema de autenticación y autorización de la
> plataforma. Su objetivo es proporcionar una base segura para el acceso
> al panel administrativo y a las cuentas de clientes.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un sistema de identidad seguro, escalable y desacoplado que
gestione autenticación, autorización y sesiones para administradores y
clientes.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Registro de clientes.
-   Inicio y cierre de sesión.
-   Recuperación y cambio de contraseña.
-   Verificación de correo electrónico.
-   Gestión de sesiones.
-   Roles y permisos.
-   Middleware de autorización.
-   Auditoría básica de acceso.

No incluye autenticación social ni SSO.

------------------------------------------------------------------------

# 3. Tipos de Usuario

## Cliente

-   Registro.
-   Inicio de sesión.
-   Gestión de perfil.
-   Consulta de pedidos.

## Administrador

-   Acceso al panel.
-   Gestión del sistema según permisos.

------------------------------------------------------------------------

# 4. Autenticación

Implementar:

-   Email + contraseña.
-   Hash seguro de contraseñas.
-   Tokens de acceso.
-   Refresh Tokens.
-   Rotación de Refresh Tokens.
-   Cierre de sesión individual y global.

Las contraseñas nunca deberán almacenarse en texto plano.

------------------------------------------------------------------------

# 5. Autorización

Modelo RBAC.

Roles mínimos:

-   Super Admin
-   Admin
-   Editor
-   Support
-   Customer

Permisos asignados mediante políticas, no mediante lógica dispersa.

------------------------------------------------------------------------

# 6. Gestión de Sesiones

Cada sesión deberá almacenar:

-   identificador
-   usuario
-   dispositivo
-   fecha de creación
-   último uso
-   estado

Permitir invalidar sesiones activas.

------------------------------------------------------------------------

# 7. Recuperación de Cuenta

Implementar:

-   solicitud de recuperación
-   token temporal
-   expiración
-   cambio seguro de contraseña
-   invalidación de sesiones si cambia la contraseña

------------------------------------------------------------------------

# 8. Verificación de Correo

Registrar estado de verificación.

El flujo deberá contemplar:

-   envío de enlace
-   expiración
-   reenvío
-   confirmación

------------------------------------------------------------------------

# 9. Seguridad

Aplicar:

-   rate limiting
-   validación de credenciales
-   protección contra fuerza bruta
-   protección frente a enumeración de usuarios
-   cookies seguras cuando corresponda
-   auditoría de accesos

------------------------------------------------------------------------

# 10. Backend

Implementar:

-   entidades del dominio Identity
-   casos de uso
-   repositorios
-   controladores
-   DTOs
-   validaciones
-   middleware
-   guards

------------------------------------------------------------------------

# 11. Frontend

Crear interfaces para:

-   login
-   registro
-   recuperación
-   restablecimiento
-   perfil
-   gestión de sesiones

Todos los formularios deberán cumplir las reglas del documento
02-UI-GUIDELINES.

------------------------------------------------------------------------

# 12. Modelo de Datos

Como mínimo contemplar:

-   User
-   Role
-   Permission
-   Session
-   PasswordReset
-   EmailVerification

El diseño deberá permitir ampliar permisos sin modificar la
arquitectura.

------------------------------------------------------------------------

# 13. APIs

Endpoints mínimos:

-   register
-   login
-   logout
-   refresh
-   forgot-password
-   reset-password
-   verify-email
-   resend-verification
-   me
-   sessions

Todas las respuestas deberán ser consistentes.

------------------------------------------------------------------------

# 14. Auditoría

Registrar:

-   inicios de sesión
-   cierres de sesión
-   cambios de contraseña
-   recuperación de cuenta
-   cambios de permisos

Sin almacenar información sensible.

------------------------------------------------------------------------

# 15. Entregables

Claude Code deberá generar:

-   dominio Identity
-   esquema Prisma
-   migraciones
-   autenticación
-   autorización
-   middleware
-   guards
-   interfaces frontend
-   documentación
-   pruebas relevantes

------------------------------------------------------------------------

# 16. Criterios de Aceptación

Se considera completado cuando:

-   clientes y administradores pueden autenticarse;
-   los permisos restringen correctamente el acceso;
-   las sesiones pueden gestionarse;
-   la recuperación de contraseña funciona;
-   la verificación de correo funciona;
-   el sistema supera las validaciones definidas.

------------------------------------------------------------------------

# 17. Definition of Done

El módulo estará terminado cuando la autenticación y autorización
funcionen de forma segura, respeten la Constitución, la Arquitectura y
los Estándares de Código, y dejen preparada la plataforma para el
documento **004 -- Admin Dashboard**.
