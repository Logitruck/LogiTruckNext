# Factory Readiness Check

## Purpose

Audit whether the factory can deliver each identified archetype before committing to a plan.
Run this AFTER feature-intake and BEFORE feature-deep-dive.

If gaps are found, decide whether to fill them first or route to Claude Code direct.

---

# Readiness Checklist

For EACH archetype identified during intake, answer the following:

## 1. Archetype exists in registry?

Check `factory/registry/archetype-registry.json`.

→ If YES: proceed.
→ If NO: factory cannot generate this piece. Route to Claude Code direct or create archetype first.

---

## 2. Required building blocks exist?

Check `defaultBuildingBlocks` for the archetype in the registry.
Then verify each block exists in `factory/building-blocks/`.

→ If all exist: proceed.
→ If missing: factory will generate generic code without LogiTruck patterns.
  Decision: create the building block before running factory, or accept manual post-fix.

---

## 3. Gold reference file exists?

Identify the most similar production file already in the repo.

Examples:
- New Cloud Function → is there a similar function in `functions/app/`?
- New Firestore hook → is there a similar hook in `src/carrier/hooks/`?
- New screen → is there a similar screen in `src/carrier/screens/`?

→ If found: add to plan as `repoContext.referenceFiles`.
→ If none: flag in plan as "no reference — higher generation risk".

---

## 4. Firestore collections documented?

If the feature reads/writes Firestore:
- Are the target collections already in `factory/registry/data-model-registry.json`?
- Are the field schemas known?

→ If YES: include in plan's `repoContext`.
→ If NO: Claude Code must define the schema before factory execution.

---

## 5. New native dependency required?

If the feature needs a library not in `package.json`:

→ STOP — trigger Dependency Gate (see factory/CLAUDE.md).
→ Do NOT proceed with factory execution until dependency is validated.

---

## 6. Navigation changes required?

If the feature adds or modifies a navigator, tab, or drawer:

→ Route to Claude Code direct — navigation is HIGH risk and not factory-safe.
→ Factory can generate the screens; Claude Code integrates them into navigation.

---

# Output

After running this check, produce:

```
Factory Readiness Report — <feature name>

| Piece              | Archetype            | Registry | Building Blocks | Reference File     | Blocker        |
|--------------------|----------------------|----------|-----------------|--------------------|----------------|
| createDispatch     | cloud-function-feat  | ✅       | ✅              | createVendorUser   | none           |
| useVendorUsers     | firestore-feature    | ✅       | ✅              | useVendorRequest   | none           |
| WizardStep1Screen  | mobile-screen-feat   | ✅       | ⚠️ missing X    | CarrierHomeScreen  | build block X  |
| CarrierAdminNav    | N/A                  | ❌       | ❌              | none               | Claude Code    |

Factory can execute: X of Y pieces
Blockers to resolve before factory: [list]
Pieces routed to Claude Code direct: [list]
```

Do not generate implementation code during this check.
