interface VerificationEmailProps {
  name: string;
  verificationUrl: string;
}

export const VerificationEmail = ({ name, verificationUrl }: VerificationEmailProps) => {
  return {
    subject: "Verify your Scrubly account",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px;">Welcome to Scrubly!</h1>
    <p style="margin: 0 0 20px 0; font-size: 16px;">Hi ${name},</p>
    <p style="margin: 0 0 20px 0; font-size: 16px;">Thanks for signing up! Please verify your email address to get started.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}"
         style="background-color: #0f172a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Verify Email Address
      </a>
    </div>
    <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">Or copy and paste this link in your browser:</p>
    <p style="margin: 0; font-size: 14px; color: #64748b; word-break: break-all;">${verificationUrl}</p>
  </div>
  <div style="text-align: center; color: #94a3b8; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Scrubly. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim(),
    text: `
Welcome to Scrubly!

Hi ${name},

Thanks for signing up! Please verify your email address to get started.

Verify your email: ${verificationUrl}

© ${new Date().getFullYear()} Scrubly. All rights reserved.
    `.trim(),
  };
};
