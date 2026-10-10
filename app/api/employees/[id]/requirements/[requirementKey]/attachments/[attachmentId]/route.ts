import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeEmployeeRequirementAccess } from "@/lib/employeeRequirementAccess";
import { isEmployeeRequirementKey } from "@/lib/employeeRequirements";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string; requirementKey: string; attachmentId: string }> };

function parsePositiveId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id: rawId, requirementKey, attachmentId: rawAttachmentId } = await params;
  const employeeId = parsePositiveId(rawId);
  const attachmentId = parsePositiveId(rawAttachmentId);
  if (!employeeId || !attachmentId) return NextResponse.json({ error: "Invalid attachment request" }, { status: 400 });
  if (!isEmployeeRequirementKey(requirementKey)) return NextResponse.json({ error: "Invalid requirement key" }, { status: 400 });
  const authorizationError = await authorizeEmployeeRequirementAccess(request, employeeId);
  if (authorizationError) return authorizationError;

  try {
    const attachment = await prisma.employeeRequirementAttachment.findFirst({
      where: { id: attachmentId, employeeId, requirementKey },
      select: { fileName: true, mimeType: true, content: true },
    });
    if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    return new Response(new Uint8Array(attachment.content), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
        "Content-Type": attachment.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Download employee requirement attachment error:", error);
    return NextResponse.json({ error: "Unable to download requirement attachment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id: rawId, requirementKey, attachmentId: rawAttachmentId } = await params;
  const employeeId = parsePositiveId(rawId);
  const attachmentId = parsePositiveId(rawAttachmentId);
  if (!employeeId || !attachmentId) return NextResponse.json({ error: "Invalid attachment request" }, { status: 400 });
  if (!isEmployeeRequirementKey(requirementKey)) return NextResponse.json({ error: "Invalid requirement key" }, { status: 400 });
  const authorizationError = await authorizeEmployeeRequirementAccess(request, employeeId);
  if (authorizationError) return authorizationError;

  try {
    const attachment = await prisma.employeeRequirementAttachment.findFirst({
      where: { id: attachmentId, employeeId, requirementKey },
      select: { id: true },
    });
    if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    await prisma.employeeRequirementAttachment.delete({ where: { id: attachment.id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete employee requirement attachment error:", error);
    return NextResponse.json({ error: "Unable to delete requirement attachment" }, { status: 500 });
  }
}
