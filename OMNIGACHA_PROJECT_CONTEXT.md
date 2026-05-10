# OmniGacha - Contexto General del Proyecto

## 1. Nombre del proyecto

**OmniGacha**

## 2. Descripción general

OmniGacha es un sistema inteligente de recomendación para jugadores de **Honkai: Star Rail**. Su objetivo es ayudar al usuario a decidir si le conviene obtener un personaje, Eidolon o cono de luz, teniendo en cuenta los personajes que ya posee, sus posibles sinergias, la formación de equipos, una estimación comparativa de daño y una clasificación inteligente de conveniencia.

El sistema no pretende reemplazar la decisión del jugador, sino entregar información clara, visual y personalizada para que pueda tomar mejores decisiones dentro del juego.

---

## 3. Idea central del proyecto

La idea principal es que el usuario registre los personajes que posee en su cuenta y luego seleccione un personaje que desea analizar. OmniGacha evaluará si ese personaje le conviene o no, basándose en:

- Cantidad de equipos en los que puede entrar.
- Sinergias con los personajes que el usuario ya tiene.
- Mejora o disminución estimada de daño.
- Valor del rol dentro de la cuenta.
- Dependencia de Eidolons.
- Dependencia de cono de luz promocional.
- Alternativas que el usuario ya posee.
- Personajes faltantes para formar equipos ideales.

La recomendación se mostrará con una puntuación de 0 a 100, una categoría de conveniencia, explicación textual y gráficas comparativas.

---

## 4. Enfoque de inteligencia artificial

OmniGacha no usará una IA generativa pesada ni una API paga.

El enfoque definido es:

```txt
Motor propio de análisis + modelo ligero de clasificación + explicación por plantillas
```

La IA del sistema será una **IA ligera basada en clasificación**, usando reglas ponderadas o un árbol de decisión simplificado.

La IA no calculará directamente el daño ni inventará resultados. El motor del sistema calculará los datos y la IA ligera clasificará la conveniencia.

---

## 5. Decisión permanente de seguridad y confianza

OmniGacha **nunca accederá directamente a la cuenta del usuario** y **nunca solicitará credenciales de HoYoLAB**.

Esto no es una limitación temporal, sino una decisión permanente de seguridad, privacidad y confianza.

OmniGacha no pedirá:

- Usuario de HoYoLAB.
- Contraseña de HoYoLAB.
- Cookies.
- Tokens.
- Acceso directo a cuentas externas.
- Permisos sobre la cuenta del jugador.

La información se ingresará únicamente mediante:

- Registro manual de personajes.
- En una fase futura, importación de imágenes o capturas proporcionadas voluntariamente por el usuario.

Esta decisión busca proteger la privacidad del jugador y evitar riesgos innecesarios de seguridad.

---

## 6. Planteamiento del problema

En los juegos tipo gacha, como Honkai: Star Rail, los jugadores deben tomar decisiones importantes sobre en qué personajes, Eidolons o conos de luz invertir sus recursos. Estos recursos suelen ser limitados, por lo que una mala decisión puede afectar el progreso de la cuenta y la capacidad del jugador para formar equipos eficientes.

Actualmente, muchos jugadores se apoyan en tier lists, opiniones de creadores de contenido o recomendaciones generales. Sin embargo, estas recomendaciones no siempre consideran la situación específica de cada usuario, como los personajes que ya posee, sus roles disponibles, las sinergias existentes, los equipos que puede formar o el impacto real que tendría un nuevo personaje dentro de su cuenta.

Esto genera incertidumbre al momento de decidir si conviene obtener un personaje en banner, mejorar un Eidolon o invertir en un cono de luz promocional. Además, calcular manualmente el impacto de un personaje puede ser complejo, ya que intervienen múltiples variables como estadísticas, roles, daño crítico, probabilidad crítica, buffs, sinergias y composición del equipo.

Por esta razón, surge la necesidad de desarrollar una herramienta inteligente que analice la información de los personajes del usuario y genere una recomendación personalizada, clara y visual sobre qué tan conveniente es obtener un personaje específico.

---

## 7. Pregunta problema

¿Cómo puede un sistema inteligente ayudar a los jugadores de Honkai: Star Rail a decidir si les conviene obtener un personaje, Eidolon o cono de luz según los personajes que ya poseen, las sinergias disponibles y la mejora estimada de daño en sus equipos?

---

## 8. Objetivo general

Desarrollar **OmniGacha**, un sistema inteligente de recomendación para jugadores de Honkai: Star Rail, capaz de analizar los personajes registrados por el usuario, evaluar sinergias de equipo, estimar mejoras de daño y generar una recomendación personalizada sobre la conveniencia de obtener un personaje, Eidolon o cono de luz.

---

## 9. Objetivos específicos

1. Diseñar un módulo de registro de personajes que permita al usuario ingresar manualmente la información de su cuenta.
2. Crear una base de datos inicial con personajes, roles, elementos, vías, estadísticas básicas y relaciones de sinergia.
3. Implementar un motor de análisis que identifique equipos compatibles según los personajes registrados por el usuario.
4. Desarrollar una calculadora de daño estimado que permita comparar el rendimiento de un equipo actual frente a un equipo modificado.
5. Implementar un modelo ligero de clasificación que determine el nivel de conveniencia de obtener un personaje.
6. Mostrar los resultados mediante gráficas comparativas, porcentajes de mejora y una explicación clara para el usuario.
7. Permitir que el usuario modifique ciertas estadísticas para simular escenarios hipotéticos, como aumentar daño crítico, ataque o velocidad.

---

## 10. Justificación

OmniGacha busca solucionar una necesidad común en jugadores de juegos gacha: tomar mejores decisiones al invertir recursos limitados.

A diferencia de una recomendación general, OmniGacha propone una recomendación personalizada basada en los personajes que el usuario ya posee. Esto permite analizar si un nuevo personaje realmente aporta valor, si mejora equipos existentes o si depende de otros personajes que el usuario aún no tiene.

Desde el punto de vista académico, el proyecto permite aplicar conceptos de:

- Desarrollo de software.
- Bases de datos.
- Análisis de datos.
- Inteligencia artificial ligera.
- Visualización de información.
- Simulación matemática.
- Arquitectura modular.
- Seguridad y privacidad del usuario.

---

## 11. MVP del proyecto

MVP significa **Minimum Viable Product**, en español **Producto Mínimo Viable**.

Para OmniGacha, el MVP será la primera versión funcional del sistema, con solo lo necesario para demostrar la idea principal.

### MVP propuesto

El sistema permitirá que un usuario registre sus personajes de Honkai: Star Rail y seleccione un personaje que desea analizar. Luego, OmniGacha evaluará si ese personaje le conviene o no según sus equipos actuales, sinergias, mejora estimada de daño y rol dentro de la cuenta.

### Funcionalidades del MVP

- Registro manual de personajes.
- Base de datos inicial con un grupo limitado de personajes.
- Análisis de sinergias entre personajes.
- Generación básica de equipos compatibles.
- Cálculo estimado de mejora o disminución de daño.
- Clasificación de conveniencia.
- Gráficas comparativas.
- Explicación personalizada de la recomendación.
- Historial básico de recomendaciones.
- Simulador básico de daño.

### Fuera del MVP inicial

- OCR desde imágenes de HoYoLAB.
- Evaluación avanzada de Eidolons.
- Evaluación avanzada de conos promocionales.
- Simulación exacta de rotaciones complejas.
- Todos los personajes del juego.
- Optimización avanzada de reliquias.
- Modelos de IA generativa pesados.
- APIs pagas de IA.

---

## 12. Stack tecnológico recomendado

### Stack principal

```txt
Frontend: Next.js + TypeScript
Backend: NestJS + TypeScript
Base de datos: PostgreSQL
ORM: Prisma
UI: Tailwind CSS + shadcn/ui
Gráficas: Recharts
IA ligera: reglas ponderadas / árbol de decisión conceptual
Control de versiones: Git + GitHub
```

### Justificación del stack

#### Next.js + TypeScript

Adecuado para construir una aplicación web moderna, organizada y escalable.

#### NestJS + TypeScript

Recomendado para backend modular, con separación clara por dominios y estructura profesional.

#### PostgreSQL + Prisma

PostgreSQL permite manejar datos estructurados y JSON cuando sea necesario. Prisma facilita el acceso tipado a la base de datos.

#### Recharts

Permite mostrar gráficas comparativas de daño, score y factores de recomendación.

#### Tailwind CSS + shadcn/ui

Permite construir una interfaz moderna, limpia y rápida de desarrollar.

#### IA ligera

No requiere GPU, no requiere API paga y puede correr en un computador normal.

---

## 13. Arquitectura general

OmniGacha se desarrollará como una aplicación web dividida en frontend, backend y motor de análisis.

```txt
Frontend
   ↓
Backend API
   ↓
Servicios de dominio
   ↓
Motor de recomendación / daño / sinergia
   ↓
Base de datos
```

### Arquitectura propuesta

```txt
OmniGacha
│
├── Frontend Web
│   ├── Registro e inicio de sesión
│   ├── Gestión de personajes
│   ├── Análisis de personajes
│   ├── Simulador de daño
│   └── Gráficas
│
├── Backend API
│   ├── Auth
│   ├── Users
│   ├── Characters
│   ├── Teams
│   ├── Recommendations
│   └── Simulations
│
├── Motor de análisis
│   ├── Damage Calculator
│   ├── Synergy Engine
│   ├── Team Builder
│   └── AI Recommender
│
└── Base de datos
    ├── Usuarios
    ├── Personajes
    ├── Personajes del usuario
    ├── Equipos
    ├── Recomendaciones
    └── Simulaciones
```

---

## 14. Estructura de carpetas recomendada

```txt
omnigacha/
│
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   └── lib/
│   │
│   └── api/
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── characters/
│       │   ├── light-cones/
│       │   ├── user-characters/
│       │   ├── teams/
│       │   ├── recommendations/
│       │   ├── simulations/
│       │   ├── dashboard/
│       │   └── prisma/
│
├── packages/
│   ├── game-engine/
│   │   ├── damage-calculator.ts
│   │   ├── synergy-engine.ts
│   │   ├── team-builder.ts
│   │   └── scoring.ts
│   │
│   ├── ai-recommender/
│   │   ├── recommendation-model.ts
│   │   ├── recommendation-rules.ts
│   │   └── explanation-generator.ts
│   │
│   └── shared/
│       ├── types.ts
│       └── schemas.ts
│
└── docs/
    ├── proyecto.md
    ├── arquitectura.md
    ├── requerimientos.md
    └── roadmap.md
```

---

## 15. Módulos del sistema

### 15.1 Módulo de autenticación

Funciones principales:

- Registrar usuario.
- Iniciar sesión.
- Cerrar sesión.
- Proteger rutas privadas.
- Asociar personajes a un usuario.

### 15.2 Módulo de usuarios

Funciones principales:

- Consultar perfil.
- Editar datos básicos.
- Ver estadísticas generales de uso.

### 15.3 Módulo de personajes del usuario

Funciones principales:

- Crear personaje del usuario.
- Editar personaje.
- Eliminar personaje.
- Listar personajes guardados.
- Consultar detalle de personaje.

Datos del personaje:

- Nombre.
- Nivel.
- Eidolon.
- Cono de luz.
- Nivel del cono.
- ATK.
- Probabilidad crítica.
- Daño crítico.
- Velocidad.
- Elemento.
- Vía.
- Rol.

### 15.4 Módulo de catálogo de personajes

Funciones principales:

- Listar personajes disponibles.
- Consultar información de un personaje.
- Consultar elemento, vía y rol.
- Consultar sinergias conocidas.

### 15.5 Módulo de equipos

Funciones principales:

- Generar equipos posibles.
- Detectar personajes compatibles.
- Validar roles dentro del equipo.
- Sugerir mejor composición.

### 15.6 Módulo de sinergias

Funciones principales:

- Evaluar compatibilidad entre personajes.
- Medir fuerza de sinergia.
- Penalizar personajes sin compatibilidad.
- Detectar roles faltantes.

### 15.7 Módulo de calculadora de daño

Funciones principales:

- Calcular daño estimado de un personaje.
- Calcular daño estimado de un equipo.
- Comparar equipo actual vs equipo propuesto.
- Calcular porcentaje de mejora o disminución.

### 15.8 Módulo de recomendación inteligente

Este es el módulo donde entra la IA ligera.

Variables que analiza:

- Equipos compatibles.
- Mejora de daño.
- Personajes faltantes.
- Valor del rol.
- Dependencia de Eidolon.
- Dependencia de cono promocional.
- Alternativas que ya tiene el usuario.

Salida:

```txt
NO_RECOMENDADO
SITUACIONAL
RECOMENDADO
MUY_RECOMENDADO
```

### 15.9 Módulo de explicación

Genera una explicación entendible para el usuario usando plantillas dinámicas.

Ejemplo:

```txt
Te conviene obtener a Kafka porque puede entrar en 3 equipos de tu cuenta,
mejora el daño estimado en 27% y tiene buena sinergia con Black Swan.
```

### 15.10 Módulo de simulaciones

Funciones principales:

- Modificar estadísticas temporalmente.
- Comparar escenarios.
- Probar cambios de daño crítico.
- Probar cambios de ataque.
- Probar cambios de velocidad.
- Guardar simulaciones.

### 15.11 Módulo de gráficas

Gráficas principales:

- Daño actual vs daño propuesto.
- Porcentaje de mejora.
- Puntuación final.
- Equipos compatibles.
- Factores de recomendación.

---

## 16. Requerimientos funcionales

### RF-01: Registro de usuario

El sistema permitirá que un usuario cree una cuenta para guardar sus personajes y simulaciones.

Datos mínimos:

- Nombre.
- Correo electrónico.
- Contraseña.

### RF-02: Inicio de sesión

El sistema permitirá que el usuario inicie sesión para acceder a sus personajes guardados, análisis y recomendaciones.

### RF-03: Registro manual de personajes

El sistema permitirá que el usuario registre manualmente los personajes que posee en su cuenta.

Datos:

- Nombre del personaje.
- Nivel.
- Eidolon.
- Cono de luz.
- Nivel del cono.
- Elemento.
- Vía / Path.
- Rol principal.
- ATK.
- Probabilidad crítica.
- Daño crítico.
- Velocidad.

### RF-04: Edición de personajes guardados

El usuario podrá editar la información de sus personajes cuando mejore estadísticas, cambie cono de luz o suba Eidolons.

### RF-05: Eliminación de personajes

El sistema permitirá eliminar personajes registrados por el usuario.

### RF-06: Catálogo base de personajes

El sistema contará con un catálogo inicial de personajes de Honkai: Star Rail.

### RF-07: Selección de personaje a evaluar

El usuario podrá seleccionar un personaje específico para analizar si le conviene obtenerlo.

### RF-08: Análisis de sinergias

El sistema analizará si el personaje evaluado tiene sinergia con los personajes registrados por el usuario.

### RF-09: Generación de equipos compatibles

El sistema mostrará posibles equipos donde podría entrar el personaje evaluado.

### RF-10: Cálculo estimado de daño

El sistema calculará una estimación de daño del equipo actual y la comparará con el equipo que incluye al personaje evaluado.

### RF-11: Clasificación inteligente de recomendación

El sistema clasificará la conveniencia del personaje usando un modelo ligero de clasificación.

### RF-12: Puntuación de conveniencia

El sistema asignará una puntuación de 0 a 100 al personaje evaluado.

### RF-13: Explicación de la recomendación

El sistema mostrará una explicación clara sobre por qué recomienda o no recomienda obtener el personaje.

### RF-14: Visualización con gráficas

El sistema mostrará gráficas comparativas.

### RF-15: Simulación de escenarios

El usuario podrá modificar algunas estadísticas para simular escenarios hipotéticos.

### RF-16: Historial de recomendaciones

El sistema podrá guardar las recomendaciones realizadas por el usuario para consultarlas después.

---

## 17. Requerimientos no funcionales

### RNF-01: Usabilidad

El sistema debe tener una interfaz clara, moderna y fácil de usar.

### RNF-02: Rendimiento

El sistema debe generar una recomendación en pocos segundos.

### RNF-03: Seguridad

El sistema no solicitará credenciales de HoYoLAB ni acceso directo a cuentas externas.

### RNF-04: Privacidad

El sistema solo almacenará los datos necesarios para realizar recomendaciones.

### RNF-05: Escalabilidad

El sistema debe permitir agregar nuevos personajes, conos de luz, Eidolons y reglas de sinergia.

### RNF-06: Mantenibilidad

El código debe organizarse por módulos para facilitar cambios futuros.

### RNF-07: Disponibilidad

Para la versión universitaria, el sistema debe estar disponible localmente o en un despliegue básico web.

### RNF-08: Compatibilidad

El sistema debe funcionar correctamente en navegadores modernos como Chrome, Edge, Firefox y Brave.

### RNF-09: Exactitud razonable

El sistema debe entregar estimaciones basadas en reglas y fórmulas definidas.

### RNF-10: Bajo consumo de recursos

El sistema no dependerá de modelos pesados de IA, GPUs ni APIs pagas.

---

## 18. Modelo inicial de base de datos

### Tablas principales

- users
- characters
- light_cones
- user_characters
- character_synergies
- recommendations
- recommendation_teams
- recommendation_team_members
- damage_simulations

### 18.1 Tabla users

| Campo | Tipo | Descripción |
|---|---|---|
| id | String / UUID | Identificador del usuario |
| name | String | Nombre del usuario |
| email | String | Correo electrónico |
| passwordHash | String | Contraseña cifrada |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Fecha de actualización |

### 18.2 Tabla characters

| Campo | Tipo | Descripción |
|---|---|---|
| id | String / UUID | Identificador del personaje |
| name | String | Nombre del personaje |
| element | Enum | Elemento |
| path | Enum | Vía / Path |
| role | Enum | Rol principal |
| damageType | String | Tipo de daño |
| rarity | Int | Rareza |
| eidolonDependency | Enum | Baja, media o alta |
| lightConeDependency | Enum | Baja, media o alta |
| description | String | Descripción general |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Fecha de actualización |

### 18.3 Tabla light_cones

| Campo | Tipo | Descripción |
|---|---|---|
| id | String / UUID | Identificador del cono |
| name | String | Nombre del cono |
| path | Enum | Vía compatible |
| rarity | Int | Rareza |
| effectDescription | String | Descripción del efecto |
| createdAt | DateTime | Fecha de creación |

### 18.4 Tabla user_characters

| Campo | Tipo | Descripción |
|---|---|---|
| id | String / UUID | Identificador |
| userId | String | Usuario propietario |
| characterId | String | Personaje del catálogo |
| lightConeId | String / Nullable | Cono equipado |
| level | Int | Nivel del personaje |
| eidolon | Int | Nivel de Eidolon |
| lightConeLevel | Int | Nivel del cono |
| attack | Float | ATK |
| critRate | Float | Probabilidad crítica |
| critDamage | Float | Daño crítico |
| speed | Float | Velocidad |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Fecha de actualización |

### 18.5 Tabla character_synergies

| Campo | Tipo | Descripción |
|---|---|---|
| id | String / UUID | Identificador |
| characterId | String | Personaje principal |
| synergyCharacterId | String | Personaje con sinergia |
| synergyType | String | Tipo de sinergia |
| synergyScore | Int | Puntuación de 1 a 10 |
| description | String | Explicación de la sinergia |

### 18.6 Tabla recommendations

| Campo | Tipo | Descripción |
|---|---|---|
| id | String / UUID | Identificador |
| userId | String | Usuario |
| evaluatedCharacterId | String | Personaje evaluado |
| score | Int | Puntuación final |
| recommendation | Enum | Resultado |
| compatibleTeamsCount | Int | Cantidad de equipos compatibles |
| damageIncreasePercent | Float | Mejora estimada |
| explanation | String | Explicación |
| createdAt | DateTime | Fecha de generación |

### 18.7 Tabla recommendation_teams

| Campo | Tipo | Descripción |
|---|---|---|
| id | String / UUID | Identificador |
| recommendationId | String | Recomendación asociada |
| teamName | String | Nombre del equipo |
| estimatedDamage | Float | Daño estimado |
| synergyScore | Int | Puntuación de sinergia |

### 18.8 Tabla recommendation_team_members

| Campo | Tipo | Descripción |
|---|---|---|
| id | String / UUID | Identificador |
| recommendationTeamId | String | Equipo recomendado |
| characterId | String | Personaje |
| position | Int | Posición en el equipo |
| roleInTeam | String | Rol dentro del equipo |

### 18.9 Tabla damage_simulations

| Campo | Tipo | Descripción |
|---|---|---|
| id | String / UUID | Identificador |
| userId | String | Usuario |
| characterId | String | Personaje simulado |
| baseDamage | Float | Daño antes del cambio |
| simulatedDamage | Float | Daño después del cambio |
| damageIncreasePercent | Float | Porcentaje de cambio |
| modifiedStats | JSON | Estadísticas modificadas |
| createdAt | DateTime | Fecha de simulación |

---

## 19. Enums recomendados

### Element

```txt
PHYSICAL
FIRE
ICE
LIGHTNING
WIND
QUANTUM
IMAGINARY
```

### Path

```txt
DESTRUCTION
HUNT
ERUDITION
HARMONY
NIHILITY
PRESERVATION
ABUNDANCE
REMEMBRANCE
```

### Role

```txt
DPS
SUB_DPS
SUPPORT
DEBUFFER
SUSTAIN
HEALER
SHIELDER
```

### DependencyLevel

```txt
LOW
MEDIUM
HIGH
```

### RecommendationResult

```txt
NO_RECOMENDADO
SITUACIONAL
RECOMENDADO
MUY_RECOMENDADO
```

---

## 20. Modelo Prisma inicial aproximado

```prisma
model User {
  id              String             @id @default(uuid())
  name            String
  email           String             @unique
  passwordHash    String
  characters      UserCharacter[]
  recommendations Recommendation[]
  simulations     DamageSimulation[]
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}

model Character {
  id                  String             @id @default(uuid())
  name                String             @unique
  element             Element
  path                Path
  role                Role
  damageType          String?
  rarity              Int
  eidolonDependency   DependencyLevel
  lightConeDependency DependencyLevel
  description         String?

  userCharacters      UserCharacter[]
  recommendations     Recommendation[]
  synergies           CharacterSynergy[] @relation("CharacterSynergies")
  synergyTargets      CharacterSynergy[] @relation("SynergyTargets")

  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
}

model LightCone {
  id                String          @id @default(uuid())
  name              String          @unique
  path              Path
  rarity            Int
  effectDescription String?
  userCharacters    UserCharacter[]
  createdAt         DateTime        @default(now())
}

model UserCharacter {
  id             String     @id @default(uuid())
  userId         String
  characterId    String
  lightConeId    String?

  level          Int
  eidolon        Int
  lightConeLevel Int?

  attack         Float
  critRate       Float
  critDamage     Float
  speed          Float

  user           User       @relation(fields: [userId], references: [id])
  character      Character  @relation(fields: [characterId], references: [id])
  lightCone      LightCone? @relation(fields: [lightConeId], references: [id])

  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@unique([userId, characterId])
}

model CharacterSynergy {
  id                 String    @id @default(uuid())
  characterId         String
  synergyCharacterId  String

  synergyType         String
  synergyScore        Int
  description         String?

  character           Character @relation("CharacterSynergies", fields: [characterId], references: [id])
  synergyCharacter    Character @relation("SynergyTargets", fields: [synergyCharacterId], references: [id])
}

model Recommendation {
  id                    String                   @id @default(uuid())
  userId                String
  evaluatedCharacterId  String

  score                 Int
  recommendation        RecommendationResult
  compatibleTeamsCount  Int
  damageIncreasePercent Float
  explanation           String

  user                  User                     @relation(fields: [userId], references: [id])
  evaluatedCharacter    Character                @relation(fields: [evaluatedCharacterId], references: [id])
  teams                 RecommendationTeam[]

  createdAt             DateTime                 @default(now())
}

model RecommendationTeam {
  id                String                     @id @default(uuid())
  recommendationId  String
  teamName          String
  estimatedDamage   Float
  synergyScore      Int

  recommendation    Recommendation             @relation(fields: [recommendationId], references: [id])
  members           RecommendationTeamMember[]
}

model RecommendationTeamMember {
  id                   String             @id @default(uuid())
  recommendationTeamId String
  characterId          String
  position             Int
  roleInTeam           String

  team                 RecommendationTeam @relation(fields: [recommendationTeamId], references: [id])
  character            Character          @relation(fields: [characterId], references: [id])
}

model DamageSimulation {
  id                    String    @id @default(uuid())
  userId                String
  characterId           String

  baseDamage            Float
  simulatedDamage       Float
  damageIncreasePercent Float
  modifiedStats         Json

  user                  User      @relation(fields: [userId], references: [id])
  character             Character @relation(fields: [characterId], references: [id])

  createdAt             DateTime  @default(now())
}

enum Element {
  PHYSICAL
  FIRE
  ICE
  LIGHTNING
  WIND
  QUANTUM
  IMAGINARY
}

enum Path {
  DESTRUCTION
  HUNT
  ERUDITION
  HARMONY
  NIHILITY
  PRESERVATION
  ABUNDANCE
  REMEMBRANCE
}

enum Role {
  DPS
  SUB_DPS
  SUPPORT
  DEBUFFER
  SUSTAIN
  HEALER
  SHIELDER
}

enum DependencyLevel {
  LOW
  MEDIUM
  HIGH
}

enum RecommendationResult {
  NO_RECOMENDADO
  SITUACIONAL
  RECOMENDADO
  MUY_RECOMENDADO
}
```

---

## 21. Flujo principal del sistema

```txt
1. El usuario entra a OmniGacha.
2. Se registra o inicia sesión.
3. Registra los personajes que tiene en su cuenta.
4. Selecciona un personaje que desea evaluar.
5. El sistema analiza sus personajes guardados.
6. El sistema busca sinergias.
7. El sistema genera equipos compatibles.
8. El sistema calcula daño estimado.
9. El modelo ligero clasifica la conveniencia.
10. El sistema muestra la recomendación final con gráficas.
```

### Flujo resumido para sustentación

```txt
El usuario registra sus personajes.
Luego selecciona un personaje que quiere evaluar.
OmniGacha analiza sinergias, equipos posibles y daño estimado.
Después, un modelo ligero clasifica la conveniencia del personaje.
Finalmente, el sistema muestra una recomendación visual y explicada.
```

---

## 22. Pantallas principales

Para el MVP inicial se recomiendan estas pantallas:

1. Login / Registro.
2. Dashboard principal.
3. Mis personajes.
4. Registrar / editar personaje.
5. Analizar personaje.
6. Resultado de recomendación.
7. Simulador de daño.
8. Historial de recomendaciones.

### MVP visual mínimo

Para presentar el flujo principal:

1. Dashboard.
2. Mis personajes.
3. Registrar personaje.
4. Analizar personaje.
5. Resultado de recomendación.

### Diseño visual recomendado

- Interfaz oscura.
- Estilo moderno.
- Tarjetas.
- Detalles morados, azules o dorados.
- Inspiración gamer/anime sin sobrecargar.
- Badges para elemento, vía y rol.
- Gráficas claras.
- Botones llamativos pero profesionales.

---

## 23. Algoritmo de recomendación

El algoritmo calcula una puntuación final de 0 a 100.

### Categorías finales

```txt
0 - 39   → NO_RECOMENDADO
40 - 59  → SITUACIONAL
60 - 79  → RECOMENDADO
80 - 100 → MUY_RECOMENDADO
```

### Variables analizadas

1. Mejora estimada de daño.
2. Cantidad de equipos compatibles.
3. Nivel de sinergia con personajes del usuario.
4. Valor del rol dentro de la cuenta.
5. Dependencia de Eidolon o cono promocional.
6. Cantidad de personajes faltantes.
7. Alternativas que ya tiene el usuario.

### Fórmula general

```txt
Score = 0.25D + 0.20S + 0.20T + 0.15R + 0.10I + 0.10A
```

Donde:

| Variable | Significado | Peso |
|---|---:|---:|
| D | Daño estimado | 25% |
| S | Sinergia | 20% |
| T | Equipos compatibles | 20% |
| R | Valor del rol | 15% |
| I | Inversión requerida | 10% |
| A | Valor para la cuenta | 10% |

### Reglas por factor

#### Daño estimado

```txt
Daño disminuye              → 0 puntos
Mejora entre 0% y 10%       → 40 puntos
Mejora entre 11% y 25%      → 65 puntos
Mejora entre 26% y 40%      → 85 puntos
Mejora mayor a 40%          → 100 puntos
```

#### Sinergia

```txt
Sin sinergias útiles      → 0 puntos
Sinergia baja             → 40 puntos
Sinergia media            → 65 puntos
Sinergia alta             → 85 puntos
Sinergia excelente        → 100 puntos
```

#### Equipos compatibles

```txt
0 equipos compatibles    → 0 puntos
1 equipo compatible      → 45 puntos
2 equipos compatibles    → 75 puntos
3 o más equipos          → 100 puntos
```

#### Valor del rol

```txt
Rol repetido y poco necesario       → 30 puntos
Rol útil pero no urgente            → 60 puntos
Rol importante para varios equipos  → 80 puntos
Rol que la cuenta necesita mucho    → 100 puntos
```

#### Inversión requerida

```txt
Baja inversión requerida    → 100 puntos
Inversión media             → 70 puntos
Inversión alta              → 40 puntos
Inversión muy alta          → 10 puntos
```

#### Valor para la cuenta

```txt
El usuario ya tiene mejores alternativas        → 30 puntos
Aporta valor moderado                           → 60 puntos
Aporta bastante valor                           → 80 puntos
Aporta algo que la cuenta no tiene actualmente  → 100 puntos
```

---

## 24. Modelo de IA ligera

### Tipo de modelo

```txt
Clasificación basada en reglas ponderadas
```

También se puede explicar como:

```txt
Árbol de decisión simplificado
```

### Entrada del modelo

```json
{
  "damageIncreasePercent": 27,
  "compatibleTeamsCount": 3,
  "synergyScore": 86,
  "roleValueScore": 90,
  "investmentScore": 85,
  "accountValueScore": 100,
  "missingKeyCharacters": 0
}
```

### Salida del modelo

```json
{
  "score": 91,
  "recommendation": "MUY_RECOMENDADO",
  "confidence": "HIGH",
  "mainReasons": [
    "Alta mejora de daño",
    "Buenas sinergias",
    "Varios equipos compatibles"
  ]
}
```

### Confianza del modelo

#### Alta confianza

- Hay 3 o más personajes con sinergia.
- Hay mejora clara de daño.
- No faltan personajes clave.

#### Confianza media

- Hay 1 o 2 sinergias.
- La mejora de daño es moderada.
- Falta algún personaje importante.

#### Baja confianza

- Hay pocos datos del usuario.
- No hay suficientes personajes registrados.
- El sistema no puede formar equipos completos.

### Pseudocódigo

```ts
type RecommendationInput = {
  damageScore: number
  synergyScore: number
  teamScore: number
  roleScore: number
  investmentScore: number
  accountValueScore: number
  compatibleTeamsCount: number
  missingKeyCharacters: number
}

type RecommendationResult =
  | "NO_RECOMENDADO"
  | "SITUACIONAL"
  | "RECOMENDADO"
  | "MUY_RECOMENDADO"

function calculateFinalScore(input: RecommendationInput): number {
  const score =
    input.damageScore * 0.25 +
    input.synergyScore * 0.20 +
    input.teamScore * 0.20 +
    input.roleScore * 0.15 +
    input.investmentScore * 0.10 +
    input.accountValueScore * 0.10

  return Math.round(score)
}

function classifyRecommendation(score: number): RecommendationResult {
  if (score >= 80) return "MUY_RECOMENDADO"
  if (score >= 60) return "RECOMENDADO"
  if (score >= 40) return "SITUACIONAL"

  return "NO_RECOMENDADO"
}

function calculateConfidence(input: RecommendationInput): "LOW" | "MEDIUM" | "HIGH" {
  if (
    input.compatibleTeamsCount >= 2 &&
    input.synergyScore >= 75 &&
    input.missingKeyCharacters === 0
  ) {
    return "HIGH"
  }

  if (
    input.compatibleTeamsCount >= 1 &&
    input.synergyScore >= 50 &&
    input.missingKeyCharacters <= 1
  ) {
    return "MEDIUM"
  }

  return "LOW"
}
```

---

## 25. Fórmula de daño estimado

OmniGacha no calculará el daño exacto del juego. Usará un **índice de daño estimado** para comparar escenarios.

### Fórmula simplificada

```txt
DañoEstimado = ATK × M × C × B × S
```

Donde:

| Variable | Significado |
|---|---|
| ATK | Ataque del personaje |
| M | Multiplicador de habilidad |
| C | Multiplicador crítico promedio |
| B | Bono de daño general |
| S | Multiplicador de sinergia del equipo |

### Multiplicador crítico promedio

```txt
C = 1 + (CRIT Rate × CRIT DMG)
```

Usando porcentajes convertidos a decimal.

Ejemplo:

```txt
CRIT Rate = 60% → 0.60
CRIT DMG = 120% → 1.20

C = 1 + (0.60 × 1.20)
C = 1.72
```

### Multiplicadores base por rol

```ts
export const roleDamageMultipliers = {
  DPS: 2.5,
  SUB_DPS: 1.8,
  SUPPORT: 1.2,
  DEBUFFER: 1.1,
  SUSTAIN: 0.8,
  HEALER: 0.6,
  SHIELDER: 0.6,
}
```

### Multiplicadores de sinergia

```ts
export const synergyMultipliers = {
  LOW: 0.9,
  MEDIUM: 1.0,
  HIGH: 1.15,
  EXCELLENT: 1.3,
}
```

### Mejora porcentual

```txt
Mejora % = ((Daño nuevo - Daño actual) / Daño actual) × 100
```

### Pseudocódigo

```ts
function calculateAverageCritMultiplier(critRate: number, critDamage: number) {
  const rate = Math.min(Math.max(critRate / 100, 0), 1)
  const damage = critDamage / 100

  return 1 + rate * damage
}

function calculateEstimatedDamage(input: {
  attack: number
  skillMultiplier: number
  critRate: number
  critDamage: number
  damageBonusMultiplier: number
  synergyMultiplier: number
}) {
  const critMultiplier = calculateAverageCritMultiplier(
    input.critRate,
    input.critDamage
  )

  return (
    input.attack *
    input.skillMultiplier *
    critMultiplier *
    input.damageBonusMultiplier *
    input.synergyMultiplier
  )
}

function calculateDamageIncreasePercent(currentDamage: number, newDamage: number) {
  if (currentDamage <= 0) return 0

  return ((newDamage - currentDamage) / currentDamage) * 100
}
```

### Importante

El sistema debe mostrar el resultado como:

```txt
Índice de daño estimado
```

No como daño exacto del juego.

---

## 26. Modelo inicial de personajes y sinergias

### Personajes iniciales recomendados para el MVP

#### DPS principales

- Kafka.
- Acheron.
- Seele.
- Jingliu.
- Firefly.

#### Sub DPS / daño secundario

- Black Swan.
- Sampo.
- Topaz.

#### Supports

- Ruan Mei.
- Robin.
- Sparkle.
- Bronya.
- Pela.

#### Sustain / defensa / curación

- Huohuo.
- Aventurine.
- Gallagher.

### Tipos de equipo que permite probar

- Equipos DoT.
- Equipos críticos tradicionales.
- Equipos de follow-up attack.
- Equipos hypercarry.
- Equipos de break.
- Equipos con sustain.

### Estructura recomendada de personaje

```ts
{
  id: "kafka",
  name: "Kafka",
  element: "LIGHTNING",
  path: "NIHILITY",
  rarity: 5,
  role: "DPS",
  archetype: "DOT",
  damageType: "DAMAGE_OVER_TIME",
  eidolonDependency: "LOW",
  lightConeDependency: "MEDIUM",
  tags: ["dot", "nihility", "damage-dealer"]
}
```

### Arquetipos recomendados

```txt
DOT
HYPERCARRY
FOLLOW_UP
BREAK
CRIT_DPS
DEBUFF
SUSTAIN
GENERAL_SUPPORT
```

### Ejemplo de catálogo inicial

```ts
export const characters = [
  {
    id: "kafka",
    name: "Kafka",
    element: "LIGHTNING",
    path: "NIHILITY",
    rarity: 5,
    role: "DPS",
    archetype: "DOT",
    damageType: "DAMAGE_OVER_TIME",
    eidolonDependency: "LOW",
    lightConeDependency: "MEDIUM",
    tags: ["dot", "nihility", "damage-dealer"]
  },
  {
    id: "black_swan",
    name: "Black Swan",
    element: "WIND",
    path: "NIHILITY",
    rarity: 5,
    role: "SUB_DPS",
    archetype: "DOT",
    damageType: "DAMAGE_OVER_TIME",
    eidolonDependency: "LOW",
    lightConeDependency: "MEDIUM",
    tags: ["dot", "nihility", "debuffer"]
  },
  {
    id: "ruan_mei",
    name: "Ruan Mei",
    element: "ICE",
    path: "HARMONY",
    rarity: 5,
    role: "SUPPORT",
    archetype: "GENERAL_SUPPORT",
    damageType: "BUFF",
    eidolonDependency: "LOW",
    lightConeDependency: "LOW",
    tags: ["support", "buff", "break", "team-damage"]
  },
  {
    id: "robin",
    name: "Robin",
    element: "PHYSICAL",
    path: "HARMONY",
    rarity: 5,
    role: "SUPPORT",
    archetype: "FOLLOW_UP",
    damageType: "BUFF",
    eidolonDependency: "LOW",
    lightConeDependency: "MEDIUM",
    tags: ["support", "follow-up", "team-damage"]
  },
  {
    id: "aventurine",
    name: "Aventurine",
    element: "IMAGINARY",
    path: "PRESERVATION",
    rarity: 5,
    role: "SUSTAIN",
    archetype: "FOLLOW_UP",
    damageType: "SHIELD",
    eidolonDependency: "LOW",
    lightConeDependency: "LOW",
    tags: ["sustain", "shield", "follow-up"]
  }
]
```

---

## 27. Modelo de sinergias

### Estructura de sinergia

```ts
{
  characterId: "kafka",
  synergyCharacterId: "black_swan",
  synergyType: "DOT",
  synergyScore: 10,
  reason: "Ambas potencian equipos basados en daño por tiempo."
}
```

### Escala de sinergia

```txt
1 - 3   → Sinergia baja
4 - 6   → Sinergia media
7 - 8   → Sinergia alta
9 - 10  → Sinergia excelente
```

### Sinergias iniciales recomendadas

```ts
export const characterSynergies = [
  {
    characterId: "kafka",
    synergyCharacterId: "black_swan",
    synergyType: "DOT",
    synergyScore: 10,
    reason: "Kafka y Black Swan funcionan muy bien en equipos centrados en daño por tiempo."
  },
  {
    characterId: "kafka",
    synergyCharacterId: "ruan_mei",
    synergyType: "TEAM_BUFF",
    synergyScore: 9,
    reason: "Ruan Mei aumenta el rendimiento general del equipo y encaja bien en composiciones DoT."
  },
  {
    characterId: "kafka",
    synergyCharacterId: "huohuo",
    synergyType: "SUSTAIN_ENERGY",
    synergyScore: 8,
    reason: "Huohuo aporta curación y utilidad para mantener estable al equipo."
  },
  {
    characterId: "black_swan",
    synergyCharacterId: "sampo",
    synergyType: "DOT",
    synergyScore: 7,
    reason: "Ambos aprovechan mecánicas relacionadas con daño por tiempo."
  },
  {
    characterId: "topaz",
    synergyCharacterId: "robin",
    synergyType: "FOLLOW_UP",
    synergyScore: 9,
    reason: "Robin potencia equipos con ataques frecuentes y composiciones de follow-up."
  },
  {
    characterId: "topaz",
    synergyCharacterId: "aventurine",
    synergyType: "FOLLOW_UP",
    synergyScore: 8,
    reason: "Aventurine aporta sustain y puede encajar bien en composiciones de follow-up."
  },
  {
    characterId: "seele",
    synergyCharacterId: "sparkle",
    synergyType: "HYPERCARRY",
    synergyScore: 9,
    reason: "Sparkle puede potenciar equipos centrados en un DPS principal."
  },
  {
    characterId: "jingliu",
    synergyCharacterId: "bronya",
    synergyType: "HYPERCARRY",
    synergyScore: 8,
    reason: "Bronya puede apoyar composiciones donde un DPS principal necesita más turnos y daño."
  },
  {
    characterId: "acheron",
    synergyCharacterId: "pela",
    synergyType: "DEBUFF",
    synergyScore: 8,
    reason: "Pela aporta debuffs útiles para equipos que aprovechan debilitamientos enemigos."
  },
  {
    characterId: "firefly",
    synergyCharacterId: "ruan_mei",
    synergyType: "BREAK",
    synergyScore: 9,
    reason: "Ruan Mei encaja muy bien en composiciones orientadas a ruptura."
  }
]
```

### Pseudocódigo de sinergia

```ts
function calculateSynergyScore(
  evaluatedCharacterId: string,
  userCharacterIds: string[],
  synergies: CharacterSynergy[]
) {
  const matchedSynergies = synergies.filter((synergy) => {
    return (
      synergy.characterId === evaluatedCharacterId &&
      userCharacterIds.includes(synergy.synergyCharacterId)
    )
  })

  if (matchedSynergies.length === 0) {
    return 0
  }

  const total = matchedSynergies.reduce((sum, synergy) => {
    return sum + synergy.synergyScore
  }, 0)

  const average = total / matchedSynergies.length

  return average * 10
}
```

---

## 28. Reglas para formar equipos

Para el MVP, cada equipo tendrá máximo 4 personajes.

Composición básica:

```txt
1 DPS principal
1 Sub DPS / Debuffer
1 Support
1 Sustain
```

Reglas:

- El personaje evaluado debe estar en el equipo.
- El equipo debe tener máximo 4 personajes.
- Debe evitar repetir roles innecesariamente.
- Debe priorizar personajes con mayor sinergia.
- Debe incluir al menos un sustain si el usuario lo tiene.

### Reglas por arquetipo

```ts
export const archetypeRules = {
  DOT: {
    preferredRoles: ["DPS", "SUB_DPS", "SUPPORT", "SUSTAIN"],
    preferredTags: ["dot", "nihility", "team-damage", "sustain"]
  },
  HYPERCARRY: {
    preferredRoles: ["DPS", "SUPPORT", "SUPPORT", "SUSTAIN"],
    preferredTags: ["damage-dealer", "buff", "action-advance", "sustain"]
  },
  FOLLOW_UP: {
    preferredRoles: ["DPS", "SUB_DPS", "SUPPORT", "SUSTAIN"],
    preferredTags: ["follow-up", "team-damage", "shield", "sustain"]
  },
  BREAK: {
    preferredRoles: ["DPS", "SUPPORT", "SUPPORT", "SUSTAIN"],
    preferredTags: ["break", "team-damage", "sustain"]
  }
}
```

---

## 29. Casos de uso

| Código | Caso de uso | Actor principal |
|---|---|---|
| CU-01 | Registrar usuario | Usuario |
| CU-02 | Iniciar sesión | Usuario |
| CU-03 | Registrar personaje | Usuario |
| CU-04 | Editar personaje | Usuario |
| CU-05 | Eliminar personaje | Usuario |
| CU-06 | Analizar personaje | Usuario |
| CU-07 | Ver resultado de recomendación | Usuario |
| CU-08 | Simular daño | Usuario |
| CU-09 | Guardar recomendación | Sistema |
| CU-10 | Consultar historial | Usuario |
| CU-11 | Consultar catálogo de personajes | Usuario |
| CU-12 | Generar explicación automática | Sistema |

### Casos de uso prioritarios para el MVP

- CU-03: Registrar personaje.
- CU-06: Analizar personaje.
- CU-07: Ver resultado de recomendación.
- CU-08: Simular daño.
- CU-10: Consultar historial.

---

## 30. Diseño de API

### Base

```txt
/api
```

### Módulos

```txt
/api/auth
/api/characters
/api/light-cones
/api/user-characters
/api/recommendations
/api/simulations
/api/dashboard
```

### Auth

#### POST /auth/register

Registra un usuario.

Body:

```json
{
  "name": "Daniel",
  "email": "daniel@email.com",
  "password": "123456"
}
```

#### POST /auth/login

Inicia sesión.

Body:

```json
{
  "email": "daniel@email.com",
  "password": "123456"
}
```

Respuesta:

```json
{
  "accessToken": "jwt_token",
  "user": {
    "id": "user_001",
    "name": "Daniel",
    "email": "daniel@email.com"
  }
}
```

#### GET /auth/me

Consulta el usuario autenticado.

---

### Characters

#### GET /characters

Lista personajes del catálogo.

#### GET /characters/:id

Consulta detalle de un personaje.

---

### Light Cones

#### GET /light-cones

Lista conos de luz disponibles.

#### GET /light-cones/:id

Consulta detalle de un cono de luz.

---

### User Characters

#### GET /user-characters

Lista personajes guardados por el usuario.

#### POST /user-characters

Registra un personaje del usuario.

Body:

```json
{
  "characterId": "kafka",
  "lightConeId": "eyes_of_the_prey",
  "level": 80,
  "eidolon": 0,
  "lightConeLevel": 80,
  "attack": 3200,
  "critRate": 35,
  "critDamage": 120,
  "speed": 145
}
```

#### PATCH /user-characters/:id

Actualiza un personaje guardado.

#### DELETE /user-characters/:id

Elimina un personaje guardado.

---

### Recommendations

#### POST /recommendations/analyze

Analiza si conviene obtener un personaje.

Body:

```json
{
  "evaluatedCharacterId": "kafka"
}
```

Flujo interno:

```txt
1. Busca los personajes guardados del usuario.
2. Consulta el personaje evaluado.
3. Calcula sinergias.
4. Genera equipos compatibles.
5. Calcula daño estimado.
6. Calcula score final.
7. Clasifica la recomendación.
8. Genera explicación.
9. Guarda la recomendación.
```

Respuesta esperada:

```json
{
  "id": "rec_001",
  "evaluatedCharacter": {
    "id": "kafka",
    "name": "Kafka",
    "element": "LIGHTNING",
    "path": "NIHILITY"
  },
  "score": 91,
  "recommendation": "MUY_RECOMENDADO",
  "confidence": "HIGH",
  "damageIncreasePercent": 27,
  "compatibleTeamsCount": 3,
  "bestTeam": {
    "name": "Equipo DoT recomendado",
    "estimatedDamage": 127000,
    "synergyScore": 92,
    "members": [
      {
        "characterId": "kafka",
        "name": "Kafka",
        "roleInTeam": "DPS"
      },
      {
        "characterId": "black_swan",
        "name": "Black Swan",
        "roleInTeam": "SUB_DPS"
      },
      {
        "characterId": "ruan_mei",
        "name": "Ruan Mei",
        "roleInTeam": "SUPPORT"
      },
      {
        "characterId": "huohuo",
        "name": "Huohuo",
        "roleInTeam": "SUSTAIN"
      }
    ]
  },
  "factorScores": {
    "damageScore": 85,
    "synergyScore": 86,
    "teamScore": 100,
    "roleScore": 90,
    "investmentScore": 90,
    "accountValueScore": 100
  },
  "explanation": "Te conviene obtener a Kafka porque puede entrar en 3 equipos de tu cuenta, mejora el daño estimado en 27% y tiene alta sinergia con personajes que ya tienes."
}
```

#### GET /recommendations

Lista el historial de recomendaciones.

#### GET /recommendations/:id

Consulta el detalle de una recomendación.

---

### Simulations

#### POST /simulations/damage

Simula cambios de estadísticas en un personaje.

Body:

```json
{
  "userCharacterId": "uc_001",
  "modifiedStats": {
    "attack": 3500,
    "critRate": 60,
    "critDamage": 180,
    "speed": 145
  }
}
```

#### GET /simulations

Lista simulaciones del usuario.

#### GET /simulations/:id

Consulta detalle de una simulación.

---

### Dashboard

#### GET /dashboard/summary

Devuelve resumen del dashboard.

Respuesta:

```json
{
  "totalCharacters": 12,
  "totalRecommendations": 5,
  "totalSimulations": 3,
  "lastRecommendation": {
    "characterName": "Kafka",
    "recommendation": "MUY_RECOMENDADO",
    "score": 91
  }
}
```

---

## 31. Flujo interno del endpoint principal

Endpoint:

```txt
POST /recommendations/analyze
```

Flujo recomendado:

```txt
Controller
   ↓
Service / Use Case
   ↓
UserCharactersRepository
   ↓
CharactersRepository
   ↓
SynergyEngine
   ↓
TeamBuilder
   ↓
DamageCalculator
   ↓
AIRecommender
   ↓
ExplanationGenerator
   ↓
RecommendationRepository
   ↓
Response
```

---

## 32. Roadmap de desarrollo

### Fase 1: Preparación del proyecto

- Crear repositorio en GitHub.
- Crear estructura monorepo.
- Crear frontend con Next.js.
- Crear backend con NestJS.
- Configurar TypeScript.
- Configurar PostgreSQL.
- Configurar Prisma.
- Crear README inicial.

### Fase 2: Base de datos inicial

- Crear schema.prisma.
- Crear modelos User, Character, LightCone y UserCharacter.
- Crear enums.
- Ejecutar migración inicial.
- Crear seed con personajes iniciales.
- Crear seed con conos básicos.
- Crear seed con sinergias iniciales.

### Fase 3: Autenticación básica

- Crear módulo auth.
- Crear POST /auth/register.
- Crear POST /auth/login.
- Cifrar contraseña.
- Generar JWT.
- Crear GET /auth/me.
- Proteger rutas privadas.

### Fase 4: Catálogo de personajes

- Crear módulo characters.
- Crear GET /characters.
- Crear GET /characters/:id.
- Crear pantalla de catálogo.
- Mostrar tarjetas de personajes.
- Agregar filtros.

### Fase 5: Personajes del usuario

- Crear módulo user-characters.
- Crear CRUD de personajes del usuario.
- Crear pantalla Mis personajes.
- Crear formulario Agregar personaje.
- Crear formulario Editar personaje.
- Mostrar listado de personajes guardados.

### Fase 6: Motor de sinergias

- Crear package game-engine.
- Crear synergy-engine.ts.
- Calcular sinergia del personaje evaluado con la cuenta del usuario.

### Fase 7: Generador de equipos

- Crear team-builder.ts.
- Definir reglas por arquetipo.
- Formar equipos de máximo 4 personajes.
- Priorizar personajes con mayor sinergia.
- Incluir sustain cuando exista.

### Fase 8: Calculadora de daño

- Crear damage-calculator.ts.
- Implementar fórmula simplificada.
- Calcular daño de personaje.
- Calcular daño de equipo.
- Calcular damageIncreasePercent.

### Fase 9: Modelo de recomendación inteligente

- Crear ai-recommender.
- Crear calculateFinalScore.
- Crear classifyRecommendation.
- Crear calculateConfidence.
- Calcular factorScores.

### Fase 10: Endpoint principal de análisis

- Crear POST /recommendations/analyze.
- Ejecutar flujo completo de análisis.
- Guardar recomendación.
- Devolver respuesta al frontend.

### Fase 11: Pantalla de análisis

- Crear pantalla Analizar personaje.
- Crear selector de personaje.
- Consumir POST /recommendations/analyze.
- Manejar carga y errores.

### Fase 12: Pantalla de resultado

- Mostrar personaje evaluado.
- Mostrar recomendación final.
- Mostrar score.
- Mostrar confianza.
- Mostrar mejor equipo.
- Mostrar explicación.
- Mostrar factorScores.

### Fase 13: Gráficas

- Instalar Recharts.
- Crear gráfica de daño actual vs daño propuesto.
- Crear gráfica de factorScores.
- Crear indicador visual de score.

### Fase 14: Simulador de daño

- Crear módulo simulations.
- Crear POST /simulations/damage.
- Crear GET /simulations.
- Crear pantalla Simulador.
- Mostrar daño actual vs daño simulado.

### Fase 15: Historial de recomendaciones

- Crear GET /recommendations.
- Crear GET /recommendations/:id.
- Crear pantalla Historial.
- Crear pantalla Detalle de recomendación.

### Fase 16: Dashboard principal

- Crear GET /dashboard/summary.
- Mostrar resumen del usuario.
- Agregar accesos rápidos.

### Fase 17: Mejoras visuales

- Mejorar tarjetas.
- Agregar badges.
- Agregar loaders.
- Agregar mensajes de éxito/error.
- Aplicar estilo oscuro moderno.

### Fase 18: Pruebas básicas

Probar:

- Registrar usuario.
- Iniciar sesión.
- Registrar personaje.
- Editar personaje.
- Analizar personaje.
- Ver resultado.
- Simular daño.
- Consultar historial.

---

## 33. Orden recomendado para programar

```txt
1. Crear monorepo
2. Configurar backend
3. Configurar base de datos
4. Crear modelos Prisma
5. Crear seed de personajes
6. Crear auth
7. Crear catálogo de personajes
8. Crear personajes del usuario
9. Crear motor de sinergias
10. Crear generador de equipos
11. Crear calculadora de daño
12. Crear modelo de recomendación
13. Crear endpoint /recommendations/analyze
14. Crear frontend base
15. Crear pantalla Mis personajes
16. Crear pantalla Analizar personaje
17. Crear pantalla Resultado
18. Crear gráficas
19. Crear simulador
20. Crear historial
21. Pulir diseño
22. Preparar presentación
```

---

## 34. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Alcance demasiado grande | MVP limitado |
| Daño inexacto | Usar índice de daño estimado |
| Datos desactualizados | Catálogo editable |
| Recomendaciones subjetivas | Mostrar explicación y confianza |
| Pocos datos del usuario | Nivel de confianza |
| OCR complejo | Dejarlo para fase futura |
| IA pesada | Usar clasificación ligera |

---

## 35. Limitaciones iniciales del MVP

Estas son limitaciones del MVP, no decisiones permanentes:

- No calculará daño exacto del juego.
- No tendrá todos los personajes disponibles al inicio.
- No evaluará todas las reliquias.
- No simulará rotaciones avanzadas inicialmente.
- No tendrá OCR en la primera versión.
- No evaluará de forma avanzada todos los Eidolons y conos promocionales.

---

## 36. Mejoras futuras

En una segunda versión, OmniGacha podría incluir:

- OCR para importar capturas de HoYoLAB.
- Más personajes.
- Más conos de luz.
- Evaluación de Eidolons.
- Evaluación de conos promocionales.
- Recomendaciones por tipo de contenido.
- Optimización de reliquias.
- Comparación entre banners.
- Perfil público de cuenta.
- Mejoras en el modelo de clasificación.
- Entrenamiento con datos simulados o datos reales anonimizados.

---

## 37. Conclusión formal

OmniGacha es una propuesta de sistema inteligente orientado a apoyar la toma de decisiones de jugadores de Honkai: Star Rail al momento de elegir si conviene obtener un personaje, Eidolon o cono de luz. A diferencia de las recomendaciones generales, el sistema busca ofrecer un análisis personalizado basado en los personajes que el usuario ya posee, sus posibles sinergias, la formación de equipos y una estimación comparativa de daño.

El proyecto combina diferentes áreas del desarrollo de software, como gestión de usuarios, bases de datos, análisis de información, visualización mediante gráficas, simulación matemática y un modelo ligero de clasificación. Esto permite construir una solución funcional sin depender de APIs pagas, modelos pesados de inteligencia artificial o computadores de alto rendimiento.

La inteligencia del sistema se basa en un motor propio que analiza variables como la cantidad de equipos compatibles, mejora estimada de daño, valor del rol, nivel de sinergia, inversión requerida y utilidad dentro de la cuenta del usuario. A partir de estos datos, OmniGacha genera una puntuación de conveniencia y clasifica la recomendación en categorías como NO_RECOMENDADO, SITUACIONAL, RECOMENDADO o MUY_RECOMENDADO.

Un aspecto importante del proyecto es su enfoque en la seguridad y confianza del usuario. OmniGacha no accederá directamente a cuentas externas, no solicitará credenciales de HoYoLAB y no pedirá información privada de acceso. Los datos serán ingresados manualmente por el usuario o, en una fase futura, mediante capturas proporcionadas voluntariamente. Esta decisión permite proteger la privacidad del jugador y mantener un modelo de funcionamiento más seguro.

Aunque el sistema no busca replicar con exactitud el motor interno de daño del juego, sí permite comparar escenarios mediante un índice de daño estimado. Esto hace que el usuario pueda visualizar si un personaje mejora o no sus equipos actuales, entendiendo que los resultados son aproximados y sirven como apoyo para la decisión final.

En conclusión, OmniGacha es un proyecto viable, útil y técnicamente defendible para un contexto universitario. Su valor principal está en ofrecer una recomendación personalizada, explicable y visual, usando un enfoque liviano de inteligencia artificial, reglas de análisis, simulación de daño y gráficas comparativas.

---

## 38. Conclusión corta para exposición

OmniGacha es un sistema inteligente de recomendación para jugadores de Honkai: Star Rail. Su objetivo es ayudar al usuario a decidir si le conviene obtener un personaje, Eidolon o cono de luz, teniendo en cuenta los personajes que ya posee, las sinergias posibles, la mejora estimada de daño y el valor del personaje dentro de su cuenta.

El sistema no depende de una IA pesada ni de APIs pagas, sino de un modelo ligero de clasificación, reglas de análisis y simulación matemática. Además, protege la privacidad del usuario porque nunca solicitará credenciales ni accederá directamente a cuentas externas.

---

## 39. Frase final recomendada

```txt
OmniGacha no busca decidir por el jugador, sino darle información clara, visual y personalizada para que pueda tomar mejores decisiones dentro del juego.
```

---

## 40. Prioridad técnica del MVP

Si el tiempo es corto, desarrollar solo esto:

```txt
1. Registrar personajes.
2. Seleccionar personaje a evaluar.
3. Calcular sinergias.
4. Calcular daño estimado.
5. Clasificar recomendación.
6. Mostrar resultado con gráfica.
```

Esto ya demuestra el corazón del sistema.

---

## 41. Resumen ejecutivo

OmniGacha será una aplicación web inteligente que combina reglas de negocio, cálculo estimado de daño, análisis de sinergias y un modelo ligero de clasificación para recomendar si un personaje de Honkai: Star Rail conviene o no según la cuenta del usuario.

Stack recomendado:

```txt
Next.js + NestJS + PostgreSQL + Prisma + Recharts + TypeScript
```

IA recomendada:

```txt
Reglas ponderadas + árbol de decisión conceptual + explicación por plantillas
```

Decisión de seguridad:

```txt
Nunca solicitar credenciales de HoYoLAB ni acceder directamente a cuentas externas.
```

