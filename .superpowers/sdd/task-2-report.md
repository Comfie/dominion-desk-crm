# Task 2 Report: Product Page Section Components

## Scope

Implemented the reusable landing/product section components in:

- `app/components/landing/product-page-sections.tsx`
- `app/components/landing/product-page-sections.test.tsx`

No unrelated files were modified. The existing Task 1 content module at
`app/components/landing/product-page-content.ts` was consumed directly and not duplicated.

## TDD Record

### RED

Created the render test file first and ran:

```bash
npm test -- app/components/landing/product-page-sections.test.tsx
```

Observed the expected failing result because `product-page-sections.tsx` did not exist yet:

```text
FAIL  app/components/landing/product-page-sections.test.tsx
Error: Failed to resolve import "./product-page-sections" from "app/components/landing/product-page-sections.test.tsx". Does the file exist?
```

### GREEN

Implemented:

- `HeroProductSurface`
- `AudiencePathGrid`
- `LifecycleRail`
- `FeatureSuiteSection`
- `PricingSection`
- `FaqSection`

Then reran:

```bash
npm test -- app/components/landing/product-page-sections.test.tsx
```

Final result:

```text
✓ app/components/landing/product-page-sections.test.tsx (7 tests)
Test Files  1 passed (1)
Tests  7 passed (7)
```

## Notes

- Product visuals are HTML/CSS only. No stale `/mockups/*` screenshot assets are rendered.
- Pricing and CTA paths are sourced from the Task 1 content model and remain on `/register` or `/demo`.
- Tenant portal presence remains surfaced in the hero surface, feature suites, and FAQ-backed content.

## Test Adjustment

After the first implementation run, the pricing test failed because the shared content model uses `Talk to us` both as the agency plan price and as the agency CTA label. The component behavior was correct, but `getByText('Talk to us')` assumed uniqueness and failed on duplicate matches.

I adjusted the test assertion to verify presence without asserting uniqueness:

```ts
expect(screen.getAllByText('Talk to us').length).toBeGreaterThan(0);
```

This keeps the test aligned with the required content while avoiding a false negative.

## Commit

Committed only:

- `app/components/landing/product-page-sections.tsx`
- `app/components/landing/product-page-sections.test.tsx`

## Fix Note

Reviewer feedback identified that `AudiencePathGrid` was truncating each audience path to the first eight features, which hid the rental-agent placement journey items required for visibility. The grid now renders the full `path.features` list, and the regression test asserts that `Placement completion`, `Lease assignment`, and `Tenant portal handoff` are present in the rendered output.
