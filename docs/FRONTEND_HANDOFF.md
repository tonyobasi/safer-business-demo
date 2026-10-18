# Frontend handoff

## Architecture

`apps/web/src/features` owns independent feature pages. `components` owns shared UI and the workspace shell. `packages/contracts` holds shared DTOs and Zod schemas. `lib/api.ts` supplies the HTTP seam; `mocks/browser.ts` maps it to the local demo repository. Domain events invalidate TanStack Query caches. Browser storage events synchronize the demo between tabs.

The frontend implements phases 1–3 of the implementation plan using local design exports. Phase 0's live high-fidelity Figma extraction remains unavailable due connector quota. Backend phases 4–6 are not implemented.

## Endpoint contract

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/workspace` | Profile, balances, payments, links, items and deliveries |
| GET | `/api/payment-links/:id` | Checkout link data (demo only; replace with a safe public DTO) |
| POST | `/api/payment-links` | Confirm reviewed link draft |
| POST | `/api/catalogue` | Add a private catalogue item |
| POST | `/api/catalogue/:id/movements` | Record sale or add stock |
| POST | `/api/deliveries` | Confirm reviewed delivery quote |
| PUT | `/api/profile` | Update merchant details |
| PUT | `/api/preferences` | Save notification preferences |
| POST | `/api/payment-links/:id/simulate` | **Demo-only. Never expose in live services.** |
| POST | `/api/deliveries/:id/advance` | **Demo-only. Never expose in live services.** |

Every command receives an `Idempotency-Key`; the demo deduplicates writes during the current page lifetime. MySQL unique keys and durable command records must replace the in-memory map. Demo stock and ledger changes are atomic JavaScript operations; database transactions and concurrency checks are needed for real services. Pending sample balances are illustrative, not a reconciled ledger.

## Backend integration order

1. Implement email/SMS verification, password hashing, recovery and secure HttpOnly session cookies. Replace `app/session.tsx` and auth screens' demo steps with real session/challenge endpoints. Reauthorize on every server request.
2. Implement business-scoped data access. Derive business membership from the session, never user/model-provided IDs.
3. Implement payments, currency-specific double-entry ledger, provider webhooks, reconciliation and separate safe guest checkout DTOs. Sample accounts/addresses must be replaced only with authorized provider results.
4. Implement stock movements and a sale record shared between manual and payment-driven inventory changes to avoid double deduction. Define refund/cancellation stock rules.
5. Replace demo delivery quotes with provider quotes containing fees, expiry and confirmed service area. Confirm the exact quote before booking.
6. Add authenticated Socket.IO transport with persisted message acknowledgement, stable client message IDs, event versions, reconnect cursor/replay and HTTP resynchronization. `EventEnvelope` supplies the baseline domain-event type. Do not equate a socket reconnect with guaranteed delivery.
7. Replace `agent-engine.ts` with a server orchestration adapter. OpenAI Responses API keys remain on Node. Use strict function tools, business-scoped read access and immutable reviewed write drafts. Validate approvals and execute idempotently. Persist final messages and action outcomes; streaming chunks may be transient.
8. Add provider-specific error/retry states, real live session expiry, structured observability, backups and operational runbooks.

## Frontend review checklist

- Use `/login` → Open demo workspace for a quick review.
- Onboarding code: 123456. Wrong/expired codes show actionable errors.
- Create a USD and an NGN link. Open checkout, simulate a result and return to the merchant tab. Balances and history update once.
- Open a generated link in a new tab and simulate successful payment twice: funds must not be credited twice.
- Record a sale and attempt a quantity larger than the stock available. Restock afterwards.
- Request a delivery, review its quote, confirm and advance through tracking states.
- Check profile/settings changes after refresh.
- Resize to mobile: use the menu for profile/settings and bottom navigation for core features.
- Use keyboard navigation, Escape to dismiss dialogs and Shift+Enter for multiline chat.

## Limits to resolve before production

- Authentication, OpenAI, sockets and providers are mocked; no live backend exists.
- Exact current Figma verification requires restored connector access or updated authoritative exports.
- Public marketing SSR/prerendering, final legal copy, onboarding eligibility checks and production payment/delivery providers remain open.
- Currency conversion, USD-versus-USDC balance treatment, withdrawals and provider fees are product/provider decisions; the frontend does not invent them.
- No browser UI may claim a transfer succeeded until a verified backend status supplies that result.
