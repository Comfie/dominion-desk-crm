# Tenant Maintenance Photo Upload Design

## Goal

Allow tenants to attach up to 5 photos when submitting a maintenance request from the tenant portal, so landlords can inspect the reported issue visually from the maintenance workflow.

## Scope

This feature only covers maintenance request photos. Letters of demand are explicitly deferred because they need legal and compliance design before implementation.

## Approach

Use the existing `MaintenanceRequest.images` JSON field to store provider-neutral image attachment metadata. UploadThing remains the temporary upload provider for testing, but the maintenance feature stores only URL/name/size/type metadata so the later AWS migration can replace the uploader without changing the maintenance domain model.

Each attachment will have this shape:

```ts
type MaintenanceImage = {
  url: string;
  name: string;
  size: number;
  type: string;
};
```

## Tenant Flow

The tenant maintenance request dialog includes an image picker that accepts JPEG, PNG, and WebP files. Tenants can select up to 5 images, each up to 8MB. The dialog uploads selected images first, then posts the maintenance request with the returned image metadata.

If upload fails, the maintenance request is not submitted. If no photos are selected, the request works exactly as it does today.

## API And Validation

`app/api/uploadthing/core.ts` gets a `maintenanceImageUploader` route that permits authenticated tenant accounts and accepts up to 5 images. `app/api/portal/maintenance/route.ts` accepts an optional `images` array, validates a maximum of 5 images, and persists it on `MaintenanceRequest.images`.

Landlord maintenance APIs already return Prisma records, so once `images` is stored it is available to list/detail responses. Tenant portal maintenance GET should explicitly select `images` for the request history.

## UI Display

Tenant portal request history shows a compact photo count or thumbnail strip for submitted photos. Landlord maintenance cards show an “X photos” hint, and the maintenance detail page shows a simple thumbnail gallery.

## Testing

Add unit coverage for maintenance image DTO validation, especially accepting 5 images and rejecting 6 images. Add route-level coverage for tenant maintenance creation persisting validated image metadata by mocking auth/session, tenant lookup, Prisma, and notifications.

## Deferred

No image deletion, captions, annotations, AWS upload implementation, or formal document records in v1.
