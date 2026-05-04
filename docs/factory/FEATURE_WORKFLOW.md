# FEATURE_WORKFLOW.md — Flujo completo de una feature

Proceso obligatorio para cualquier feature nueva en LogiTruckNext.
No saltarse pasos. Los checkpoints (🛑) requieren respuesta humana antes de continuar.

---

## Resumen visual

```
Tú: Completa TASK_TEMPLATE
          ↓
Opus: Analiza impacto (lee código, CLAUDE.md, ARCHITECTURE.md)
          ↓
     🛑 Checkpoint — tú apruebas el plan
          ↓
Opus: Genera tests → los corre → verifica 🔴 red
          ↓
Claude Code: Implementa → corre tests → verifica 🟢 green
          ↓
Opus + Tú: REVIEW_CHECKLIST completo
          ↓
Tú: PR → merge a main
          ↓
Tú: RELEASE_CHECKLIST → deploy
          ↓
Opus: Actualiza ARCHITECTURE.md
```

---

## Paso 1 — Describir la feature

**Responsable:** Tú  
**Herramienta:** `docs/factory/TASK_TEMPLATE.md`

Copiar el template y completar:
- Descripción en lenguaje de negocio (no técnico)
- Rol(es) afectado(s): Carrier / Driver / Finder / Todos
- Zona de impacto: 🟢 LIBRE / 🟡 CONTROLADA / 🔴 PROTEGIDA
- Criterios de éxito medibles y verificables
- Tests requeridos (tabla de casos a cubrir)
- Archivos que NO tocar

**Output esperado:** `docs/factory/TASK_TEMPLATE.md` completado (o copia en el chat).

---

## Paso 2 — Manager Agent analiza el impacto

**Responsable:** Manager Agent (Opus)  
**Input:** TASK_TEMPLATE completado

Opus lee en este orden:
1. El TASK_TEMPLATE completado
2. `CLAUDE.md` (patrones, gotchas, reglas del proyecto)
3. `ARCHITECTURE.md` (§9 zonas protegidas, §15 functions, rol afectado)
4. Los archivos concretos que la feature tocará

Analiza:
- ¿Qué archivos crea / modifica la feature?
- ¿Alguno es zona PROTEGIDA no contemplada en el template?
- ¿Hay riesgo de regresión en `src/core/`, `src/modules/`, o Firestore triggers?
- ¿Se requiere `expo prebuild`? (nueva dep nativa o cambio en `app.json`)
- ¿Se requiere deploy de functions? (nueva o modificada Cloud Function)
- ¿Los tests propuestos cubren los criterios de éxito?

**Output esperado:** plan detallado con:
- Lista ordenada de archivos a crear / modificar
- Orden de trabajo (siempre: tests primero → implementación)
- Alertas si hay zona protegida o riesgo no contemplado
- Comandos necesarios (prebuild, emulador, deploy)
- Estimación de archivos de test a generar en Paso 4

---

## 🛑 Paso 3 — Checkpoint: tú apruebas el plan

**Responsable:** Tú  

Revisar el plan de Manager Agent:
- ¿El scope es el correcto? ¿No hay archivos inesperados?
- ¿Las zonas de riesgo están bien identificadas?
- ¿Los criterios de éxito son los correctos?
- ¿Los tests propuestos cubren los casos del negocio?

**Opciones:**
- ✅ **Aprobar** → continuar al Paso 4
- ✏️ **Ajustar** → devolver al Manager Agent con feedback concreto
- ❌ **Cancelar** → descartar y volver al Paso 1

> **Manager Agent NO escribe ninguna línea de código hasta recibir aprobación aquí.**
> No hay excepciones — ni para bugfixes urgentes (ver §Excepciones).

---

## Paso 4 — Manager Agent genera los tests (🔴 red)

**Responsable:** Manager Agent (Opus)  
**Input:** plan aprobado + TASK_TEMPLATE

Opus genera los archivos de test **antes** de cualquier implementación.

**Patrón obligatorio para hooks con Firestore:**
```typescript
// src/<rol>/hooks/__tests__/<hook>.test.ts

import { renderHook, waitFor, act } from '@testing-library/react-native'
// NO importar de '@testing-library/react-hooks' — deprecado, no soporta React 19

const mockUnsubscribe = jest.fn()
const mockOnSnapshot = jest.fn()
const mockGetDoc = jest.fn()

jest.mock('firebase/firestore', () => ({
  onSnapshot: mockOnSnapshot,
  getDoc: mockGetDoc,
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
}))

describe('useNuevoHook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retorna loading: true mientras fetcha', async () => {
    mockOnSnapshot.mockImplementation((ref, onNext) => {
      // no llama onNext inmediatamente — simula loading
      return mockUnsubscribe
    })
    const { result } = renderHook(() => useNuevoHook())
    expect(result.current.loading).toBe(true)
  })

  it('retorna data correcta en happy path', async () => {
    mockOnSnapshot.mockImplementation((ref, onNext) => {
      onNext({ docs: [{ id: '1', data: () => ({ campo: 'valor' }) }] })
      return mockUnsubscribe
    })
    const { result } = renderHook(() => useNuevoHook())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toHaveLength(1)
  })

  it('retorna error si Firestore falla', async () => {
    mockOnSnapshot.mockImplementation((ref, onNext, onError) => {
      onError(new Error('Network error'))
      return mockUnsubscribe
    })
    const { result } = renderHook(() => useNuevoHook())
    await waitFor(() => expect(result.current.error).toBeTruthy())
  })

  it('limpia el listener al unmount', async () => {
    mockOnSnapshot.mockImplementation((ref, onNext) => {
      onNext({ docs: [] })
      return mockUnsubscribe
    })
    const { unmount } = renderHook(() => useNuevoHook())
    await waitFor(() => {})
    act(() => unmount())
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
```

**Verificar que los tests fallan (🔴 red) — si pasan, están mal escritos:**
```bash
npm test -- --testPathPattern=<nombre-del-hook>
```

**Output esperado:** archivos de test creados, todos fallando con `FAIL`.

---

## Paso 5 — Code Agent implementa (🟢 green)

**Responsable:** Code Agent (Claude Code / Sonnet)  
**Input:** archivos de test en rojo + plan aprobado

Code Agent implementa respetando:
- Hook contract de CLAUDE.md: `{ data, loading, error }` + `try/catch/finally`
- Colocation: `NuevaScreen/index.tsx` + `styles.ts` + `types.ts`
- i18n: `localized()` — no strings raw
- Theme: `useTheme()` y `useSpacing()` — no valores hardcodeados
- Firestore listeners: `return () => unsubscribe()` en cleanup
- TypeScript: sin `any` donde hay tipo disponible

**Regla crítica:** Si Code Agent encuentra una zona PROTEGIDA o un cambio de scope no planeado → para y escala a Manager Agent → que escala al humano. No improvisar.

**Verificar que los tests pasan (🟢 green):**
```bash
npm test -- --testPathPattern=<nombre-del-hook>
```

**Verificar que no hay regresiones:**
```bash
npm test
```

**Verificar TypeScript:**
```bash
npx tsc --noEmit
```

**Output esperado:** implementación completa, todos los tests en verde, sin regresiones.

---

## Paso 6 — REVIEW_CHECKLIST

**Responsable:** Manager Agent + Tú  
**Herramienta:** `docs/factory/REVIEW_CHECKLIST.md`

Recorrer el checklist completo en orden:

1. **Tests** — TDD verificado, patrones correctos, cobertura de casos
2. **Seguridad** — sin secrets hardcodeados, `defineSecret` en functions con OpenAI
3. **Zonas protegidas** — nada fuera del plan aprobado
4. **Patrones de código** — hooks, listeners, i18n, theme, colocation
5. **TypeScript** — `npx tsc --noEmit` sin errores
6. **Dependencias nativas** — prebuild planeado si aplica
7. **Cloud Functions** — emulador, secrets, `functions/index.js` correcto

Si algún ítem falla → volver al Paso 5 con feedback específico.

---

## Paso 7 — PR

**Responsable:** Tú  

```bash
# Crear branch desde main
git checkout -b feat/<nombre-feature>

# Commits: tests primero, implementación después
git add src/<rol>/hooks/__tests__/<hook>.test.ts
git commit -m "test: agregar tests para <hook> (red)"

git add src/<rol>/hooks/<hook>.ts ...
git commit -m "feat: <descripción en lenguaje de negocio>"

# PR
gh pr create --title "feat: <título corto>" --body "$(cat <<'EOF'
## Qué resuelve
<descripción del TASK_TEMPLATE>

## Rol(es) afectado(s)
<Carrier / Driver / Finder>

## Criterios de éxito cumplidos
- [ ] <criterio 1 del TASK_TEMPLATE>
- [ ] <criterio 2>
- [ ] npm test pasa sin regresiones

## REVIEW_CHECKLIST
- [ ] Tests: TDD, patrones, cobertura
- [ ] Seguridad: sin secrets hardcodeados
- [ ] TypeScript: sin errores
- [ ] Zonas protegidas: respetadas

🤖 Generated with Claude Code
EOF
)"
```

---

## Paso 8 — Deploy

**Responsable:** Tú  
**Herramienta:** `docs/factory/RELEASE_CHECKLIST.md`

Seguir RELEASE_CHECKLIST en orden:

1. **Fase 1 — Código:** PR mergeado a `main`, `git status` limpio
2. **Fase 2 — Tests:** `npm test` pasa en `main`
3. **Fase 3 — Cloud Functions:** emulador → deploy (si hubo cambios en `functions/`)
4. **Fase 4 — App nativa:** `expo prebuild` → EAS build (solo si hay cambios nativos)
5. **Fase 5 — Secrets:** no hay hardcoded, Firebase project IDs correctos
6. **Post-deploy:** smoke test en dispositivo real por cada rol afectado

---

## Paso 9 — Actualizar ARCHITECTURE.md

**Responsable:** Manager Agent  
**Condición:** si la feature introdujo cambios estructurales

Actualizar las secciones correspondientes:

| Cambio | Sección a actualizar |
|--------|---------------------|
| Nueva Firestore collection | §7 Firebase collections |
| Nuevo módulo en `src/modules/` | §4 Feature Modules |
| Nuevo hook en un rol | §2.X (tabla de hooks del rol) |
| Nueva Cloud Function | §15 estructura + tabla de clasificación |
| Nueva dependencia relevante | §1 Stack tecnológico |
| Nuevo archivo >500 líneas | §9 Zona protegida |
| Cambio en navegación | §5 Navigation |

```bash
# Siempre actualizar la fecha al final
# Última actualización: 2026-XX-XX
```

---

## Excepciones

| Situación | Acción permitida |
|-----------|-----------------|
| **Bugfix urgente en producción** | Paso 1 abreviado con bug description. Igual requiere test antes del fix (Paso 4). Checkpoint simplificado. |
| **Feature puramente visual** (solo `styles.ts` o copy) | Zona 🟢 LIBRE — Code Agent puede proceder desde Paso 5 con aprobación verbal en el chat. |
| **Nuevo secret / API key detectado** | Detener todo — configurar en Secret Manager antes de continuar. No hay excepción. |
| **Zona PROTEGIDA detectada en Paso 5** | Code Agent para. Escala a Manager Agent. Manager Agent escala al humano. No improvisar. |
| **Refactor de deuda técnica** (sin nueva feature) | Igual flujo completo. La deuda no exime de tests. |

---

*Este documento es la ley del proceso. Si hay ambigüedad, el humano desempata.*
