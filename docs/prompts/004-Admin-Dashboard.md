# 004 -- Admin Dashboard

## Engineering Specification

Version: 1.0

> Este documento define el panel administrativo de la plataforma. Su
> propósito es proporcionar una interfaz centralizada, segura y
> eficiente para gestionar todas las operaciones del eCommerce.

------------------------------------------------------------------------

# 1. Objetivo

Construir un panel administrativo modular que permita administrar el
catálogo, pedidos, clientes, contenido, configuración y métricas desde
una única interfaz.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Layout administrativo.
-   Dashboard principal.
-   Navegación.
-   Gestión de usuarios administradores.
-   Gestión de roles (consumo del módulo Identity).
-   Widgets y métricas.
-   Centro de notificaciones.
-   Búsqueda global.
-   Configuración de perfil.
-   Auditoría visual.

No incluye la lógica específica de los módulos de negocio (catálogo,
pedidos, etc.).

------------------------------------------------------------------------

# 3. Requisitos Funcionales

## Dashboard

Mostrar indicadores configurables:

-   Ventas.
-   Pedidos.
-   Clientes.
-   Productos.
-   Ingresos.
-   Conversión.
-   Inventario.
-   Actividad reciente.

Los widgets deberán poder ocultarse o reordenarse.

------------------------------------------------------------------------

# 4. Navegación

Implementar:

-   Sidebar colapsable.
-   Header persistente.
-   Breadcrumbs.
-   Menú por permisos.
-   Búsqueda global.
-   Atajos de teclado cuando aporten valor.

------------------------------------------------------------------------

# 5. Layout

El panel deberá incluir:

-   Sidebar.
-   Header.
-   Área principal.
-   Panel de notificaciones.
-   Footer opcional.

Toda la interfaz deberá respetar el documento 02-UI-GUIDELINES.

------------------------------------------------------------------------

# 6. Control de Acceso

Cada opción del menú deberá validarse mediante RBAC.

Un usuario nunca visualizará acciones para las que no tenga permisos.

------------------------------------------------------------------------

# 7. Componentes Base

Crear componentes reutilizables para:

-   DataTable.
-   KPI Card.
-   Statistic Card.
-   Empty State.
-   Filters Bar.
-   Action Bar.
-   Confirm Dialog.
-   Drawer.
-   Activity Timeline.
-   Search Command Palette.

------------------------------------------------------------------------

# 8. Experiencia de Usuario

Aplicar:

-   Skeleton Loading.
-   Estados vacíos.
-   Mensajes de éxito y error.
-   Acciones masivas.
-   Confirmaciones para acciones destructivas.

------------------------------------------------------------------------

# 9. Auditoría

Mostrar historial de:

-   accesos;
-   cambios importantes;
-   acciones administrativas;
-   errores relevantes.

Los registros deberán ser consultables mediante filtros.

------------------------------------------------------------------------

# 10. Perfil

Permitir:

-   editar datos básicos;
-   cambiar contraseña;
-   gestionar sesiones;
-   configurar preferencias del panel.

------------------------------------------------------------------------

# 11. Backend

Exponer APIs para:

-   dashboard;
-   métricas;
-   actividad reciente;
-   perfil;
-   preferencias;
-   auditoría.

------------------------------------------------------------------------

# 12. Frontend

Implementar:

-   Layout administrativo.
-   Sistema de navegación.
-   Widgets.
-   Tablas reutilizables.
-   Gestión de estados.
-   Manejo consistente de errores.

------------------------------------------------------------------------

# 13. Rendimiento

Optimizar mediante:

-   carga diferida;
-   paginación;
-   virtualización para tablas extensas;
-   caché donde sea apropiado.

------------------------------------------------------------------------

# 14. Entregables

Claude Code deberá generar:

-   estructura del panel;
-   layout completo;
-   componentes reutilizables;
-   navegación;
-   widgets;
-   integración con Identity;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 15. Criterios de Aceptación

El módulo se considera completo cuando:

-   el panel carga correctamente;
-   la navegación funciona;
-   los permisos restringen la interfaz;
-   los widgets muestran información;
-   las acciones administrativas son accesibles desde una experiencia
    consistente.

------------------------------------------------------------------------

# 16. Definition of Done

El panel administrativo estará terminado cuando sirva como base para
integrar todos los módulos posteriores (Catálogo, Inventario, Pedidos,
CMS, Marketing y Configuración) sin requerir rediseños estructurales.
