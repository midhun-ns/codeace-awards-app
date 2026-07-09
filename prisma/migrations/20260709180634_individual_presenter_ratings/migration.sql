-- CreateTable
CREATE TABLE "Topic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Presenter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "photo" TEXT,
    "topicId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Presenter_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Score" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "presenterId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Score_presenterId_fkey" FOREIGN KEY ("presenterId") REFERENCES "Presenter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Presenter_topicId_idx" ON "Presenter"("topicId");

-- CreateIndex
CREATE INDEX "Score_presenterId_idx" ON "Score"("presenterId");

-- CreateIndex
CREATE INDEX "Score_topicId_idx" ON "Score"("topicId");

-- CreateIndex
CREATE INDEX "Score_sessionToken_idx" ON "Score"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Score_email_presenterId_sessionToken_key" ON "Score"("email", "presenterId", "sessionToken");

-- CreateIndex
CREATE INDEX "Session_topicId_idx" ON "Session"("topicId");

-- CreateIndex
CREATE INDEX "Session_isActive_idx" ON "Session"("isActive");
