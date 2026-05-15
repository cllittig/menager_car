-- Migration: 20250619233336_fix_vehicle_unique_constraints
-- Description: Replace global unique indexes on Client (email/cpf/cnh) and Vehicle
--              (licensePlate/chassis) with user-scoped composite unique indexes.

BEGIN;

DROP INDEX "Client_cnh_key";
DROP INDEX "Client_cpf_key";
DROP INDEX "Client_email_key";
DROP INDEX "Vehicle_chassis_key";
DROP INDEX "Vehicle_licensePlate_key";

CREATE UNIQUE INDEX "Vehicle_userId_licensePlate_key" ON "Vehicle"("userId", "licensePlate");
CREATE UNIQUE INDEX "Vehicle_userId_chassis_key" ON "Vehicle"("userId", "chassis");

COMMIT;
