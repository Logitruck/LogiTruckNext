# REVIEW_CHECKLIST.md — Checklist de revisión de código

Completar antes de aprobar cualquier PR o implementación.
Manager Agent lo ejecuta en el Paso 6 del flujo. Un solo ítem marcado ❌ bloquea el merge.

---

## 1. Tests (TDD verificado)

- [ ] **¿El test fue escrito ANTES de la implementación?**
  → Verificar en `git log` que el commit de tests precede al de implementación
- [ ] **¿`npm test` pasa completo sin errores ni timeouts?**
  ```bash
  npm test
  ```
- [ ] **¿Los nuevos tests cubren los casos del TASK_TEMPLATE?**
  - [ ] Happy path — datos correctos
  - [ ] Estado `loading: true` durante el fetch
  - [ ] Estado `error` cuando Firestore falla
  - [ ] Cleanup del listener en unmount (si el hook usa `onSnapshot`)
- [ ] **¿Se usó `renderHook` de `@testing-library/react-native`?**
  (No de `@testing-library/react-hooks` — deprecado, no soporta React 19)
- [ ] **¿Se llamó `jest.clearAllMocks()` en `beforeEach`?**
- [ ] **¿El mock de Firestore sigue el patrón de CLAUDE.md §Testing?**
  ```typescript
  mockOnSnapshot.mockImplementation((ref, onNext) => {
    onNext({ docs: [...] })
    return mockUnsubscribe
  })
  await waitFor(() => expect(result.current.loading).toBe(false))
  act(() => unmount())
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  ```

---

## 2. Seguridad

- [ ] **¿Hay API keys, tokens o secrets hardcodeados en el código?**
  ```bash
  grep -rn "sk-\|AIza\|apiKey.*['\"][a-zA-Z0-9_\-]\{20,\}" src/ functions/
  ```
  → Si hay resultados: ❌ **BLOQUEADO** — mover a `defineSecret()` o variable de entorno

- [ ] **¿Las nuevas Cloud Functions que usan OpenAI tienen `secrets: [openAIKey]`** en sus opciones?
  ```javascript
  exports.miFunction = onCall({ secrets: [openAIKey] }, async (req) => { ... })
  ```

- [ ] **¿`functions/.env.local` está en `functions/.gitignore`?**
  ```bash
  grep ".env.local" functions/.gitignore
  ```

- [ ] **¿No se commitearon archivos `.env`, `.env.local` o de credenciales?**
  ```bash
  git status --short | grep -E "\.env|\.plist|google-services"
  ```

---

## 3. Zonas protegidas

- [ ] **¿El cambio toca algún archivo de la zona 🔴 PROTEGIDA que no estaba en el plan aprobado?**
  Ver AGENTS.md §PROTEGIDA o ARCHITECTURE.md §9
  → Si toca zona protegida sin estar en el plan: ❌ **BLOQUEADO** — escalar al humano

- [ ] **¿Se modificó `functions/index.js`?**
  - [ ] ¿El nuevo export apunta a un archivo real en `functions/app/` o `functions/triggers/`?
  - [ ] ¿No se registraron funciones LEGACY del repo `LogiFunctionsV2`?

- [ ] **¿Se modificó `app.json`?**
  - [ ] ¿Está planeado el `expo prebuild` + rebuild nativo?
  - [ ] ¿Están listas las credenciales Firebase (`GoogleService-Info.plist`, `google-services.json`)?

- [ ] **¿Se modificó algún slice de `src/redux/`?**
  → Requiere aprobación humana explícita

- [ ] **¿Se importó algún archivo con "copy" en el nombre?**
  → ❌ Dead code — no importar

---

## 4. Patrones de código

- [ ] **¿Los nuevos hooks siguen el contrato estándar?**
  ```typescript
  const useMiHook = () => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    // ...
    return { data, loading, error }
  }
  ```

- [ ] **¿Los listeners de Firestore hacen cleanup en `useEffect`?**
  ```typescript
  useEffect(() => {
    const unsubscribe = onSnapshot(query, handler)
    return () => unsubscribe()
  }, [])
  ```

- [ ] **¿Se usó `localized()` para todos los strings de UI?**
  No hay strings raw en JSX/TSX

- [ ] **¿Se usó `useTheme()` y `useSpacing()`?**
  No hay colores o valores de espaciado hardcodeados

- [ ] **¿La colocation de archivos es correcta?**
  ```
  NuevaScreen/
    index.tsx
    styles.ts
    types.ts   (si aplica)
  ```

- [ ] **¿Los barrel exports del directorio van por `index.ts`?**

- [ ] **¿El nuevo hook tiene su test en `src/<rol>/hooks/__tests__/`?**

---

## 5. TypeScript

- [ ] **¿El proyecto compila sin errores de TypeScript?**
  ```bash
  npx tsc --noEmit
  ```
- [ ] **¿No hay uso de `any` donde hay un tipo disponible?**
- [ ] **¿Los tipos nuevos están en `src/types/` o colocados con su componente?**

---

## 6. Dependencias nativas

- [ ] **¿Se agregó una nueva dependencia nativa a `package.json` root?**
  → [ ] ¿Es compatible con Expo 55 / React Native 0.83.2?
  → [ ] ¿Está planeado `npx expo prebuild` antes del siguiente build?
  → [ ] ¿Está planeado `pod install` en iOS?

- [ ] **¿Se modificó `app.json` plugins?**
  → Requiere `npx expo prebuild` — no editar `ios/` o `android/` directamente

---

## 7. Cloud Functions

- [ ] **¿Se agregaron nuevas Cloud Functions?**
  - [ ] Registradas en `functions/index.js` con el nombre correcto
  - [ ] Probadas en el emulador sin errores de carga ni de runtime:
    ```bash
    firebase emulators:start --only functions,firestore --project logitruck-f6e40
    ```
  - [ ] Si usan OpenAI: `defineSecret('OPENAI_API_KEY')` + `secrets: [openAIKey]`
  - [ ] Si necesitan nueva dependencia: agregada a `functions/package.json` + `npm install` en `functions/`

- [ ] **¿Se modificaron Cloud Functions existentes?**
  - [ ] Probadas en el emulador sin regresiones
  - [ ] El comportamiento es consistente con lo que la app RN espera (`httpsCallable`)

---

## 8. PR

- [ ] **¿El título del PR describe el cambio en términos de negocio?**
  (Ej: "feat: driver puede adjuntar foto de ticket de entrega")
- [ ] **¿El PR no mezcla features no relacionadas?**
- [ ] **¿ARCHITECTURE.md está actualizado** si hay nuevos módulos, collections, hooks o functions?
- [ ] **¿El PR body incluye** los criterios de éxito del TASK_TEMPLATE cumplidos?

---

*Un solo ítem marcado ❌ bloquea el merge. No hay excepciones.*
