-- Multi-tenant core migration

create table if not exists "Tenant" (
  "id" text primary key,
  "name" text not null,
  "slug" text not null unique,
  "isActive" boolean not null default true,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

-- Create default tenant and backfill existing rows
insert into "Tenant" ("id", "name", "slug", "isActive")
values ('00000000-0000-0000-0000-000000000001', 'Default Tenant', 'default-tenant', true)
on conflict ("slug") do nothing;

alter table "User" add column if not exists "tenantId" text;
alter table "Vehicle" add column if not exists "tenantId" text;
alter table "Client" add column if not exists "tenantId" text;
alter table "Transaction" add column if not exists "tenantId" text;
alter table "Contract" add column if not exists "tenantId" text;

update "User" set "tenantId" = '00000000-0000-0000-0000-000000000001' where "tenantId" is null;
update "Vehicle" set "tenantId" = '00000000-0000-0000-0000-000000000001' where "tenantId" is null;
update "Client" set "tenantId" = '00000000-0000-0000-0000-000000000001' where "tenantId" is null;
update "Transaction" set "tenantId" = '00000000-0000-0000-0000-000000000001' where "tenantId" is null;
update "Contract" set "tenantId" = '00000000-0000-0000-0000-000000000001' where "tenantId" is null;

alter table "User" alter column "tenantId" set not null;
alter table "Vehicle" alter column "tenantId" set not null;
alter table "Client" alter column "tenantId" set not null;
alter table "Transaction" alter column "tenantId" set not null;
alter table "Contract" alter column "tenantId" set not null;

alter table "User" add constraint "User_tenantId_fkey"
  foreign key ("tenantId") references "Tenant"("id") on update cascade on delete restrict;
alter table "Vehicle" add constraint "Vehicle_tenantId_fkey"
  foreign key ("tenantId") references "Tenant"("id") on update cascade on delete restrict;
alter table "Client" add constraint "Client_tenantId_fkey"
  foreign key ("tenantId") references "Tenant"("id") on update cascade on delete restrict;
alter table "Transaction" add constraint "Transaction_tenantId_fkey"
  foreign key ("tenantId") references "Tenant"("id") on update cascade on delete restrict;
alter table "Contract" add constraint "Contract_tenantId_fkey"
  foreign key ("tenantId") references "Tenant"("id") on update cascade on delete restrict;

create index if not exists "User_tenantId_idx" on "User"("tenantId");
create index if not exists "Vehicle_tenantId_idx" on "Vehicle"("tenantId");
create index if not exists "Client_tenantId_idx" on "Client"("tenantId");
create index if not exists "Transaction_tenantId_idx" on "Transaction"("tenantId");
create index if not exists "Contract_tenantId_idx" on "Contract"("tenantId");

drop index if exists "unique_user_license_plate";
drop index if exists "unique_user_chassis";
create unique index if not exists "unique_tenant_license_plate" on "Vehicle"("tenantId", "licensePlate");
create unique index if not exists "unique_tenant_chassis" on "Vehicle"("tenantId", "chassis");
