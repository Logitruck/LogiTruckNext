# RELEASE_CHECKLIST.md — Checklist de deploy a producción

Completar en orden. No hacer deploy hasta que todos los ítems de Fases 1-3 estén marcados.
Responsable: Humano — confirma cada fase antes de continuar.

---

## Fase 1 — Código

- [ ] **PR aprobado y mergeado a `main`**
- [ ] **`git status` limpio en `main`** — sin cambios no commiteados
  ```bash
  git status
  ```
- [ ] **REVIEW_CHECKLIST completado** para todos los cambios del release — sin ítems bloqueados
- [ ] **`ARCHITECTURE.md` actualizado** si hubo cambios estructurales (nuevos módulos, collections, hooks, functions)
- [ ] **Fecha de `ARCHITECTURE.md` actualizada** — `Última actualización: YYYY-MM-DD`

---

## Fase 2 — Tests

- [ ] **`npm test` pasa completo en `main`** — sin errores, sin timeouts
  ```bash
  npm test
  ```
- [ ] **Sin regresiones** — todos los tests pre-existentes pasan, no solo los nuevos
- [ ] **Opcional — cobertura no bajó en zonas críticas:**
  ```bash
  npm run test:coverage
  ```
  Zonas críticas (prioridad 1): hooks de `carrier/`, `driver/`, `finder/`

---

## Fase 3 — Cloud Functions

> Saltar esta fase si no hubo cambios en `functions/`.

- [ ] **¿Hay cambios en `functions/`?**
  ```bash
  git diff main~1..main -- functions/
  ```

- [ ] **Probadas en emulador sin errores de carga ni de runtime**
  ```bash
  firebase emulators:start --only functions,firestore --project logitruck-f6e40
  ```
  → Verificar en los logs que las 32 funciones cargan sin `Cannot find module` ni errores de inicialización

- [ ] **¿Hay nuevas functions que usan OpenAI?**
  - [ ] Secret `OPENAI_API_KEY` configurado en Firebase Secret Manager:
    ```bash
    firebase functions:secrets:set OPENAI_API_KEY --project logitruck-f6e40
    ```
  - [ ] Usan `defineSecret('OPENAI_API_KEY')` + `secrets: [openAIKey]` en las opciones

- [ ] **¿Hay nuevas functions?**
  - [ ] Registradas en `functions/index.js`
  - [ ] No se registraron funciones LEGACY

- [ ] **`firebase.json` apunta al source correcto:**
  ```json
  { "source": "functions", "codebase": "logitruck" }
  ```

- [ ] **Deploy de functions:**
  ```bash
  firebase deploy --only functions --project logitruck-f6e40
  ```
- [ ] **Deploy exitoso** — `✔ Deploy complete!` en el output — verificar en Firebase Console

---

## Fase 4 — App nativa

> Saltar si no hubo cambios en `app.json` plugins, `package.json` native deps, o `ios/`/`android/`.

- [ ] **¿Hay nuevas dependencias nativas o cambios en `app.json` plugins?**

- [ ] **`expo prebuild` ejecutado** (si cambiaron plugins):
  ```bash
  npx expo prebuild --clean
  ```
  ⚠️ `--clean` borra `ios/` y `android/` — restaurar credenciales Firebase después

- [ ] **Credenciales Firebase restauradas** después del `--clean`:
  ```bash
  # Copiar desde ubicación segura
  cp /ruta/segura/GoogleService-Info.plist ./   # iOS
  cp /ruta/segura/google-services.json ./        # Android
  ```

- [ ] **`pod install` ejecutado** (iOS):
  ```bash
  cd ios && pod install && cd ..
  ```

- [ ] **Build de iOS sin errores:**
  ```bash
  eas build --platform ios
  ```

- [ ] **Build de Android sin errores:**
  ```bash
  eas build --platform android
  ```

---

## Fase 5 — Secrets y configuración

- [ ] **No hay secrets hardcodeados** en el historial de git:
  ```bash
  git log --all -p | grep -E "sk-proj-|sk-[a-zA-Z0-9]{20,}|AIza"
  ```
  → Cualquier resultado: parar y limpiar el historial

- [ ] **Firebase project ID correcto** (`logitruck-f6e40`) en `firebase.json` y `app.json`

- [ ] **Google Maps API key activa** en `app.json` → `android.config.googleMaps.apiKey`

- [ ] **Firebase App IDs correctos:**
  - iOS bundle: `ai.logitruck.LogiTruckNext`
  - Android package: `ai.logitruck.LogiTruckNext`
  - EAS Project ID: `122d55d5-6bff-46c2-a9a8-81fe60936b70`

---

## Fase 6 — Submit a stores (solo releases de app)

> Solo si hay cambio visible en la app — no necesario para releases de solo Cloud Functions.

- [ ] **Build de iOS subido a TestFlight / App Store:**
  ```bash
  eas submit --platform ios
  ```
- [ ] **Build de Android subido a Google Play:**
  ```bash
  eas submit --platform android
  ```

---

## Post-deploy — verificación

- [ ] **Cloud Functions en producción** — Firebase Console → Functions → revisar logs (sin cold start errors)
- [ ] **Smoke test en dispositivo real** — flujo crítico de cada rol afectado por el release
  - [ ] Carrier: flujo de ofertas / deals / inspecciones (según scope)
  - [ ] Driver: job activo / tracking / inspección (según scope)
  - [ ] Finder: crear solicitud / ver deals / proyectos (según scope)
- [ ] **Sin errores en Firestore** — Firebase Console → Firestore → verificar estructura de documentos
- [ ] **Sin errores en Crashlytics / logs** — primeras 15 minutos post-deploy

---

*Deploy bloqueado si cualquier ítem de Fases 1-3 no está completado.*
*Fases 4-6 aplican solo según el scope del release.*
