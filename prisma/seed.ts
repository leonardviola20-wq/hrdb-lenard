import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create an admin user
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  // Optional: create a test user
  const userPassword = await bcrypt.hash("user123", 10);

  await prisma.user.create({
    data: {
      email: "user@example.com",
      password: userPassword,
      role: "USER",
    },
  });
}

main()
  .then(() => {
    console.log("Seed data created ✅");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
