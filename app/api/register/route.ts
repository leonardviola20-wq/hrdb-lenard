// app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password, role } = await req.json();

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword, // ✅ explicitly included
      role,                     // ✅ explicitly included
    },
    select: {
      id: true,
      email: true,
      role: true,               // ✅ explicitly included
    }
  });

  return NextResponse.json({ message: "User registered", user });
}
