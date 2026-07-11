-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Score" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "presenterId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,
    "voterId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Score_presenterId_fkey" FOREIGN KEY ("presenterId") REFERENCES "Presenter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Score" ("id", "presenterId", "topicId", "voterId", "rating", "sessionToken", "ipAddress", "createdAt")
SELECT "id", "presenterId", "topicId", "email", "rating", "sessionToken", COALESCE("ipAddress", 'unknown'), "createdAt" FROM "Score";
DROP TABLE "Score";
ALTER TABLE "new_Score" RENAME TO "Score";
CREATE INDEX "Score_presenterId_idx" ON "Score"("presenterId");
CREATE INDEX "Score_topicId_idx" ON "Score"("topicId");
CREATE INDEX "Score_sessionToken_idx" ON "Score"("sessionToken");
CREATE UNIQUE INDEX "Score_voterId_presenterId_sessionToken_key" ON "Score"("voterId", "presenterId", "sessionToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
