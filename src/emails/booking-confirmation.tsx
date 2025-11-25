import { formatPrice, formatDate } from "@/lib/utils";

interface BookingConfirmationProps {
  customerName: string;
  bookingId: string;
  serviceType: string;
  propertyType: string;
  address: string;
  city: string;
  postcode: string;
  date: string;
  timeSlot: string;
  bedrooms?: number;
  bathrooms?: number;
  desks?: number;
  extras: string[];
  price: number;
}

export const BookingConfirmationEmail = ({
  customerName,
  bookingId,
  serviceType,
  propertyType,
  address,
  city,
  postcode,
  date,
  timeSlot,
  bedrooms,
  bathrooms,
  desks,
  extras,
  price,
}: BookingConfirmationProps) => {
  const serviceName = serviceType.replace(/_/g, " ");
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    subject: `Booking Confirmed - ${serviceName} Clean`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #0f172a; margin: 0 0 10px 0; font-size: 24px;">Booking Confirmed!</h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Booking #${bookingId.slice(0, 8).toUpperCase()}</p>

    <p style="margin: 0 0 20px 0; font-size: 16px;">Hi ${customerName},</p>
    <p style="margin: 0 0 30px 0; font-size: 16px;">Your ${serviceName.toLowerCase()} cleaning has been confirmed. We're looking for the perfect cleaner for you!</p>

    <div style="background-color: white; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: #0f172a; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Booking Details</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Service</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500; font-size: 14px;">${serviceName}</td>
        </tr>
        ${bedrooms !== undefined ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Property</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500; font-size: 14px;">${bedrooms} bed, ${bathrooms} bath</td>
        </tr>
        ` : ''}
        ${desks !== undefined ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Office Size</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500; font-size: 14px;">${desks} desks</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500; font-size: 14px;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500; font-size: 14px;">${timeSlot}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Address</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500; font-size: 14px;">${address}, ${city} ${postcode}</td>
        </tr>
        ${extras.length > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Extras</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500; font-size: 14px;">${extras.map(e => e.replace(/-/g, ' ')).join(', ')}</td>
        </tr>
        ` : ''}
        <tr style="border-top: 2px solid #e2e8f0;">
          <td style="padding: 15px 0 0 0; color: #0f172a; font-size: 16px; font-weight: 600;">Total</td>
          <td style="padding: 15px 0 0 0; text-align: right; color: #0f172a; font-size: 18px; font-weight: 600;">£${(price / 100).toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>What's next?</strong><br>
        We're matching you with a verified cleaner in your area. You'll receive an update once a cleaner accepts your booking.
      </p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/dashboard/customer"
         style="background-color: #0f172a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        View Booking
      </a>
    </div>
  </div>

  <div style="text-align: center; color: #94a3b8; font-size: 12px;">
    <p>Need help? Contact us at support@scrubly.com</p>
    <p>© ${new Date().getFullYear()} Scrubly. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim(),
    text: `
Booking Confirmed!

Booking #${bookingId.slice(0, 8).toUpperCase()}

Hi ${customerName},

Your ${serviceName.toLowerCase()} cleaning has been confirmed. We're looking for the perfect cleaner for you!

BOOKING DETAILS
Service: ${serviceName}
${bedrooms !== undefined ? `Property: ${bedrooms} bed, ${bathrooms} bath\n` : ''}${desks !== undefined ? `Office Size: ${desks} desks\n` : ''}Date: ${formattedDate}
Time: ${timeSlot}
Address: ${address}, ${city} ${postcode}
${extras.length > 0 ? `Extras: ${extras.map(e => e.replace(/-/g, ' ')).join(', ')}\n` : ''}
Total: £${(price / 100).toFixed(2)}

WHAT'S NEXT?
We're matching you with a verified cleaner in your area. You'll receive an update once a cleaner accepts your booking.

View your booking: ${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/dashboard/customer

Need help? Contact us at support@scrubly.com
© ${new Date().getFullYear()} Scrubly. All rights reserved.
    `.trim(),
  };
};
