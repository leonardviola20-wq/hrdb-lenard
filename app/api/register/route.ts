import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;
    const role = body.role ? String(body.role).toUpperCase() : "USER";

    // Basic validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Prevent duplicate accounts
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash and create
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenHash = createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const user = await prisma.user.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        role,
        emailVerified: false,
        verificationTokenHash,
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const origin = new URL(req.url).origin;
    return NextResponse.json(
      {
        message: "Registration successful. Verify your email before logging in.",
        user,
        localVerificationUrl: `${origin}/api/verify-email?token=${verificationToken}`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
