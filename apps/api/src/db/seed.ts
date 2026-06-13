import { db } from "./client";
import { folders, files } from "./schema";

async function seed() {
  await db.delete(files);
  await db.delete(folders);

  // Roots
  const [documents, pictures] = await db
    .insert(folders)
    .values([
      { name: "Documents", parentId: null },
      { name: "Pictures", parentId: null },
    ])
    .returning();

  const [work, personal] = await db
    .insert(folders)
    .values([
      { name: "Work", parentId: documents.id },
      { name: "Personal", parentId: documents.id },
    ])
    .returning();

  const [vacation] = await db
    .insert(folders)
    .values([{ name: "Vacation", parentId: pictures.id }])
    .returning();

  const [reports] = await db
    .insert(folders)
    .values([{ name: "Reports", parentId: work.id }])
    .returning();

  const [year2026] = await db
    .insert(folders)
    .values([{ name: "2026", parentId: reports.id }])
    .returning();

  await db.insert(files).values([
    { name: "resume.pdf", folderId: personal.id, sizeBytes: 245_000 },
    { name: "photo1.jpg", folderId: vacation.id, sizeBytes: 1_200_000 },
    { name: "q1-report.docx", folderId: year2026.id, sizeBytes: 58_000 },
  ]);

  console.log("Seed done.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
