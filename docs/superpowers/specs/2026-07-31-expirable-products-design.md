# Expirable Product Toggle — Design

## Problem

Some products are not expirable and don't have meaningful production/expiration
dates. Today the "Add Product" / "Add Quantity" (Inventory dialog) and "Add
Purchase" forms always show Production Date and Expiration Date inputs,
forcing users to skip or fabricate dates for non-expirable products.

## Goal

Add an "Expirable" checkbox (checked by default) to the Inventory dialog and
Purchase dialog that shows/hides the Production Date and Expiration Date
inputs. Non-expirable products end up with null dates on their batch(es).

`createPurchase` (`src/prisma-actions/purchases.action.ts`) already dedupes
batches by `(productId, productionDate, expirationDate)`, so purchasing a
non-expirable product repeatedly through that flow collapses into a single
null/null batch. `createProductBatch` (used by the Inventory dialog's "Add
Quantity" flow) has no such dedup logic — repeated "Add Quantity" actions on
a non-expirable product create separate null/null batches each time. This is
an accepted, documented limitation, not something addressed by this feature.

## Data model

Add a new field to `Product` in `prisma/schema.prisma`:

```prisma
model Product {
  ...
  isExpirable Boolean @default(true)
  ...
}
```

No changes to `ProductBatch`. It already stores nullable `productionDate` /
`expirationDate`. As noted above, only the `createPurchase` path dedupes
batches by `(productId, productionDate, expirationDate)`; the
`createProductBatch` ("Add Quantity") path does not.

This repo does **not** apply schema changes via `prisma db push` or
`prisma migrate dev` — both conflict with a custom `_applied_migrations`
tracking table that `src/electron.ts`'s `ensureDatabase()` maintains (verified:
`bun run db:push` refuses to run because it wants to drop that table).
Instead, add a hand-written `prisma/migrations/<timestamp>_<name>/migration.sql`
file (plain `ALTER TABLE` statements, matching the existing
`purchase_discount` migration's style) and run `bun run db:generate` to
regenerate the Prisma client types. Both `tests/setup/db.ts` and
`src/electron.ts` scan `prisma/migrations/*/migration.sql` directly and apply
whatever hasn't been recorded yet, so the new file is picked up automatically
by both the test suite and the running Electron app — no `db push`/`migrate
dev` step is needed or safe here.

## Validation rule

- Checkbox checked (`isExpirable: true`): `productionDate` and
  `expirationDate` are both **required** (`z.date()`), plus the existing
  "expiration must be after production" refinement.
- Checkbox unchecked (`isExpirable: false`): both fields are omitted from the
  zod schema and cleared to `undefined` before submit, even if they had
  previously been filled in.

The checkbox is never disabled in any context (new product, add quantity,
purchase — new or existing product line). Selecting an existing product
initializes the checkbox from that product's stored `isExpirable`, but the
user can still freely toggle it, and doing so persists the new value back to
the product record.

## Inventory dialog (`src/components/dialogs/inventory-dialog.tsx`)

- Add an "Expirable" checkbox (requires `bunx shadcn add checkbox`, no
  Checkbox component exists yet), checked by default, in both the "New
  Product" and "Add Quantity" tabs.
- Wrap the Production Date / Expiration Date `Controller`s in
  `<Activity mode={isExpirable ? 'visible' : 'hidden'}>`, driven by
  `form.watch('isExpirable')`.
- In "Add Quantity" tab, when the user picks an existing product via the
  combobox, initialize the checkbox from that product's `isExpirable` (needs
  `getAllProducts` to also return `isExpirable`).
- On submit, `isExpirable` is included in the payload passed to `onClose`, for
  both create and update paths.

## Purchase dialog (`src/components/dialogs/purchase-dialog.tsx`)

- Add the same "Expirable" checkbox per product line item, in both "New
  product" and "Exist product" sub-tabs, checked by default.
- For "Exist product", selecting a product initializes that line's checkbox
  from the product's stored `isExpirable` (still editable).
- Date fields hidden/shown per-line via `Activity`, based on that line's
  checkbox state.
- `isExpirable` is included per product entry in `PurchaseFormData`.

## Backend (`src/prisma-actions`)

- `product.action.ts`:
  - `createProduct` / `updateProduct`: pass `isExpirable` through (already
    covered since they spread the full `product` object into `data`).
  - `getAllProducts`: also return `isExpirable` (currently only returns
    `id`/`name`), so the dialogs can read it when an existing product is
    selected.
  - `updateProductBatch`: include `isExpirable` in the `product.update` call
    alongside the existing `name` / `description` / `unitPrice` update (this
    powers the Inventory page's edit-batch-row flow).
- `purchases.action.ts`:
  - `createPurchase`: when creating a new product, set `isExpirable` on
    creation; when using an existing product, include `isExpirable` in the
    existing `tx.product.update` call that currently only updates
    `unitPrice`.
  - Dates continue to pass through unchanged (`ProductBatch` fields are
    already nullable).

## Out of scope

- No new `isExpirable` column added to the Inventory/Batches table — not
  requested, and the existing Production/Expiration Date columns already
  communicate this implicitly (blank for non-expirable rows).
- No backend enforcement preventing a mismatch between a product's
  `isExpirable` flag and dates already stored on its existing batches (e.g.
  toggling a product to non-expirable does not retroactively clear dates on
  batches created before the toggle).
