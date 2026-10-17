import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    // Throttle account creation per IP to blunt automated/abusive signups.
    const rateLimit = checkRateLimit(`register:${getClientIp(req)}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const body = await req.json();
    const username = (body.username || "").trim();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;

    // SECURITY: The role is never taken from the client. Public self-signup
    // always creates a least-privilege USER; privileged roles are only granted
    // afterwards by an admin through /api/admin/users/[id].
    const role = "USER";

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

    // Enforce the same password strength rules as /api/me/password.
    const meetsPasswordRequirements =
      typeof password === "string"
      && password.length >= 8
      && Buffer.byteLength(password, "utf8") <= 72
      && /[A-Z]/.test(password)
      && /[0-9]/.test(password)
      && /[^\p{L}\p{N}\s]/u.test(password);
    if (!meetsPasswordRequirements) {
      return NextResponse.json(
        { message: "Password must be 8-72 characters and include an uppercase letter, a number, and a special character" },
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
    // SECURITY: only surface the verification link in development/testing,
    // where there is no email transport. In production the link must be
    // delivered by email only and never returned to the client.
    const verificationUrl =
      process.env.NODE_ENV === "production"
        ? undefined
        : `${origin}/api/verify-email?token=${verificationToken}`;
    return NextResponse.json(
      {
        // No mailer is deployed, so production signups wait for an admin to
        // verify the account in /admin. Development keeps the direct link.
        message: verificationUrl
          ? "Registration successful. Verify your email before logging in."
          : "Registration received. An administrator must verify your account before you can log in.",
        user,
        ...(verificationUrl ? { verificationUrl } : {}),
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
