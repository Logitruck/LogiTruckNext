# LogiTruckNext — Architecture Reference

> Memoria permanente de la fábrica de software. Actualizar ante cambios estructurales.
> Última actualización: 2026-05-03

---

## 1. Stack tecnológico completo

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Expo (**bare workflow**) | ~55.0.7 |
| Runtime | React Native | 0.83.2 |
| UI Library | React | 19.2.0 |
| Lenguaje | TypeScript | ~5.9.2 |
| Build | Babel (babel-preset-expo) | ^55.0.12 |

### Navegación
| Librería | Versión |
|----------|---------|
| @react-navigation/native | ^7.1.33 |
| @react-navigation/native-stack | ^7.14.5 |
| @react-navigation/bottom-tabs | ^7.15.5 |
| @react-navigation/drawer | ^7.9.4 |

### Estado global
| Librería | Versión |
|----------|---------|
| redux | ^5.0.1 |
| react-redux | ^9.2.0 |

### Firebase
| Librería | Versión |
|----------|---------|
| firebase (Web SDK) | ^12.11.0 |
| firebase-admin | ^13.7.0 |
| @react-native-firebase/app | ^24.0.0 |
| @react-native-firebase/messaging | ^24.0.0 |

### Mapas y ubicación
| Librería | Versión |
|----------|---------|
| react-native-maps | ^1.27.2 |
| @mapbox/polyline | ^1.2.1 |
| @liberty-rider/flexpolyline | ^0.1.0 |
| react-native-geocoding | ^0.5.0 |
| react-native-google-places-autocomplete | ^2.6.4 |

### UI / Componentes
| Librería | Versión |
|----------|---------|
| @gorhom/bottom-sheet | ^5.2.8 |
| @expo/vector-icons | ^15.0.2 |
| react-native-vector-icons | ^10.3.0 |
| react-native-modal | ^14.0.0-rc.1 |
| react-native-reanimated | ^4.2.1 |
| react-native-gesture-handler | ~2.30.0 |
| react-native-screens | ~4.23.0 |

### Media y documentos
| Librería | Versión |
|----------|---------|
| expo-image-picker | ~55.0.17 |
| expo-document-picker | ~55.0.9 |
| expo-image-manipulator | ~55.0.15 |
| react-native-image-picker | latest |
| react-native-pdf | ^7.0.4 |
| react-native-html-to-pdf | ^1.3.0 |
| react-native-signature-canvas | ^5.0.2 |
| react-native-blob-util | ^0.24.7 |
| sharp | ^0.34.5 |

### Fecha, notificaciones y storage
| Librería | Versión |
|----------|---------|
| @react-native-community/datetimepicker | ^9.1.0 |
| react-native-modal-datetime-picker | ^18.0.0 |
| expo-notifications | ~55.0.19 |
| @react-native-async-storage/async-storage | ^2.2.0 |
| @react-native-community/netinfo | ^12.0.1 |
| uuid | ^13.0.0 |

### EAS / Expo Config
- **EAS Project ID:** `122d55d5-6bff-46c2-a9a8-81fe60936b70`
- **Firebase Project ID:** `logitruck-f6e40`
- **iOS bundle:** `ai.logitruck.LogiTruckNext`
- **Android package:** `ai.logitruck.LogiTruckNext`
- **iOS entitlement:** `aps-environment: development` (requerido para push notifications en desarrollo)
- **Android extras:** `softwareKeyboardLayoutMode: adjustResize`, `predictiveBackGestureEnabled: false`

---

## 1.5 Configuración nativa requerida

> Este proyecto usa **Expo bare workflow**: las carpetas `ios/` y `android/` existen en el repo
> y se regeneran con `expo prebuild`. Los plugins de `app.json` modifican código nativo —
> cualquier cambio en plugins requiere un nuevo prebuild + rebuild nativo.

### Archivos de credenciales (no están en el repo — deben copiarse manualmente)

| Archivo | Plataforma | Propósito |
|---------|-----------|-----------|
| `GoogleService-Info.plist` | iOS | Configuración Firebase iOS |
| `google-services.json` | Android | Configuración Firebase Android |

Estos archivos se obtienen desde la consola de Firebase y deben colocarse en la raíz
del proyecto **antes de cada prebuild limpio**.

### Permisos nativos configurados

**iOS** (`app.json → ios.infoPlist`):
- `NSLocationWhenInUseUsageDescription` — ubicación mientras la app está activa
- `NSLocationAlwaysAndWhenInUseUsageDescription` — ubicación en background para tracking logístico

**Android** (`app.json → android.permissions`):
- `android.permission.RECORD_AUDIO` — audio en mensajes de chat

**Vía plugins:**
- Cámara y fotos — `expo-image-picker` con mensajes de permiso custom
- Push notifications en background — `expo-notifications` con `enableBackgroundRemoteNotifications: true`

### Plugins que modifican código nativo

Cambiar cualquiera de estos en `app.json` requiere `expo prebuild` + rebuild del proyecto nativo:

| Plugin | Efecto nativo |
|--------|--------------|
| `expo-web-browser` | Config de URL schemes en iOS/Android |
| `expo-image` | Librerías de imagen nativas |
| `@react-native-community/datetimepicker` | DateTimePicker nativo |
| `@react-native-firebase/app` | GoogleService files + Firebase init |
| `@react-native-firebase/messaging` | APNs entitlements + FCM setup |
| `expo-notifications` | Background modes iOS, FCM Android |
| `expo-image-picker` | NSPhotoLibraryUsageDescription + permisos de cámara |
| `expo-build-properties` | Pods iOS extra (ver abajo) |

### Pods iOS especiales (via expo-build-properties)

```json
"extraPods": [
  { "name": "GoogleUtilities",      "modular_headers": true },
  { "name": "FirebaseCoreInternal", "modular_headers": true }
]
```

Estos `modular_headers` son **obligatorios** para evitar conflictos de compilación
entre el SDK de Firebase y los headers de Swift/ObjC en Xcode.

---

## 2. Los 3 roles: Carrier · Driver · Finder (Shipper)

### 2.1 Carrier (Dispatcher / Manager)

Directorio: `src/carrier/`

**Screens principales:**

| Screen | Propósito |
|--------|-----------|
| `ManagerHomeScreen` | Dashboard general con actividad, KPIs, alertas |
| `LiveFleetMapScreen` | Mapa en tiempo real de flota de camiones |
| `RequestDetailsScreen` (~955 líneas) | Detalle completo de una carga |
| `InspectionsHomeScreen` | Vista general de inspecciones de la flota |
| `InspectionRepairScreen` (~641 líneas) | Gestión de reparaciones detectadas |
| `PreviewInspectionScreen` (~970 líneas) | Revisión / edición de reporte de inspección |
| Deals screens | Browse, confirmación y preparación de ofertas |
| Jobs screens | Asignación y gestión de trabajos |

**Hooks propios del rol:**

| Hook | Propósito |
|------|-----------|
| `useCarrierActivityFeed` | Feed de actividad del dispatcher |
| `useCarrierDealsOverview` | Resumen de deals activos |
| `useCarrierInspectionsOverview` | Estado de inspecciones |
| `useCarrierJobsOverview` | Resumen de jobs |
| `useCarrierLiveOperations` | Operaciones en vivo |
| `useCarrierOperationsSummary` | KPIs de operaciones |
| `useCarrierPriorityActions` | Acciones urgentes del dashboard |
| `useCarrierJobsList` | Lista paginada de jobs |
| `useChecklistDocumentActions` | Acciones sobre documentos de checklist |
| `useDashboardOffersSummary` | Resumen de ofertas para dashboard |
| `useDispatcherInspectionsVehicles` | Vehículos con inspecciones pendientes |
| `useJobTrackingHistory` | Historial de tracking de un job |
| `useLiveTruckLocations` | Posiciones en tiempo real de camiones |
| `useRejectOffer` | Rechazar oferta de proveedor |
| `useRequestDetails` | Detalle de una solicitud (carrier view) |
| `useSubmitContract` | Enviar contrato firmado |
| `useSubmitVendorOffer` | Crear/editar oferta a shipper |
| `useUploadCompanyDocument` | Subir documentos de empresa |
| `useVendorDocuments` | Documentos de la empresa carrier |
| `useVendorOffer` | Detalle de oferta del vendor |
| `useVendorRequestsList` | Lista de solicitudes disponibles |

---

### 2.2 Driver (Conductor)

Directorio: `src/driver/`

**Screens principales:**

| Screen | Propósito |
|--------|-----------|
| `HomeDriverScreen` (~807 líneas) | Dashboard del conductor: jobs, vehículo, estado |
| `HomeTrackingScreen` (~552 líneas) | Tracking GPS en tiempo real durante operación |
| `InspectionScreen` (~1002 líneas) | Formulario completo de inspección vehículo |
| `DriverInspectionsHomeScreen` (~578 líneas) | Lista de inspecciones del conductor |
| `DriverJobsScreen` | Lista de jobs asignados |
| Ticket capture screens | Captura de fotos/documentos en job activo |
| Chat screens | Mensajería del conductor |

**Hooks propios del rol:**

| Hook | Propósito |
|------|-----------|
| `useActiveJob` | Job activo actual del conductor |
| `useAssignedJobs` | Lista de jobs asignados |
| `useDriverAssignedVehicles` | Vehículos asignados al conductor |
| `useDriverChatParticipants` | Participantes del chat en un job |
| `useDriverInspectionHistory` | Historial de inspecciones realizadas |
| `useRouteToDestination` | Ruta calculada al destino |
| `useSummaryInspection` | Resumen de inspección para firma |
| `useSyncDriverLocation` | Sincronización GPS → Firestore |
| `useTripTracking` | Estado del viaje activo |
| `useUpdateJobTripStatus` | Cambiar estado del job (en camino, llegó, etc.) |
| `useUploadJobTicketImage` | Subir foto de ticket/evidencia |
| `useCompanyDrivers` | Lista de conductores de la empresa |

---

### 2.3 Finder (Shipper / Cargador)

Directorio: `src/finder/`

> "Finder" y "Shipper" son el mismo rol. Finder es el término interno del código; Shipper es el término del dominio de negocio.

**Screens principales:**

| Screen | Propósito |
|--------|-----------|
| `FinderHomeScreen` | Dashboard del shipper: deals, proyectos, resumen |
| `SearchScreen` | Mapa interactivo para crear nueva solicitud de carga |
| `DealsScreen` | Gestión de ofertas recibidas de carriers |
| `ReviewRequestScreen` | Revisión final antes de publicar una solicitud |
| `ChecklistScreen` | Verificación pre-carga |
| `MyRequestsScreen` | Historial de solicitudes |
| `ProjectsHomeScreen` | Vista general de proyectos del shipper |

**Hooks propios del rol:**

| Hook | Propósito |
|------|-----------|
| `useFinderDealsOverview` | Resumen de deals en dashboard |
| `useFinderPriorityActions` | Acciones urgentes del dashboard |
| `useFinderProjectsOverview` | Resumen de proyectos activos |
| `useCreateRequest` | Crear nueva solicitud de carga |
| `useDealsByTab` | Deals filtrados por tab (activo/completado/etc.) |
| `useFinderRoute` | Ruta calculada para la solicitud |
| `useMarkRequestToSign` | Marcar solicitud lista para firma |
| `useMyRequests` | Lista de mis solicitudes |
| `useReadyForSignature` | Solicitudes pendientes de firma de contrato |
| `useRejectVendorOffer` | Rechazar oferta de un carrier |
| `useRequestDetails` | Detalle de solicitud (finder view) |
| `useSendChecklist` | Enviar checklist al carrier |
| `useUpdateRequestStatus` | Actualizar estado de una solicitud |
| `useVendorOffer` | Detalle de oferta recibida |
| `useReviewDocumentActions` | Acciones sobre documentos en revisión |

---

## 3. src/core/ — Shared Infrastructure

Directorio: `src/core/`

| Módulo | Archivos clave | Roles que lo usan |
|--------|---------------|-------------------|
| `core/chat/` | `IMChatScreen.tsx` (~1064 líneas), `firebaseChatClient.ts`, hooks de chat | Carrier, Driver, Finder |
| `core/onboarding/` | `LoadScreen`, `WalkthroughScreen`, `AuthProvider` | Todos (flujo de login) |
| `core/dopebase/` | Sistema de componentes UI, theme, i18n, ActionSheet | Todos |
| `core/firebase/` | `config.ts` (init Firebase), Firestore/Auth/Functions setup | Todos |
| `core/navigation/` | `RootNavigation.ts` (ref global) | Todos |
| `core/media/` | `storageAPI.ts` (upload/download a Storage) | Carrier, Driver |
| `core/notifications/` | Push handler, `InAppNotificationProvider` | Todos |
| `core/mentions/` | `IMRichTextInput`, `IMRichTextView`, `IMMentionList` | Chat (Carrier, Driver, Finder) |
| `core/components/` | `MapViewBase`, `AnimatedMarker`, `RouteMap`, `MultiSelectSheet`, `StatusTabs`, `ChecklistSection` | Todos (según función) |
| `core/profile/` | Gestión de perfil de usuario | Todos |
| `core/vendor/` | Configuración específica por vendor/empresa | Carrier, Driver |

**Core hooks:**

| Hook | Propósito |
|------|-----------|
| `useAuth` | Estado de autenticación Firebase |
| `useCurrentUser` | Perfil del usuario activo |
| `useOnboardingConfig` | Config de onboarding por vendor |
| `useProfileAuth` | Auth de perfil |
| `useProfileConfig` | Config de perfil por rol |
| `useVendorConfig` | Config del vendor/empresa |
| `useSpacing` | Espaciado responsivo del theme |
| `useTranslations` | Función `localized()` para i18n |
| `usePushListeners` | Escucha push notifications |

---

## 4. src/modules/ — Feature Modules

### 4.1 `modules/projects/`
Gestión de proyectos multi-etapa (multi-leg operations).

- **23+ hooks** de operaciones de proyectos
- **Carrier:** setup de proyecto, personal, recursos, jobs del proyecto
- **Finder:** setup de proyecto, rutas, jobs del shipper
- **Shared:** detalles, checklists, rutas compartidas
- **Colección Firestore:** `project_channels`
- **Roles:** Carrier + Finder

### 4.2 `modules/inspections/`
Inspecciones pre/post-viaje de vehículos.

- PDF generation + firma digital
- Sincronización offline (detecta red con `useNetworkStatus`)
- Subida de reportes firmados a Storage

| Hook | Líneas | Propósito |
|------|--------|-----------|
| `useFullInspectionDetails` | — | Detalles completos de inspección |
| `useInspectionPDF` | — | Generación de PDF |
| `useInspectionReportMutations` | — | Crear/actualizar reporte |
| `useInspectionTemplate` | — | Template de la inspección |
| `useNetworkStatus` | — | Estado de conectividad |
| `usePendingInspectionSync` | — | Cola de sync offline |
| `useUploadSignedInspectionReport` | ~536 | Upload de reporte firmado |

- **Roles:** Carrier (gestión) + Driver (ejecución)

### 4.3 `modules/contracts/`
Flujo de firma de contratos.

- Firma digital
- Asociación de documentos
- Gestión de documentos de empresa
- Almacenamiento de firmas

| Hook | Propósito |
|------|-----------|
| `useContractDetails` | Detalle de contrato |
| `useContractSignatures` | Firmas existentes |
| `useUploadSignedContract` | Subir contrato firmado |

- **Colecciones:** contract signatures, contract documents
- **Roles:** Carrier + Finder

### 4.4 `modules/vehicleExpenses/`
Registro de gastos de vehículo.

| Hook | Propósito |
|------|-----------|
| `useSaveVehicleExpense` | Guardar gasto (combustible/reparación) |
| `useVehicleExpenses` | Lista de gastos |

- Servicios: `vehicleExpenseService.ts`, `expenseLocationService.ts`, receipt capture
- **Rol:** Driver (principalmente)

### 4.5 `modules/aiSupport/`
Asistente de soporte IA in-app.

- `useSupportAssistant` hook
- Screen con quick actions y message bubbles
- Contexto-aware (sabe el rol del usuario)
- **Roles:** Todos

---

## 5. Navigation — Routing por rol

```
RootNavigator
├── LoadScreen                         ← pantalla inicial (splash)
├── LoginStack                         ← no autenticado
├── SelectVendorScreen                 ← si el usuario pertenece a múltiples empresas
├── SelectRoleScreen                   ← selección de rol
│
└── Role navigators (post-auth)
    │
    ├── CarrierRootNavigator
    │   ├── CarrierMainTabsNavigator   ← 5 tabs
    │   │   ├── Home (ManagerHomeScreen)
    │   │   ├── Inspections
    │   │   ├── Deals
    │   │   ├── Projects
    │   │   └── Live Fleet / Chat
    │   ├── CarrierChatStackNavigator
    │   └── SupportAssistant (AI)
    │
    ├── DriverRootNavigator
    │   ├── DrawerNavigator
    │   └── BottomTabsNavigator
    │       ├── Home (HomeDriverScreen)
    │       ├── Projects
    │       ├── Active Job (tracking)
    │       ├── Inspections
    │       └── Support (Chat)
    │
    ├── FinderRootNavigator
    │   └── BottomTabsNavigator
    │       ├── Home (FinderHomeScreen)
    │       ├── Search (mapa + crear solicitud)
    │       ├── Deals
    │       ├── Projects
    │       └── Messenger
    │
    └── AdminStackNavigator            ← administración de plataforma
```

**Patrones de navegación usados:**
- **Native Stack** — navegación primaria entre screens
- **Bottom Tabs** — navegación principal por rol
- **Drawer** — menús laterales (Carrier con múltiples drawers anidados, Driver para settings)
- **Modal / Bottom Sheet** — overlays (@gorhom/bottom-sheet)

---

## 6. Estado global

### 6.1 Redux Store (`src/redux/`)

Redux legacy (`legacy_createStore`) con 6 slices:

| Slice | Actions clave | Propósito |
|-------|--------------|-----------|
| `auth.ts` | `setUserData`, `logOut` | Estado de autenticación |
| `bottomSheet.ts` | `setbottomSheetSnapPoints` | Control de snap points del bottom sheet |
| `trip.ts` | origin, destination, cargo, ETA, distance, `resetTripState` | Datos del viaje en construcción |
| `ride.ts` | `setCarCategories`, `setSelectedRide`, `setCars` | Selección de vehículo/categoría |
| `finderRequestPackage.ts` | add/update/remove routes, `clearRequestPackage` | Builder de solicitud multi-leg |
| `operationSheet.ts` | `setOperationSheetData`, `resetOperationSheetData` | Datos del panel de operación |

### 6.2 Context Providers (en `App.tsx`, orden de wrapping)

| Provider | Propósito |
|----------|-----------|
| `ConfigProvider` | Config global: APIs, thresholds de tracking, iconos de tabs, menús de drawer |
| `AuthProvider` | Estado de autenticación Firebase |
| `ProfileAuthProvider` | Perfil del usuario |
| `DopebaseProvider` | Theme + localización (sistema dopebase) |
| `TranslationProvider` | i18n — función `localized()` |
| `ActionSheetProvider` | Bottom action sheets globales |
| `InAppNotificationProvider` | Toast/banner notifications in-app |
| `SafeAreaProvider` | Safe area para iOS/Android |

---

## 7. Firebase — Colecciones principales

| Colección | Subcolecciones | Roles que la usan | Propósito |
|-----------|---------------|-------------------|-----------|
| `channels` | `messages_live` | Todos | Canales de chat y mensajes en tiempo real |
| `social_feeds` | `chat_feed_live` | Todos | Feeds de actividad social |
| `requests` | — | Finder (crea), Carrier (lee) | Solicitudes de carga publicadas |
| `vendor_users` | `users` | Carrier, Driver | Empleados de una empresa |
| `vendor_vehicles` | `vehicles` | Carrier, Driver | Flota de vehículos |
| `vendor_documents` | `documents` | Carrier, Finder | Documentos de empresa |
| `users` | — | Todos | Perfiles de usuario |
| `master_categories` | — | Finder, Carrier | Categorías de vehículo/carga |
| `taxi_trips` | — | Driver, Carrier | Historial de viajes |
| `project_channels` | — | Carrier, Finder | Chat de proyecto |

**Auth:** Firebase Authentication con email/password.  
**Storage:** Firebase Storage para imágenes, PDFs y documentos.  
**Functions:** Firebase Cloud Functions para lógica de backend.

---

## 8. Patrones de código que se repiten

### Hook pattern estándar
Todos los hooks de dominio siguen este contrato:
```typescript
const useMiHook = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      // Firestore query
      setData(result)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  return { data, loading, error, fetchData }
}
```

### Colocation de estilos
Cada pantalla/componente tiene su `styles.ts` colocado junto al componente:
```
SomeScreen/
  index.tsx
  styles.ts
  types.ts   (opcional)
```

### Barrel exports
Cada directorio de feature exporta desde `index.ts` para imports limpios:
```typescript
// src/modules/inspections/index.ts
export * from './hooks'
export * from './components'
```

### Firestore listener con cleanup
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snap) => { ... })
  return () => unsubscribe()
}, [])
```

### Navegación tipada
Se usa `useNavigation()` con tipos de React Navigation. Las rutas están definidas en los navigators de cada rol, no en un archivo central de rutas.

### Theme/spacing vía hook
```typescript
const { theme } = useTheme()
const { spacing } = useSpacing()
```

---

## 9. Zona protegida — Archivos de más de 500 líneas

Estos archivos son complejos. Modificar con precaución y revisar el contexto completo antes de editar.

| Archivo | Líneas | Rol / Módulo |
|---------|--------|--------------|
| `app.json` | — | Expo config — cambios en plugins requieren `expo prebuild` |
| `src/core/chat/IMChatScreen/IMChatScreen.tsx` | ~1064 | Core — Chat |
| `src/core/chat/IMChatScreen copy 2.tsx` | ~1038 | Core — Chat (copia) |
| `src/driver/screens/InspectionScreen/InspectionScreen.tsx` | ~1002 | Driver |
| `src/carrier/screens/PreviewInspectionScreen/PreviewInspectionScreen.tsx` | ~970 | Carrier |
| `src/carrier/screens/RequestDetailsScreen/RequestDetailsScreen.tsx` | ~955 | Carrier |
| `src/core/chat/IMChatScreen copy.tsx` | ~939 | Core — Chat (copia) |
| `src/driver/screens/HomeDriverScreen/HomeDriverScreen.tsx` | ~807 | Driver |
| `src/core/chat/IMChatScreen/styles.ts` | ~667 | Core — Chat (estilos) |
| `src/carrier/screens/InspectionRepairScreen/InspectionRepairScreen.tsx` | ~641 | Carrier |
| `src/core/chat/components/ThreadItem/ThreadItem.tsx` | ~579 | Core — Chat |
| `src/driver/screens/DriverInspectionsHomeScreen.tsx` | ~578 | Driver |
| `src/modules/projects/screens/ProjectDetailsScreen.tsx` | ~569 | Módulo Projects |
| `src/driver/screens/HomeTrackingScreen/HomeTrackingScreen.tsx` | ~552 | Driver |
| `src/modules/inspections/hooks/useUploadSignedInspectionReport.ts` | ~536 | Módulo Inspections |

> `app.json` es zona protegida de configuración. La Google Maps API key vive aquí
> (`android.config.googleMaps.apiKey`). No editar plugins sin planificar el prebuild y el rebuild nativo.

---

## 10. Archivos con espacios en el nombre ("copy")

✅ **Eliminados en commit `357b7a0` (2026-05-03)** — 21 archivos, recuperables vía `git show 357b7a0^:<ruta>`.

---

## 11. Dependencias externas clave

| Servicio | Propósito | Configuración |
|---------|-----------|--------------|
| **Firebase** (Firestore, Auth, Storage, Functions) | Backend completo | `src/core/firebase/config.ts` |
| **Google Maps** | Mapas en Android/iOS | API key en `app.json` |
| **HERE Maps** | Directions API alternativa | `src/services/getDirectionsHere.ts` |
| **Google Places** | Autocompletado de direcciones | `react-native-google-places-autocomplete` |
| **EAS (Expo Application Services)** | Build y distribución | `eas.json`, projectId en `app.json` |

---

## 12. Cómo correr el proyecto en local

### Requisitos previos
- Node.js (LTS recomendado)
- Expo CLI: `npm install -g @expo/cli`
- Para iOS: Xcode (Mac) + simulador iOS
- Para Android: Android Studio + emulador o dispositivo físico
- Archivos de credenciales Firebase (**no están en el repo** — obtener de Firebase Console):
  - `GoogleService-Info.plist` → colocar en raíz del proyecto (iOS)
  - `google-services.json` → colocar en raíz del proyecto (Android)

### Flujo de setup inicial (bare workflow)

```bash
# 1. Instalar dependencias JS
npm install

# 2. Generar carpetas nativas (solo si no existen o si cambiaron plugins)
npx expo prebuild

# 3. Copiar credenciales Firebase (se pierden con --clean)
cp /ruta/segura/GoogleService-Info.plist ./
cp /ruta/segura/google-services.json ./

# 4. Instalar pods iOS
cd ios && pod install && cd ..
```

### Comandos de desarrollo

```bash
# Iniciar servidor Metro
npm start

# Correr en iOS (requiere Mac + Xcode)
npm run ios

# Correr en Android
npm run android

# Correr en web
npm run web
```

### Cuándo correr expo prebuild

`ios/` y `android/` son **carpetas generadas** — no editarlas directamente.
Regenerar con prebuild en estos casos:

```bash
# Al agregar/cambiar un plugin en app.json, o al clonar desde cero
npx expo prebuild --clean

# Después de --clean, siempre restaurar credenciales Firebase:
cp /ruta/segura/GoogleService-Info.plist ./
cp /ruta/segura/google-services.json ./
```

> `--clean` borra y regenera `ios/` y `android/` desde cero.
> Las credenciales Firebase se pierden con `--clean` y hay que reponerlas manualmente.

### Build de producción (EAS)

```bash
# Build iOS
eas build --platform ios

# Build Android
eas build --platform android

# Submit a stores
eas submit
```

### Variables de entorno / Config
- La configuración de Firebase va en `src/core/firebase/config.ts`
- La config de la app (tabs, menus, thresholds) va en `src/config/` vía `ConfigProvider`
- Google Maps API key está en `app.json` bajo `android.config.googleMaps.apiKey`

---

## 13. Próximas funcionalidades pendientes

> Inferido de módulos en desarrollo, archivos incompletos y patrones en el código.

| Funcionalidad | Estado estimado | Evidencia |
|--------------|----------------|-----------|
| AI Support Assistant | Beta / parcialmente integrado | `modules/aiSupport/` existe pero limitado |
| Sync offline de inspecciones | En desarrollo | `usePendingInspectionSync`, `useNetworkStatus` |
| Gastos de vehículo (Vehicle Expenses) | Módulo creado, integración parcial | `modules/vehicleExpenses/` con 2 hooks |
| Admin panel completo | Esqueleto creado | `src/admin/` con estructura básica |
| Limpieza de archivos "copy" | Pendiente | 20+ archivos duplicados en el repo |
| Modernización de Redux | Pendiente | Uso de `legacy_createStore` — migrar a `configureStore` con RTK |
| Consolidación del chat | Pendiente | 3 versiones de `IMChatScreen` coexisten |
| Web support completo | Parcial | Expo Web configurado pero no validado end-to-end |

---

## Estructura de directorios resumida

```
LogiTruckNext/
├── assets/                    # Íconos, splash screens
├── scripts/                   # Scripts de build/utilidades
├── src/
│   ├── admin/                 # Rol: Admin
│   ├── app/                   # Root App component + setup
│   ├── assets/icons/          # Íconos custom
│   ├── carrier/               # Rol: Carrier / Dispatcher
│   ├── chat/                  # Feature: Chat (screens de nivel root)
│   ├── config/                # consumerAppConfig, tab icons, drawer menus
│   ├── core/                  # Infraestructura shared
│   │   ├── chat/              # Sistema de chat (IMChat)
│   │   ├── components/        # Componentes shared (MapViewBase, etc.)
│   │   ├── dopebase/          # UI system + theme + i18n
│   │   ├── firebase/          # Firebase init y config
│   │   ├── media/             # Upload/download a Storage
│   │   ├── mentions/          # Rich text con @mentions
│   │   ├── navigation/        # RootNavigation ref
│   │   ├── notifications/     # Push + in-app notifications
│   │   ├── onboarding/        # Auth + onboarding screens
│   │   ├── profile/           # Perfil de usuario
│   │   └── vendor/            # Config por vendor/empresa
│   ├── driver/                # Rol: Driver / Conductor
│   ├── finder/                # Rol: Finder / Shipper
│   ├── modules/               # Feature modules cross-rol
│   │   ├── aiSupport/         # Asistente IA
│   │   ├── contracts/         # Firma de contratos
│   │   ├── inspections/       # Inspecciones vehiculares
│   │   ├── projects/          # Proyectos multi-leg
│   │   └── vehicleExpenses/   # Gastos de vehículo
│   ├── navigation/            # RootNavigator y auth navigation
│   ├── redux/                 # Store + 6 slices
│   ├── screens/               # Auth screens (Login, Register)
│   ├── services/              # Firebase client, HERE API, directions
│   ├── theme/                 # baseTheme, ThemeProvider
│   ├── translations/          # Strings i18n
│   ├── types/                 # TypeScript types globales
│   └── utils/                 # Utilidades generales
├── android/                   # Native Android (generado por Expo)
├── ios/                       # Native iOS (generado por Expo)
├── app.json                   # Expo config
├── package.json               # Dependencias
├── tsconfig.json              # TypeScript config
└── ARCHITECTURE.md            # Este archivo
```

---

## 14. Testing

### Stack de testing

| Librería | Versión | Propósito |
|----------|---------|-----------|
| jest | ^29.7.0 | Test runner (requerido por jest-expo 55) |
| jest-expo | ^55.0.16 | Preset con transform y mocks de Expo |
| @testing-library/react-native | ^13.3.3 | Render + queries + renderHook para React 19 |
| @testing-library/react-hooks | ^8.0.1 | Instalado con `--legacy-peer-deps` — **no usar en tests nuevos** |
| @testing-library/jest-native | ^5.4.3 | Deprecado — matchers ya incluidos en RNTL v13 |
| react-test-renderer | 19.2.0 | Pinado exacto para coincidir con react@19.2.0 |
| @types/jest | ^30.0.0 | Tipos TypeScript para Jest |

> **Nota:** `renderHook` viene de `@testing-library/react-native`, NO de `@testing-library/react-hooks`.
> Este último está deprecado y no soporta React 19.

### Archivos de configuración

| Archivo | Propósito |
|---------|-----------|
| `jest.config.js` | Preset, `transformIgnorePatterns`, `setupFilesAfterEnv` |
| `jest.setup.ts` | Mocks explícitos de 13 módulos nativos |
| `babel.config.js` | `reanimated: false` cuando `NODE_ENV === 'test'` |
| `__tests__/setup.test.ts` | Test trivial de verificación del entorno |

### Módulos nativos mockeados en jest.setup.ts

| Módulo | Razón del mock |
|--------|---------------|
| `@react-native-firebase/app` | Puente nativo — no disponible en Jest |
| `@react-native-firebase/messaging` | Puente nativo — FCM |
| `@react-native-async-storage/async-storage` | Usa mock oficial del paquete |
| `react-native-maps` | Componentes nativos de mapa |
| `expo-notifications` | APIs nativas de notificaciones |
| `expo-image-picker` | APIs nativas de cámara/fotos |
| `expo-document-picker` | APIs nativas del sistema de archivos |
| `react-native-reanimated` | Usa `react-native-reanimated/mock` |
| `@gorhom/bottom-sheet` | Depende de reanimated y gesture-handler |
| `react-native-gesture-handler` | Setup vía `jestSetup` del paquete |
| `@react-native-community/datetimepicker` | Componente nativo |
| `react-native-blob-util` | APIs nativas de filesystem |
| `react-native-pdf` | Renderizador PDF nativo |

### Decisiones técnicas tomadas

1. **`react-test-renderer` pinado a `19.2.0`** — la versión `19.2.5` (latest) requiere `react@^19.2.5` pero el proyecto usa `react@19.2.0`. Si se actualiza React, actualizar también este pin.

2. **`@testing-library/react-hooks` con `--legacy-peer-deps`** — solo soporta React 16-17. Se instaló porque estaba en el requisito original. No lo usar en tests nuevos; usar `renderHook` de RNTL v13.

3. **`babel.config.js`: `{ reanimated: false }` aislado en branch `isTest`** — `react-native-reanimated v4` requiere `react-native-worklets` para su Babel plugin, paquete que no está instalado. La opción `reanimated: false` previene que `babel-preset-expo` lo cargue automáticamente en Jest. **Crítico:** el condicional usa un `if (isTest) { return ... }` separado para que el caso no-test devuelva `presets: ['babel-preset-expo']` como string puro — sin options object (`{}`). Pasar `{}` explícito en lugar de la forma string activa una ruta diferente en `babel-preset-expo` v55 que intenta resolver `react-refresh/babel`; si ese módulo no está disponible como dependencia directa, el Metro bundler y el build de iOS fallan con `Cannot find module 'react-refresh/babel'`.

   > **Gotcha conocido:** NO usar `['babel-preset-expo', isTest ? { reanimated: false } : {}]` — el `{}` del caso no-test es suficiente para romper iOS. El patrón correcto es:
   > ```js
   > if (isTest) { return { presets: [['babel-preset-expo', { reanimated: false }]] }; }
   > return { presets: ['babel-preset-expo'], plugins: ['react-native-reanimated/plugin'] };
   > ```

4. **`transformIgnorePatterns` sin `/` al final del lookahead** — el patrón `expo` (sin trailing `/`) actúa como prefix match y cubre `expo/`, `expo-modules-core/`, `expo-notifications/`, etc. Con trailing `/` solo matchearía `expo/` exacto y `expo-modules-core` quedaría excluido de la transformación, causando errores de sintaxis ESM.

5. **`process.env.NODE_ENV` en lugar de `api.env()`** — después de `api.cache(true)`, llamar `api.env()` lanza un error de Babel porque intentaría modificar la estrategia de caché. `process.env.NODE_ENV` es una variable de entorno directa que Jest setea a `'test'` automáticamente.

### Comandos

```bash
npm test                    # Corre todos los tests
npm run test:watch          # Modo watch (re-runs al guardar)
npm run test:coverage       # Con reporte de cobertura en /coverage
```

### Regla de la fábrica

> **Opus genera el test ANTES de implementar cualquier feature.**
> El test debe fallar primero (🔴 red) y pasar después de la implementación (🟢 green).

### Prioridad de cobertura

| Prioridad | Zona | Razón |
|-----------|------|-------|
| 1 | Hooks de roles (`carrier/`, `driver/`, `finder/`) | Lógica de negocio core, mayor riesgo de regresión |
| 2 | Módulos compartidos (`modules/`) | Inspections, contracts, projects — alta complejidad |
| 3 | Componentes core (`core/`) | UI shared — más estable, menor volatilidad |

### Patrón establecido para hooks con Firestore

```typescript
// 1. Mockear onSnapshot invocando el callback inmediatamente
mockOnSnapshot.mockImplementation((ref, onNext) => {
  onNext({ docs: [...] });
  return mockUnsubscribe;
});

// 2. Mockear getDoc con resolución o rechazo
mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({...}) });
mockGetDoc.mockRejectedValue(new Error('Network error'));

// 3. Esperar a que el hook termine de procesar
await waitFor(() => expect(result.current.loading).toBe(false));

// 4. Verificar cleanup del listener en unmount
act(() => unmount());
expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
```

- `jest.clearAllMocks()` en `beforeEach` — resetea call counts sin borrar las factory implementations
- `collection: jest.fn(() => ({}))` en el factory del mock — provee un ref dummy que `onSnapshot` recibe sin importar su valor
- Para el error callback de `onSnapshot`: `mockImplementation((ref, onNext, onError) => { onError(new Error(...)); return mockUnsubscribe; })`

### Hooks con tests

| Hook | Ubicación | Casos | Assertions |
|------|-----------|-------|------------|
| `useVendorRequestsList` | `src/carrier/hooks/__tests__/` | 8 | 12 ✅ |

---

---

## 15. Cloud Functions (`functions/`)

> Migrado desde `LogiFunctionsV2` el 2026-05-03. Solo las **32 funciones activas** de las 89 originales.

### Estructura

```
functions/
├── index.js                    ← registro central — solo exports activos
├── package.json                ← deps mínimas: firebase-admin, firebase-functions, openai, uuid, axios, node-fetch
├── firebase.json               ← en raíz del proyecto, apunta a functions/ como source
├── core/                       ← utilidades compartidas (collections.js, user.js)
├── utils/                      ← helpers (harversine.js — cálculo de distancia geográfica)
├── notifications/              ← push notification helpers (utils.js)
│
├── app/                        ← 18 funciones httpsCallable — llamadas desde la app RN
│   ├── chat/
│   │   ├── chatv2.js           ← listChannels, listChannelsWithFilters, createChannel,
│   │   │                          markAsRead, markUserAsTypingInChannel, deleteMessage,
│   │   │                          listMessages, deleteGroup, leaveGroup, updateGroup,
│   │   │                          addMessageReaction, insertMessage
│   │   │                          + triggers: syncChatFeedStatus{OnChannelUpdate,OnChannelCreate}
│   │   └── utils.js
│   ├── openai/
│   │   ├── openai.js           ← insertMessageAI, createChannelAI
│   │   └── utils.js
│   ├── tickets/
│   │   └── processJobTicket.js ← processJobTicket (Driver — OCR de tickets)
│   ├── tripRequest/
│   │   └── tripRequest.js      ← triprequest (Finder — HERE + EIA + vendors en una llamada)
│   ├── jobs/
│   │   └── assignCarrierProjectJob.js ← assignCarrierProjectJob (Carrier)
│   └── vendorUser/
│       └── createVendorUser.js ← createVendorUser (Carrier — crea conductor/dispatch)
│
├── triggers/                   ← 10 Firestore triggers — disparados por eventos de la app
│   ├── triggers.js             ← propagateUserProfileUpdates (users/{userId})
│   ├── inspections/
│   │   ├── inspections.js      ← onVehicleInspectionCreated, onVehicleInspectionUpdated
│   │   └── driverChange.js     ← onVehicleAssignedDriverChanged
│   ├── distributeRequest/
│   │   └── distributeRequest.js ← onRequestCreated (distribuye a carriers cercanos al crear una solicitud)
│   ├── deels/
│   │   ├── onRequestUpdated.js      ← onRequestUpdated
│   │   └── onVendorRequestUpdated.js ← onVendorRequestUpdated
│   └── projects/
│       └── onSetupFlagWritten.js    ← onSetupFlagWritten
│
└── landing/                    ← 4 funciones del agente de voz investor (landing page)
    ├── saveInvestorTurn.js     ← saveLogiTruckInvestorTurn (persiste cada turno)
    ├── finalizeInvestorSession.js ← finalizeInvestorSession (analiza sesión con GPT-4o)
    └── openai/
        ├── investorContext.js  ← getLogiTruckInvestorContext (sirve contexto desde Firestore)
        └── marketStudy.js      ← getLogiTruckMarketStudy (sirve estudio de mercado)
```

### Clasificación de funciones (resumen del análisis)

| Categoría | Cantidad | Descripción |
|---|---|---|
| ✅ ACTIVA httpsCallable | 18 | App RN las llama via `httpsCallable()` |
| ✅ ACTIVA trigger | 10 | Se disparan por eventos de Firestore |
| 🌐 LANDING | 4 | Solo las usa la landing de inversores |
| ⚠️ LEGACY | 57 | En `LogiFunctionsV2` — no las llama nadie activo |

### Cómo correr functions en local

```bash
# Desde la raíz del proyecto (donde está firebase.json)
firebase emulators:start --only functions,firestore --project logitruck-f6e40

# Instalar deps de functions (primera vez)
cd functions && npm install
```

### Reglas de desarrollo

- No agregar funciones LEGACY a `index.js`. Crear nuevas funciones directamente aquí.
- `app/chat/chatv2.js` contiene tanto httpsCallable como Firestore triggers — ambos registrados en `index.js`.
- Si una función necesita una dependencia nueva, agregarla a `functions/package.json`.
- Las dependencias internas (`core/`, `utils/`, `notifications/`) están al nivel raíz de `functions/` — compartidas entre `app/` y `triggers/`.

---

*Generado automáticamente el 2026-05-03. Mantener actualizado ante cambios en estructura de carpetas, nuevos roles, módulos o dependencias.*
