# Feature: Carrier Admin Onboarding Wizard

**Created:** 2026-05-08  
**Last updated:** 2026-05-08 | Session: S54  
**Owner:** Juan Moreno  
**Status:** [x] In Progress

---

## Overview

Separar el role `carrier` (dueño/superadmin de la empresa) del role `dispatch` (operativo).
El carrier admin tiene su propio navigator con un wizard obligatorio que configura la empresa
de forma guiada (dispatch users, drivers, trucks, trailers, sedes, contacto de notificaciones).
El mismo wizard se convierte en el panel de administración del día a día después del onboarding.

---

## Design Decisions

- **UX**: Drawer Navigator (macro) + StatusTabs (wizard/admin de empresa)
- **Onboarding state**: campo `onboarding{}` dentro de `vendors/{vendorID}` — no colección nueva
- **Wizard steps**: libre (usuario puede navegar entre tabs), no secuencial bloqueante
- **After onboarding**: misma pantalla `CompanySetupScreen`, mismos tabs — solo cambia el contenido de cada step (gestión vs formulario de creación)
- **CarrierProjectSetupScreen**: es el gold reference y plantilla directa para `CompanySetupScreen`
- **SetupStepPersonnel / SetupStepResources**: adaptables directamente para steps de dispatch/drivers/trucks/trailers
- **Separación en RootNavigator**: `carrier` → `CarrierAdminRootNavigator`, `dispatch/dispatcher` → `CarrierRootNavigator` (sin cambios)
- **Creación de usuarios (dispatch/driver)**: Reusar `useCreateCarrierPersonnel` — ya llama a `createVendorUser` con `rolesArray: ['dispatch']` o `rolesArray: ['driver']`. No se crean Cloud Functions nuevas para usuarios.
- **Lectura de trucks/trailers/drivers/dispatchers/contacts**: Reusar `useCarrierResources(vendorID)` — ya tiene todos. Extendido con `.contacts` (rolesArray contains 'notification_contact'). `useVendorPersonnel` y `useVendorVehicles` eliminados.
- **Creación de vehículos (truck/trailer)**: Reusar `useCreateCarrierVehicle` — escribe directo a Firestore (`vendor_vehicles/{vendorID}/vehicles`). No se necesita Cloud Function nueva.
- **Contacto de notificaciones**: Reusar `useCreateCarrierPersonnel` con nuevo role — `rolesArray: ['notification_contact']` (o equivalente). Mismo patrón que dispatch/driver vía `createVendorUser`.
- **createLocation**: Sí es nueva — no existe hook ni CF. Colección real: `vendor_locations/{vendorID}/locations/{locationID}` (con S). Schema requerido por `onRequestCreated`: `{ location: { location: { lat, lng } }, maxDistanceService: number, name, address, vendorID, status, createdAt, updatedAt }`. Crear como hook Firestore directo (patrón `useCreateCarrierVehicle`).
- **notification_contact + distributeRequest**: El trigger ya notifica a roles `carrier` y `dispatch`. El wizard crea el contacto con `rolesArray: ['notification_contact']`; en iteración futura se agrega ese rol al filtro del trigger.

---

## Discovery Answers

- **Business goal**: Separar roles carrier (admin) y dispatch (operativo) — primer paso del roadmap de roles
- **Target area**: Mobile app — navegación, roles, wizard de configuración de empresa
- **User role**: `carrier` (nuevo scope superadmin), `dispatch` (scope actual sin cambios)
- **Multi-role**: Un usuario puede tener `carrier` + `dispatch` simultáneamente — `SelectRoleScreen` ya lo maneja
- **Existing patterns to reuse**: `CarrierProjectSetupScreen`, `SetupStepPersonnel`, `SetupStepResources`, todos sus modales
- **Protected areas**: Funcionalidad dispatch completa (`CarrierRootNavigator`) — no tocar
- **Colecciones existentes**: `vendor_vehicles/{vendorID}`, `vendor_location/{vendorID}`, `vendor_users/{vendorID}/users`
- **Onboarding schema**: Nuevo campo `onboarding{}` en `vendors/{vendorID}`

---

## Onboarding Schema

```typescript
// vendors/{vendorID}
onboarding: {
  isComplete: boolean,
  steps: {
    dispatch:   boolean,   // >= 1 dispatch user creado
    drivers:    boolean,   // >= 1 driver creado
    trucks:     boolean,   // >= 1 truck creado
    trailers:   boolean,   // >= 1 trailer creado
    locations:  boolean,   // >= 1 sede creada
    contact:    boolean,   // contacto de notificaciones configurado
  },
  completedAt: Timestamp | null,
}
```

---

## Phase Status

| Phase | Description | Status | Blocker |
|---|---|---|---|
| 1 — Navigation | CarrierAdminRootNavigator + Drawer + RootNavigator split | ⏳ pending | — |
| 2 — CompanySetupScreen | Adaptar CarrierProjectSetupScreen + steps existentes | ⏳ pending | Phase 1 |
| 3 — Cloud Functions | ~~5 nuevas functions~~ → Solo `createLocation` hook (resto ya existe) | ⏳ pending | — |
| 4 — Hooks | 4 hooks Firestore (onboardingState, personnel, vehicles, locations) | ⏳ pending | — |
| 5 — New Steps | WizardStepLocations + WizardStepContact | ⏳ pending | Phase 4 |
| 6 — Integration | Conectar todo + validar en simulador | ⏳ pending | Phases 1-5 |

---

## Pieces

| Pieza | Plan | Factory | Integrado | Notas |
|---|---|---|---|---|
| `CarrierAdminRootNavigator` | — | ❌ Claude Code | ⏳ | Drawer-based, ref: DriverRootNavigator |
| `CarrierAdminDrawerNavigator` | — | ❌ Claude Code | ⏳ | |
| `RootNavigator` (2 líneas) | — | ❌ Claude Code | ⏳ | Separar carrier / dispatch en línea 40 |
| `CompanySetupScreen` | — | ❌ Claude Code | ⏳ | Adaptar CarrierProjectSetupScreen |
| `WizardStepDispatch` | — | ❌ Claude Code | ⏳ | Adaptar SetupStepPersonnel |
| `WizardStepDrivers` | — | ❌ Claude Code | ⏳ | Adaptar SetupStepPersonnel |
| `WizardStepTrucks` | — | ❌ Claude Code | ⏳ | Adaptar SetupStepResources |
| `WizardStepTrailers` | — | ❌ Claude Code | ⏳ | Adaptar SetupStepResources |
| `WizardStepLocations` | ✅ plan | 🏭 Factory | ⏳ | mobile-screen-feature, ref: SetupStepResources + CreateVehicleModal |
| `WizardStepContact` | ✅ plan | 🏭 Factory | ⏳ | mobile-screen-feature, ref: SetupStepPersonnel + CreatePersonnelModal |
| `useOnboardingState` | ✅ plan | 🏭 Factory | ⏳ | firestore-feature, lee vendors/{vendorID}.onboarding |
| `useVendorPersonnel` | — | ❌ Eliminada | — | Reutilizar useCarrierResources.dispatchers / .drivers |
| `useVendorVehicles` | — | ❌ Eliminada | — | Reutilizar useCarrierResources.trucks / .trailers |
| `useVendorLocations` | ✅ plan | 🏭 Factory | ⏳ | firestore-feature, vendor_locations/{vendorID}/locations (con S) |
| `createDispatchUser` | — | ❌ Eliminada | — | Reutilizar createVendorUser vía useCreateCarrierPersonnel (rolesArray: ['dispatch']) |
| `createDriverUser` | — | ❌ Eliminada | — | Reutilizar createVendorUser vía useCreateCarrierPersonnel (rolesArray: ['driver']) |
| `createVehicle` | — | ❌ Eliminada | — | Reutilizar useCreateCarrierVehicle (Firestore directo, type: 'Truck'|'Trailer') |
| `useCreateLocation` | ✅ plan | 🏭 Factory | ⏳ | firestore-feature (hook directo), vendor_locations/{vendorID}/locations (con S) |
| `createNotificationContact` | — | ❌ Eliminada | — | Reutilizar useCreateCarrierPersonnel con rolesArray: ['notification_contact'] |

---

## Dependencies

### npm / Native Libraries

Ninguna dependencia nueva identificada. Todo usa librerías existentes:
- `@react-navigation/drawer` — ya instalado (DriverRootNavigator lo usa)
- `MaterialCommunityIcons` — ya instalado
- Firebase SDK — ya instalado

### Archetype / Building Block Gaps

| Gap | Tipo | Estado |
|---|---|---|
| `firestore-feature` building block | Existe en registry, building blocks presentes | ✅ listo |
| `mobile-screen-feature` building block | Existe en registry, building blocks presentes | ✅ listo |
| `cloud-function-feature` | Validado en sesión anterior | ✅ listo |

---

## Approvals Pending

Ninguna aprobación pendiente — no hay dependencias nativas nuevas.

---

## Session Log

| Session | Date | What was done | What's next |
|---|---|---|---|
| S54 | 2026-05-08 | Discovery completo. Diseño maestro definido. PROGRESS.md creado. | Fase 1: Claude Code — CarrierAdminRootNavigator + RootNavigator split |
| S55 | 2026-05-08 | Confirmado: reusar useCreateCarrierPersonnel para dispatch/driver y notification_contact. Reusar useCreateCarrierVehicle. Descubierto schema vendor_locations (con S, doble nested lat/lng). 7 planes Factory creados y validados (readiness check: 7/7). | Fase 1: implementar navigation — CarrierAdminRootNavigator + RootNavigator split (Claude Code direct). |
