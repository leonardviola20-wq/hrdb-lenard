import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");

  if (!token) {
    return NextResponse.json({ message: "Verification token is required" }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const user = await prisma.user.findFirst({
    where: {
      verificationTokenHash: tokenHash,
      verificationTokenExpires: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Verification link is invalid or expired" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationTokenHash: null,
      verificationTokenExpires: null,
    },
  });

  return NextResponse.json({ message: "Email verified. You can now log in." });
}
