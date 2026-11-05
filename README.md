# BuyMeData (buymedata.com)

**BuyMeData** is a full-stack creator support, crowdfunding, and personal fundraising platform built initially for Nigeria (with NGN ₦ default currency) and engineered for multi-market African expansion.

It enables creators, educators, developers, students, and community causes to receive one-time financial support and launch milestone-driven fundraising campaigns through a single shareable link.

---

## 🚀 Key Features

1. **Public Marketing Website**:
   - High-converting Homepage with the headline *"Your passion deserves support."*
   - Interactive live support preview widget
   - Detailed How It Works, About, and FAQ sections
   - Legal document drafts: Terms of Service, Privacy Policy, Refund Policy, and Fundraising Guidelines.
2. **Creator Onboarding & Personalization**:
   - 5-step onboarding wizard
   - Customizable profile avatar, cover banner, bio, and social links
   - Palette theme switcher: Violet, Emerald, Amber, Rose, Ocean, and Midnight
   - Custom CTA button text (e.g., *"Buy me data 📶"*, *"Fuel my research 🚀"*)
   - Configurable suggested preset amounts (e.g. ₦500, ₦1,000, ₦2,000, ₦5,000)
3. **Public Creator Pages (`/:username`)**:
   - Single-link destination for each creator
   - Live mobile-optimized support checkout
   - Public supporter encouragement message wall
   - Showcase for active crowdfunding campaigns
4. **Fundraising Campaign Management (`/:username/campaigns/:campaignSlug`)**:
   - Milestone goal tracking with live progress bar calculated from verified contributions
   - Real-time backer counters and optional deadline countdowns
   - Creator progress updates with image attachments
5. **Friction-Free One-Time Support Checkout**:
   - Supports Debit Cards, Direct Bank Transfers, and USSD
   - Anonymous contribution option (hides name publicly while funds settle)
   - Celebratory confetti feedback, instant verifiable transaction receipts, and fee disclosure
   - Dual-mode gateway architecture: Paystack adapter & realistic Sandbox Simulator
6. **Auditable Double-Entry Financial Ledger**:
   - Immutable double-entry financial ledger records every event with balanced debit & credit entries (`ESCROW_CASH`, `PLATFORM_FEES`, `CREATOR_AVAILABLE`, `PAYOUT_OUTFLOW`)
   - Transparent 5% platform fee deduction
   - Clear distinction between Gross Inflow, Net Creator Earnings, Withdrawn Funds, and Available Balance
7. **Creator Bank Payouts**:
   - Integration architecture for licensed Central Bank of Nigeria (CBN) commercial and microfinance banks (GTBank, Access Bank, Zenith Bank, Kuda, OPay, Moniepoint, First Bank, etc.)
   - Instant 10-digit NUBAN account name resolution and verification
   - Enforces ₦2,000 minimum withdrawal threshold and ₦50 transfer processing fee
8. **In-App Notifications**:
   - Real-time notification center for support received, payout milestones, and campaign goals
9. **Administrative Portal (`/admin`)**:
   - Protected role-based access control (RBAC) enforced server-side
   - User account management with suspend/reinstate controls
   - Crowdfunding campaign moderation queue
   - Payment transaction inspection and double-entry ledger audits
   - Payout approval queue with disbursement execution
   - Community abuse reports and immutable administrative audit logs

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend & Database**: Firebase Cloud Firestore with ABAC Security Rules
- **Authentication**: Firebase Authentication (Email/Password, Google Sign-In with popup, Password Reset)
- **Financial Architecture**: Double-entry accounting ledger & provider-independent payment adapter (Paystack / Sandbox)

---

## 📁 Project Structure

```
├── firebase-applet-config.json     # Provisioned Firebase client configuration
├── firebase-blueprint.json         # Intermediate Representation (IR) data model
├── firestore.rules                 # Deployed Firestore ABAC security rules
├── index.html                      # Entry HTML with typography and SEO tags
├── metadata.json                   # Applet metadata
├── package.json                    # Dependencies & build scripts
├── src/
│   ├── components/
│   │   ├── checkout/               # Contribution checkout modal & confetti receipt
│   │   ├── creator/                # SupportBox, CampaignCard, SupporterMessageWall
│   │   └── layout/                 # Navbar, Footer, DashboardLayout, AdminLayout
│   ├── context/
│   │   └── AuthContext.tsx         # User session & profile context
│   ├── firebase/
│   │   ├── config.ts               # Firebase SDK init & connectivity check
│   │   └── errors.ts               # Structured Firestore error handling
│   ├── pages/
│   │   ├── admin/                  # Admin dashboard, users, campaigns, payouts, reports
│   │   ├── auth/                   # Login, Register, Forgot Password
│   │   ├── dashboard/              # Creator overview, page editor, campaigns, earnings, payouts
│   │   ├── onboarding/             # 5-step creator setup wizard
│   │   ├── public/                 # Homepage, About, How It Works, FAQ, Legal, Creator page
│   │   └── NotFoundPage.tsx        # 404 page
│   ├── router/                     # URL router with history pushState and param matching
│   ├── services/
│   │   ├── adminService.ts         # User moderation, payouts, reports, audit logs
│   │   ├── authService.ts          # Auth and profile synchronization
│   │   ├── campaignService.ts      # Campaigns & updates management
│   │   ├── creatorService.ts       # Profile CRUD & username availability
│   │   ├── notificationService.ts  # In-app alerts
│   │   ├── paymentService.ts       # Checkouts, ledger recording, earnings calculations
│   │   └── payoutService.ts        # Bank resolution & withdrawal requests
│   ├── types/
│   │   └── index.ts                # TypeScript entity definitions
│   └── utils/
│       ├── banks.ts                # Nigerian CBN bank codes & resolution simulation
│       └── formatters.ts           # NGN ₦ currency, dates, percentages, and slugification
```

---

## 🔐 Environment Variables

Define the following environment variables if deploying with production Paystack keys:

```env
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."
PAYSTACK_WEBHOOK_SECRET="whsec_..."
PAYMENT_PROVIDER="sandbox" # or "paystack"
APP_URL="https://buymedata.com"
```

*Note: In the development environment, if live payment credentials are not supplied, the app operates in safe Sandbox Simulator mode with realistic bank transfer, debit card, and USSD simulation.*

---

## ⚡ Development & Build Commands

```bash
# Run local development server
npm run dev

# Run TypeScript check and lint
npm run lint

# Compile production bundle
npm run build
```

---

## 🛡️ Security & Administration Notice

- Direct administrative access is granted to `EmmybikeCEO@gmail.com` as configured in the Firestore security rules.
- Payout requests and financial balance records are strictly verified through server-side ledger recalculations to prevent client-side manipulation.
