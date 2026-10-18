# Frontend verification — 17 October 2026

## Automated checks

- TypeScript strict checks, including unused locals/parameters: passed.
- Vitest: 21 tests across four files passed.
- Production Vite build: passed, with route modules split into separate chunks.
- Production dependency audit: zero known vulnerabilities at verification time.
- Source formatting: Prettier applied.

Tests cover exact USD/NGN minor-unit conversion, invalid amounts/currencies, payment-link form validation, idempotent creation and settlement, failure/retry accounting, stock limits and movement deduplication, catalogue SKU uniqueness and opening stock, delivery input validation, and demo assistant routing/currency extraction.

## Browser checks

Development journeys were exercised through the browser; the built app was subsequently opened using `npm run preview` on port 4173.

| Check | Result |
|---|---|
| Email signup → incorrect OTP → resend → correct OTP → password → business setup → workspace | Passed; corrected an onboarding cleanup/navigation race found during the first run |
| Phone signup → OTP view | Passed |
| Chat → USD 120.09 link → public checkout | Passed |
| USD checkout methods: US virtual account and USDC | Passed; intentionally non-payable demo details |
| Checkout pending → failed → retry → successful receipt | Passed |
| Payment settlement updates merchant balance across tabs | Passed; USD 4,280.00 → 4,400.09 |
| NGN 85,000 link → checkout → balance update | Passed; NGN 1,284,500.00 → 1,369,500.00 |
| Inventory sale recording and restocking | Passed |
| Private catalogue item creation | Passed |
| Delivery quote → review → demo booking → tracking update request | Passed |
| Profile and notification preference saves | Passed |
| Mobile menu navigation and Escape dismissal | Passed |
| Desktop 1440px, tablet 820px, mobile 390px | Passed; no page-level horizontal overflow in inspected workspace views |
| Mobile landing at 320px | Passed; no page-level horizontal overflow |
| Landing photo loading | All 13 distinct photo sources loaded; photographs are not reused between landing sections |
| Built frontend starts and demo workspace opens | Passed |

Tables scroll inside their cards on narrow screens. Real provider/network recovery and server authorization are outside this frontend milestone; they require the backend.

## Visual evidence

- `screenshots/workspace-desktop.png`
- `screenshots/workspace-mobile.png`
- `screenshots/landing-desktop.png`
- `screenshots/landing-mobile.png`
- `screenshots/checkout-mobile.png`

Reviewed against saved design references. Exact live Figma fidelity is unverified because the Figma connector returned its Starter-plan quota limit. No Figma source changes were made during frontend implementation. Accessibility checks included native labelled forms, dialog focus behaviour, keyboard interaction and responsive menus; a complete WCAG audit has not been performed.

## Release boundary

This is a working frontend demo with mock APIs. It is not ready to process real money, authenticate real accounts, call OpenAI or dispatch riders. The backend, provider integrations, socket persistence/recovery, final legal copy, public-page prerendering/SSR, production security review and operational release gates remain pending.
