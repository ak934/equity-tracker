-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "frameworkName" TEXT NOT NULL DEFAULT 'Buffett';

-- CreateTable
CREATE TABLE "AnalysisFramework" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisFramework_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisFramework_clerkUserId_idx" ON "AnalysisFramework"("clerkUserId");
