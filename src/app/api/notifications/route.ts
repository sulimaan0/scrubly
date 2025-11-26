import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getMobileSession } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  // Try mobile token first
  let session = await getMobileSession(req);

  // Fall back to cookie-based session
  if (!session) {
    const webSession = await auth.api.getSession({ headers: await headers() });
    if (webSession) {
      session = { user: webSession.user } as any;
    }
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  // Try mobile token first
  let session = await getMobileSession(req);

  // Fall back to cookie-based session
  if (!session) {
    const webSession = await auth.api.getSession({ headers: await headers() });
    if (webSession) {
      session = { user: webSession.user } as any;
    }
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  await db.notification.update({
    where: { id },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
