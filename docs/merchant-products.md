# Archived products and storefront demo

The visitor storefront was archived on 20 October 2026. On 21 October 2026 the new product manager, product details and image-upload screens were also removed from the active app, restoring the original private stock catalogue. Their source is retained for recovery; no merchant data is erased. Its route, visitor entry button and demo transport endpoint are disabled. Product management, saved data and publication settings remain intact. `apps/web/src/features/store/Storefront.tsx` and its styles are retained for restoration. The visitor behaviour described below documents the archived feature.

The archived product manager previously used `/app/catalogue`. That route now opens the original private stock catalogue. Add or edit a product with up to four images, title, description, price/currency, SKU, business type, category, subcategory and opening stock. The first image is the cover; additional images can be promoted to cover or removed. Stock movements continue to record sales and restocks independently of payments.

Categories depend on business type: fashion/accessories, electronics, food/hospitality, retail, professional services or other. Changing type resets the category and subcategory together. Editing details preserves sales and current stock.

New and legacy stock items are drafts until explicitly published. Publishing requires an image, a description of at least ten characters and a positive price. Returning a product to draft removes it from the visitor view.

“View as visitor” opens `/store/demo` without the merchant shell or a session requirement. It supports category/subcategory filters, title/description search, stock availability and product details with an image gallery. Its data projection excludes drafts, SKUs, stock counts, sales history, merchant contact details, account information and balances.

This remains a browser-local demo. Images are resized to at most 1000 pixels on their longest side and stored with the workspace in localStorage. Sources must be JPEG, PNG or WebP and at most 8 MB; processed images have a 600,000-character limit. Storage failures roll back product changes. A storefront preview on another device will use that device’s own demo data. There is no public hosting of merchant data, customer cart, ordering or checkout in this feature. Production needs authenticated product APIs, durable image storage, a public merchant identifier and a server-side public-product projection.

Validation covers publication requirements, taxonomy, duplicate SKUs, private/public visibility, price precision, stock preservation, full-storage rollback, business-type selection and an upload-to-publication flow.
