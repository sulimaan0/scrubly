import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

// Better-auth compatible password hashing
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const email = "admin@test.com";
  const password = "admin123";
  const name = "Test Admin";

  console.log(`Creating admin account...`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log();

  // Create user
  const user = await prisma.user.create({
    data: {
      id: `admin-${Date.now()}`,
      email,
      name,
      role: "SUPER_ADMIN",
      emailVerified: true,
    },
  });

  // Create account with hashed password
  await prisma.account.create({
    data: {
      id: `account-${Date.now()}`,
      userId: user.id,
      accountId: email,
      providerId: "credential",
      password: hashPassword(password),
    },
  });

  console.log(`✓ Successfully created admin account!`);
  console.log(`\nLogin credentials:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: ${user.role}`);
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
