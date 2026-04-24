/*
  Warnings:

  - A unique constraint covering the columns `[userId,licensePlate]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,chassis]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Client_cnh_key";

-- DropIndex
DROP INDEX "Client_cpf_key";

-- DropIndex
DROP INDEX "Client_email_key";

-- DropIndex
DROP INDEX "Vehicle_chassis_key";

-- DropIndex
DROP INDEX "Vehicle_licensePlate_key";

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_userId_licensePlate_key" ON "Vehicle"("userId", "licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_userId_chassis_key" ON "Vehicle"("userId", "chassis");
