/*
  Warnings:

  - You are about to drop the column `slotId` on the `RequestAppointmentAttempt` table. All the data in the column will be lost.
  - You are about to drop the `InstallationSlot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InstallationSlot" DROP CONSTRAINT "InstallationSlot_createdById_fkey";

-- DropForeignKey
ALTER TABLE "InstallationSlot" DROP CONSTRAINT "InstallationSlot_locationId_fkey";

-- DropForeignKey
ALTER TABLE "RequestAppointmentAttempt" DROP CONSTRAINT "RequestAppointmentAttempt_slotId_fkey";

-- AlterTable
ALTER TABLE "RequestAppointmentAttempt" DROP COLUMN "slotId";

-- DropTable
DROP TABLE "InstallationSlot";
