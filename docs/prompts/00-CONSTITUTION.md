# 00-CONSTITUTION.md

# Bart Commerce Enterprise --- Engineering Constitution

Version: 1.0

> Este documento es la máxima autoridad técnica del proyecto Bart
> Commerce Enterprise. Toda decisión de arquitectura, desarrollo,
> diseño, infraestructura y despliegue deberá respetar estas reglas. Si
> una especificación futura entra en conflicto con esta Constitución,
> prevalece este documento.

------------------------------------------------------------------------

# 1. Propósito

Construir una plataforma eCommerce propietaria inspirada en la
experiencia de BartJerseys, con un CMS propio, código mantenible, alto
rendimiento y preparada para crecer sin reescrituras estructurales.

No es un SaaS multi-tenant ni un competidor de Shopify. Es una
aplicación única, diseñada para operar una tienda profesional con
calidad Enterprise.

------------------------------------------------------------------------

# 2. Objetivos del Proyecto

-   Código completamente propio.
-   Excelente experiencia de compra.
-   Panel administrativo potente.
-   Alto rendimiento.
-   SEO técnico sólido.
-   Seguridad por diseño.
-   Arquitectura mantenible.
-   Escalabilidad razonable sin sobreingeniería.

Todo el proyecto deberá favorecer claridad antes que complejidad.

------------------------------------------------------------------------

# 3. Valores Fundamentales

1.  La experiencia del usuario tiene prioridad.
2.  La arquitectura nunca se sacrifica por velocidad de desarrollo.
3.  El código debe poder mantenerse durante años.
4.  La simplicidad elegante supera a la complejidad innecesaria.
5.  Las decisiones deben justificarse técnicamente.

------------------------------------------------------------------------

# 4. Principios de Ingeniería

Todo cambio deberá cumplir:

-   Responsabilidad única.
-   Bajo acoplamiento.
-   Alta cohesión.
-   Reutilización.
-   Legibilidad.
-   Determinismo.
-   Observabilidad.
-   Seguridad.
-   Escalabilidad razonable.
-   Compatibilidad futura.

Evitar soluciones temporales y deuda técnica deliberada.

------------------------------------------------------------------------

# 5. Arquitectura

La arquitectura oficial es:

-   Domain Driven Design
-   Clean Architecture
-   Hexagonal Architecture
-   SOLID
-   Dependency Injection
-   Repository Pattern
-   Composition over Inheritance
-   Modular Monolith preparado para evolucionar cuando realmente sea
    necesario.

Las reglas de dependencia nunca podrán romperse.

------------------------------------------------------------------------

# 6. Organización

Separar responsabilidades entre:

-   Presentation
-   Application
-   Domain
-   Infrastructure

Cada módulo será dueño de sus reglas de negocio.

No compartir lógica de dominio mediante utilidades genéricas.

------------------------------------------------------------------------

# 7. Calidad del Código

Obligatorio:

-   TypeScript strict.
-   Sin any salvo justificación excepcional.
-   Funciones pequeñas.
-   Componentes reutilizables.
-   Nombres claros.
-   Sin duplicación.
-   Sin código muerto.
-   Sin valores mágicos.
-   Sin comentarios redundantes.

El código debe explicar el "cómo"; la documentación, el "por qué".

------------------------------------------------------------------------

# 8. Diseño de Interfaz

La interfaz debe transmitir:

-   rapidez
-   confianza
-   simplicidad
-   consistencia

Principios:

-   Mobile First
-   Accesibilidad
-   Diseño basado en componentes
-   Sistema de Design Tokens
-   Estados completos
-   Skeletons
-   Feedback inmediato

Nunca sacrificar usabilidad por estética.

------------------------------------------------------------------------

# 9. Rendimiento

Objetivos:

-   Tiempo de respuesta bajo.
-   Carga progresiva.
-   Optimización de imágenes.
-   Lazy Loading.
-   Code Splitting.
-   Caché donde aporte valor.

Toda optimización deberá medirse.

------------------------------------------------------------------------

# 10. Seguridad

Aplicar seguridad desde el diseño.

Como mínimo:

-   Validación de entrada.
-   Sanitización.
-   Protección contra XSS.
-   Protección contra CSRF cuando aplique.
-   Protección contra SQL Injection.
-   Gestión segura de secretos.
-   Rate Limiting.
-   Principio de mínimo privilegio.

Nunca almacenar credenciales en el repositorio.

------------------------------------------------------------------------

# 11. Base de Datos

-   PostgreSQL como fuente de verdad.
-   Migraciones versionadas.
-   Índices conscientes.
-   Integridad referencial.
-   Evitar consultas N+1.
-   Evitar duplicación innecesaria.

------------------------------------------------------------------------

# 12. APIs

Las APIs deberán ser:

-   Consistentes.
-   Versionables.
-   Documentadas.
-   Tipadas.
-   Predecibles.

Los errores deberán tener formato uniforme.

------------------------------------------------------------------------

# 13. Observabilidad

Todo el sistema deberá permitir:

-   Logging estructurado.
-   Correlación mediante Request ID.
-   Manejo global de errores.
-   Health checks.
-   Métricas preparadas para crecimiento.

------------------------------------------------------------------------

# 14. Testing

Cada módulo deberá incorporar:

-   Pruebas unitarias cuando exista lógica de negocio.
-   Pruebas de integración cuando interactúe con infraestructura.
-   Casos límite relevantes.

Las pruebas deben ser reproducibles y rápidas.

------------------------------------------------------------------------

# 15. SEO

Implementar por defecto:

-   Metadata.
-   Canonical.
-   Open Graph.
-   Robots.
-   Sitemap.
-   JSON-LD cuando corresponda.
-   URLs limpias.
-   Breadcrumbs.

------------------------------------------------------------------------

# 16. Dependencias

Agregar una dependencia solo si aporta un beneficio claro.

Antes de instalar una nueva librería evaluar:

-   mantenimiento
-   comunidad
-   seguridad
-   tamaño
-   compatibilidad
-   necesidad real

Preferir soluciones nativas cuando sean suficientes.

------------------------------------------------------------------------

# 17. Documentación

Todo módulo deberá incluir:

-   propósito
-   alcance
-   dependencias
-   instrucciones de uso
-   decisiones importantes

La documentación debe mantenerse junto al código.

------------------------------------------------------------------------

# 18. Git

Cada cambio deberá:

-   compilar
-   pasar validaciones
-   mantener formato
-   respetar convenciones

No realizar commits con código roto.

------------------------------------------------------------------------

# 19. Definition of Done

Un módulo solo estará terminado cuando:

-   cumple esta Constitución;
-   compila sin errores;
-   respeta la arquitectura;
-   mantiene rendimiento;
-   no introduce vulnerabilidades;
-   posee documentación mínima;
-   supera sus pruebas correspondientes;
-   está listo para producción.

------------------------------------------------------------------------

# 20. Reglas para Claude Code

En todos los documentos posteriores Claude Code deberá:

1.  Asumir que esta Constitución está vigente.
2.  No repetir estas reglas.
3.  Enfocarse únicamente en el alcance del documento correspondiente.
4.  Si detecta un conflicto con esta Constitución, explicarlo y proponer
    una solución compatible.
5.  Entregar implementaciones listas para producción, evitando código
    demostrativo o incompleto salvo que la especificación lo solicite
    expresamente.

------------------------------------------------------------------------

# 21. Principio Final

La meta del proyecto no es producir la mayor cantidad de código posible.

La meta es construir una plataforma que pueda evolucionar durante años
con confianza, calidad y consistencia.

Todo el proyecto deberá poder entenderse, mantenerse y ampliarse sin
depender de quienes lo desarrollaron originalmente.

Fin del documento.
