-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isFirstLogin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requirePasswordChange" BOOLEAN NOT NULL DEFAULT false;

-- Optional: Add comment to document the fields
COMMENT ON COLUMN "User"."isFirstLogin" IS 'Indicates if the user needs to change their password on first login';
COMMENT ON COLUMN "User"."requirePasswordChange" IS 'Forces the user to change their password before accessing the system';

