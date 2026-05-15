-- Migration: 20250620013204_add_client_birthdate
-- Description: Add optional birthDate column to Client.

BEGIN;

ALTER TABLE "Client" ADD COLUMN "birthDate" TIMESTAMP(3);

COMMIT;
