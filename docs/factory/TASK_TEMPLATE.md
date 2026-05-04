# TASK_TEMPLATE.md

Copiar y completar este template antes de iniciar cualquier feature.
Manager Agent (Opus) lo usa como input para el análisis de impacto en el Paso 2.

---

## Feature: [Nombre corto en lenguaje de negocio]

### Descripción en lenguaje de negocio
> ¿Qué problema del usuario resuelve? ¿Por qué es necesario ahora?

[2-4 oraciones desde la perspectiva del usuario. Sin términos técnicos.]

---

### Rol afectado

- [ ] **Carrier** — dispatcher / fleet manager (`src/carrier/`)
- [ ] **Driver** — conductor (`src/driver/`)
- [ ] **Finder** — shipper / cargo owner (`src/finder/`)
- [ ] **Todos los roles** — módulo cross-rol (`src/modules/`)
- [ ] **Solo backend** — Cloud Functions (`functions/`)

---

### Zona de impacto (marcar todas las que aplican)

**🟢 LIBRE — Code Agent puede proceder directamente:**
- [ ] Nueva screen en `src/<rol>/screens/`
- [ ] Nuevo hook en `src/<rol>/hooks/`
- [ ] Nuevos archivos `styles.ts`
- [ ] Nuevos strings i18n en `src/translations/`
- [ ] Nuevos tests en `src/<rol>/hooks/__tests__/`
- [ ] Nueva Cloud Function en `functions/app/`

**🟡 CONTROLADA — requiere plan aprobado de Manager Agent:**
- [ ] Modificar hook existente en `src/modules/` (inspections, contracts, projects, vehicleExpenses, aiSupport)
- [ ] Modificar archivos en `src/core/` (chat, components, notifications, media)
- [ ] Añadir ruta en un role navigator (Carrier / Driver / Finder)
- [ ] Nueva Firestore collection o cambio de schema existente
- [ ] Modificar `functions/app/chat/chatv2.js` o archivos en `functions/triggers/`
- [ ] Nueva dependencia en `functions/package.json`
- [ ] Modificar `src/config/` (tabs, drawer menus, thresholds de ConfigProvider)

**🔴 PROTEGIDA — requiere aprobación humana explícita antes de cualquier cambio:**
- [ ] Archivos >500 líneas (ver ARCHITECTURE.md §9 y AGENTS.md §Code Agent)
- [ ] `app.json` → requiere `expo prebuild` + rebuild nativo
- [ ] `src/core/firebase/config.ts`
- [ ] `src/redux/` (cualquier slice — `auth`, `trip`, `ride`, `finderRequestPackage`, `bottomSheet`, `operationSheet`)
- [ ] `functions/index.js`
- [ ] Nueva dependencia nativa en `package.json` root → requiere `expo prebuild`

---

### Criterios de éxito medibles
> Comportamiento observable y verificable. No "debería funcionar bien".

1. [ ] [Ej: "Hook `useNuevoHook` retorna `{ data: Request[], loading: boolean, error: Error | null }`"]
2. [ ] [Ej: "Screen renderiza correctamente para el rol X sin errores de TypeScript"]
3. [ ] [Ej: "Cloud Function `nuevaFunction` retorna `{ success: true }` con auth válida"]
4. [ ] [Ej: "Cloud Function `nuevaFunction` lanza `unauthenticated` sin auth"]
5. [ ] [`npm test` pasa completo sin regresiones en tests existentes]

---

### Tests requeridos ANTES de implementar (TDD — 🔴 red first)

Manager Agent genera estos archivos en el Paso 4. Completar la tabla aquí como guía:

| Caso de test | Archivo destino | Descripción |
|--------------|-----------------|-------------|
| Happy path | `src/<rol>/hooks/__tests__/<hook>.test.ts` | Retorna data correcta |
| Loading state | `src/<rol>/hooks/__tests__/<hook>.test.ts` | `loading: true` durante fetch |
| Error state | `src/<rol>/hooks/__tests__/<hook>.test.ts` | `error` cuando Firestore falla |
| Listener cleanup | `src/<rol>/hooks/__tests__/<hook>.test.ts` | `unsubscribe` llamado en unmount |
| [Caso adicional] | | |

**Patrón base de mocking Firestore** (ver CLAUDE.md §Testing para el patrón completo):
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

### Archivos que NO tocar
> Listar explícitamente cualquier archivo adyacente que NO debe modificarse.

- `[ruta/archivo.tsx]` — razón explícita (ej: "zona protegida, >500 líneas")
- `[ruta/archivo.tsx]` — razón explícita
- `functions/index.js` — no registrar nada hasta que Manager Agent lo valide

---

### Dependencias y consideraciones

**¿Requiere nueva dependencia nativa?**
- [ ] No
- [ ] Sí — `[nombre del paquete]`
  → Verificar compatibilidad con Expo 55 / RN 0.83.2 (Research Agent si hay duda)
  → **Requiere: `npm install` → `npx expo prebuild` → `pod install` → rebuild**

**¿Requiere nueva Cloud Function?**
- [ ] No
- [ ] Sí — `[nombre de la function]`
  → Registrar en `functions/index.js` al final
  → **Requiere: probar en emulador → `firebase deploy --only functions --project logitruck-f6e40`**

**¿Requiere nuevo secret o API key?**
- [ ] No
- [ ] Sí — `[NOMBRE_SECRET]`
  → **Configurar con: `firebase functions:secrets:set NOMBRE_SECRET --project logitruck-f6e40`**
  → Usar `defineSecret('NOMBRE_SECRET')` en el archivo de la function

**¿Toca Firestore?**
- [ ] No
- [ ] Solo lectura — collection `[nombre]`
- [ ] Lectura + escritura — collection `[nombre]`
- [ ] Nueva collection — `[nombre]` → 🟡 Zona CONTROLADA

**¿Hay cambios de navegación?**
- [ ] No
- [ ] Sí — rol `[Carrier/Driver/Finder]`, nueva ruta `[nombre]` → 🟡 Zona CONTROLADA

---

### Notas adicionales

[Contexto extra, dependencias de otras features en curso, deuda técnica relacionada,
decisiones arquitectónicas previas que afectan este trabajo]

---

*Manager Agent no inicia el Paso 2 sin este template completado.*
