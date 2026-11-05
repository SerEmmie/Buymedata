# BuyMeData — System Architecture & Engineering Documentation

## 1. Executive Summary & Overview

**BuyMeData** (`buymedata.com`) is a high-integrity creator support, crowdfunding, and personal fundraising platform engineered for the Nigerian and broader African creator economy.

- **Primary Currency**: Nigerian Naira (NGN, `₦`). Designed with explicit currency fields to avoid implicit currency conversions.
- **Core Activities**:
  1. **Support**: Frictionless, one-time financial contributions to creators without mandatory supporter registration.
  2. **Fundraise**: Goal-oriented crowdfunding campaigns with milestone tracking, updates, and community transparency.
  3. **Track & Ledger**: Double-entry financial accounting, creator balances, payout automation, and administrative oversight.

---

## 2. Directory & Component Architecture

```
/
├── firestore.rules               # Strict Firestore security rules (RBAC, tamper protection)
├── firebase-blueprint.json       # Formal Firestore schema & index definitions
├── index.html                    # HTML5 entry with Plus Jakarta Sans & SEO metadata
├── metadata.json                 # AI Studio applet configuration & capabilities
├── package.json                  # Runtime and build dependencies
├── tsconfig.json                 # Strict TypeScript configuration
├── vite.config.ts                # Vite build config with Tailwind CSS v4 & path aliases
└── src/
    ├── App.tsx                   # Main application router and role-guarded layout selector
    ├── main.tsx                  # React 19 application entry point
    ├── index.css                 # Tailwind CSS v4 design tokens and utility styles
    ├── types/
    │   └── index.ts              # Canonical domain types & interfaces
    ├── context/
    │   └── AuthContext.tsx       # Firebase Auth state, profile hydration, suspension status
    ├── router/
    │   └── index.tsx             # Route management, URL path matching, navigation hooks
    ├── components/
    │   ├── ui/                   # Reusable, design-system compliant UI primitives
    │   │   ├── Button.tsx        # Variant-based button (primary, secondary, danger, outline, ghost)
    │   │   ├── Badge.tsx         # Status & category pills (success, warning, error, brand)
    │   │   ├── Card.tsx          # Card container with CardHeader, CardTitle, CardContent
    │   │   ├── Modal.tsx         # Accessible dialog/backdrop primitive
    │   │   └── index.ts          # Barrel export
    │   ├── layout/
    │   │   ├── Navbar.tsx        # Responsive top navigation with auth awareness
    │   │   ├── Footer.tsx        # Site-wide footer with legal and product navigation
    │   │   ├── DashboardLayout.tsx # Creator dashboard sidebar, user suspension banner
    │   │   └── AdminLayout.tsx   # Restricted admin control center navigation
    │   ├── creator/
    │   │   ├── SupportBox.tsx    # One-time payment widget on public creator pages
    │   │   ├── CampaignCard.tsx  # Campaign preview with progress bar & metadata
    │   │   └── SupporterMessageWall.tsx # Public supporter appreciation board
    │   └── checkout/
    │       └── ContributionCheckoutModal.tsx # Multi-step payment modal (Card, Bank, USSD)
    ├── services/
    │   ├── authService.ts        # User registration, role protection, login, profile queries
    │   ├── creatorService.ts     # Profile management, public slug resolution
    │   ├── campaignService.ts    # Campaign CRUD, goal increments, updates
    │   ├── paymentService.ts     # Atomic batch payment finalization, fee splits, ledger posting
    │   ├── payoutService.ts      # Withdrawal validation (min ₦2,000), suspension guard
    │   ├── adminService.ts       # Moderation, payout approvals, metrics, audit logs
    │   └── notificationService.ts # In-app notification triggers and queries
    └── utils/
        ├── banks.ts              # Nigerian commercial banks, FinTechs & USSD codes
        └── formatters.ts         # Currency (₦), dates, percentages, and string sanitizers
```

---

## 3. Role-Based Access Control (RBAC) & Security Architecture

### 3.1 Role Hierarchy
1. **Supporter (Guest / Authenticated)**:
   - Can discover public profiles and campaigns.
   - Can submit one-time contributions with custom messages without creating an account.
   - Can optionally submit abuse reports (`/reports`).
2. **Creator (`role: 'creator'`)**:
   - Manages personal creator profile (`/creatorProfiles`), page appearance, and suggested amounts.
   - Creates and manages campaigns (`/campaigns`) and updates (`/campaignUpdates`).
   - Links bank payout accounts (`/paymentAccounts`).
   - Requests withdrawals (`/payouts`) once balance >= ₦2,000, provided `accountStatus !== 'suspended'`.
   - Views personal contributions, notifications, and immutable earnings ledger entries.
3. **Admin (`role: 'admin'`)**:
   - Authorized by designated email (`EmmybikeCEO@gmail.com`) or membership in the `/admins` Firestore collection.
   - Global review and moderation across all users, campaigns, transactions, and abuse reports.
   - Approves or declines payout requests with automatic atomic ledger settlement.
   - Enforces account suspension/reactivation.
   - Accesses append-only immutable audit logs (`/adminAuditLogs`).

### 3.2 Security Vulnerabilities Identified & Remediated
During the architectural audit, several critical attack surfaces were identified and resolved:

| Vulnerability Surface | Threat Vector | Architectural Fix Applied |
| :--- | :--- | :--- |
| **User Role Escalation** | Malicious users submitting `role: 'admin'` or resetting `accountStatus` in profile updates. | Added strict `hasOnly(['fullName', 'username', 'emailVerified', 'updatedAt'])` check in `firestore.rules` and enforced `role: 'creator'` in `authService.ts`. |
| **Contribution Spoofing** | Attackers sending direct Firestore writes setting `paymentStatus: 'successful'` without paying. | Hardened `firestore.rules` to enforce `paymentStatus == 'pending'` on creation; transitions to `successful` can only occur through verified update rules or admin override. |
| **Campaign Aggregate Tampering** | Creators manually inflating `amountRaised` or `contributorCount` on their own campaigns. | Protected aggregate fields; client edits are constrained to content fields (`title`, `description`, `goal`, etc.). Settlement increments are strictly bounded. |
| **Payout Exploits** | Suspended users or attackers submitting payouts under minimum threshold or with pre-approved status. | Enforced `incoming().amount >= 2000 && incoming().status == 'pending'` in `firestore.rules`; integrated suspension check in `payoutService.ts`. |
| **Financial Ledger Inconsistency** | Individual document writes failing midway, causing desynchronized balances. | Refactored `paymentService.ts` and `adminService.ts` to use atomic Firestore `writeBatch(db)` commits across contributions, campaigns, and all balanced ledger pairs. |

---

## 4. Double-Entry Financial Ledger Mechanics

BuyMeData never stores account balances as single, mutable number fields. All financial movements are recorded as discrete, immutable debits and credits across double-entry ledger accounts.

### 4.1 Account Types
- `ESCROW_CASH`: Platform settlement clearing account holding real money received from payment gateways.
- `PLATFORM_FEES`: Retained revenue earned by BuyMeData (default 5% platform fee).
- `CREATOR_AVAILABLE`: Net withdrawable funds earned by the creator.
- `PAYOUT_OUTFLOW`: Funds disbursed to the creator's verified Nigerian commercial bank account.

### 4.2 Contribution Payment Event Formula
When a supporter sends a contribution of gross amount $A$ with platform fee rate $r$ (5%):

$$\text{Gross Amount} = A$$
$$\text{Platform Fee} = \text{round}(A \times r)$$
$$\text{Net Creator Amount} = A - \text{Platform Fee}$$

**Atomic Batch Commit**:
1. Update `contributions/{id}`: `paymentStatus = 'successful'`
2. Update `paymentTransactions/{ref}`: `status = 'successful'`
3. If campaign contribution: Increment `campaigns/{id}.amountRaised += A` and `contributorCount += 1`
4. Post Double-Entry Ledger Records:
   - `ESCROW_CASH` (`DEBIT`, $+A$): Total cash asset received into platform gateway.
   - `PLATFORM_FEES` (`CREDIT`, $+\text{Platform Fee}$): Revenue retained by the platform.
   - `CREATOR_AVAILABLE` (`CREDIT`, $+\text{Net Creator Amount}$): Payable owed to creator.

$$\sum \text{Debits} = A = \text{Platform Fee} + \text{Net Creator Amount} = \sum \text{Credits}$$

### 4.3 Payout Approval Event Formula
When an administrator approves a creator's payout request of amount $W$:

**Atomic Batch Commit**:
1. Update `payouts/{id}`: `status = 'approved'`, `processedAt = now`
2. Post Double-Entry Ledger Records:
   - `CREATOR_AVAILABLE` (`DEBIT`, $+W$): Deducts eligible balance from creator ledger.
   - `PAYOUT_OUTFLOW` (`CREDIT`, $+W$): Records disbursement to destination bank account.

$$\sum \text{Debits} = W = \sum \text{Credits}$$

---

## 4.4 Paystack Payment Gateway & Financial Infrastructure

BuyMeData integrates with Paystack using its official developer specifications, supporting Card, Bank Transfer, and USSD channels in Nigerian Naira (NGN, `₦`).

### 1. Zero-Trust Server-Side Verification
- **Never Trust Client Status**: The client interface NEVER writes or transitions payment status to `successful`.
- Payment initialization occurs via `POST /api/payments/initialize` with amount in kobo (`amount * 100`) and metadata containing `{ contributionId, creatorId, campaignId }`.
- Verification is performed server-side via `POST /api/payments/verify/:reference` which directly contacts `https://api.paystack.co/transaction/verify/:reference`.
- The server strictly verifies:
  1. `data.status === 'success'`
  2. `data.currency === 'NGN'`
  3. `data.amount === expectedKobo`
  4. Idempotency: If previously settled, returns existing state without double-crediting.

### 2. Cryptographic Signed Webhook Ingestion (`POST /api/payments/webhook`)
- Webhook authenticity is verified using HMAC SHA512 against `x-paystack-signature` using `crypto.timingSafeEqual`.
- `charge.success` triggers identical idempotent ledger settlement.
- `transfer.success` / `transfer.failed` updates creator withdrawal records.

### 3. Automated Payout & NUBAN Bank Transfers (`POST /api/payouts/initiate`)
- Bank account details are validated against NIBSS / CBN NUBAN records via `POST /api/banks/resolve`.
- Payout requests are strictly bounded:
  - Account suspension guard: Suspended creators cannot request payouts.
  - Minimum threshold: ₦2,000 minimum withdrawal.
  - Genuine ledger balance check: Available balance calculated from `ledgerEntries`.
- Paystack Transfers API executes disbursement:
  1. `POST https://api.paystack.co/transferrecipient` (generates recipient code)
  2. `POST https://api.paystack.co/transfer` (initiates transfer with reference)
  3. Writes balanced double-entry ledger entries: `CREATOR_AVAILABLE` (`DEBIT`), `PAYOUT_OUTFLOW` (`CREDIT`).

---

## 5. Database Schema & Collections Reference

The platform utilizes 14 distinct Firestore collections defined in `firebase-blueprint.json`:

1. `users`: Authentication metadata, role (`creator` | `admin`), account status (`active` | `suspended`).
2. `admins`: Admin role delegation and permissions.
3. `creatorProfiles`: Bio, display name, handle, avatar, cover image, suggested support amounts, social links.
4. `campaigns`: Goal amount, amount raised, deadline, category, creator ID, status (`active` | `completed` | `paused`).
5. `campaignUpdates`: Creator progress posts and announcements attached to campaigns.
6. `contributions`: Supporter details, gross amount, net amount, fee, message, visibility, status.
7. `paymentTransactions`: Payment gateway references, method (`card` | `transfer` | `ussd`), provider response.
8. `paymentAccounts`: Creator bank details (bank code, bank name, account number, account name).
9. `payouts`: Withdrawal requests, amount, destination account, status (`pending` | `approved` | `rejected`).
10. `ledgerEntries`: Immutable double-entry records (`entryType`, `accountType`, `amount`, `referenceId`).
11. `notifications`: In-app notification feed for creators and administrators.
12. `reports`: Community content moderation reports regarding campaigns or profiles.
13. `platformSettings`: Configurable parameters (platform fee percentage, minimum withdrawal threshold).
14. `adminAuditLogs`: Tamper-proof log of administrative actions (suspensions, approvals, setting changes).

---

## 6. Frontend Design Tokens & UI Component Standards

The frontend follows a clean, trust-inspiring visual design tailored for financial platforms:
- **Primary Brand Color**: Indigo/Violet `#6741D9` with deep accent `#4F2DB8` and subtle wash `#F3F0FF`.
- **Backgrounds**: Ultra-clean `#FAFAFC` surface with crisp white card containers (`#FFFFFF`).
- **Typography**: Plus Jakarta Sans for confident headings; Inter for readable financial figures.
- **Component Primitives (`src/components/ui/`)**:
  - `Button`: Consistent loading states, size tiers (`sm`, `md`, `lg`), and style variants (`primary`, `secondary`, `outline`, `ghost`, `danger`).
  - `Badge`: Standardized statuses (`success`, `warning`, `error`, `neutral`, `brand`).
  - `Card`: Structured container with `CardHeader`, `CardTitle`, `CardDescription`, and `CardContent`.
  - `Modal`: Accessible backdrop overlay with click-outside and escape-key handling.

---

## 7. Guidelines for Future Feature Development

When extending BuyMeData with upcoming features (e.g., automated Paystack/Flutterwave webhook verification, recurring memberships, or digital downloads):
1. **Never mutate balances directly**: Always compute available funds via `calculateCreatorBalance(creatorId)` from the `ledgerEntries` collection.
2. **Preserve atomic batch commits**: Any transaction affecting money, status, or counts must use `writeBatch(db)` to ensure all-or-nothing execution.
3. **Maintain RBAC checks**: Always enforce user suspension guards in new mutative operations.
4. **Follow the UI primitive library**: Utilize `@/src/components/ui` components to prevent ad-hoc inline styling discrepancies.
