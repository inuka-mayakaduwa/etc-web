-- CreateTable
CREATE TABLE "LocationWeeklySchedule" (
    "id" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" VARCHAR(5),
    "closeTime" VARCHAR(5),
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationWeeklySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationCapacityRule" (
    "id" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "dayOfWeek" INTEGER,
    "startTime" VARCHAR(5),
    "endTime" VARCHAR(5),
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationCapacityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationCalendarBlock" (
    "id" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "blockType" VARCHAR(20) NOT NULL,
    "blockDate" DATE,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "reason" VARCHAR(255),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationCalendarBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationSlotConfig" (
    "id" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "serviceDuration" INTEGER NOT NULL DEFAULT 60,
    "bufferBefore" INTEGER NOT NULL DEFAULT 0,
    "bufferAfter" INTEGER NOT NULL DEFAULT 0,
    "minAdvanceHours" INTEGER NOT NULL DEFAULT 24,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationSlotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocationWeeklySchedule_locationId_dayOfWeek_idx" ON "LocationWeeklySchedule"("locationId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "LocationWeeklySchedule_locationId_dayOfWeek_key" ON "LocationWeeklySchedule"("locationId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "LocationCapacityRule_locationId_priority_idx" ON "LocationCapacityRule"("locationId", "priority");

-- CreateIndex
CREATE INDEX "LocationCapacityRule_locationId_dayOfWeek_idx" ON "LocationCapacityRule"("locationId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "LocationCalendarBlock_locationId_blockDate_idx" ON "LocationCalendarBlock"("locationId", "blockDate");

-- CreateIndex
CREATE INDEX "LocationCalendarBlock_locationId_startAt_endAt_idx" ON "LocationCalendarBlock"("locationId", "startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "LocationSlotConfig_locationId_key" ON "LocationSlotConfig"("locationId");

-- AddForeignKey
ALTER TABLE "LocationWeeklySchedule" ADD CONSTRAINT "LocationWeeklySchedule_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InstallationLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationCapacityRule" ADD CONSTRAINT "LocationCapacityRule_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InstallationLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationCalendarBlock" ADD CONSTRAINT "LocationCalendarBlock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InstallationLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationCalendarBlock" ADD CONSTRAINT "LocationCalendarBlock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationSlotConfig" ADD CONSTRAINT "LocationSlotConfig_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InstallationLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
