# Contexto de Implementación: Retratos de Personaje para Roster, Recomendación, Simulación y Admin

## 1. Propósito del documento

Este documento consolida el diseño técnico recomendado para incorporar un segundo asset visual de personaje dentro de OmniGacha.

El objetivo es preparar el sistema para:

- Mostrar personajes con una imagen más atractiva en el front.
- Mantener `splash art` como asset editorial grande.
- Incorporar un nuevo asset tipo retrato enfocado al rostro del personaje.
- Reutilizar ese retrato en:
  - roster
  - recomendación
  - simulación
  - catálogo visual futuro
- Permitir administrar ese segundo asset desde el panel admin.

Este documento debe servir como base de implementación antes de tocar Prisma, backend, frontend y pruebas.

## 2. Objetivo funcional

Se busca que la experiencia de selección y visualización de personajes deje de depender solo de texto y pase a una UI visual basada en cards o filas con retrato.

El sistema debe soportar dos tipos de imagen para `Character`:

- `splash art`
  - uso editorial
  - visual grande
  - posible uso hero/futuro front visual

- `portrait`
  - recorte enfocado a la cara o busto del personaje
  - uso en listas, selectores, cards y módulos densos del producto

## 3. Alcance de la implementación

Incluye:

- Extensión del modelo `Character` para soportar `portrait`.
- Extensión de `MediaKind` para distinguir este asset.
- Endpoints admin para subir, reemplazar y eliminar retrato.
- Exposición de `portraitUrl` y `portraitAssetId` en backend y frontend.
- Ajuste del panel admin para mostrar dos slots de imagen en personajes:
  - splash art
  - retrato de catálogo
- Preparación visual del front para mostrar placeholders aunque todavía no existan imágenes reales.
- Refactor de UX en:
  - espacio de roster
  - objetivo de recomendación
  - personaje a simular
  - roster detectado
  - roster guardado

Queda fuera de esta fase:

- Generación automática de crops.
- Recorte inteligente por IA.
- Carga masiva de retratos.
- Segundo retrato para `LightCone` o `RelicSet`.
- Uso del retrato en home o en landing pública.

## 4. Estado actual relevante del proyecto

### Backend

Hallazgos actuales:

- `Character` ya soporta `splashArtAssetId`.
- Existe `MediaAsset`.
- Existe infraestructura admin para upload de splash art.
- `MediaKind` actualmente solo contempla `SPLASH_ART`.
- Los presenters de personajes ya devuelven `splashArtUrl`.

### Frontend

Hallazgos actuales:

- El roster usa formularios y listas principalmente textuales.
- La selección de personaje depende de `Combobox`.
- Recomendación y simulación usan selectores textuales.
- El admin de personajes ya permite subir splash art.
- No existe componente visual reutilizable para cards de personaje con imagen.

## 5. Decisión arquitectónica principal

La recomendación adoptada es:

```txt
Mantener splash art y portrait como dos relaciones distintas sobre Character
```

Esto implica:

- No reutilizar `splashArt` como retrato.
- No simular el retrato con crop CSS sobre el splash actual.
- No guardar imagen de retrato en `UserCharacter`.
- No introducir todavía una tabla polimórfica compleja de variantes visuales.

Ventajas:

- Más claridad semántica.
- Menos lógica condicional en frontend.
- Mejor control editorial.
- Menor riesgo de diseño inconsistente.

## 6. Modelo de datos recomendado

### 6.1. Enum `MediaKind`

Actualmente:

- `SPLASH_ART`

Se recomienda agregar:

- `CHARACTER_PORTRAIT`

### 6.2. Modelo `Character`

Agregar:

- `portraitAssetId Int? @unique`
- `portraitAsset MediaAsset?`

Mantener:

- `splashArtAssetId`
- `splashArtAsset`

### 6.3. Modelo `MediaAsset`

Agregar la relación inversa:

- `characterPortrait Character? @relation("CharacterPortrait")`

### 6.4. Contrato final del personaje

El objeto expuesto al frontend debe quedar conceptualmente así:

- `splashArtAssetId`
- `splashArtUrl`
- `portraitAssetId`
- `portraitUrl`

## 7. Estrategia de migración de base de datos

Crear una nueva migración Prisma dedicada, por ejemplo:

```txt
add_character_portrait_asset
```

Debe incluir:

- ampliar enum `MediaKind`
- agregar columna `portraitAssetId` a `Character`
- índice único para `portraitAssetId`
- foreign key hacia `MediaAsset(id)` con `ON DELETE SET NULL`

No se requiere backfill inicial.

Todos los personajes existentes pueden quedar con:

- `portraitAssetId = null`

## 8. Cambios backend recomendados

### 8.1. Prisma schema

Archivo principal:

- `apps/api/prisma/schema.prisma`

Cambios:

- extender `MediaKind`
- extender `Character`
- extender `MediaAsset`

### 8.2. DTOs

Archivos:

- `apps/api/src/characters/dto/create-character.dto.ts`
- `apps/api/src/characters/dto/update-character.dto.ts`

Agregar soporte opcional para:

- `portraitAssetId?: number | null`

### 8.3. CharactersService

Archivo:

- `apps/api/src/characters/characters.service.ts`

Cambios:

- incluir `portraitAssetId` en defaults de escritura
- incluir `portraitAssetId` en selects internos
- soportar create/update con ese campo

### 8.4. Presenter de personajes

Archivo:

- `apps/api/src/characters/character-presenter.ts`

Cambios:

- incluir `portraitAsset` en el `include`
- mapear:
  - `portraitAssetId`
  - `portraitUrl`

### 8.5. Servicio de media

Archivo:

- `apps/api/src/media/media.service.ts`

Recomendación:

- extraer una función genérica tipo `saveImageAsset`
- parametrizar:
  - `kind`
  - `namespace`
  - `slug`

No dejar toda la lógica atada solo a splash art.

### 8.6. Endpoints admin para personajes

Archivo:

- `apps/api/src/admin/admin-characters.controller.ts`

Agregar endpoints:

- `POST /admin/characters/:id/portrait`
- `DELETE /admin/characters/:id/portrait`

Comportamiento esperado:

- subir retrato nuevo
- asociarlo en `portraitAssetId`
- borrar asset anterior si existía
- permitir eliminar el retrato y dejar la relación en `null`

## 9. Cambios frontend recomendados

### 9.1. Tipos API del frontend

Archivo:

- `apps/web/src/lib/api.ts`

Agregar en `Character`:

- `portraitAssetId?: number | null`
- `portraitUrl?: string | null`

### 9.2. Admin de personajes

Archivo actual:

- `apps/web/src/app/admin/_components/admin-dashboard-client.tsx`

Agregar un segundo bloque de media:

- `Splash art`
- `Retrato de catálogo`

El bloque de retrato debe:

- mostrar preview vertical
- mostrar placeholder si no existe
- permitir upload
- permitir remove
- dejar claro que esta imagen se usa en:
  - roster
  - recomendación
  - simulación
  - catálogo visual

### 9.3. Componentes visuales reutilizables nuevos

Se recomienda crear:

- `CharacterPortrait`
  - imagen o placeholder
  - ratio `3:4`
  - tamaños `sm | md | lg`

- `CharacterSummaryCard`
  - retrato
  - nombre
  - elemento
  - path
  - role

- `CharacterVisualPicker`
  - búsqueda
  - grid o lista visual de personajes
  - selección por card

- `CharacterOptionRow`
  - thumbnail pequeño + texto
  - útil para selectores compactos

### 9.4. Espacio de roster

Archivos relevantes:

- `apps/web/src/app/page.tsx`
- `apps/web/src/components/characters/user-character-form.tsx`

Recomendación:

- reemplazar la selección textual principal del personaje por `CharacterVisualPicker`
- mantener búsqueda
- mostrar card visual del personaje seleccionado
- en `Roster guardado`, usar `CharacterSummaryCard`

### 9.5. Recomendación

Archivo:

- `apps/web/src/app/simulator/page.tsx`

Recomendación:

- reemplazar el selector principal del objetivo por `CharacterVisualPicker`
- mostrar mini ficha del objetivo seleccionado con retrato
- usar retrato en `Roster detectado`

### 9.6. Simulación

Archivo:

- `apps/web/src/app/simulator/page.tsx`

Recomendación:

- personaje principal a simular con selector visual
- compañeros secundarios pueden seguir usando `Combobox`
- como mejora incremental, el `Combobox` puede evolucionar a filas con mini retrato

## 10. Estrategia UX recomendada

### Selección principal de personaje

No se recomienda quedarse solo con dropdown textual.

La opción preferida es:

```txt
buscador + grid visual de cards
```

Razones:

- más atractivo
- más cercano a la referencia visual esperada
- mejor reconocimiento por imagen
- más consistente con el tipo de producto

### Selectores secundarios

Para casos más densos o de soporte:

- mantener `Combobox`
- agregar thumbnail pequeño en cada opción como mejora futura

## 11. Placeholders obligatorios

Como las imágenes se cargarán manualmente después, el sistema debe verse bien sin assets reales.

Todo bloque de retrato debe reservar espacio con:

- ratio fijo `3:4`
- fondo degradado
- iniciales del personaje
- badge de elemento o rareza si aplica
- nombre visible

Nunca debe mostrarse:

- imagen rota
- layout colapsado
- espacio impredecible

## 12. Reglas de uso de assets

### `splashArtUrl`

Usos recomendados:

- admin editorial
- hero
- pantallas grandes
- materiales futuros de detalle

### `portraitUrl`

Usos recomendados:

- roster
- recomendación
- simulación
- catálogo visual
- tarjetas pequeñas o medianas

## 13. Estrategia de implementación recomendada

### Fase 1

- Prisma schema
- migración
- presenters
- DTOs
- service backend

### Fase 2

- endpoints admin portrait upload/delete
- preview admin de segunda imagen

### Fase 3

- componente `CharacterPortrait`
- componente `CharacterSummaryCard`
- componente `CharacterVisualPicker`

### Fase 4

- integración en roster
- integración en recomendación
- integración en simulación

### Fase 5

- refinamiento visual
- placeholders
- hardening de pruebas

## 14. Orden de implementación recomendado

1. Migración Prisma.
2. Ajuste de tipos backend.
3. Presenter de `Character`.
4. Endpoints admin de retrato.
5. Slot adicional en admin.
6. Componentes visuales compartidos en web.
7. Integración en roster.
8. Integración en recomendación.
9. Integración en simulación.
10. Ajustes visuales finales y pruebas.

## 15. Criterios de aceptación

La implementación se considera correcta cuando:

- `Character` soporta `portraitAssetId`.
- El backend expone `portraitUrl`.
- El admin permite subir y eliminar retrato.
- El admin muestra dos espacios distintos:
  - splash art
  - retrato
- Roster muestra retrato o placeholder.
- Recomendación muestra retrato o placeholder.
- Simulación muestra retrato o placeholder.
- La UI sigue funcionando aunque no exista ninguna imagen todavía.

## 16. Riesgos a evitar

- No reutilizar `splashArtUrl` como fallback principal del retrato.
- No intentar resolver el retrato con crop CSS del splash.
- No duplicar componentes visuales para cada módulo.
- No guardar la imagen en `UserCharacter`.
- No introducir de momento una abstracción de media demasiado genérica.

## 17. Resultado esperado

Al terminar esta implementación, OmniGacha quedará listo para una experiencia visual mucho más fuerte sin depender de que las imágenes ya existan hoy.

El sistema quedará preparado para que luego solo tengas que subir manualmente los retratos desde admin y el front los consuma automáticamente en:

- roster
- recomendación
- simulación
- catálogo visual futuro
