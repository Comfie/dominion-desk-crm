# Tenant Maintenance Photo Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tenants can upload up to 5 issue photos when submitting a maintenance request, and landlords can view those photos in maintenance workflows.

**Architecture:** Reuse `MaintenanceRequest.images` as a provider-neutral JSON array of image metadata. UploadThing provides the temporary upload transport through a dedicated tenant-allowed uploader, while maintenance APIs and UI consume plain URL metadata to keep the later AWS migration contained.

**Tech Stack:** Next.js App Router, Prisma, UploadThing, React Query, Vitest, Zod.

---

## File Structure

- `lib/features/maintenance/dtos/maintenance.dto.ts`: defines reusable `maintenanceImageSchema` and adds `images` to create DTO validation.
- `app/api/portal/maintenance/route.ts`: accepts, validates, persists, and returns maintenance images for tenant portal requests.
- `app/api/uploadthing/core.ts`: adds a temporary `maintenanceImageUploader` for up to 5 tenant-uploaded images.
- `components/portal/maintenance-request-dialog.tsx`: handles multi-image selection, client-side validation, upload, and request submission.
- `components/maintenance/maintenance-card.tsx`: shows photo count on landlord maintenance cards.
- `app/(dashboard)/maintenance/[id]/page.tsx`: shows a thumbnail gallery on landlord maintenance details.
- `lib/features/maintenance/__tests__/maintenance.dto.test.ts`: covers image validation limits.
- `app/api/portal/maintenance/route.test.ts`: covers tenant POST persistence of image metadata.

## Tasks

### Task 1: Validation

**Files:**

- Modify: `lib/features/maintenance/dtos/maintenance.dto.ts`
- Test: `lib/features/maintenance/__tests__/maintenance.dto.test.ts`

- [ ] Write failing tests that parse 5 valid images and reject 6 images.
- [ ] Run `npm test -- lib/features/maintenance/__tests__/maintenance.dto.test.ts --run` and confirm the new tests fail because image validation is missing.
- [ ] Add `maintenanceImageSchema` with `url`, `name`, `size`, and `type`, plus `images: z.array(...).max(5).optional()` to `createMaintenanceSchema`.
- [ ] Re-run the targeted test and confirm it passes.

### Task 2: Tenant API Persistence

**Files:**

- Modify: `app/api/portal/maintenance/route.ts`
- Test: `app/api/portal/maintenance/route.test.ts`

- [ ] Write a failing route test for POST `/api/portal/maintenance` that sends one image and expects `prisma.maintenanceRequest.create` to receive `images`.
- [ ] Run `npm test -- app/api/portal/maintenance/route.test.ts --run` and confirm the test fails because images are not persisted.
- [ ] Update the route schema to accept up to 5 images and select `images` in tenant maintenance GET.
- [ ] Persist `images: validatedData.images ?? []` when creating the maintenance request.
- [ ] Re-run the targeted route test and confirm it passes.

### Task 3: Upload Transport

**Files:**

- Modify: `app/api/uploadthing/core.ts`

- [ ] Add `maintenanceImageUploader` with `image: { maxFileSize: '8MB', maxFileCount: 5 }`.
- [ ] Keep authentication required, allow tenant accounts, and return `{ uploadedBy, fileUrl, fileName, fileSize, fileType }`.

### Task 4: Tenant UI

**Files:**

- Modify: `components/portal/maintenance-request-dialog.tsx`

- [ ] Add local state for selected image files.
- [ ] Validate max 5 images, image MIME types, and max 8MB per image before upload.
- [ ] Use `useUploadThing('maintenanceImageUploader')` to upload selected files before POST.
- [ ] Submit image metadata with the maintenance request body.
- [ ] Show selected image names/count and allow removing selected files before submission.

### Task 5: Landlord Display

**Files:**

- Modify: `components/maintenance/maintenance-card.tsx`
- Modify: `app/(dashboard)/maintenance/[id]/page.tsx`

- [ ] Add `images` to local request types.
- [ ] Show an “X photos” hint on maintenance cards when images exist.
- [ ] Add a simple thumbnail gallery on the maintenance detail page.

### Task 6: Verification

**Files:**

- All modified source and test files.

- [ ] Run targeted tests: `npm test -- lib/features/maintenance/__tests__/maintenance.dto.test.ts app/api/portal/maintenance/route.test.ts --run`.
- [ ] Run type check: `npm run type-check`.
- [ ] Run build if type-check is clean: `npm run build`.
