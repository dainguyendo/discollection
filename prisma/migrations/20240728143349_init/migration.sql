-- CreateTable
CREATE TABLE "Release" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "artist" TEXT
);

-- CreateTable
CREATE TABLE "ReleaseGenre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "releaseId" INTEGER NOT NULL,
    "genre" TEXT NOT NULL,
    CONSTRAINT "ReleaseGenre_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReleaseStyle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "releaseId" INTEGER NOT NULL,
    "style" TEXT NOT NULL,
    CONSTRAINT "ReleaseStyle_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
