# Scrubly - Professional Cleaning Service Booking Platform

A modern, full-stack cleaning service booking platform built with Next.js 14, TypeScript, Prisma, and Stripe. Scrubly enables customers to book various cleaning services, from standard home cleaning to commercial office spaces.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF)

## ✨ Features

### 🏠 Multi-Service Booking System
- **Standard Cleaning** - Regular home cleaning services
- **Deep Cleaning** - Thorough cleaning with added extras
- **Move In/Out** - End of tenancy cleaning
- **Office Cleaning** - Commercial space cleaning with custom parameters (desks, meeting rooms, restrooms)

### 🎯 Smart Booking Flow
- Multi-step booking form with progress tracking
- Dynamic pricing based on property size and service type
- Office-specific parameters that adapt when office cleaning is selected
- Real-time price calculation
- Service-specific extras

### 💳 Payment Integration
- Stripe payment processing
- Secure checkout with card payments
- Webhook integration for payment confirmations
- Test and live mode support

### 👥 Role-Based Access Control
- **Customer Dashboard** - View and manage bookings
- **Cleaner Dashboard** - Accept and complete jobs
- **Admin Dashboard** - Manage bookings and users
- **Super Admin Dashboard** - Full system control with analytics

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Comprehensive navigation with dropdown menus
- User account menu with profile management
- Mobile-friendly interface
- Loading states and error handling

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Authentication:** Better Auth
- **Payments:** Stripe
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Deployment:** Vercel

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Stripe account
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/scrubly.git
   cd scrubly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   DATABASE_URL="postgresql://..."
   BETTER_AUTH_SECRET="your-secret-key"
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Database Schema

The application uses Prisma with the following main models:

- **User** - Customer, cleaner, admin, and super admin accounts
- **Booking** - Cleaning service bookings with location and pricing
- **CleanerProfile** - Cleaner-specific information and service areas
- **Notification** - User notifications system
- **PromoCode** - Discount codes for bookings

## 🎨 Project Structure

```
scrubly/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding
├── src/
│   ├── app/
│   │   ├── (auth)/        # Authentication pages
│   │   ├── api/           # API routes
│   │   ├── booking/       # Booking flow
│   │   └── dashboard/     # Role-based dashboards
│   ├── components/
│   │   ├── ui/            # Reusable UI components
│   │   ├── navbar.tsx     # Navigation component
│   │   └── payment-form.tsx
│   └── lib/
│       ├── auth.ts        # Authentication logic
│       ├── db.ts          # Database client
│       ├── stripe.ts      # Stripe configuration
│       └── utils.ts       # Utility functions
├── .env.example           # Environment variables template
└── package.json
```

## 🔧 Configuration

### Stripe Webhooks

For local development, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

For production, configure webhooks in the Stripe Dashboard:
- Endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### Database Migrations

Create a new migration:
```bash
npx prisma migrate dev --name your_migration_name
```

Apply migrations in production:
```bash
npx prisma migrate deploy
```

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. **Set up environment variables in Vercel**
   - Add all variables from `.env.example`
   - Update URLs to match your Vercel domain
   - Configure Stripe webhook with production URL

4. **Run database migrations**
   ```bash
   vercel env pull
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Environment Variables Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `BETTER_AUTH_SECRET` - Authentication secret (generate new for production)
- [ ] `BETTER_AUTH_URL` - Your production URL
- [ ] `NEXT_PUBLIC_APP_URL` - Your production URL
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (production endpoint)

## 🧪 Testing

### Test Cards (Stripe)

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

Use any future expiry date and any 3-digit CVC.

## 📱 Features Breakdown

### Office Cleaning Adaptation
When users select "Office Clean", the booking form automatically adapts to show:
- Number of desks (0-50)
- Meeting rooms (0-5)
- Restrooms (1-5)
- Office-specific extras (carpet cleaning, sanitization, etc.)
- Custom pricing calculation for office spaces

### Navigation Menu
- Services dropdown with all cleaning types
- Company pages (How It Works, Pricing, About, Contact)
- User account menu with dashboard, settings, and profile
- Mobile-responsive with organized sections

### Dynamic Pricing
Prices are calculated based on:
- Service type (Standard, Deep, Move In/Out, Office)
- Property size (bedrooms/bathrooms or office parameters)
- Selected extras
- Real-time updates in sidebar cart

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Payments by [Stripe](https://stripe.com/)
- Database hosted on [Neon](https://neon.tech/)

## 📞 Support

For support, please open an issue in the GitHub repository.

---

**Made with ❤️ using Claude Code**
