/*
  Warnings:

  - Added the required column `userId` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/

-- Primeiro, adicionar as colunas como nullable
ALTER TABLE "Client" ADD COLUMN "userId" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "userId" TEXT;

-- Atualizar todos os registros existentes com o ID do usuário admin
UPDATE "Client" SET "userId" = (SELECT id FROM "User" WHERE email = 'admin@controleveicular.com' LIMIT 1);
UPDATE "Vehicle" SET "userId" = (SELECT id FROM "User" WHERE email = 'admin@controleveicular.com' LIMIT 1);

-- Agora tornar as colunas NOT NULL
ALTER TABLE "Client" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "userId" SET NOT NULL;

-- Criar índices
CREATE INDEX "Client_userId_idx" ON "Client"("userId");
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");

-- Adicionar Foreign Keys
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
