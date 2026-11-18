import { prisma } from "@/lib/prisma";

export async function nextSssReportId() {
  const rows = await prisma.$queryRaw<{ id: number }[]>`SELECT nextval('"SssReport_id_seq"')::integer AS id`;
  const id = rows[0]?.id;
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Unable to allocate an SSS report ID.");
  }
  return id;
}

export async function nextSssReportDraftId() {
  const rows = await prisma.$queryRaw<{ id: number }[]>`SELECT nextval('"SssReportDraft_id_seq"')::integer AS id`;
  const id = rows[0]?.id;
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Unable to allocate an SSS report draft ID.");
  }
  return id;
}
