import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper to check super admin
async function checkSuperAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (user?.role !== "SUPER_ADMIN") return null;
  return session;
}

// GET - List all users
export async function GET(req: NextRequest) {
  const session = await checkSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const where = role ? { role: role as "CUSTOMER" | "CLEANER" | "ADMIN" | "SUPER_ADMIN" } : {};

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
          acceptedJobs: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// DELETE - Delete user
export async function DELETE(req: NextRequest) {
  const session = await checkSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  // Prevent deleting yourself
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  // Prevent deleting other super admins
  const targetUser = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (targetUser?.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot delete super admin users" }, { status: 400 });
  }

  // Delete user (cascades to sessions, accounts, notifications)
  await db.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

// PATCH - Update user role
export async function PATCH(req: NextRequest) {
  const session = await checkSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { id, role } = body;

  if (!id || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Prevent changing your own role
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  // Prevent creating new super admins (only existing super admins can be created manually)
  if (role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot assign super admin role through API" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return NextResponse.json(user);
}
