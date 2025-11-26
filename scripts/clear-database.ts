import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Starting database cleanup...\n");

  try {
    // Delete in order to respect foreign key constraints
    console.log("Deleting notifications...");
    const notifications = await prisma.notification.deleteMany();
    console.log(`✓ Deleted ${notifications.count} notifications`);

    console.log("Deleting bookings...");
    const bookings = await prisma.booking.deleteMany();
    console.log(`✓ Deleted ${bookings.count} bookings`);

    console.log("Deleting cleaner profiles...");
    const cleanerProfiles = await prisma.cleanerProfile.deleteMany();
    console.log(`✓ Deleted ${cleanerProfiles.count} cleaner profiles`);

    console.log("Deleting sessions...");
    const sessions = await prisma.session.deleteMany();
    console.log(`✓ Deleted ${sessions.count} sessions`);

    console.log("Deleting accounts...");
    const accounts = await prisma.account.deleteMany();
    console.log(`✓ Deleted ${accounts.count} accounts`);

    console.log("Deleting verifications...");
    const verifications = await prisma.verification.deleteMany();
    console.log(`✓ Deleted ${verifications.count} verifications`);

    console.log("Deleting users...");
    const users = await prisma.user.deleteMany();
    console.log(`✓ Deleted ${users.count} users`);

    console.log("\n✅ Database cleanup completed successfully!");
  } catch (error) {
    console.error("\n❌ Error during cleanup:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
