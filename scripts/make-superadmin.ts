import { db } from "../src/lib/db";

async function makeSuperAdmin() {
  const email = "d@d.com";

  try {
    console.log(`Making ${email} a SUPER_ADMIN...`);

    const user = await db.user.update({
      where: { email },
      data: { role: "SUPER_ADMIN" },
    });

    console.log(`Success! ${user.email} is now a ${user.role}`);
    console.log("User details:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    // If user doesn't exist, show available users
    const users = await db.user.findMany({
      select: { email: true, role: true },
    });
    console.log("\nAvailable users:");
    users.forEach(u => console.log(`  - ${u.email} (${u.role})`));
  } finally {
    await db.$disconnect();
  }
}

makeSuperAdmin();
