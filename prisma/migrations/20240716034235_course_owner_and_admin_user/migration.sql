/*
  Warnings:

  - Added the required column `ownerId` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Course_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("id", "image", "name") SELECT "id", "image", "name" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Manually add admin user
INSERT INTO User VALUES('clynvc4ot0000dhxbu5owo530','koko@epiccourse.dev','koko','Koko',1721101401533,1721101401533,3);
INSERT INTO Password VALUES('$2a$10$267QiBqSJGsYka6CKiTIxOrrqhV6vKrhYZabZqXYAIUUosy80x5zG','clynvc4ot0000dhxbu5owo530');
-- The Ids of the production and dev db don't match so comment them out
-- INSERT INTO _RoleToUser VALUES('clnf2zvlw000gpcour6dyyuh6','clynvc4ot0000dhxbu5owo530');
-- INSERT INTO _RoleToUser VALUES('clnf2zvlx000hpcou5dfrbegs','clynvc4ot0000dhxbu5owo530');