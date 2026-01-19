-- CreateEnum
CREATE TYPE "EtcRequestType" AS ENUM ('NEW_INDIVIDUAL', 'NEW_COMPANY', 'ADD_VEHICLE_EXISTING_USER', 'ADD_VEHICLE_EXISTING_COMPANY', 'REPLACE_TAG');

-- CreateEnum
CREATE TYPE "RequestChannel" AS ENUM ('WEB', 'COUNTER', 'CALLCENTER', 'OTHER');

-- CreateEnum
CREATE TYPE "ScheduleMode" AS ENUM ('USER_PICKED', 'STAFF_ASSIGNED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'MISSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('GOVPAY', 'BANK_TRANSFER', 'IPG', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PENDING_REVIEW', 'COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('PENDING', 'INSTALLED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProvisionStatus" AS ENUM ('PENDING', 'CREATED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('REQUEST_CREATED', 'REQUEST_UPDATED', 'STATUS_CHANGED', 'ASSIGNED_CHANGED', 'ALLOW_EDIT_CHANGED', 'PAYMENT_ATTEMPT_CREATED', 'PAYMENT_STATUS_CHANGED', 'APPOINTMENT_ATTEMPT_CREATED', 'APPOINTMENT_STATUS_CHANGED', 'INSTALLATION_UPDATED', 'PROVISIONING_UPDATED', 'COMMENT_ADDED');

-- CreateEnum
CREATE TYPE "CommentVisibility" AS ENUM ('INTERNAL_ONLY', 'INTERNAL_AND_CUSTOMER');

-- CreateTable
CREATE TABLE "VehicleType" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationLocation" (
    "id" UUID NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "address" VARCHAR(255),
    "contactNo" VARCHAR(30),
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationSlot" (
    "id" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 1,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestStatus" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "isEditable" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestStatusTransition" (
    "id" UUID NOT NULL,
    "fromStatusId" UUID NOT NULL,
    "toStatusId" UUID NOT NULL,
    "requiredPermissionId" UUID,
    "requiresComment" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestStatusTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemUser" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "mobile" VARCHAR(30) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemUserOtp" (
    "id" UUID NOT NULL,
    "systemUserId" UUID NOT NULL,
    "otpHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestIp" VARCHAR(80),

    CONSTRAINT "SystemUserOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemRole" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemPermission" (
    "id" UUID NOT NULL,
    "node" VARCHAR(180) NOT NULL,
    "description" VARCHAR(255),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemRolePermission" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "SystemRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemUserRole" (
    "id" UUID NOT NULL,
    "systemUserId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "SystemUserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemUserPermission" (
    "id" UUID NOT NULL,
    "systemUserId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "SystemUserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemUserLocationAccess" (
    "id" UUID NOT NULL,
    "systemUserId" UUID NOT NULL,
    "locationId" UUID NOT NULL,

    CONSTRAINT "SystemUserLocationAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemUserStatusAccess" (
    "id" UUID NOT NULL,
    "systemUserId" UUID NOT NULL,
    "statusId" UUID NOT NULL,

    CONSTRAINT "SystemUserStatusAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ETCRegistrationRequest" (
    "id" UUID NOT NULL,
    "requestNo" VARCHAR(40) NOT NULL,
    "requestType" "EtcRequestType" NOT NULL,
    "channel" "RequestChannel" NOT NULL DEFAULT 'WEB',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStatusId" UUID NOT NULL,
    "assignedOfficerId" UUID,
    "preferredLocationId" UUID,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "allowEditRequest" BOOLEAN NOT NULL DEFAULT false,
    "allowEditUpdatedById" UUID,
    "allowEditUpdatedAt" TIMESTAMP(3),
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "notes" VARCHAR(1000),
    "applicantName" VARCHAR(120) NOT NULL,
    "applicantNICOrPassport" VARCHAR(40) NOT NULL,
    "applicantMobile" VARCHAR(30) NOT NULL,
    "applicantEmail" VARCHAR(150),
    "notifySMS" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT false,
    "companyName" VARCHAR(180),
    "brn" VARCHAR(60),
    "companyAddress" VARCHAR(255),
    "lpn" VARCHAR(25) NOT NULL,
    "vehicleTypeId" UUID NOT NULL,
    "matchedMasterUserId" UUID,
    "activePaymentAttemptId" UUID,
    "activeAppointmentAttemptId" UUID,
    "installationStatus" "InstallationStatus" NOT NULL DEFAULT 'PENDING',
    "installedAt" TIMESTAMP(3),
    "installedById" UUID,
    "rfidValue" VARCHAR(80),
    "installationRemarks" VARCHAR(1000),
    "provisionStatus" "ProvisionStatus" NOT NULL DEFAULT 'PENDING',
    "provisionedAt" TIMESTAMP(3),
    "provisionError" VARCHAR(2000),
    "masterUserId" UUID,
    "masterCompanyId" UUID,
    "masterVehicleId" UUID,
    "masterWalletId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ETCRegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestPaymentAttempt" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2),
    "reference" VARCHAR(120),
    "proofUrl" VARCHAR(500),
    "declaredAt" TIMESTAMP(3),
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMP(3),
    "rejectReason" VARCHAR(500),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestPaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestAppointmentAttempt" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "locationId" UUID NOT NULL,
    "slotId" UUID,
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "scheduledEndAt" TIMESTAMP(3) NOT NULL,
    "mode" "ScheduleMode" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "calendarProvider" VARCHAR(40),
    "calendarEventId" VARCHAR(120),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestAppointmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentAccessLink" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentAccessLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestAuditLog" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "doneById" UUID,
    "doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" VARCHAR(80),

    CONSTRAINT "RequestAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestComment" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "comment" TEXT NOT NULL,
    "visibility" "CommentVisibility" NOT NULL DEFAULT 'INTERNAL_ONLY',
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleType_code_key" ON "VehicleType"("code");

-- CreateIndex
CREATE INDEX "VehicleType_active_idx" ON "VehicleType"("active");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationLocation_code_key" ON "InstallationLocation"("code");

-- CreateIndex
CREATE INDEX "InstallationLocation_active_idx" ON "InstallationLocation"("active");

-- CreateIndex
CREATE INDEX "InstallationLocation_code_idx" ON "InstallationLocation"("code");

-- CreateIndex
CREATE INDEX "InstallationSlot_locationId_startAt_idx" ON "InstallationSlot"("locationId", "startAt");

-- CreateIndex
CREATE INDEX "InstallationSlot_status_idx" ON "InstallationSlot"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RequestStatus_code_key" ON "RequestStatus"("code");

-- CreateIndex
CREATE INDEX "RequestStatus_active_idx" ON "RequestStatus"("active");

-- CreateIndex
CREATE INDEX "RequestStatus_orderIndex_idx" ON "RequestStatus"("orderIndex");

-- CreateIndex
CREATE INDEX "RequestStatusTransition_active_idx" ON "RequestStatusTransition"("active");

-- CreateIndex
CREATE UNIQUE INDEX "RequestStatusTransition_fromStatusId_toStatusId_key" ON "RequestStatusTransition"("fromStatusId", "toStatusId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_email_key" ON "SystemUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_mobile_key" ON "SystemUser"("mobile");

-- CreateIndex
CREATE INDEX "SystemUser_active_idx" ON "SystemUser"("active");

-- CreateIndex
CREATE INDEX "SystemUserOtp_systemUserId_expiresAt_idx" ON "SystemUserOtp"("systemUserId", "expiresAt");

-- CreateIndex
CREATE INDEX "SystemUserOtp_usedAt_idx" ON "SystemUserOtp"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemRole_name_key" ON "SystemRole"("name");

-- CreateIndex
CREATE INDEX "SystemRole_active_idx" ON "SystemRole"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SystemPermission_node_key" ON "SystemPermission"("node");

-- CreateIndex
CREATE INDEX "SystemPermission_active_idx" ON "SystemPermission"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SystemRolePermission_roleId_permissionId_key" ON "SystemRolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUserRole_systemUserId_roleId_key" ON "SystemUserRole"("systemUserId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUserPermission_systemUserId_permissionId_key" ON "SystemUserPermission"("systemUserId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUserLocationAccess_systemUserId_locationId_key" ON "SystemUserLocationAccess"("systemUserId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUserStatusAccess_systemUserId_statusId_key" ON "SystemUserStatusAccess"("systemUserId", "statusId");

-- CreateIndex
CREATE UNIQUE INDEX "ETCRegistrationRequest_requestNo_key" ON "ETCRegistrationRequest"("requestNo");

-- CreateIndex
CREATE UNIQUE INDEX "ETCRegistrationRequest_rfidValue_key" ON "ETCRegistrationRequest"("rfidValue");

-- CreateIndex
CREATE INDEX "ETCRegistrationRequest_currentStatusId_idx" ON "ETCRegistrationRequest"("currentStatusId");

-- CreateIndex
CREATE INDEX "ETCRegistrationRequest_assignedOfficerId_idx" ON "ETCRegistrationRequest"("assignedOfficerId");

-- CreateIndex
CREATE INDEX "ETCRegistrationRequest_preferredLocationId_idx" ON "ETCRegistrationRequest"("preferredLocationId");

-- CreateIndex
CREATE INDEX "ETCRegistrationRequest_vehicleTypeId_idx" ON "ETCRegistrationRequest"("vehicleTypeId");

-- CreateIndex
CREATE INDEX "ETCRegistrationRequest_lpn_idx" ON "ETCRegistrationRequest"("lpn");

-- CreateIndex
CREATE INDEX "ETCRegistrationRequest_submittedAt_idx" ON "ETCRegistrationRequest"("submittedAt");

-- CreateIndex
CREATE INDEX "RequestPaymentAttempt_requestId_status_idx" ON "RequestPaymentAttempt"("requestId", "status");

-- CreateIndex
CREATE INDEX "RequestPaymentAttempt_method_idx" ON "RequestPaymentAttempt"("method");

-- CreateIndex
CREATE UNIQUE INDEX "RequestPaymentAttempt_requestId_attemptNo_key" ON "RequestPaymentAttempt"("requestId", "attemptNo");

-- CreateIndex
CREATE INDEX "RequestAppointmentAttempt_requestId_status_idx" ON "RequestAppointmentAttempt"("requestId", "status");

-- CreateIndex
CREATE INDEX "RequestAppointmentAttempt_locationId_scheduledStartAt_idx" ON "RequestAppointmentAttempt"("locationId", "scheduledStartAt");

-- CreateIndex
CREATE UNIQUE INDEX "RequestAppointmentAttempt_requestId_attemptNo_key" ON "RequestAppointmentAttempt"("requestId", "attemptNo");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentAccessLink_tokenHash_key" ON "AppointmentAccessLink"("tokenHash");

-- CreateIndex
CREATE INDEX "AppointmentAccessLink_requestId_active_idx" ON "AppointmentAccessLink"("requestId", "active");

-- CreateIndex
CREATE INDEX "AppointmentAccessLink_expiresAt_idx" ON "AppointmentAccessLink"("expiresAt");

-- CreateIndex
CREATE INDEX "RequestAuditLog_requestId_doneAt_idx" ON "RequestAuditLog"("requestId", "doneAt");

-- CreateIndex
CREATE INDEX "RequestAuditLog_action_idx" ON "RequestAuditLog"("action");

-- CreateIndex
CREATE INDEX "RequestComment_requestId_createdAt_idx" ON "RequestComment"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "RequestComment_visibility_idx" ON "RequestComment"("visibility");

-- AddForeignKey
ALTER TABLE "InstallationSlot" ADD CONSTRAINT "InstallationSlot_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InstallationLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationSlot" ADD CONSTRAINT "InstallationSlot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusTransition" ADD CONSTRAINT "RequestStatusTransition_fromStatusId_fkey" FOREIGN KEY ("fromStatusId") REFERENCES "RequestStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusTransition" ADD CONSTRAINT "RequestStatusTransition_toStatusId_fkey" FOREIGN KEY ("toStatusId") REFERENCES "RequestStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusTransition" ADD CONSTRAINT "RequestStatusTransition_requiredPermissionId_fkey" FOREIGN KEY ("requiredPermissionId") REFERENCES "SystemPermission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUserOtp" ADD CONSTRAINT "SystemUserOtp_systemUserId_fkey" FOREIGN KEY ("systemUserId") REFERENCES "SystemUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemRolePermission" ADD CONSTRAINT "SystemRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SystemRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemRolePermission" ADD CONSTRAINT "SystemRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "SystemPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUserRole" ADD CONSTRAINT "SystemUserRole_systemUserId_fkey" FOREIGN KEY ("systemUserId") REFERENCES "SystemUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUserRole" ADD CONSTRAINT "SystemUserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SystemRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUserPermission" ADD CONSTRAINT "SystemUserPermission_systemUserId_fkey" FOREIGN KEY ("systemUserId") REFERENCES "SystemUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUserPermission" ADD CONSTRAINT "SystemUserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "SystemPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUserLocationAccess" ADD CONSTRAINT "SystemUserLocationAccess_systemUserId_fkey" FOREIGN KEY ("systemUserId") REFERENCES "SystemUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUserLocationAccess" ADD CONSTRAINT "SystemUserLocationAccess_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InstallationLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUserStatusAccess" ADD CONSTRAINT "SystemUserStatusAccess_systemUserId_fkey" FOREIGN KEY ("systemUserId") REFERENCES "SystemUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUserStatusAccess" ADD CONSTRAINT "SystemUserStatusAccess_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "RequestStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETCRegistrationRequest" ADD CONSTRAINT "ETCRegistrationRequest_currentStatusId_fkey" FOREIGN KEY ("currentStatusId") REFERENCES "RequestStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETCRegistrationRequest" ADD CONSTRAINT "ETCRegistrationRequest_assignedOfficerId_fkey" FOREIGN KEY ("assignedOfficerId") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETCRegistrationRequest" ADD CONSTRAINT "ETCRegistrationRequest_preferredLocationId_fkey" FOREIGN KEY ("preferredLocationId") REFERENCES "InstallationLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETCRegistrationRequest" ADD CONSTRAINT "ETCRegistrationRequest_allowEditUpdatedById_fkey" FOREIGN KEY ("allowEditUpdatedById") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETCRegistrationRequest" ADD CONSTRAINT "ETCRegistrationRequest_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETCRegistrationRequest" ADD CONSTRAINT "ETCRegistrationRequest_activePaymentAttemptId_fkey" FOREIGN KEY ("activePaymentAttemptId") REFERENCES "RequestPaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETCRegistrationRequest" ADD CONSTRAINT "ETCRegistrationRequest_activeAppointmentAttemptId_fkey" FOREIGN KEY ("activeAppointmentAttemptId") REFERENCES "RequestAppointmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETCRegistrationRequest" ADD CONSTRAINT "ETCRegistrationRequest_installedById_fkey" FOREIGN KEY ("installedById") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestPaymentAttempt" ADD CONSTRAINT "RequestPaymentAttempt_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ETCRegistrationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestPaymentAttempt" ADD CONSTRAINT "RequestPaymentAttempt_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAppointmentAttempt" ADD CONSTRAINT "RequestAppointmentAttempt_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ETCRegistrationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAppointmentAttempt" ADD CONSTRAINT "RequestAppointmentAttempt_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InstallationLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAppointmentAttempt" ADD CONSTRAINT "RequestAppointmentAttempt_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "InstallationSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAppointmentAttempt" ADD CONSTRAINT "RequestAppointmentAttempt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAccessLink" ADD CONSTRAINT "AppointmentAccessLink_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ETCRegistrationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAuditLog" ADD CONSTRAINT "RequestAuditLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ETCRegistrationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAuditLog" ADD CONSTRAINT "RequestAuditLog_doneById_fkey" FOREIGN KEY ("doneById") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ETCRegistrationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
