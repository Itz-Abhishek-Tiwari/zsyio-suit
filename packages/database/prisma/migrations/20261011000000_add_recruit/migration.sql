-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "RecruitJob" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "employment" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'APPLIED',
    "source" TEXT NOT NULL DEFAULT 'Direct',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecruitJob_status_createdAt_idx" ON "RecruitJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RecruitApplication_stage_createdAt_idx" ON "RecruitApplication"("stage", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitApplication_jobId_email_key" ON "RecruitApplication"("jobId", "email");

-- CreateIndex
CREATE INDEX "RecruitEvent_applicationId_createdAt_idx" ON "RecruitEvent"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "RecruitApplication" ADD CONSTRAINT "RecruitApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "RecruitJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitEvent" ADD CONSTRAINT "RecruitEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RecruitApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

