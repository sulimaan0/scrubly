import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import { resend, EMAIL_FROM } from "./resend";
import { VerificationEmail } from "@/emails/verification-email";

// Determine the base URL based on environment
const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) {
    console.log("[AUTH CONFIG] Using BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
    return process.env.BETTER_AUTH_URL;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    console.log("[AUTH CONFIG] Using NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    console.log("[AUTH CONFIG] Using VERCEL_URL:", url);
    return url;
  }
  console.log("[AUTH CONFIG] Using localhost");
  return "http://localhost:3000";
};

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: getBaseURL(),
  basePath: "/api/auth",
  trustedOrigins: [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://scrubly-delta.vercel.app",
    process.env.NEXT_PUBLIC_APP_URL || "",
    process.env.BETTER_AUTH_URL || "",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ].filter(Boolean),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true to require email verification before login
    sendVerificationEmail: async ({ user, url }: { user: { name: string; email: string }; url: string }) => {
      try {
        const emailContent = VerificationEmail({
          name: user.name,
          verificationUrl: url,
        });

        await resend.emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        console.log("[AUTH] Verification email sent to:", user.email);
      } catch (error) {
        console.error("[AUTH] Failed to send verification email:", error);
        throw error;
      }
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
