# Project Structure and Import Paths

## Purpose

This building block teaches the factory how to generate correct file locations and import paths for LogiTruck. All data is derived from the real repository. No TypeScript path aliases exist. No babel module-resolver exists. Every import is a relative path.

---

## Core Rule: All Imports Are Relative

`tsconfig.json` has no `compilerOptions.paths`. `babel.config.js` has no `module-resolver` plugin. There are no `@/` or `~/` shortcuts anywhere in the codebase.

**The factory must compute every import path relative to the generated file's location.**

---

## Depth Formula

Count the number of directories between the generated file and `src/`, then resolve the target:

```
depth = directories from file up to src/
path  = "../" × depth + "core/firebase/config"
```

| Generated file | Depth to src/ | Import to core/firebase/config |
|----------------|:---:|--------------------------------------|
| `src/carrier/hooks/useX.ts` | 2 | `../../core/firebase/config` |
| `src/carrier/screens/Deals/HomeDealsScreen.tsx` | 3 | `../../../core/firebase/config` |
| `src/modules/inspections/hooks/useX.ts` | 3 | `../../../core/firebase/config` |
| `src/modules/projects/hooks/shared/useX.ts` | 4 | `../../../../core/firebase/config` |
| `src/modules/projects/screens/shared/ScreenName/ScreenName.tsx` | 5 | `../../../../../core/firebase/config` |
| `src/modules/aiSupport/screens/SupportAssistantScreen/SupportAssistantScreen.tsx` | 4 | `../../../../core/dopebase` |

---

## Standard Import Targets

### Firebase (Firestore + Auth)

```typescript
import { db } from '../../core/firebase/config';      // from src/{role}/hooks/
import { db } from '../../../core/firebase/config';    // from src/{role}/screens/{Dir}/Screen.tsx
import { db } from '../../../core/firebase/config';    // from src/modules/{mod}/hooks/
```

`config.ts` exports: `auth`, `db`, `FieldValue`, `firebase` (default app).

### Current User

```typescript
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';
```

`useCurrentUser` returns the Redux user object including: `uid`, `id`, `vendorID`, `activeVendorID`, `role`, `rolesArray`, `firstName`, `lastName`, `email`, `preferredLanguage`.

Always resolve `vendorID` as:
```typescript
const vendorID = currentUser?.activeVendorID ?? currentUser?.vendorID ?? null;
```

### Theme + Translations

```typescript
import { useTheme, useTranslations } from '../../core/dopebase';
```

The `src/core/dopebase/index.tsx` barrel exports: `useTheme`, `useTranslations`, `useActionSheet`, `ActionSheetProvider`, `DopebaseProvider`, `BottomSheet`.

Usage:
```typescript
const { theme } = useTheme();
const { localized } = useTranslations();
// Never hardcode color values or string literals in UI
```

### Redux Store

```typescript
import { useSelector, useDispatch } from 'react-redux';
import { setUserData } from '../../redux';   // from src/{role}/hooks/
```

`src/redux/index.ts` is the barrel. Slices: `auth`, `trip`, `finderRequestPackage`, `ride`, `bottomSheet`, `operationSheet`.

### Config

```typescript
import { useConfig } from '../../config';   // from src/{role}/hooks/
```

`src/config/index.tsx` barrel.

### Translations

```typescript
import translations from '../../translations';   // from src/{role}/hooks/
```

`src/translations/index.ts` barrel.

---

## Role Directories

```
src/
├── carrier/          Dispatcher / fleet manager
│   ├── hooks/        Domain hooks — flat files (useVendorRequestsList.ts)
│   ├── screens/      Mix of flat files and folder-pattern screens
│   ├── navigation/   CarrierRootNavigator, tab/stack/drawer navigators
│   ├── components/   Role-specific UI components
│   ├── types/        TypeScript types
│   └── utils/        Role-specific utilities
├── driver/           Truck driver
│   ├── hooks/        Domain hooks
│   ├── screens/      Driver screens (Home/, Inspections/, Jobs/ subdirs)
│   └── navigation/   DriverRootNavigator, drawer, tabs
└── finder/           Shipper / cargo owner
    ├── hooks/        Domain hooks
    ├── screens/      Finder screens
    ├── navigation/   FinderRootNavigator
    └── services/     tripsAPIManager.ts
```

---

## Module Directories (`src/modules/`)

Cross-role modules are shared by two or more roles. They live in `src/modules/` and must not import from any role directory.

```
src/modules/
├── aiSupport/
│   ├── components/   SupportComposer, SupportMessageBubble, SupportQuickActions
│   ├── hooks/        useSupportAssistant.ts
│   ├── screens/SupportAssistantScreen/  SupportAssistantScreen.tsx + styles.ts
│   ├── types.ts      Module types at root (NOT inside types/)
│   └── utils/        buildSupportContext.ts
├── contracts/        Digital signature flow
├── inspections/      Vehicle inspections + PDF generation
│   ├── hooks/        useCarrierInspectionVehicles, useFullInspectionDetails
│   ├── screens/      Folder-pattern screens
│   └── services/     Upload/report services
├── projects/
│   ├── hooks/carrier/   Carrier project hooks
│   ├── hooks/finder/    Finder project hooks
│   ├── hooks/shared/    useProjectDetails.ts
│   ├── screens/carrier/ Carrier project screens
│   ├── screens/finder/  Finder project screens
│   └── screens/shared/  ProjectDetailsScreen/ (folder pattern)
└── vehicleExpenses/   Driver expense tracking
```

---

## Core Infrastructure (`src/core/`)

Imported by all roles and modules.

```
src/core/
├── chat/
│   ├── api/           chatRef.ts, firebaseChatClient.ts; index.ts barrel
│   ├── IMChatScreen/  ~1064 lines — read fully before editing
│   └── index.ts       Chat barrel
├── components/        MapViewBase, AnimatedMarker, RouteMap, MultiSelectSheet
├── dopebase/          UI system; index.tsx barrel — useTheme, useTranslations, etc.
├── firebase/
│   └── config.ts      ONLY file — exports auth, db, FieldValue
├── media/             storageAPI.ts; index.ts barrel
├── navigation/        RootNavigation.ts (global nav ref)
├── notifications/     Push handlers, InAppNotificationProvider
├── onboarding/
│   ├── api/           index.ts barrel
│   └── hooks/useAuth.tsx  useCurrentUser — imported by ALL data hooks
├── profile/
│   ├── hooks/         useUpdateUserProfile.ts
│   └── screens/MyProfileScreen/
├── ui/                Drawer menu, SearchBarAlternate
└── vendor/hooks/      Vendor-related shared hooks
```

---

## Screen File Patterns

### Folder Pattern (preferred for new screens)

```
src/modules/{module}/screens/{subdir}/ScreenName/
├── ScreenName.tsx    Screen component
└── styles.ts         dynamicStyles function

src/modules/aiSupport/screens/SupportAssistantScreen/SupportAssistantScreen.tsx
src/modules/projects/screens/shared/ProjectDetailsScreen/ProjectDetailsScreen.tsx
```

### Flat File Pattern (common in role screens)

```
src/carrier/screens/Deals/HomeDealsScreen.tsx
src/carrier/screens/Deals/styles.ts
```

### Styles Convention

```typescript
// styles.ts
export const dynamicStyles = (theme: any, appearance: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.primaryBackground,
  },
});
```

Import as: `import { dynamicStyles } from './styles'`

---

## Hook File Patterns

Hook files are flat `.ts` files directly inside the `hooks/` directory:

```
src/carrier/hooks/useVendorRequestsList.ts
src/carrier/hooks/useCarrierJobsList.ts
src/driver/hooks/useAssignedJobs.ts
src/modules/inspections/hooks/useFullInspectionDetails.ts
src/modules/projects/hooks/shared/useProjectDetails.ts
```

Hook return shape is always:
```typescript
return { data, loading, error };
```

---

## Intra-Module Import Examples

When generating a screen inside `src/modules/aiSupport/screens/SupportAssistantScreen/`:

```typescript
// Depth 4 — go up 4 dirs to reach src/
import { useTheme, useTranslations } from '../../../../core/dopebase';
import { useCurrentUser } from '../../../../core/onboarding/hooks/useAuth';
import { db } from '../../../../core/firebase/config';

// Intra-module — relative within the module
import { SupportContext, SupportMessage } from '../../types';
import { useSupportAssistant } from '../../hooks/useSupportAssistant';
import SupportMessageBubble from '../../components/SupportMessageBubble';
```

When generating a hook inside `src/carrier/hooks/`:

```typescript
// Depth 2
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';
import { useTheme } from '../../core/dopebase';
```

When generating a hook inside `src/modules/projects/hooks/shared/`:

```typescript
// Depth 4
import { db } from '../../../../core/firebase/config';
import { useCurrentUser } from '../../../../core/onboarding/hooks/useAuth';
```

---

## Import Boundaries (Enforcement Rules)

### Forbidden Cross-Role Imports

```typescript
// ❌ carrier/ must never import from driver/ or finder/
import something from '../../driver/hooks/useX';   // FORBIDDEN

// ❌ driver/ must never import from carrier/ or finder/
import something from '../../carrier/hooks/useX';  // FORBIDDEN

// ❌ finder/ must never import from carrier/ or driver/
import something from '../../carrier/hooks/useX';  // FORBIDDEN
```

### Forbidden Module → Role Imports

```typescript
// ❌ modules/ must never import from any role directory
// src/modules/inspections/hooks/useX.ts
import something from '../../../carrier/hooks/useX';  // FORBIDDEN
```

### Allowed Imports

| From | May import |
|------|-----------|
| `src/carrier/` | `core/`, `modules/`, `redux/`, `config/`, `utils/`, `types/` |
| `src/driver/` | `core/`, `modules/`, `redux/`, `config/`, `utils/`, `types/` |
| `src/finder/` | `core/`, `modules/`, `redux/`, `config/`, `utils/`, `types/` |
| `src/modules/` | `core/`, `redux/`, `config/`, `utils/`, `types/` |
| `src/core/` | `redux/`, `config/`, `utils/`, `types/` |

---

## Barrel Exports

Barrels exist at **subdomain boundaries**, not at every directory level. Most `hooks/` and `screens/` directories do NOT have an `index.ts`.

**Confirmed barrels:**

```
src/carrier/hooks/home/index.ts
src/carrier/components/ManagerHome/index.ts
src/core/chat/api/index.ts
src/core/chat/index.ts
src/core/dopebase/index.tsx
src/core/media/index.ts
src/core/onboarding/api/index.ts
src/core/onboarding/index.tsx
src/modules/vehicleExpenses/index.ts
src/redux/index.ts
src/theme/index.ts
src/translations/index.ts
```

**When there is no barrel:** import the file directly.

```typescript
// ✅ Direct import — no barrel in carrier/hooks/
import useVendorRequestsList from '../../hooks/useVendorRequestsList';

// ✅ Barrel available — use it
import { useTheme } from '../../core/dopebase';
```

---

## Test File Conventions

```
src/{role}/hooks/__tests__/useHookName.test.ts
src/core/profile/hooks/__tests__/useUpdateUserProfile.test.ts
```

Always use `renderHook` from `@testing-library/react-native` — NOT from `@testing-library/react-hooks`.

Standard mock block for a role hook:

```typescript
jest.mock('../../../core/onboarding/hooks/useAuth');
jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
}));
jest.mock('../../../core/firebase/config', () => ({ db: {} }));
```

Import the hook from one level up (test is inside `__tests__/`):

```typescript
import useVendorRequestsList from '../useVendorRequestsList';
```

---

## Cloud Functions File Conventions

All functions are CommonJS — no ES module syntax.

```javascript
// functions/app/domain/myFunction.js
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

exports.myFunction = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Auth required');
  // ...
});
```

**Every new function must be registered in `functions/index.js`:**

```javascript
// functions/index.js
const myMod = require('./app/domain/myFunction');
exports.myFunction = myMod.myFunction;
```

Callable files go to: `functions/app/{domain}/{functionName}.js`
Trigger files go to: `functions/triggers/{domain}/{triggerName}.js`
Landing functions go to: `functions/landing/{purpose}.js`

Shared helpers:

```javascript
const { add, getList } = require('../../core/collections');
const { fetchUser } = require('../../core/user');
const { sendPushNotification } = require('../../notifications/utils');
```

---

## When to Load This Building Block

Load `project-structure-imports` whenever a feature generates:

- Any new screen file (to place it correctly and compute import depths)
- Any new hook file (location, naming, return shape)
- Any new Cloud Function (CJS, index.js registration, path)
- Any test file (mock pattern, renderHook source, relative paths)
- Any code that imports `db`, `useCurrentUser`, `useTheme`, or `useTranslations`
- Any module-level feature that must respect role isolation boundaries

This building block is a companion to `screen-hook-separation`, `hook-service-pattern`, and `firestore-data-model-access`. Load all three together for any `mobile-screen-feature` or `firestore-feature` execution.
