# Safer Business

Merchant-only React frontend for payments, private stock tracking, deliveries and an agentic business workspace.

## Run locally

Use Node.js 24 LTS (the existing Node 22.12 host also builds and passes the checks; MSW's optional CLI dependencies recommend 22.13+).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173). The root URL opens the demo dashboard automatically. Login and signup also include a prominent **Login to demo** button. You can still complete onboarding with a sample email/phone, verification code **123456**, and a sample password. Passwords are never stored.

```sh
npm run check       # TypeScript, tests, production build
npm run build      # Output: apps/web/dist
```

## Implemented frontend

- Direct demo dashboard entry with Outfit headings and Switzer body typography, supplied logo and glossy workspace screens. Landing source is retained but is not routed.
- Nigeria-only country selection with flag/+234, email/phone signup, OTP validation/expiry/resend, password setup, business setup, login and password-recovery views.
- Responsive merchant shell with glossy Recent payments, USD/NGN balances and demo EUR/GBP wallets, business navigation and a mobile menu.
- Demo assistant with payment-link, stock, payment and delivery cards; explicit action review, cancellation and retry.
- USD/NGN payment-link creation, generated-link sharing, public checkout and successful/pending/failed/expired/invalid link states.
- Payment history, search/status filters, receipts and withdrawal review.
- Private catalogue, search/category filtering, sold/remaining counts, item creation, sale recording and restocking.
- Delivery quote/review/booking, tracking and simulated status updates.
- Editable profile, notification preferences, security form and help.

## What is simulated

This is a frontend implementation, not a live financial service. Demo mode routes requests directly to the browser-local repository without a service worker or live API. Sample business data is kept in localStorage; a demo session and chat are kept in sessionStorage. No passwords, API keys or real session credentials are stored. Changing the browser or clearing its storage resets the demonstration. Public checkout is public within this local demo only; shared links do not work across devices without a hosted backend.

The assistant is a deterministic mock adapter, not connected to OpenAI. Email/SMS, real authentication, funds, US virtual accounts, USDC addresses, withdrawals, riders and notifications are simulated. USDC receiving-network/address details are deliberately not invented. No Stellar wallet connection is present.

For real services, replace mock endpoints with Node/MySQL services and authenticated sockets, then integrate OpenAI server-side tools. `VITE_API_BASE_URL` is the future API boundary; turning demo mode off alone does **not** create secure production authentication or payments. See [integration handoff](docs/FRONTEND_HANDOFF.md).

## Design provenance

Based on the approved Safer Business design exports and screen references in `designs/`. The live Figma connector was quota-limited during this implementation, so exact fidelity to subsequent Figma edits is not claimed. The supplied logo, current Outfit/Switzer typography, approved tagline, section colours and recorded African photography were retained. Photos are illustrative, not customer endorsements; credits are in `apps/web/public/photo-credits.md`.

The landing workspace illustration is built from HTML/components rather than a screenshot asset. Screen modules are independent files with shared components and responsive CSS.

## Deployment

The build can be served as a static SPA over HTTPS. Configure your host to rewrite unknown application routes to `/index.html`, while serving `/images`, `/assets` and `/mockServiceWorker.js` normally. The GitHub repository is connected to Vercel at https://safer-business-demo.vercel.app. The root `vercel.json` configures the frontend build output and SPA routing.

Do not enable real payment collection until the backend integration and release gates in `IMPLEMENTATION_PLAN.md` are complete.

## GitHub repository

This repository contains the frontend and shared contracts. Large Figma image/SVG exports stay local; design notes and application assets are included. Environment files, private keys, dependencies and build output are ignored. Copy `apps/web/.env.example` to `apps/web/.env.local` only if you need to change the default demo settings. Every `VITE_` value is public browser configuration; never place secret keys there.

GitHub Actions runs `npm ci` and `npm run check` for pushes and pull requests using Node 24. To publish, create an empty GitHub repository and push this local repository to its remote. No GitHub repository or deployment is created by this preparation step.
