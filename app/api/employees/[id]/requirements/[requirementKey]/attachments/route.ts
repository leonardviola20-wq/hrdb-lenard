import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeEmployeeRequirementAccess } from "@/lib/employeeRequirementAccess";
import {
  employeeRequirementAttachmentMaxBytes,
  hasSupportedEmployeeRequirementAttachmentSignature,
  isEmployeeRequirementAttachmentMimeType,
} from "@/lib/employeeRequirementAttachments";
import { isEmployeeRequirementKey } from "@/lib/employeeRequirements";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string; requirementKey: string }> };
const maxMultipartOverheadBytes = 256 * 1024;

async function readBoundedRequestBody(request: Request, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, totalBytes);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id: rawId, requirementKey } = await params;
  const employeeId = Number(rawId);
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  }
  if (!isEmployeeRequirementKey(requirementKey)) {
    return NextResponse.json({ error: "Invalid requirement key" }, { status: 400 });
  }
  const authorizationError = await authorizeEmployeeRequirementAccess(request, employeeId);
  if (authorizationError) return authorizationError;

  const contentLength = Number(request.headers.get("content-length"));
  const maxRequestBytes = employeeRequirementAttachmentMaxBytes + maxMultipartOverheadBytes;
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    return NextResponse.json({ error: "Attachment exceeds the 10 MB limit" }, { status: 413 });
  }

  try {
    let formData: FormData;
    try {
      const requestBody = await readBoundedRequestBody(request, maxRequestBytes);
      if (!requestBody) {
        return NextResponse.json({ error: "Attachment exceeds the 10 MB limit" }, { status: 413 });
      }
      const headers = new Headers(request.headers);
      headers.delete("content-length");
      headers.delete("transfer-encoding");
      const boundedRequest = new Request(request.url, { method: request.method, headers, body: requestBody });
      formData = await boundedRequest.formData();
    } catch {
      return NextResponse.json({ error: "Invalid multipart attachment request" }, { status: 400 });
    }
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a non-empty attachment file" }, { status: 400 });
    }
    if (file.size > employeeRequirementAttachmentMaxBytes) {
      return NextResponse.json({ error: "Attachment exceeds the 10 MB limit" }, { status: 413 });
    }
    if (!isEmployeeRequirementAttachmentMimeType(file.type)) {
      return NextResponse.json({ error: "Only PDF, JPEG, and PNG attachments are allowed" }, { status: 415 });
    }

    const content = Buffer.from(await file.arrayBuffer());
    if (!hasSupportedEmployeeRequirementAttachmentSignature(file.type, content)) {
      return NextResponse.json({ error: "The file contents do not match the selected PDF, JPEG, or PNG type" }, { status: 415 });
    }

    const fileName = file.name.replace(/[\\/\u0000-\u001f\u007f]/g, "_").slice(0, 255) || "attachment";
    const attachment = await prisma.$transaction(async (transaction) => {
      const requirement = await transaction.employeeRequirement.upsert({
        where: { employeeId_requirementKey: { employeeId, requirementKey } },
        create: { employeeId, requirementKey },
        update: {},
        select: { id: true },
      });
      return transaction.employeeRequirementAttachment.create({
        data: {
          employeeId,
          requirementKey,
          employeeRequirementId: requirement.id,
          fileName,
          mimeType: file.type,
          size: content.byteLength,
          content,
        },
        select: { id: true, requirementKey: true, fileName: true, mimeType: true, size: true, createdAt: true },
      });
    });
    return NextResponse.json({ attachment }, {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Upload employee requirement attachment error:", error);
    return NextResponse.json({ error: "Unable to upload requirement attachment" }, { status: 500 });
  }
}
