# 02-UI-GUIDELINES.md

# Bart Commerce Enterprise --- UI & UX Guidelines

Version: 1.0

> Este documento establece las normas de diseño visual, experiencia de
> usuario y comportamiento de la interfaz para toda la plataforma. Todos
> los módulos deberán cumplir estas directrices.

------------------------------------------------------------------------

# 1. Objetivo

Crear una experiencia moderna, rápida, intuitiva y consistente que
inspire confianza desde el primer contacto y reduzca la fricción durante
todo el recorrido del usuario.

------------------------------------------------------------------------

# 2. Principios de Diseño

-   Simplicidad antes que decoración.
-   Claridad antes que densidad.
-   Consistencia antes que creatividad.
-   Rapidez percibida antes que animaciones llamativas.
-   Accesibilidad desde el diseño.

Cada elemento de la interfaz debe tener un propósito.

------------------------------------------------------------------------

# 3. Personalidad Visual

La interfaz debe transmitir:

-   Profesionalismo
-   Confianza
-   Rapidez
-   Orden
-   Calidad

Evitar interfaces recargadas o con elementos puramente ornamentales.

------------------------------------------------------------------------

# 4. Sistema de Diseño

Toda la UI deberá construirse mediante un Design System.

Incluir como mínimo:

-   Design Tokens
-   Componentes reutilizables
-   Escala tipográfica
-   Sistema de espaciado
-   Escala de elevación
-   Radios consistentes
-   Paleta de colores
-   Sistema de iconografía

No utilizar valores mágicos.

------------------------------------------------------------------------

# 5. Grid y Layout

-   Mobile First.
-   Grid consistente.
-   Contenedores reutilizables.
-   Espaciado basado en múltiplos de 4 y 8 px.
-   Máximo ancho legible para contenido.

------------------------------------------------------------------------

# 6. Tipografía

-   Máximo tres niveles tipográficos principales.
-   Jerarquía clara.
-   Alto contraste.
-   Interlineado cómodo.
-   Longitud de línea adecuada para lectura.

------------------------------------------------------------------------

# 7. Colores

Definir colores mediante tokens.

Categorías mínimas:

-   Primary
-   Secondary
-   Success
-   Warning
-   Error
-   Info
-   Surface
-   Background
-   Border
-   Text

Nunca depender únicamente del color para comunicar estados.

------------------------------------------------------------------------

# 8. Componentes Base

Todo componente debe ser:

-   Reutilizable
-   Tipado
-   Accesible
-   Independiente
-   Documentado

Biblioteca mínima:

-   Button
-   Input
-   Textarea
-   Select
-   Checkbox
-   Radio
-   Switch
-   Badge
-   Card
-   Modal
-   Drawer
-   Tabs
-   Accordion
-   Table
-   Pagination
-   Toast
-   Tooltip
-   Skeleton
-   Spinner
-   Avatar
-   Breadcrumb

------------------------------------------------------------------------

# 9. Estados

Todos los componentes deberán contemplar:

-   Default
-   Hover
-   Focus
-   Active
-   Disabled
-   Loading
-   Empty
-   Success
-   Warning
-   Error

Nunca mostrar una interfaz sin un estado definido.

------------------------------------------------------------------------

# 10. Formularios

Los formularios deberán:

-   Validar en cliente y servidor.
-   Mostrar errores comprensibles.
-   Preservar datos cuando sea posible.
-   Agrupar campos relacionados.
-   Minimizar el esfuerzo del usuario.

------------------------------------------------------------------------

# 11. Navegación

La navegación debe ser:

-   Predecible
-   Consistente
-   Fácil de aprender
-   Fácil de recorrer con teclado

Siempre indicar claramente dónde se encuentra el usuario.

------------------------------------------------------------------------

# 12. Experiencia de Compra

## Listados

-   Filtros rápidos.
-   Ordenamiento.
-   Búsqueda.
-   Paginación o carga progresiva.
-   Skeletons.

## Producto

-   Galería optimizada.
-   Variantes claras.
-   Precio visible.
-   Disponibilidad inmediata.
-   CTA principal destacado.

## Carrito

-   Actualización sin recargar.
-   Resumen claro.
-   Costos transparentes.

## Checkout

-   Flujo corto.
-   Validación inmediata.
-   Indicador de progreso.
-   Confirmaciones claras.

------------------------------------------------------------------------

# 13. Rendimiento Percibido

Aplicar:

-   Skeleton Loading
-   Lazy Loading
-   Prefetch inteligente
-   Optimistic UI
-   Transiciones discretas

Evitar pantallas en blanco.

------------------------------------------------------------------------

# 14. Accesibilidad

Cumplir WCAG 2.2 AA como mínimo.

Incluir:

-   Navegación por teclado.
-   Focus visible.
-   Contraste suficiente.
-   Etiquetas accesibles.
-   Roles ARIA cuando sean necesarios.
-   Compatibilidad con lectores de pantalla.

------------------------------------------------------------------------

# 15. Responsive

Garantizar funcionamiento correcto en:

-   Teléfono
-   Tablet
-   Laptop
-   Escritorio
-   Pantallas grandes

No crear funcionalidades exclusivas de un único tamaño de pantalla.

------------------------------------------------------------------------

# 16. Microinteracciones

Las animaciones deben:

-   Confirmar acciones.
-   Guiar la atención.
-   No retrasar el flujo.
-   Respetar la preferencia de reducción de movimiento.

------------------------------------------------------------------------

# 17. Panel Administrativo

El panel deberá priorizar:

-   Velocidad.
-   Densidad de información controlada.
-   Búsqueda inmediata.
-   Atajos de teclado cuando aporten valor.
-   Tablas eficientes.
-   Acciones masivas.

------------------------------------------------------------------------

# 18. SEO Visual

Las páginas públicas deberán:

-   Mantener estructura semántica.
-   Encabezados jerárquicos.
-   Imágenes optimizadas.
-   Contenido estable durante la carga.
-   Evitar cambios bruscos de layout.

------------------------------------------------------------------------

# 19. Definition of Done

Una interfaz se considera terminada cuando:

-   Sigue el Design System.
-   Es consistente.
-   Es accesible.
-   Es responsive.
-   Mantiene buen rendimiento.
-   Puede reutilizarse.
-   No introduce inconsistencias visuales.

------------------------------------------------------------------------

# 20. Aplicación

Todas las especificaciones de ingeniería posteriores deberán asumir este
documento como obligatorio y no redefinir reglas de interfaz salvo que
exista una excepción expresamente documentada.
