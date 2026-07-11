-- CreateIndex
CREATE INDEX "Session_topicId_isActive_expiresAt_idx" ON "Session"("topicId", "isActive", "expiresAt");

-- DropIndex
DROP INDEX "Session_topicId_idx";

-- DropIndex
DROP INDEX "Session_isActive_idx";
