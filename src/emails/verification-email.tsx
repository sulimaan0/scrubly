interface VerificationEmailProps {
  name: string;
  code: string;
}

export const VerificationEmail = ({ name, code }: VerificationEmailProps) => {
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
    <p style="margin: 0 0 20px 0; font-size: 16px;">Thanks for signing up! Use the verification code below to verify your email address and get started.</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #ffffff; border: 2px solid #0f172a; border-radius: 8px; padding: 20px; display: inline-block;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</div>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', monospace;">${code}</div>
      </div>
    </div>
    <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-align: center;">This code will expire in 15 minutes.</p>
    <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
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

Thanks for signing up! Use the verification code below to verify your email address and get started.

Your verification code: ${code}

This code will expire in 15 minutes.

If you didn't request this code, you can safely ignore this email.

© ${new Date().getFullYear()} Scrubly. All rights reserved.
    `.trim(),
  };
};
