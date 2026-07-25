# 03-CODING-STANDARDS.md

# Bart Commerce Enterprise --- Coding Standards

Version: 1.0

> Este documento define las normas obligatorias de desarrollo para toda
> la plataforma. Su objetivo es garantizar consistencia, calidad,
> mantenibilidad y seguridad durante todo el ciclo de vida del proyecto.

------------------------------------------------------------------------

# 1. Objetivo

Todo el código deberá ser:

-   Legible.
-   Consistente.
-   Tipado.
-   Reutilizable.
-   Seguro.
-   Fácil de mantener.
-   Fácil de probar.

El código debe poder ser entendido por cualquier desarrollador sin
depender del autor original.

------------------------------------------------------------------------

# 2. Principios Fundamentales

Aplicar siempre:

-   KISS (Keep It Simple)
-   DRY (Don't Repeat Yourself)
-   SOLID
-   Clean Code
-   Clean Architecture
-   Domain Driven Design
-   Composition over Inheritance
-   Separation of Concerns

Evitar soluciones ingeniosas que reduzcan la claridad.

------------------------------------------------------------------------

# 3. TypeScript

Configuración obligatoria:

-   strict = true
-   noImplicitAny
-   strictNullChecks
-   exactOptionalPropertyTypes
-   noUncheckedIndexedAccess

Reglas:

-   Evitar `any`.
-   Preferir tipos explícitos en APIs públicas.
-   Usar interfaces para contratos estables.
-   Usar type para composición y utilidades.
-   Modelar correctamente los dominios mediante tipos.

------------------------------------------------------------------------

# 4. Organización del Código

Separar claramente:

-   presentation/
-   application/
-   domain/
-   infrastructure/

Evitar carpetas ambiguas como:

-   misc
-   temp
-   new
-   old
-   helpers (cuando mezclen responsabilidades)

Cada carpeta debe representar una responsabilidad clara.

------------------------------------------------------------------------

# 5. Convenciones de Nombres

Clases: - PascalCase

Interfaces: - PascalCase

Tipos: - PascalCase

Funciones: - camelCase

Variables: - camelCase

Constantes: - UPPER_SNAKE_CASE solo cuando representen constantes
globales.

Archivos:

-   kebab-case

Nombres descriptivos antes que abreviaturas.

------------------------------------------------------------------------

# 6. Funciones

Toda función deberá:

-   Tener una única responsabilidad.
-   Ser pequeña.
-   Evitar efectos secundarios.
-   Ser fácilmente comprobable.

Cuando una función comienza a realizar múltiples tareas, dividirla.

------------------------------------------------------------------------

# 7. Componentes Frontend

Todo componente deberá ser:

-   Reutilizable.
-   Tipado.
-   Accesible.
-   Independiente.
-   Fácil de probar.

No mezclar lógica de negocio con presentación.

------------------------------------------------------------------------

# 8. Backend

Los controladores únicamente coordinan.

Los casos de uso contienen la lógica.

Los repositorios acceden a la persistencia.

La infraestructura implementa contratos.

Nunca colocar lógica de negocio en controladores.

------------------------------------------------------------------------

# 9. Base de Datos

Obligatorio:

-   Migraciones versionadas.
-   Índices justificados.
-   Relaciones explícitas.
-   Integridad referencial.
-   Evitar consultas N+1.
-   Evitar duplicación de datos.

------------------------------------------------------------------------

# 10. Manejo de Errores

Los errores deberán:

-   Ser tipados.
-   Tener mensajes claros.
-   Mantener contexto.
-   No revelar información sensible.

Nunca ocultar errores silenciosamente.

------------------------------------------------------------------------

# 11. Logging

Utilizar logging estructurado.

Registrar:

-   timestamp
-   nivel
-   módulo
-   request id
-   usuario (cuando aplique)
-   mensaje

Nunca registrar:

-   contraseñas
-   tokens
-   secretos
-   datos sensibles

------------------------------------------------------------------------

# 12. Seguridad

Validar toda entrada.

Aplicar:

-   Sanitización.
-   Validación.
-   Escape cuando corresponda.
-   Principio de mínimo privilegio.

Nunca confiar en datos provenientes del cliente.

------------------------------------------------------------------------

# 13. Dependencias

Antes de instalar una librería evaluar:

-   mantenimiento
-   comunidad
-   licenciamiento
-   tamaño
-   seguridad
-   compatibilidad

Eliminar dependencias sin uso.

------------------------------------------------------------------------

# 14. Testing

Cada módulo deberá incluir:

-   pruebas unitarias para lógica de negocio;
-   pruebas de integración cuando interactúe con infraestructura;
-   cobertura de casos límite relevantes.

Las pruebas deben ser rápidas, deterministas y aisladas.

------------------------------------------------------------------------

# 15. Rendimiento

Evitar:

-   renderizados innecesarios;
-   consultas redundantes;
-   algoritmos ineficientes;
-   dependencias pesadas sin justificación.

Optimizar utilizando métricas y no suposiciones.

------------------------------------------------------------------------

# 16. Documentación

Documentar:

-   decisiones arquitectónicas;
-   contratos públicos;
-   configuraciones importantes;
-   comportamiento no evidente.

Los comentarios deberán explicar el motivo, no repetir el código.

------------------------------------------------------------------------

# 17. Git y Calidad

Antes de cada commit verificar:

-   compilación correcta;
-   lint sin errores;
-   formato aplicado;
-   pruebas relevantes superadas.

No realizar commits con código roto.

------------------------------------------------------------------------

# 18. Revisión de Código

Todo cambio deberá responder afirmativamente:

-   ¿Es más claro?
-   ¿Es más seguro?
-   ¿Es más mantenible?
-   ¿Respeta la arquitectura?
-   ¿Evita duplicación?
-   ¿Tiene pruebas cuando corresponde?

Si alguna respuesta es negativa, revisar antes de integrar.

------------------------------------------------------------------------

# 19. Definition of Done

Un módulo estará terminado cuando:

-   Compila correctamente.
-   Respeta este documento.
-   Sigue la Constitución.
-   Mantiene la arquitectura.
-   No introduce deuda técnica deliberada.
-   Incluye la documentación mínima necesaria.
-   Está listo para producción.

------------------------------------------------------------------------

# 20. Aplicación

Todas las especificaciones de ingeniería posteriores asumirán estas
normas como obligatorias y no deberán redefinirlas, salvo que exista una
excepción técnica explícitamente documentada.
