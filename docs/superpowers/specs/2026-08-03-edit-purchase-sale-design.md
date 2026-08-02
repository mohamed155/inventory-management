# Edit Purchase / Edit Sale (reusing the Add dialogs)

## Goal

Let users edit an existing purchase or sale record — provider/customer, line items, quantities, prices, dates, discount, paid amount — by reusing `PurchaseDialog`/`SaleDialog` (the existing "add" dialogs) in an edit mode, instead of only being able to adjust payment via `UpdatePaymentDialog`.

## Coexistence with Update Payment

Both editing modes stay available, controlled by a new admin-only setting:

- `settings.store.ts` gains `purchaseSaleEditMode: 'paymentOnly' | 'fullEdit'` (default `'fullEdit'`), persisted like the rest of the store, with a setter and included in `resetSettings`.
- `settings.tsx` gets a new control for this setting, gated by `currentUser?.role === 'admin'` — the same pattern already used for `<UserManagement />` (`{currentUser?.role === 'admin' && <UserManagement />}`). Non-admins never see the control; they get whichever mode is currently configured.
- In `purchases.tsx`/`sales.tsx`, the pencil-icon action branches on this setting: `'paymentOnly'` → open `UpdatePaymentDialog` (unchanged, existing behavior); `'fullEdit'` → open `PurchaseDialog`/`SaleDialog` in edit mode (new).

`UpdatePaymentDialog` and the existing lightweight `updatePurchase`/`updateSale` IPC calls (`Partial<Purchase|Sale>`) are **not removed** — they remain the payment-only path.

## Dialog edit mode

`PurchaseDialog` and `SaleDialog` each gain an optional prop:

```ts
initialData?: { id: string } & PurchaseFormData   // PurchaseDialog
initialData?: { id: string } & SaleFormData       // SaleDialog
```

When present:
- Dialog title becomes "Edit Purchase" / "Edit Sale" (new i18n keys); submit stays "Save".
- `providerStatus`/`customerStatus` starts as `'exist'` (the record already resolved to a real provider/customer row).
- Form defaults come from `initialData` instead of the blank add-mode defaults.

**Implementation constraint:** both dialogs currently have a `useEffect` that calls `form.reset(blankDefaults)` whenever `providerStatus`/`customerStatus` changes (including on mount). Do not add a second, separately-keyed effect for prefill — the two would race, and whichever resets last wins (likely wiping the prefill). Instead, extract a single `buildDefaultValues(status, initialData)` function and use it as the *only* place default values are computed: in `useForm`'s initial `defaultValues`, and in the existing status-change effect (which now also depends on `initialData`/`open`).

## Prefill mapping

**Purchases:** `getAllPurchaseItems(purchaseId)` returns one row per `PurchaseItem`, merged with product + batch fields (`{...product, ...batch, ...item}`). Since `item` is spread last, the row's `id` field is the **PurchaseItem id**, not the product id — map the dialog's `products[].id` from the row's `productId` field, not `id`. Purchase items map 1:1 (no splitting), so no grouping is needed.

**Sales:** `getAllSaleItems(saleId)` also returns one row per `SaleItem`, but `createSale`'s FIFO consumption can split a single submitted line across multiple batches (multiple `SaleItem` rows sharing the same `productId`, same `unitPrice`, different `batchId`/`quantity`). Prefill must **group rows by `productId` and sum `quantity`** before building the form's `products` array, otherwise a previously-split sale reopens as duplicate lines, and each re-save multiplies the split further. `unitPrice` can be taken from any row in the group (`createSale` writes the same value to every split).

**Sale prefill stock-check fix:** `SaleDialog`'s `availableProducts` (filters to `getProductStock(id) > 0`) and its `superRefine` stock check both compare the requested quantity against current batch stock — which already excludes what *this* sale is holding, since the sale already consumed it. Opening an untouched edit form would then show an empty product picker for this sale's own products and fail validation immediately. Fix: when `initialData` is present, add the sale's own grouped per-product quantities back on top of `getProductStock`'s result (for the availability filter and the `superRefine` check only — not for the payload sent on save).

## Backend reconciliation

Two new prisma-actions, each wrapped in a single `prisma.$transaction`:

### `updatePurchaseWithItems(prisma, inventoryId, id, body: PurchaseFormData)`

Delta-by-batch-key, not blanket reverse-and-reapply — a purchase's batch may have been drawn down by sales that happened after the purchase, so reversing the full original quantity can fail even when the net edit is valid.

1. Resolve provider (existing-or-create, same as `createPurchase`).
2. Update the `Purchase` row's scalar fields (`paidAmount`, `discount`, `payDueDate`, `date`, `providerId`).
3. Load existing `PurchaseItem`s for this purchase, keyed by batch key = `productId + productionDate + expirationDate`.
4. Group the submitted `body.products` the same way, resolving new/existing products same as `createPurchase`.
5. For every batch key in the union of old and new:
   - `delta = newQty - oldQty` (0 if key only exists on one side).
   - If `delta < 0` and the batch's current quantity `+ delta < 0`: reject the whole transaction with `insufficientStockError(productId, oldQty + currentBatchQuantity - oldQty)` — i.e. the minimum quantity this key could be reduced to given how much is already sold. (Message framing differs from the sales case — see UI below.)
   - Otherwise apply the delta to `ProductBatch.quantity` (creating the batch if the key is new, same as `createPurchase`).
   - Update `Product.unitPrice`/`isExpirable` same as `createPurchase` for touched products.
6. Delete all old `PurchaseItem`s for this purchase, insert new ones from `body.products`.

### `updateSaleWithItems(prisma, inventoryId, id, body: SaleFormData)`

Full reverse + reapply — incrementing stock back is always safe, so there's no partial-application case to handle.

1. Resolve customer (existing-or-create, same as `createSale`).
2. Update the `Sale` row's scalar fields (`paidAmount`, `discount`, `payDueDate`, `date`, `customerId`).
3. Load existing `SaleItem`s for this sale; increment each one's batch by its quantity (full reversal).
4. Delete all old `SaleItem`s for this sale.
5. Run `createSale`'s existing FIFO-consumption loop (find batches ordered by expiration/production/createdAt, consume oldest-first, `insufficientStockError` if short) against `body.products`, creating new `SaleItem`s.

If step 5 throws, the transaction rolls back — the reversal in step 3 never commits.

## Error UX

- Reuse `insufficientStockError`/`parseInsufficientStockError` (`src/util/stock-error.ts`) for both directions — it's already generic (`productId`, a number).
- `PurchaseDialog` gains a `stockError?: { productId: string; available: number } | null` prop, mirroring `SaleDialog`'s existing one: on change, find the matching product line and `form.setError` + `form.setFocus` on its quantity field. Message text: "Cannot reduce below {available} — already sold from this batch" (new key), distinct from `SaleDialog`'s "Insufficient stock" wording.
- `purchases.tsx` catches errors from `updatePurchaseWithItems` the same way `sales.tsx` already catches `createSale` errors — `parseInsufficientStockError`, set `stockError` state, fall back to a toast for anything else.

**Two consequences of this design, worth being explicit about:**
- Reducing a purchased quantity (or removing a line) below what's already been sold from that batch is **rejected outright** — no partial/best-effort application.
- Changing a purchase line's product, production date, or expiration date is implemented as remove-old-batch-key + add-new-batch-key. It can fail for the same reason (old units already sold) even though conceptually only one field changed.

## API / type changes

- `src/prisma-actions/purchases.action.ts`: add `updatePurchaseWithItems`.
- `src/prisma-actions/sales.action.ts`: add `updateSaleWithItems`.
- `src/prisma-actions.ts`: register both, IPC channel names `updatePurchaseWithItems` / `updateSaleWithItems`.
- `src/preload.ts`, `src/types.d.ts`: expose `updatePurchaseWithItems(inventoryId, id, PurchaseFormData) => Promise<IpcResponse<Purchase>>` and the sale equivalent.
- `src/services/purchases.ts`, `src/services/sales.ts`: add corresponding service functions (mirroring `createPurchase`/`createSale`'s `getInventoryId()` pattern).
- Existing `updatePurchase`/`updateSale` (payment-only) are untouched.

## UI wiring (`purchases.tsx` / `sales.tsx`)

- Pencil-icon handler reads `useCurrentSettings((s) => s.purchaseSaleEditMode)` and branches to the existing `openUpdatePaymentDialog` or a new `openEditDialog` (fetches full item list via `getAllPurchaseItems`/`getAllSaleItems`, builds `initialData`, opens the add dialog in edit mode).
- `PurchaseDialog`/`SaleDialog` (already always-mounted for "add") gain the `initialData` prop; `onClose` handler branches on whether `initialData` was set (edit → call `updatePurchaseWithItems`/`updateSaleWithItems`; otherwise → existing create path).
- `SaleDialog`'s existing `stockError` handling (used today for create) is reused as-is for edit-mode insufficient-stock errors.

## i18n

New keys needed in both `src/i18n/locales/en.ts` and `ar.ts`: "Edit Purchase", "Edit Sale", the purchase-reduction-blocked error message, and the new settings control's label + option labels (e.g. "Payment only" / "Full record").

## Testing

- Unit/integration coverage (wherever existing `createPurchase`/`createSale`/`deletePurchase`/`deleteSale` tests live) for:
  - Purchase edit: quantity increase, quantity decrease within headroom, quantity decrease beyond headroom (rejected), product/date change on an untouched batch, product/date change on a partially-sold batch (rejected).
  - Sale edit: quantity increase within stock, quantity increase beyond stock (rejected), quantity decrease, product change, a sale that was originally FIFO-split across batches (prefill groups correctly, edit reconciles correctly).
- Manual verification in the running app: toggle the admin setting, confirm non-admin users don't see the control but get the configured mode, confirm edit prefill for both dialogs shows correct values including a split sale.
