# Contexto de Implementación: Módulo Administrador y Gestión de Catálogo

## 1. Propósito del documento

Este documento consolida el contexto técnico y funcional para implementar un módulo administrador dentro de OmniGacha.

Su objetivo es servir como base de trabajo para:

- Crear usuarios administradores y usuarios estándar.
- Gestionar catálogo de personajes.
- Gestionar catálogo de conos de luz.
- Gestionar catálogo de artefactos.
- Gestionar catálogo de ornamentos.
- Preparar almacenamiento de imágenes tipo splash art para uso futuro en frontend.

Este archivo debe considerarse la referencia inicial antes de comenzar cambios en backend, frontend, base de datos y pruebas.

## 2. Alcance de la implementación

La implementación propuesta cubre:

- Control de acceso por roles.
- Backoffice web dentro del mismo monorepo.
- CRUD administrativo para entidades de catálogo.
- Subida y asociación de splash art a entidades de catálogo.
- Endurecimiento de seguridad en autenticación y endpoints sensibles.

Queda fuera de esta fase:

- Optimización visual final del front público usando splash art.
- Integración con storage cloud definitivo.
- Equipamiento detallado de sets sobre personajes del usuario.
- Auditoría completa de cambios históricos por registro.

## 3. Estado actual relevante del proyecto

### Stack actual

- Frontend: Next.js + React + TypeScript.
- Backend: NestJS + TypeScript.
- Base de datos: PostgreSQL.
- ORM: Prisma.
- Autenticación: JWT + refresh tokens.

### Hallazgos importantes (actualizado 2026-10-11)

> Nota: esta sección reflejaba el estado del proyecto al redactar el documento original. Desde entonces el backend avanzó significativamente; se deja la versión original tachada como referencia histórica y se documenta el estado real verificado.

Estado real verificado en el repositorio:

- El modelo `User` en `apps/api/prisma/schema.prisma` **ya incluye** `role: UserRole`, `isActive: Boolean` y `mustChangePassword: Boolean`, con enum `UserRole` (`USER`, `ADMIN`).
- **Ya existe** la tabla `MediaAsset` con todos los campos sugeridos en la sección 7.2 (kind, storageDriver, storageKey, publicUrl, mimeType, sizeBytes, width, height, checksum, createdByUserId, createdAt, updatedAt), más enums `MediaKind` y `StorageDriver`.
- **Ya existe** `RelicSet` unificado con enum `RelicSetType` (`ARTIFACT`, `ORNAMENT`) — no se crearon entidades separadas de artefactos y ornamentos, siguiendo la recomendación de la sección 8.
- `Character` y `LightCone` **ya incluyen** `slug`, `status: CatalogStatus` y `splashArtAssetId`.
- **Ya existe** el módulo `admin/` (`apps/api/src/admin/`) con `AdminUsersController`, `AdminCharactersController`, `AdminLightConesController`, `AdminRelicSetsController` y `AdminDashboardController`, todos protegidos con `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`, exponiendo CRUD completo y endpoints `POST`/`DELETE :id/splash-art`.
- **Ya existe** `media/media.service.ts` cumpliendo el rol de `StorageService` (driver `LOCAL`, guarda en `apps/api/uploads/`).
- Los endpoints públicos de catálogo (`characters`, `light-cones`) **ya son solo lectura** (`GET`); no hay escritura pública expuesta.
- `POST /auth/change-password` **ya requiere** usuario autenticado vía `JwtAuthGuard` (no depende de un email público).
- El JWT **ya incluye** el campo `role` en su payload, y existe `RolesGuard` + decorador `@Roles()`.

Conclusión: la mayor parte del backend descrito en este documento (secciones 6, 7, 9 y 10) **ya está implementada**. El trabajo pendiente real se concentra en:

1. ~~**Frontend admin**: faltan `/admin/users`, `/admin/catalog/characters`, `/admin/catalog/light-cones`, `/admin/catalog/artifacts` y `/admin/catalog/ornaments`.~~ ✅ **Completado 2026-10-12.** Las 5 rutas existen, cada una con su propio `AdminAccessGate`, fetch independiente, formularios por bloques y upload de media vía `FormData`. Artefactos y ornamentos comparten un único componente parametrizado (`RelicSetsPanel`) en vez de duplicar código. El dashboard monolítico (`admin-dashboard-client.tsx`) se redujo a resumen + tarjetas de redirección a cada módulo. Verificado con `tsc`, `eslint`, `next build` y pruebas funcionales end-to-end contra la API real (CRUD + upload/remove de splash art y retrato + guardia de "último admin activo").
2. **Backend — pulido menor, aún pendiente**: `StorageService` no es todavía una interfaz explícita y desacoplada (hoy vive embebida en `MediaService` con driver LOCAL); extraerla facilitaría migrar a S3/R2 más adelante.
3. ~~**Testing e2e** automatizado del flujo admin (Fase 6).~~ ✅ **Completado 2026-10-12.** 48 tests en `apps/api/test/admin-*.e2e-spec.ts` (RBAC, CRUD + upload/archive de usuarios/personajes/conos/relic sets, filtro `?type=`, validaciones de la sección 13). Al escribirlos se detectó y corrigió un bug real de esquema: `RelicSet.name` estaba declarado `@unique` en `schema.prisma` pero la migración que creó la tabla (`20260629190000_admin_media_catalog`) nunca generó ese índice — permitía nombres duplicados de artefactos/ornamentos en producción. Corregido con la migración `20261012040000_add_relic_set_name_unique`. Con esto, las validaciones de la sección 13 quedan **confirmadas por test**, no solo supuestas: email/nombre/slug únicos (409), password mínimo 8 caracteres (400), upload no-imagen rechazado (400), límite de 10MB vía `multer`, y la guardia de "último admin activo" (400).
4. Mantener este documento actualizado a medida que avance el trabajo, para que no vuelva a quedar desalineado con el código real.

### Riesgos actuales a corregir antes o junto con el módulo admin

> Ya mitigados en backend (ver hallazgos arriba); se conservan como checklist de verificación continua, no como pendientes de cero.

- El cambio de contraseña no debe depender solo de un email público. — **Mitigado**: requiere JWT + password actual.
- Los endpoints de escritura del catálogo no deben permanecer públicos. — **Mitigado**: escritura solo vía `/admin/*` con `RolesGuard`.
- El CRUD de usuarios no debe estar accesible sin autenticación y autorización. — **Mitigado**: `AdminUsersController` protegido con `JwtAuthGuard` + `RolesGuard` + `@Roles(ADMIN)`.

## 4. Objetivo funcional del módulo admin

El módulo administrador permitirá que un usuario con rol `ADMIN` pueda:

- Crear usuarios.
- Editar usuarios.
- Activar o desactivar usuarios.
- Cambiar rol de usuarios.
- Crear personajes.
- Editar personajes.
- Crear conos de luz.
- Editar conos de luz.
- Crear sets de artefactos.
- Editar sets de artefactos.
- Crear sets de ornamentos.
- Editar sets de ornamentos.
- Subir, reemplazar o quitar splash art de cada entidad de catálogo.

## 5. Decisión arquitectónica principal

La recomendación adoptada para esta implementación es:

```txt
Backoffice nativo dentro del monorepo + RBAC simple + storage desacoplado de la base de datos
```

Esto implica:

- No usar un CMS externo.
- Mantener el frontend admin dentro de `apps/web`.
- Mantener el backend admin dentro de `apps/api`.
- Guardar en base de datos solo metadatos de imágenes.
- Guardar archivos en storage local inicialmente, con diseño preparado para migrar a cloud storage.

## 6. Diseño de seguridad recomendado

### Roles

Se propone introducir:

- `USER`
- `ADMIN`

### Extensiones del usuario

La tabla `User` debería incorporar:

- `role`
- `isActive`
- `mustChangePassword`

### Reglas de acceso

- Usuarios `USER`:
  - Acceden a funcionalidades actuales del producto.
  - No pueden gestionar usuarios ni catálogo.
- Usuarios `ADMIN`:
  - Acceden al panel `/admin`.
  - Pueden gestionar usuarios y catálogo.

### Reglas sobre autenticación

- `POST /auth/register` puede mantenerse si el negocio quiere registro abierto, pero siempre crea `USER`.
- `POST /auth/change-password` debe requerir usuario autenticado y password actual.
- El JWT debe incluir el `role`.
- Se debe agregar `RolesGuard` además del guard JWT.

## 7. Modelo de datos recomendado

### 7.1. Usuario

Campos nuevos sugeridos:

- `role: UserRole`
- `isActive: Boolean`
- `mustChangePassword: Boolean`

### 7.2. MediaAsset

Se recomienda introducir una tabla `MediaAsset` para desacoplar media del resto del dominio.

Campos sugeridos:

- `id`
- `kind`
- `storageDriver`
- `storageKey`
- `publicUrl`
- `mimeType`
- `sizeBytes`
- `width`
- `height`
- `checksum`
- `createdByUserId`
- `createdAt`
- `updatedAt`

### 7.3. Character

Campos nuevos sugeridos:

- `slug`
- `status`
- `splashArtAssetId`

### 7.4. LightCone

Campos nuevos sugeridos:

- `slug`
- `status`
- `splashArtAssetId`

### 7.5. RelicSet

Se recomienda modelar artefactos y ornamentos en una sola entidad:

```txt
RelicSet
```

Con un enum:

- `ARTIFACT`
- `ORNAMENT`

Campos sugeridos:

- `id`
- `name`
- `slug`
- `type`
- `rarity`
- `twoPieceBonus`
- `fourPieceBonus`
- `gameVersion`
- `status`
- `splashArtAssetId`
- `createdAt`
- `updatedAt`

### 7.6. Estado editorial del catálogo

Se recomienda un enum `CatalogStatus`:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

Ventajas:

- Evita borrado destructivo innecesario.
- Permite preparar contenido antes de publicarlo.
- Facilita mantener integridad si una entidad ya está referenciada.

## 8. Decisiones de modelado importantes

### Artefactos y ornamentos

Aunque visualmente se presentarán como módulos separados, a nivel de base de datos y backend se recomienda una sola entidad `RelicSet`.

Razones:

- Menos duplicación de código.
- Menos duplicación de DTOs, servicios y pantallas.
- Más fácil mantener consistencia en validaciones y media.

### Splash art

No se recomienda guardar binarios dentro de PostgreSQL.

Se recomienda:

- Archivo en disco local en desarrollo.
- Metadatos en `MediaAsset`.
- Relación nullable desde la entidad del catálogo hacia el asset.

### Slug

No usar el nombre visible como identificador operativo.

Se recomienda `slug` para:

- URLs futuras.
- nombres de archivos.
- referencias estables.

## 9. Estructura de módulos backend sugerida

### Nuevos módulos o cambios

- `auth`
  - ampliar payload JWT
  - proteger cambio de contraseña
- `users`
  - separar endpoints admin de endpoints propios del usuario
- `admin`
  - módulo raíz de backoffice
- `media`
  - upload y gestión de archivos
- `relic-sets`
  - nuevo dominio para artefactos y ornamentos

### Organización sugerida

```txt
apps/api/src/
  admin/
  auth/
  media/
  relic-sets/
  users/
  characters/
  light-cones/
```

## 10. Endpoints sugeridos

### Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/change-password`

### Admin users

- `GET /admin/users`
- `POST /admin/users`
- `GET /admin/users/:id`
- `PATCH /admin/users/:id`
- `PATCH /admin/users/:id/status`
- `PATCH /admin/users/:id/role`

### Admin characters

- `GET /admin/characters`
- `POST /admin/characters`
- `GET /admin/characters/:id`
- `PATCH /admin/characters/:id`
- `POST /admin/characters/:id/splash-art`
- `DELETE /admin/characters/:id/splash-art`

### Admin light cones

- `GET /admin/light-cones`
- `POST /admin/light-cones`
- `GET /admin/light-cones/:id`
- `PATCH /admin/light-cones/:id`
- `POST /admin/light-cones/:id/splash-art`
- `DELETE /admin/light-cones/:id/splash-art`

### Admin relic sets

- `GET /admin/relic-sets`
- `GET /admin/relic-sets?type=ARTIFACT`
- `GET /admin/relic-sets?type=ORNAMENT`
- `POST /admin/relic-sets`
- `GET /admin/relic-sets/:id`
- `PATCH /admin/relic-sets/:id`
- `POST /admin/relic-sets/:id/splash-art`
- `DELETE /admin/relic-sets/:id/splash-art`

### Catálogo público o de consumo interno actual

Los endpoints de lectura pueden mantenerse fuera de `/admin` para consumo del producto actual, pero los endpoints de escritura deben quedar protegidos.

## 11. Diseño frontend sugerido

### Rutas

Se recomienda crear un espacio independiente:

```txt
/admin
```

Rutas sugeridas:

- `/admin`
- `/admin/users`
- `/admin/catalog/characters`
- `/admin/catalog/light-cones`
- `/admin/catalog/artifacts`
- `/admin/catalog/ornaments`

### Pantallas principales

#### Dashboard admin

- resumen rápido
- cantidad de usuarios
- cantidad de entidades en draft
- últimos cambios

#### Gestión de usuarios

- listado paginado
- filtro por rol
- filtro por estado
- crear usuario
- editar usuario
- activar/desactivar
- cambiar rol

#### Gestión de personajes

- listado
- crear
- editar
- preview de splash art
- estado editorial

#### Gestión de conos

- listado
- crear
- editar
- preview de splash art
- estado editorial

#### Gestión de artefactos y ornamentos

- misma base visual
- diferencia por filtro de `type`

### Formularios admin

Cada formulario debería dividirse en bloques:

- datos base
- propiedades de juego
- media
- publicación

## 12. Upload de imágenes

### Recomendación de implementación

- Backend con `multipart/form-data`.
- Validaciones por tipo MIME y tamaño máximo.
- Nombre físico desacoplado del nombre visible.
- Posibilidad de reemplazar splash art.

### Storage inicial recomendado

Para la primera implementación:

- Driver `LOCAL`
- Carpeta sugerida: `apps/api/uploads/`

Estructura sugerida:

```txt
apps/api/uploads/
  splash-art/
    characters/
    light-cones/
    relic-sets/
```

### Recomendación de abstracción

Crear un `StorageService` con interfaz desacoplada:

- `saveFile`
- `deleteFile`
- `buildPublicUrl`

Esto facilita migrar luego a S3, R2 o Supabase Storage sin romper controladores.

## 13. Validaciones funcionales mínimas

### Usuario

- email único
- password segura
- no permitir desactivar al único admin activo

### Personaje

- nombre único
- slug único
- stats base válidos

### Light cone

- nombre único
- slug único
- rarity válida

### Relic set

- nombre único
- slug único
- `type` obligatorio
- `fourPieceBonus` puede ser null para ornamentos si el diseño del juego así lo requiere

### Splash art

- solo imágenes válidas
- límite de peso
- asociación a entidad existente

## 14. Estrategia de migración sugerida

### Fase 1

- agregar roles y endurecer auth

### Fase 2

- crear `MediaAsset`
- crear `RelicSet`
- extender `Character` y `LightCone`

### Fase 3

- crear endpoints admin protegidos

### Fase 4

- crear panel admin web

### Fase 5

- agregar upload y preview de splash art

### Fase 6

- pruebas e2e y documentación final

## 15. Orden de implementación recomendado

> Estado actualizado 2026-10-12: los 10 pasos están completos. Solo queda el pulido menor de la sección 3 (`StorageService` como interfaz desacoplada), que es una mejora opcional, no un bloqueante.

1. ~~Prisma schema y migraciones.~~ ✅
2. ~~Seed del primer admin.~~ ✅
3. ~~Guards, decorators y RBAC.~~ ✅
4. ~~Corrección de endpoints inseguros actuales.~~ ✅
5. ~~CRUD admin de usuarios.~~ ✅ (backend + frontend)
6. ~~CRUD admin de personajes y conos.~~ ✅ (backend + frontend)
7. ~~CRUD admin de `RelicSet`.~~ ✅ (backend + frontend)
8. ~~Módulo de media.~~ ✅
9. ~~Frontend `/admin`.~~ ✅ Dashboard + `/admin/users` + `/admin/catalog/{characters,light-cones,artifacts,ornaments}`.
10. ~~Testing e2e.~~ ✅ 48 tests en `apps/api/test/admin-*.e2e-spec.ts`, corriendo contra Postgres real vía el flujo register→login (sin JWT firmado a mano), siguiendo la convención ya establecida por `mvp-flow.e2e-spec.ts`.

## 16. Criterios de aceptación

La implementación se considera correctamente resuelta cuando:

- Existe al menos un usuario `ADMIN`.
- Un usuario `USER` no puede acceder a `/admin` ni a endpoints administrativos.
- Un `ADMIN` puede crear y editar usuarios.
- Un `ADMIN` puede crear y editar personajes.
- Un `ADMIN` puede crear y editar conos de luz.
- Un `ADMIN` puede crear y editar artefactos y ornamentos.
- Un `ADMIN` puede subir y reemplazar splash art.
- El sistema conserva compatibilidad con los flujos actuales de usuario estándar.

## 17. Riesgos y notas de implementación

- Cambiar auth y usuarios impacta login, payload JWT y persistencia de sesión.
- Cambiar catálogo sin estrategia de `status` puede romper referencias existentes.
- Si se usa disco local para media, en producción será necesario definir persistencia real.
- El frontend actual usa helper JSON; para uploads habrá que agregar una variante para `FormData`.

## 18. Recomendación operativa final

La mejor ruta para OmniGacha es implementar el módulo admin como una evolución nativa del sistema actual, no como una herramienta paralela.

La combinación recomendada es:

- RBAC simple
- backoffice en Next.js
- API admin en NestJS
- Prisma como única fuente de verdad
- media desacoplada de PostgreSQL
- `RelicSet` unificado para artefactos y ornamentos

Esta decisión reduce deuda técnica, mantiene coherencia con el stack actual y deja preparado el proyecto para una futura mejora visual del frontend usando splash art reales.
