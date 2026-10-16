import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = body.password;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Throttle by both the submitted email and the client IP so that neither
    // per-account guessing nor cross-account spraying from one host is cheap.
    const emailLimit = checkRateLimit(`login:email:${email}`, 10, 15 * 60 * 1000);
    const ipLimit = checkRateLimit(`login:ip:${getClientIp(req)}`, 30, 15 * 60 * 1000);
    if (!emailLimit.allowed || !ipLimit.allowed) {
      const retryAfter = Math.max(emailLimit.retryAfterSeconds, ipLimit.retryAfterSeconds);
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        canAccessEmployees: true,
        accessiblePages: true,
        emailVerified: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before logging in" },
        { status: 403 }
      );
    }

    // Create JWT payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      canAccessEmployees: user.canAccessEmployees,
      accessiblePages: user.accessiblePages,
    };

    // Sign JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });

    // Send cookie + role
    const response = NextResponse.json({
      message: "Login successful",
      role: user.role
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only force secure in prod
      sameSite: "strict",
      path: "/"
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
