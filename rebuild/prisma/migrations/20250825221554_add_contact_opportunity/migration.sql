-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'proposal_won', 'proposal_lost', 'archived');

-- CreateEnum
CREATE TYPE "public"."ProposalStatus" AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "public"."TrainingContentType" AS ENUM ('video', 'article', 'quiz', 'diagram', 'playbook');

-- CreateEnum
CREATE TYPE "public"."RoadmapStatus" AS ENUM ('todo', 'in_progress', 'done', 'archived');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "public"."Phase" AS ENUM ('MONO', 'TRIF');

-- CreateEnum
CREATE TYPE "public"."OpportunityStatus" AS ENUM ('open', 'won', 'lost', 'archived');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "consumoMedio" DECIMAL(10,2),
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'new',
    "address" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Proposal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "public"."ProposalStatus" NOT NULL DEFAULT 'draft',
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrainingModule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrainingContent" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "type" "public"."TrainingContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" JSONB,
    "mediaUrl" TEXT,
    "durationSec" INTEGER,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserTrainingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "progressPerc" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "lastAccessed" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTrainingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SolarModule" (
    "id" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "powerW" INTEGER NOT NULL,
    "efficiencyPerc" DECIMAL(5,2),
    "dimensions" TEXT,
    "warrantyYears" INTEGER DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolarModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inverter" (
    "id" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "powerW" INTEGER NOT NULL,
    "mpptCount" INTEGER DEFAULT 1,
    "efficiencyPerc" DECIMAL(5,2),
    "phases" "public"."Phase" NOT NULL DEFAULT 'MONO',
    "warrantyYears" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inverter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TarifaConcessionaria" (
    "id" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "distribuidora" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "vigenciaInicio" TIMESTAMP(3) NOT NULL,
    "vigenciaFim" TIMESTAMP(3),
    "tusd" DECIMAL(10,6) NOT NULL,
    "te" DECIMAL(10,6) NOT NULL,
    "pisCofins" DECIMAL(5,4),
    "icms" DECIMAL(5,4),
    "cosip" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarifaConcessionaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoadmapItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."RoadmapStatus" NOT NULL DEFAULT 'todo',
    "priority" "public"."Priority" NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "consumoMedio" DECIMAL(10,2),
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'new',
    "address" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Opportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "public"."OpportunityStatus" NOT NULL DEFAULT 'open',
    "amount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactId" TEXT NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Proposal_leadId_idx" ON "public"."Proposal"("leadId");

-- CreateIndex
CREATE INDEX "Proposal_authorId_idx" ON "public"."Proposal"("authorId");

-- CreateIndex
CREATE INDEX "TrainingContent_moduleId_idx" ON "public"."TrainingContent"("moduleId");

-- CreateIndex
CREATE INDEX "UserTrainingProgress_userId_idx" ON "public"."UserTrainingProgress"("userId");

-- CreateIndex
CREATE INDEX "UserTrainingProgress_moduleId_idx" ON "public"."UserTrainingProgress"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrainingProgress_userId_moduleId_key" ON "public"."UserTrainingProgress"("userId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "SolarModule_manufacturer_model_key" ON "public"."SolarModule"("manufacturer", "model");

-- CreateIndex
CREATE UNIQUE INDEX "Inverter_manufacturer_model_key" ON "public"."Inverter"("manufacturer", "model");

-- CreateIndex
CREATE INDEX "TarifaConcessionaria_uf_distribuidora_tipo_idx" ON "public"."TarifaConcessionaria"("uf", "distribuidora", "tipo");

-- CreateIndex
CREATE INDEX "Opportunity_contactId_idx" ON "public"."Opportunity"("contactId");

-- CreateIndex
CREATE INDEX "Opportunity_ownerId_idx" ON "public"."Opportunity"("ownerId");

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainingContent" ADD CONSTRAINT "TrainingContent_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."TrainingModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTrainingProgress" ADD CONSTRAINT "UserTrainingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTrainingProgress" ADD CONSTRAINT "UserTrainingProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."TrainingModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
