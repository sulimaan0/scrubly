import { Resend } from "resend";

// Use a dummy key during build time if not available
export const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

// Email configuration
export const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
export const APP_NAME = "Scrubly";
export const APP_URL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
