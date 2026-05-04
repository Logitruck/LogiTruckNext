# AGENTS.md — Sistema de agentes LogiTruckNext

## Jerarquía

```
Tú (humano)
  └── Manager Agent (Opus)
        ├── Code Agent (Claude Code / Sonnet)
        ├── Research Agent (Tavily)
        └── Subagentes de dominio
              ├── Copy Agent
              ├── UX Agent
              └── Strategy Agent
```

---

## Manager Agent (Opus)

**Responsabilidades:**
- Analizar features con TASK_TEMPLATE antes de cualquier implementación
- Verificar que el plan no toca zonas protegidas sin aprobación humana
- Generar los tests (🔴 red) antes de que Code Agent implemente (🟢 green)
- Coordinar el orden: tests → implementación → review → PR
- Actualizar ARCHITECTURE.md cuando hay cambios estructurales
- Detener el flujo si detecta zona protegida no planeada

**Límites estrictos:**
- NO toma decisiones sobre zonas protegidas sin checkpoint humano
- NO inicia implementación antes de la aprobación del Paso 3
- NO agrega dependencias nativas sin señalar que se requiere prebuild
- NO registra funciones en `functions/index.js` sin análisis previo
- NO genera código con secrets hardcodeados bajo ninguna circunstancia

---

## Code Agent (Claude Code / Sonnet)

### 🟢 LIBRE — puede tocar sin permiso adicional

- Archivos nuevos en `src/carrier/`, `src/driver/`, `src/finder/` (hooks, screens)
- Archivos `styles.ts` en cualquier componente
- Archivos `__tests__/` (crear y editar tests)
- `src/translations/` (agregar keys i18n)
- Archivos nuevos en `functions/app/` o `functions/triggers/`
- Archivos nuevos en `src/modules/` (módulos nuevos — no editar existentes)

### 🟡 CONTROLADA — necesita plan aprobado de Manager Agent

- Editar archivos existentes en `src/core/`
- Modificar hooks existentes en `src/modules/` (inspections, contracts, projects)
- `functions/app/chat/chatv2.js` o cualquier archivo en `functions/triggers/`
- Añadir rutas en role navigators
- Nueva Firestore collection o cambio de schema existente
- `src/config/` (tabs, drawer menus, thresholds)
- `functions/package.json` (nuevas dependencias de functions)

### 🔴 PROTEGIDA — nunca toca sin aprobación humana explícita

**Archivos >500 líneas** (ARCHITECTURE.md §9):

| Archivo | Líneas | Rol |
|---------|--------|-----|
| `src/core/chat/IMChatScreen/IMChatScreen.tsx` | ~1064 | Core — Chat |
| `src/driver/screens/InspectionScreen/InspectionScreen.tsx` | ~1002 | Driver |
| `src/carrier/screens/PreviewInspectionScreen/PreviewInspectionScreen.tsx` | ~970 | Carrier |
| `src/carrier/screens/RequestDetailsScreen/RequestDetailsScreen.tsx` | ~955 | Carrier |
| `src/driver/screens/HomeDriverScreen/HomeDriverScreen.tsx` | ~807 | Driver |
| `src/carrier/screens/InspectionRepairScreen/InspectionRepairScreen.tsx` | ~641 | Carrier |
| `src/driver/screens/DriverInspectionsHomeScreen.tsx` | ~578 | Driver |
| `src/modules/projects/screens/ProjectDetailsScreen.tsx` | ~569 | Projects |
| `src/driver/screens/HomeTrackingScreen/HomeTrackingScreen.tsx` | ~552 | Driver |
| `src/modules/inspections/hooks/useUploadSignedInspectionReport.ts` | ~536 | Inspections |

**Siempre protegidos independientemente del tamaño:**

- `app.json` — cambios en plugins requieren `expo prebuild` + rebuild nativo
- `src/core/firebase/config.ts` — Firebase init, IDs de proyecto
- `src/redux/` — todos los slices (`legacy_createStore` en uso; migración planificada)
- `functions/index.js` — registro central de las 32 funciones activas
- `ios/` y `android/` — generados por `expo prebuild`; nunca editar directamente
- Archivos con "copy" en el nombre — dead code, no importar ni editar
- `package.json` root — deps nativas activan `expo prebuild`
- Secrets / API keys en cualquier archivo

### Reglas siempre activas

- `defineSecret()` o variables de entorno — nunca hardcodear keys
- `localized()` de `useTranslations()` — nunca strings raw en UI
- `useTheme()` y `useSpacing()` — nunca valores hardcodeados
- Hook contract: `{ data, loading, error }` + `try/catch/finally` + `setLoading`
- Firestore listeners: retornar `unsubscribe` en `useEffect` cleanup
- `renderHook` de `@testing-library/react-native` — no de `@testing-library/react-hooks`
- `jest.clearAllMocks()` en `beforeEach`

---

## Research Agent (Tavily)

**Se activa cuando:**
- Incompatibilidad de librería con Expo 55 / React Native 0.83.2
- Verificar API de Firebase Admin v11+ o Firebase Web SDK v12+
- API correcta de OpenAI SDK v6+ (Responses API, Assistants API)
- Evaluar una dependencia nativa nueva antes de agregarla
- Error de build iOS/Android sin solución evidente en el codebase

**No reemplaza:** CLAUDE.md y ARCHITECTURE.md — leerlos siempre primero.

---

## Subagentes de dominio

### Copy Agent
- **Scope:** strings de UI, microcopy, textos de error, labels
- **Patrón:** agregar keys a `src/translations/`, envolver en `localized()`
- **Activa cuando:** feature tiene nuevos textos de interfaz
- **Regla:** ningún string raw en JSX/TSX — siempre `localized()`

### UX Agent
- **Scope:** `styles.ts`, layout, espaciado, colores del theme
- **Patrón:** `useTheme()` y `useSpacing()` — sin valores hardcodeados
- **Activa cuando:** feature requiere nueva pantalla o componente visual
- **Regla:** no editar `src/core/dopebase/` sin aprobación humana

### Strategy Agent
- **Scope:** nuevas Firestore collections, nuevos módulos cross-rol, migraciones arquitectónicas (ej: Redux legacy → RTK, chatv2 → v3)
- **Activa cuando:** feature requiere cambios estructurales que afectan múltiples roles
- **Produce:** documento de decisión antes de que Manager Agent genere el plan

---

## Reglas de comunicación entre agentes

| De | A | Qué se comunica |
|----|---|-----------------|
| Humano | Manager Agent | Feature descrita en TASK_TEMPLATE |
| Manager Agent | Humano | Plan de implementación — espera aprobación (Checkpoint) |
| Manager Agent | Code Agent | Plan aprobado + archivos de test generados |
| Code Agent | Manager Agent | Bloqueadores o scope inesperado detectado |
| Manager Agent | Research Agent | Consulta específica con contexto del stack real |
| Cualquier agente | Humano | Zona PROTEGIDA no planeada detectada → parar inmediatamente |

---

## Mapa de zonas — referencia rápida

| Zona | Ejemplos representativos | Acción al detectar |
|------|--------------------------|-------------------|
| 🔴 PROTEGIDA | Archivos >500 líneas, `app.json`, `redux/`, `functions/index.js`, `ios/`, `android/` | Parar — escalar al humano |
| 🟡 CONTROLADA | `src/core/`, `functions/triggers/`, role navigators, Firestore schema | Requiere plan aprobado de Manager Agent |
| 🟢 LIBRE | Hooks nuevos, screens nuevas, `styles.ts`, `__tests__/`, translations | Code Agent procede directamente |
