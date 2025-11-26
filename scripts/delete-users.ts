import { db } from "../src/lib/db";

async function deleteAllUsers() {
  try {
    console.log("Starting cleanup...");

    // Delete all verification codes first
    const verifications = await db.verification.deleteMany({});
    console.log(`✅ Deleted ${verifications.count} verification codes`);

    // Delete all bookings (must be done before users due to foreign key constraints)
    const bookings = await db.booking.deleteMany({});
    console.log(`✅ Deleted ${bookings.count} bookings`);

    // Delete all notifications
    const notifications = await db.notification.deleteMany({});
    console.log(`✅ Deleted ${notifications.count} notifications`);

    // Delete all cleaner profiles
    const cleanerProfiles = await db.cleanerProfile.deleteMany({});
    console.log(`✅ Deleted ${cleanerProfiles.count} cleaner profiles`);

    // Delete all sessions
    const sessions = await db.session.deleteMany({});
    console.log(`✅ Deleted ${sessions.count} sessions`);

    // Delete all accounts
    const accounts = await db.account.deleteMany({});
    console.log(`✅ Deleted ${accounts.count} accounts`);

    // Now delete all users
    const users = await db.user.deleteMany({});
    console.log(`✅ Deleted ${users.count} users`);

    console.log("\n✅ All user data has been cleared successfully!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

deleteAllUsers();
