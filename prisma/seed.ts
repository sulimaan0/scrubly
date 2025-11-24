import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  console.log("\nNOTE: Seed users are created WITHOUT passwords.");
  console.log("To create admin access:");
  console.log("1. Register at /register with your email");
  console.log("2. Update the user role in database to ADMIN or SUPER_ADMIN\n");

  // Create admin user placeholder
  const admin = await prisma.user.upsert({
    where: { email: "admin@scrubly.com" },
    update: {},
    create: {
      id: "admin-user-id",
      email: "admin@scrubly.com",
      name: "Admin User",
      role: "SUPER_ADMIN",
      emailVerified: true,
    },
  });

  // Create sample cleaner
  const cleaner = await prisma.user.upsert({
    where: { email: "cleaner@scrubly.com" },
    update: {},
    create: {
      id: "cleaner-user-id",
      email: "cleaner@scrubly.com",
      name: "John Cleaner",
      role: "CLEANER",
      emailVerified: true,
    },
  });

  await prisma.cleanerProfile.upsert({
    where: { userId: cleaner.id },
    update: {},
    create: {
      userId: cleaner.id,
      bio: "Professional cleaner with 5 years of experience",
      hourlyRate: 25,
      experience: 5,
      verified: true,
      serviceAreas: ["London", "Manchester", "Birmingham"],
      rating: 4.8,
      totalJobs: 150,
    },
  });

  // Create sample customer
  const customer = await prisma.user.upsert({
    where: { email: "customer@scrubly.com" },
    update: {},
    create: {
      id: "customer-user-id",
      email: "customer@scrubly.com",
      name: "Jane Customer",
      role: "CUSTOMER",
      emailVerified: true,
    },
  });

  console.log("Database seeded successfully!");
  console.log({ admin, cleaner, customer });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
