import { db } from "../src/lib/db";

async function deleteAllUsers() {
  try {
    console.log("Starting cleanup...");

    // Delete all verification codes
    const verifications = await db.verification.deleteMany({});
    console.log(`✅ Deleted ${verifications.count} verification codes`);

    // Delete all users (cascade will handle related records)
    const users = await db.user.deleteMany({});
    console.log(`✅ Deleted ${users.count} users`);

    console.log("\nAll user data has been cleared:");
    console.log("- Users");
    console.log("- Sessions (cascade)");
    console.log("- Accounts (cascade)");
    console.log("- Bookings (cascade)");
    console.log("- Notifications (cascade)");
    console.log("- Cleaner profiles (cascade)");
    console.log("- Verification codes");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

deleteAllUsers();
