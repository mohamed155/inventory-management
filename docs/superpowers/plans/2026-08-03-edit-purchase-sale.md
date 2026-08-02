# Edit Purchase / Edit Sale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users edit an existing purchase or sale — provider/customer, line items, quantities, prices, dates, discount, paid amount — by reusing the existing `PurchaseDialog`/`SaleDialog` in an edit mode, with an admin-only setting choosing between the old payment-only dialog and the new full edit.

**Architecture:** Two new IPC-exposed prisma actions reconcile stock. Purchases use *delta-by-batch-key* (a purchase's batch may already be drawn down by later sales, so a blanket reverse-and-reapply would fail spuriously where a net delta is legal). Sales use *full reverse + FIFO reapply* (incrementing stock back is always safe). The add dialogs gain an optional `initialData` prop; prefill mapping lives in pure `src/util/` functions so it is testable in the repo's node-environment vitest setup.

**Tech Stack:** Electron + React 19, Prisma over SQLite (LibSQL WASM), TanStack Query, Zustand, React Hook Form + Zod, shadcn/ui, i18next (en + ar/RTL), vitest, Bun.

## Global Constraints

- Package manager is **Bun** — use `bun` / `bunx`, never npm/npx.
- Never call Prisma from React-side code; all DB access goes React service → `window.electronAPI` → preload → IPC handler in `src/prisma-actions.ts` → prisma action.
- Never use `<input type="number">` or `<Input type="number">`; always `<ArithmeticInput>` from `@/components/ui/arithmetic-input.tsx`.
- Use Tailwind **logical properties** (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`), never physical (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`), so Arabic RTL flips correctly.
- Every new user-facing string needs a key in **both** `src/i18n/locales/en.ts` and `src/i18n/locales/ar.ts`. `tests/unit/lib/i18n-keys.test.ts` fails the build if a key exists in en but not ar. Keys in both files are kept in alphabetical order.
- No i18n interpolation in this codebase — build messages by string concatenation, e.g. `` `${t('Insufficient stock')} (${t('Available Stock')}: ${n})` ``.
- Do **not** run `bun run db:push` or `prisma migrate dev`. This feature requires **no schema change**, so no migration file is needed either.
- Tests: `bun run test` (vitest, `environment: 'node'`, only `tests/**/*.test.ts` — no `.tsx`, no jsdom, no testing-library). Do not add component-test infrastructure.
- Typecheck with `bunx tsc -b`.
- Formatting: Biome — 2-space indent, single quotes, trailing commas.
- Path alias `@/` resolves to `src/`.

## File Structure

**Create:**
- `src/util/purchase-edit-data.ts` — pure mapping of a purchase row + its item rows into `PurchaseEditData`
- `src/util/sale-edit-data.ts` — same for sales, including the FIFO-split grouping
- `tests/unit/util/purchase-edit-data.test.ts`
- `tests/unit/util/sale-edit-data.test.ts`

**Modify:**
- `src/models/purchase-form.ts` — add `PurchaseEditData`
- `src/models/sales-form.ts` — add `SaleEditData`
- `src/store/settings.store.ts` — add `purchaseSaleEditMode`
- `src/prisma-actions/purchases.action.ts` — add `updatePurchaseWithItems`
- `src/prisma-actions/sales.action.ts` — add `updateSaleWithItems`
- `src/prisma-actions.ts` — register two IPC handlers
- `src/preload.ts`, `src/types.d.ts` — expose the two methods
- `src/services/purchases.ts`, `src/services/sales.ts` — add service wrappers
- `tests/setup/electron-api.ts` — add the two methods to the mock whitelist
- `src/components/dialogs/purchase-dialog.tsx` — `initialData` + `stockError` props
- `src/components/dialogs/sale-dialog.tsx` — `initialData` prop, edit-aware stock baseline
- `src/pages/purchases.tsx`, `src/pages/sales.tsx` — branch pencil icon on the setting, wire edit mode
- `src/pages/settings.tsx` — admin-only setting control
- `src/i18n/locales/en.ts`, `src/i18n/locales/ar.ts` — new keys
- `tests/unit/store/settings.test.ts`, `tests/unit/prisma-actions/{purchases,sales}.test.ts`, `tests/unit/services/{purchases,sales}.test.ts` — new cases

---

### Task 1: Edit-data models and pure prefill mappers

Extracts the two mappings that carry real bug risk: purchase item rows expose the **PurchaseItem** id as `id` (the merge order is `{...product, ...batch, ...item}`, so `item` wins), and sale items can be **FIFO-split** across batches so one submitted line becomes several rows.

**Files:**
- Modify: `src/models/purchase-form.ts`
- Modify: `src/models/sales-form.ts`
- Create: `src/util/purchase-edit-data.ts`
- Create: `src/util/sale-edit-data.ts`
- Test: `tests/unit/util/purchase-edit-data.test.ts`
- Test: `tests/unit/util/sale-edit-data.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: types `PurchaseEditData`, `SaleEditData`; functions `toPurchaseEditData(purchase: PurchaseEditSource, items: PurchaseItemRow[]): PurchaseEditData` and `toSaleEditData(sale: SaleEditSource, items: SaleItemRow[]): SaleEditData`. Tasks 6–9 consume all four.

- [ ] **Step 1: Add the edit-data types**

Append to `src/models/purchase-form.ts`:

```ts
export type PurchaseEditData = {
  id: string;
  providerId: string;
  paidAmount: number;
  discount: number;
  payDueDate: Date;
  date: Date;
  products: {
    id: string;
    isExpirable: boolean;
    quantity: number;
    unitPrice: number;
    productionDate?: Date;
    expirationDate?: Date;
  }[];
};
```

Append to `src/models/sales-form.ts`:

```ts
export type SaleEditData = {
  id: string;
  customerId: string;
  paidAmount: number;
  discount: number;
  payDueDate: Date;
  date: Date;
  products: {
    id: string;
    quantity: number;
    unitPrice: number;
  }[];
};
```

- [ ] **Step 2: Write the failing tests**

Create `tests/unit/util/purchase-edit-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toPurchaseEditData } from '@/util/purchase-edit-data.ts';

const purchase = {
  id: 'pur-1',
  providerId: 'prov-1',
  paidAmount: 250,
  discount: 10,
  payDueDate: new Date('2026-12-31'),
  date: new Date('2026-01-15'),
};

describe('toPurchaseEditData', () => {
  it('maps the product id from productId, not the merged item id', () => {
    const result = toPurchaseEditData(purchase, [
      {
        id: 'purchase-item-1',
        productId: 'product-1',
        quantity: 8,
        unitPrice: 25,
        isExpirable: true,
        productionDate: new Date('2025-01-01'),
        expirationDate: new Date('2026-12-31'),
      },
    ]);

    expect(result.products[0].id).toBe('product-1');
  });

  it('carries the purchase scalars through', () => {
    const result = toPurchaseEditData(purchase, []);

    expect(result.id).toBe('pur-1');
    expect(result.providerId).toBe('prov-1');
    expect(result.paidAmount).toBe(250);
    expect(result.discount).toBe(10);
    expect(result.payDueDate).toEqual(new Date('2026-12-31'));
    expect(result.date).toEqual(new Date('2026-01-15'));
  });

  it('keeps one entry per item row without merging', () => {
    const result = toPurchaseEditData(purchase, [
      {
        id: 'pi-1',
        productId: 'product-1',
        quantity: 5,
        unitPrice: 10,
        isExpirable: true,
        productionDate: new Date('2025-01-01'),
        expirationDate: new Date('2026-06-30'),
      },
      {
        id: 'pi-2',
        productId: 'product-1',
        quantity: 7,
        unitPrice: 10,
        isExpirable: true,
        productionDate: new Date('2025-05-01'),
        expirationDate: new Date('2026-12-31'),
      },
    ]);

    expect(result.products).toHaveLength(2);
    expect(result.products[0].quantity).toBe(5);
    expect(result.products[1].quantity).toBe(7);
  });

  it('converts null batch dates to undefined', () => {
    const result = toPurchaseEditData(purchase, [
      {
        id: 'pi-1',
        productId: 'product-1',
        quantity: 3,
        unitPrice: 4,
        isExpirable: false,
        productionDate: null,
        expirationDate: null,
      },
    ]);

    expect(result.products[0].productionDate).toBeUndefined();
    expect(result.products[0].expirationDate).toBeUndefined();
    expect(result.products[0].isExpirable).toBe(false);
  });
});
```

Create `tests/unit/util/sale-edit-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toSaleEditData } from '@/util/sale-edit-data.ts';

const sale = {
  id: 'sale-1',
  customerId: 'cust-1',
  paidAmount: 400,
  discount: 20,
  payDueDate: new Date('2026-11-30'),
  date: new Date('2026-02-10'),
};

describe('toSaleEditData', () => {
  it('groups FIFO-split rows of the same product into one line', () => {
    const result = toSaleEditData(sale, [
      { id: 'si-1', productId: 'product-1', quantity: 30, unitPrice: 12 },
      { id: 'si-2', productId: 'product-1', quantity: 15, unitPrice: 12 },
      { id: 'si-3', productId: 'product-1', quantity: 5, unitPrice: 12 },
    ]);

    expect(result.products).toHaveLength(1);
    expect(result.products[0].id).toBe('product-1');
    expect(result.products[0].quantity).toBe(50);
    expect(result.products[0].unitPrice).toBe(12);
  });

  it('keeps distinct products as separate lines in first-seen order', () => {
    const result = toSaleEditData(sale, [
      { id: 'si-1', productId: 'product-a', quantity: 2, unitPrice: 5 },
      { id: 'si-2', productId: 'product-b', quantity: 3, unitPrice: 7 },
      { id: 'si-3', productId: 'product-a', quantity: 4, unitPrice: 5 },
    ]);

    expect(result.products).toHaveLength(2);
    expect(result.products[0].id).toBe('product-a');
    expect(result.products[0].quantity).toBe(6);
    expect(result.products[1].id).toBe('product-b');
    expect(result.products[1].quantity).toBe(3);
  });

  it('maps the product id from productId, not the merged item id', () => {
    const result = toSaleEditData(sale, [
      { id: 'sale-item-1', productId: 'product-9', quantity: 1, unitPrice: 3 },
    ]);

    expect(result.products[0].id).toBe('product-9');
  });

  it('carries the sale scalars through', () => {
    const result = toSaleEditData(sale, []);

    expect(result.id).toBe('sale-1');
    expect(result.customerId).toBe('cust-1');
    expect(result.paidAmount).toBe(400);
    expect(result.discount).toBe(20);
    expect(result.payDueDate).toEqual(new Date('2026-11-30'));
    expect(result.date).toEqual(new Date('2026-02-10'));
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `bun run test -- tests/unit/util/purchase-edit-data.test.ts tests/unit/util/sale-edit-data.test.ts`
Expected: FAIL — cannot resolve `@/util/purchase-edit-data.ts` / `@/util/sale-edit-data.ts`.

- [ ] **Step 4: Implement `toPurchaseEditData`**

Create `src/util/purchase-edit-data.ts`:

```ts
import type { PurchaseEditData } from '@/models/purchase-form.ts';

export type PurchaseEditSource = {
  id: string;
  providerId: string;
  paidAmount: number;
  discount: number;
  payDueDate: Date | string;
  date: Date | string;
};

export type PurchaseItemRow = {
  productId: string;
  quantity: number;
  unitPrice: number;
  isExpirable: boolean;
  productionDate?: Date | string | null;
  expirationDate?: Date | string | null;
};

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

const toOptionalDate = (value?: Date | string | null) =>
  value === null || value === undefined ? undefined : toDate(value);

export const toPurchaseEditData = (
  purchase: PurchaseEditSource,
  items: PurchaseItemRow[],
): PurchaseEditData => ({
  id: purchase.id,
  providerId: purchase.providerId,
  paidAmount: purchase.paidAmount,
  discount: purchase.discount,
  payDueDate: toDate(purchase.payDueDate),
  date: toDate(purchase.date),
  products: items.map((item) => ({
    id: item.productId,
    isExpirable: item.isExpirable,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    productionDate: toOptionalDate(item.productionDate),
    expirationDate: toOptionalDate(item.expirationDate),
  })),
});
```

Note the `Date | string` unions: values crossing the Electron IPC boundary may arrive as ISO strings, and `DatePicker` requires real `Date` objects.

- [ ] **Step 5: Implement `toSaleEditData`**

Create `src/util/sale-edit-data.ts`:

```ts
import type { SaleEditData } from '@/models/sales-form.ts';

export type SaleEditSource = {
  id: string;
  customerId: string;
  paidAmount: number;
  discount: number;
  payDueDate: Date | string;
  date: Date | string;
};

export type SaleItemRow = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

export const toSaleEditData = (
  sale: SaleEditSource,
  items: SaleItemRow[],
): SaleEditData => {
  const grouped = new Map<string, SaleEditData['products'][number]>();

  for (const item of items) {
    const existing = grouped.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      grouped.set(item.productId, {
        id: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }
  }

  return {
    id: sale.id,
    customerId: sale.customerId,
    paidAmount: sale.paidAmount,
    discount: sale.discount,
    payDueDate: toDate(sale.payDueDate),
    date: toDate(sale.date),
    products: [...grouped.values()],
  };
};
```

`createSale` writes the same `product.unitPrice` to every split row, so taking the first row's price is correct. `Map` preserves insertion order, satisfying the first-seen-order test.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `bun run test -- tests/unit/util/purchase-edit-data.test.ts tests/unit/util/sale-edit-data.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 7: Typecheck and commit**

Run: `bunx tsc -b`
Expected: no errors.

```bash
git add src/models/purchase-form.ts src/models/sales-form.ts src/util/purchase-edit-data.ts src/util/sale-edit-data.ts tests/unit/util/purchase-edit-data.test.ts tests/unit/util/sale-edit-data.test.ts
git commit -m "feat: add edit-data models and pure prefill mappers for purchases and sales"
```

---

### Task 2: `purchaseSaleEditMode` setting

**Deliberate behavior change:** the default is `'fullEdit'`, and the persisted zustand blob in existing installs has no key for this setting — so every existing install picks up the default and the pencil icon changes meaning on upgrade. This matches the intent ("replace the payment-only dialog"), but it is a change for existing users rather than an opt-in. Do not "fix" it by defaulting to `'paymentOnly'`.

**Files:**
- Modify: `src/store/settings.store.ts`
- Test: `tests/unit/store/settings.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: exported type `PurchaseSaleEditMode = 'paymentOnly' | 'fullEdit'`; store field `purchaseSaleEditMode` and setter `setPurchaseSaleEditMode(mode: PurchaseSaleEditMode): void`. Tasks 8, 9, 10 consume these.

- [ ] **Step 1: Write the failing tests**

In `tests/unit/store/settings.test.ts`, add `purchaseSaleEditMode: 'fullEdit' as const,` to the local `defaults` object at the top of the file, then append these cases inside the existing `describe('settings store', ...)` block:

```ts
  it('defaults purchaseSaleEditMode to fullEdit', () => {
    expect(useCurrentSettings.getState().purchaseSaleEditMode).toBe('fullEdit');
  });

  it('setPurchaseSaleEditMode updates the mode', () => {
    useCurrentSettings.getState().setPurchaseSaleEditMode('paymentOnly');
    expect(useCurrentSettings.getState().purchaseSaleEditMode).toBe(
      'paymentOnly',
    );
  });

  it('resetSettings reverts purchaseSaleEditMode to fullEdit', () => {
    useCurrentSettings.getState().setPurchaseSaleEditMode('paymentOnly');
    useCurrentSettings.getState().resetSettings();
    expect(useCurrentSettings.getState().purchaseSaleEditMode).toBe('fullEdit');
  });
```

The third case is the important one: it catches the field being added to the interface and setter list but omitted from the module-level `defaults` const, which `resetSettings()` sets from.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test -- tests/unit/store/settings.test.ts`
Expected: FAIL — `purchaseSaleEditMode` is `undefined`, and `setPurchaseSaleEditMode` is not a function.

- [ ] **Step 3: Implement the store change**

In `src/store/settings.store.ts`, add the type export next to the existing ones:

```ts
export type PurchaseSaleEditMode = 'paymentOnly' | 'fullEdit';
```

Add to the `SettingsState` interface, after `lowStockThreshold`:

```ts
  purchaseSaleEditMode: PurchaseSaleEditMode;
```

and after `setLowStockThreshold`:

```ts
  setPurchaseSaleEditMode: (mode: PurchaseSaleEditMode) => void;
```

Add to the module-level `defaults` const:

```ts
  purchaseSaleEditMode: 'fullEdit' as PurchaseSaleEditMode,
```

Add to the store body, after `setLowStockThreshold`:

```ts
      setPurchaseSaleEditMode: (purchaseSaleEditMode) =>
        set({ purchaseSaleEditMode }),
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test -- tests/unit/store/settings.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/settings.store.ts tests/unit/store/settings.test.ts
git commit -m "feat: add admin-controlled purchaseSaleEditMode setting"
```

---

### Task 3: `updatePurchaseWithItems` prisma action

Reconciles purchase stock by **delta per batch key**, where a batch key is `productId + productionDate + expirationDate`. A blanket reverse-and-reapply would fail spuriously: if a purchase added 100 units and 70 were later sold, reversing the full 100 against a batch now holding 30 goes negative, even though editing 100 → 90 is perfectly legal.

**Files:**
- Modify: `src/prisma-actions/purchases.action.ts`
- Test: `tests/unit/prisma-actions/purchases.test.ts`

**Interfaces:**
- Consumes: existing `insufficientStockError` from `../util/stock-error.ts` (already imported by `sales.action.ts`; `purchases.action.ts` must add the import).
- Produces: `updatePurchaseWithItems(prisma: PrismaClient, inventoryId: string, id: string, body: PurchaseFormData): Promise<Purchase>`. Tasks 5 and 8 consume it.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/prisma-actions/purchases.test.ts` (the file's `beforeAll`/`afterEach`/`inventoryId` scaffolding already exists at the top — do not duplicate it). Add `updatePurchaseWithItems` to the existing import from `@/prisma-actions/purchases.action.ts`:

```ts
describe('updatePurchaseWithItems', () => {
  const seedPurchase = async (quantity = 100) => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);

    const purchase = await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    return { user, provider, product, purchase };
  };

  it('increases batch stock when quantity is increased', async () => {
    const { user, provider, product, purchase } = await seedPurchase(100);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 130,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    expect(batch?.quantity).toBe(130);
  });

  it('decreases batch stock when quantity is reduced within headroom', async () => {
    const { user, provider, product, purchase } = await seedPurchase(100);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 60,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    expect(batch?.quantity).toBe(60);
  });

  it('allows a reduction down to exactly the already-sold floor', async () => {
    const { user, provider, product, purchase } = await seedPurchase(100);
    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    if (!batch) throw new Error('Expected purchase batch');
    // simulate 70 units sold: batch now holds 30, so the floor is 100 - 30 = 70
    await prisma.productBatch.update({
      where: { id: batch.id },
      data: { quantity: 30 },
    });

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 70,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const after = await prisma.productBatch.findUnique({
      where: { id: batch.id },
    });
    expect(after?.quantity).toBe(0);
  });

  it('rejects a reduction below the already-sold floor and rolls back', async () => {
    const { user, provider, product, purchase } = await seedPurchase(100);
    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    if (!batch) throw new Error('Expected purchase batch');
    await prisma.productBatch.update({
      where: { id: batch.id },
      data: { quantity: 30 },
    });

    await expect(
      updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
        userId: user.id,
        providerId: provider.id,
        paidAmount: 100,
        payDueDate: new Date('2026-12-31'),
        date: new Date('2026-01-01'),
        products: [
          {
            id: product.id,
            quantity: 50,
            unitPrice: 10,
            productionDate: new Date('2025-01-01'),
            expirationDate: new Date('2026-12-31'),
          },
        ],
      }),
    ).rejects.toThrow('INSUFFICIENT_STOCK');

    const after = await prisma.productBatch.findUnique({
      where: { id: batch.id },
    });
    expect(after?.quantity).toBe(30);
    const items = await prisma.purchaseItem.findMany({
      where: { purchaseId: purchase.id },
    });
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(100);
  });

  it('reports the reduction floor, not remaining stock, in the error', async () => {
    const { user, provider, product, purchase } = await seedPurchase(100);
    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    if (!batch) throw new Error('Expected purchase batch');
    await prisma.productBatch.update({
      where: { id: batch.id },
      data: { quantity: 30 },
    });

    await expect(
      updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
        userId: user.id,
        providerId: provider.id,
        paidAmount: 100,
        payDueDate: new Date('2026-12-31'),
        date: new Date('2026-01-01'),
        products: [
          {
            id: product.id,
            quantity: 50,
            unitPrice: 10,
            productionDate: new Date('2025-01-01'),
            expirationDate: new Date('2026-12-31'),
          },
        ],
      }),
      // floor is 100 - 30 = 70, NOT the remaining 30
    ).rejects.toThrow(`INSUFFICIENT_STOCK:${product.id}:70`);
  });

  it('moves stock between batches when a line changes its dates', async () => {
    const { user, provider, product, purchase } = await seedPurchase(40);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 40,
          unitPrice: 10,
          productionDate: new Date('2025-06-01'),
          expirationDate: new Date('2027-06-30'),
        },
      ],
    });

    const oldBatch = await prisma.productBatch.findFirst({
      where: {
        productId: product.id,
        productionDate: new Date('2025-01-01'),
      },
    });
    const newBatch = await prisma.productBatch.findFirst({
      where: {
        productId: product.id,
        productionDate: new Date('2025-06-01'),
      },
    });
    expect(oldBatch?.quantity).toBe(0);
    expect(newBatch?.quantity).toBe(40);
  });

  it('updates the purchase scalar fields', async () => {
    const { user, provider, product, purchase } = await seedPurchase(10);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 777,
      discount: 55,
      payDueDate: new Date('2027-03-31'),
      date: new Date('2026-02-02'),
      products: [
        {
          id: product.id,
          quantity: 10,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const updated = await prisma.purchase.findUnique({
      where: { id: purchase.id },
    });
    expect(updated?.paidAmount).toBe(777);
    expect(updated?.discount).toBe(55);
  });

  it('replaces purchase items rather than appending to them', async () => {
    const { user, provider, product, purchase } = await seedPurchase(10);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 25,
          unitPrice: 12,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const items = await prisma.purchaseItem.findMany({
      where: { purchaseId: purchase.id },
    });
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(25);
    expect(items[0].unitPrice).toBe(12);
  });

  it('creates a brand new product added during an edit', async () => {
    const { user, provider, product, purchase } = await seedPurchase(10);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 10,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
        {
          id: undefined,
          name: 'Added During Edit',
          isExpirable: false,
          quantity: 6,
          unitPrice: 30,
        },
      ],
    });

    const created = await prisma.product.findFirst({
      where: { name: 'Added During Edit' },
    });
    expect(created).not.toBeNull();
    const items = await prisma.purchaseItem.findMany({
      where: { purchaseId: purchase.id },
    });
    expect(items).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test -- tests/unit/prisma-actions/purchases.test.ts`
Expected: FAIL — `updatePurchaseWithItems` is not exported.

- [ ] **Step 3: Implement `updatePurchaseWithItems`**

In `src/prisma-actions/purchases.action.ts`, add the import at the top alongside the existing `intersectIds` import:

```ts
import { insufficientStockError } from '../util/stock-error.ts';
```

Then append:

```ts
const batchKey = (
  productId: string,
  productionDate?: Date | null,
  expirationDate?: Date | null,
) =>
  `${productId}|${productionDate?.getTime() ?? ''}|${expirationDate?.getTime() ?? ''}`;

export const updatePurchaseWithItems = async (
  prisma: PrismaClient,
  inventoryId: string,
  id: string,
  body: PurchaseFormData,
) => {
  return prisma.$transaction(async (tx: PrismaClient) => {
    let providerId: string;
    if (body.providerId) {
      const provider = await tx.provider.findFirst({
        where: { id: body.providerId, inventoryId },
        select: { id: true },
      });
      if (!provider) {
        throw new Error('Provider not found in selected inventory');
      }
      providerId = body.providerId;
    } else {
      const provider = await tx.provider.upsert({
        where: {
          inventoryId_phone: { inventoryId, phone: body.providerPhone },
        },
        update: {},
        create: {
          name: body.providerName,
          phone: body.providerPhone,
          address: body.providerAddress,
          inventory: { connect: { id: inventoryId } },
        },
      });
      providerId = provider.id;
    }

    // Aggregate the quantities this purchase currently contributes, per batch key.
    const existingItems = await tx.purchaseItem.findMany({
      where: { purchaseId: id },
      include: { batch: true },
    });

    const oldByKey = new Map<
      string,
      { productId: string; batchId: string; quantity: number }
    >();
    for (const item of existingItems as (PurchaseItem & {
      batch: ProductBatch;
    })[]) {
      const key = batchKey(
        item.productId,
        item.batch.productionDate,
        item.batch.expirationDate,
      );
      const existing = oldByKey.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        oldByKey.set(key, {
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.quantity,
        });
      }
    }

    // Resolve every submitted line to a concrete product id, creating new products.
    const resolved: {
      key: string;
      productId: string;
      productionDate: Date | null;
      expirationDate: Date | null;
      quantity: number;
      unitPrice: number;
      isExpirable?: boolean;
    }[] = [];

    for (const product of body.products) {
      let productId: string;
      if (!product.id) {
        const newProduct = await tx.product.create({
          data: {
            name: product.name || 'Unnamed Product',
            isExpirable: product.isExpirable ?? true,
            inventory: { connect: { id: inventoryId } },
          },
        });
        productId = newProduct.id;
      } else {
        const existingProduct = await tx.product.findFirst({
          where: { id: product.id, inventoryId },
          select: { id: true },
        });
        if (!existingProduct) {
          throw new Error('Product not found in selected inventory');
        }
        productId = product.id;
      }

      const productionDate = product.productionDate ?? null;
      const expirationDate = product.expirationDate ?? null;

      resolved.push({
        key: batchKey(productId, productionDate, expirationDate),
        productId,
        productionDate,
        expirationDate,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        isExpirable: product.isExpirable,
      });
    }

    const newByKey = new Map<string, (typeof resolved)[number]>();
    for (const line of resolved) {
      const existing = newByKey.get(line.key);
      if (existing) {
        existing.quantity += line.quantity;
      } else {
        newByKey.set(line.key, { ...line });
      }
    }

    // Apply the delta for every key present on either side.
    const batchIdByKey = new Map<string, string>();

    for (const [key, line] of newByKey) {
      const oldQuantity = oldByKey.get(key)?.quantity ?? 0;
      const delta = line.quantity - oldQuantity;

      let batch = await tx.productBatch.findFirst({
        where: {
          productId: line.productId,
          productionDate: line.productionDate,
          expirationDate: line.expirationDate,
        },
      });

      if (!batch) {
        batch = await tx.productBatch.create({
          data: {
            productId: line.productId,
            productionDate: line.productionDate,
            expirationDate: line.expirationDate,
            quantity: delta > 0 ? delta : 0,
          },
        });
      } else if (delta !== 0) {
        if (batch.quantity + delta < 0) {
          throw insufficientStockError(
            line.productId,
            Math.max(0, oldQuantity - batch.quantity),
          );
        }
        batch = await tx.productBatch.update({
          where: { id: batch.id },
          data: { quantity: { increment: delta } },
        });
      }

      batchIdByKey.set(key, batch.id);
    }

    // Keys that disappeared entirely give back their whole contribution.
    for (const [key, old] of oldByKey) {
      if (newByKey.has(key)) continue;
      const batch = await tx.productBatch.findUnique({
        where: { id: old.batchId },
      });
      if (!batch) continue;
      if (batch.quantity - old.quantity < 0) {
        throw insufficientStockError(
          old.productId,
          Math.max(0, old.quantity - batch.quantity),
        );
      }
      await tx.productBatch.update({
        where: { id: batch.id },
        data: { quantity: { decrement: old.quantity } },
      });
    }

    await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

    for (const line of resolved) {
      const batchId = batchIdByKey.get(line.key);
      if (!batchId) continue;
      await tx.purchaseItem.create({
        data: {
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          purchase: { connect: { id } },
          product: { connect: { id: line.productId } },
          batch: { connect: { id: batchId } },
        },
      });

      await tx.product.update({
        where: { id: line.productId },
        data: {
          unitPrice: line.unitPrice,
          ...(line.isExpirable !== undefined
            ? { isExpirable: line.isExpirable }
            : {}),
        },
      });
    }

    return tx.purchase.update({
      where: { id },
      data: {
        paidAmount: body.paidAmount,
        discount: body.discount ?? 0,
        payDueDate: body.payDueDate,
        date: body.date,
        provider: { connect: { id: providerId } },
      },
    });
  });
};
```

The reduction floor is `Math.max(0, oldQuantity - batch.quantity)` — the smallest value this line can be edited down to. Derivation: `batch.quantity + (newQty - oldQty) >= 0` ⟹ `newQty >= oldQty - batch.quantity`. It is **not** `batch.quantity` (that is the remaining stock, a different number).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test -- tests/unit/prisma-actions/purchases.test.ts`
Expected: PASS — all pre-existing cases plus the 9 new ones.

- [ ] **Step 5: Typecheck and commit**

Run: `bunx tsc -b`
Expected: no errors.

```bash
git add src/prisma-actions/purchases.action.ts tests/unit/prisma-actions/purchases.test.ts
git commit -m "feat: reconcile purchase stock by batch-key delta on full edit"
```

---

### Task 4: `updateSaleWithItems` prisma action

Sales reverse cleanly — giving stock back is always safe — so this is a full reverse followed by a re-run of the existing FIFO consumption. The whole thing is one transaction, so a shortfall on reapply rolls the reversal back too.

**Files:**
- Modify: `src/prisma-actions/sales.action.ts`
- Test: `tests/unit/prisma-actions/sales.test.ts`

**Interfaces:**
- Consumes: existing `insufficientStockError` (already imported in this file).
- Produces: `updateSaleWithItems(prisma: PrismaClient, inventoryId: string, id: string, body: SaleFormData): Promise<Sale>`. Tasks 5 and 9 consume it.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/prisma-actions/sales.test.ts`, adding `updateSaleWithItems` to the existing import from `@/prisma-actions/sales.action.ts`. Reuse whatever `beforeAll`/`afterEach`/`inventoryId` scaffolding and fixture imports (`seedUser`, `seedCustomer`, `seedProduct`, `seedProductBatch`) the file already has — do not duplicate them.

```ts
describe('updateSaleWithItems', () => {
  const seedSale = async (quantity = 20, stock = 100) => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);
    await seedProductBatch(prisma, product.id, { quantity: stock });

    const sale = await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity, unitPrice: 10 }],
    });

    return { user, customer, product, sale };
  };

  const totalStock = async (productId: string) => {
    const batches = await prisma.productBatch.findMany({
      where: { productId },
    });
    return batches.reduce(
      (sum: number, b: { quantity: number }) => sum + b.quantity,
      0,
    );
  };

  it('returns stock when the sold quantity is reduced', async () => {
    const { user, customer, product, sale } = await seedSale(20, 100);
    expect(await totalStock(product.id)).toBe(80);

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity: 5, unitPrice: 10 }],
    });

    expect(await totalStock(product.id)).toBe(95);
  });

  it('consumes more stock when the sold quantity is increased', async () => {
    const { user, customer, product, sale } = await seedSale(20, 100);

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity: 60, unitPrice: 10 }],
    });

    expect(await totalStock(product.id)).toBe(40);
  });

  it('lets an edit use stock the sale itself is holding', async () => {
    // stock is fully consumed by the sale; re-saving the same quantity must work
    const { user, customer, product, sale } = await seedSale(100, 100);
    expect(await totalStock(product.id)).toBe(0);

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity: 100, unitPrice: 10 }],
    });

    expect(await totalStock(product.id)).toBe(0);
    const items = await prisma.saleItem.findMany({ where: { saleId: sale.id } });
    expect(
      items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0),
    ).toBe(100);
  });

  it('rejects an increase beyond available stock and rolls back', async () => {
    const { user, customer, product, sale } = await seedSale(20, 100);

    await expect(
      updateSaleWithItems(prisma, inventoryId, sale.id, {
        userId: user.id,
        customerId: customer.id,
        paidAmount: 50,
        payDueDate: new Date('2026-12-31'),
        date: new Date('2026-01-01'),
        products: [{ id: product.id, quantity: 150, unitPrice: 10 }],
      }),
    ).rejects.toThrow('INSUFFICIENT_STOCK');

    // reversal must not have leaked out of the failed transaction
    expect(await totalStock(product.id)).toBe(80);
    const items = await prisma.saleItem.findMany({ where: { saleId: sale.id } });
    expect(
      items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0),
    ).toBe(20);
  });

  it('regroups a FIFO-split sale into the requested quantity', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);
    await seedProductBatch(prisma, product.id, {
      quantity: 30,
      expirationDate: new Date('2026-06-30'),
    });
    await seedProductBatch(prisma, product.id, {
      quantity: 30,
      expirationDate: new Date('2027-06-30'),
    });

    const sale = await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity: 50, unitPrice: 10 }],
    });

    const splitItems = await prisma.saleItem.findMany({
      where: { saleId: sale.id },
    });
    expect(splitItems.length).toBeGreaterThan(1);

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity: 20, unitPrice: 10 }],
    });

    const items = await prisma.saleItem.findMany({ where: { saleId: sale.id } });
    expect(
      items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0),
    ).toBe(20);
    expect(await totalStock(product.id)).toBe(40);
  });

  it('swaps to a different product, returning the original stock', async () => {
    const { user, customer, product, sale } = await seedSale(20, 100);
    const other = await seedProduct(prisma, {}, inventoryId);
    await seedProductBatch(prisma, other.id, { quantity: 50 });

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: other.id, quantity: 10, unitPrice: 10 }],
    });

    expect(await totalStock(product.id)).toBe(100);
    expect(await totalStock(other.id)).toBe(40);
  });

  it('updates the sale scalar fields', async () => {
    const { user, customer, product, sale } = await seedSale(10, 100);

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 321,
      discount: 15,
      payDueDate: new Date('2027-03-31'),
      date: new Date('2026-02-02'),
      products: [{ id: product.id, quantity: 10, unitPrice: 10 }],
    });

    const updated = await prisma.sale.findUnique({ where: { id: sale.id } });
    expect(updated?.paidAmount).toBe(321);
    expect(updated?.discount).toBe(15);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test -- tests/unit/prisma-actions/sales.test.ts`
Expected: FAIL — `updateSaleWithItems` is not exported.

- [ ] **Step 3: Implement `updateSaleWithItems`**

Append to `src/prisma-actions/sales.action.ts`:

```ts
export const updateSaleWithItems = async (
  prisma: PrismaClient,
  inventoryId: string,
  id: string,
  body: SaleFormData,
) => {
  return prisma.$transaction(async (tx: PrismaClient) => {
    let customerId: string;
    if (body.customerId) {
      const customer = await tx.customer.findFirst({
        where: { id: body.customerId, inventoryId },
        select: { id: true },
      });
      if (!customer) {
        throw new Error('Customer not found in selected inventory');
      }
      customerId = body.customerId;
    } else {
      const customer = await tx.customer.upsert({
        where: {
          inventoryId_phone: { inventoryId, phone: body.customerPhone },
        },
        update: {},
        create: {
          firstname: body.customerFirstname,
          lastname: body.customerLastname,
          phone: body.customerPhone,
          address: body.customerAddress,
          inventory: { connect: { id: inventoryId } },
        },
      });
      customerId = customer.id;
    }

    // Give every previously-consumed unit back before reapplying.
    const existingItems = await tx.saleItem.findMany({ where: { saleId: id } });
    for (const item of existingItems as SaleItem[]) {
      await tx.productBatch.update({
        where: { id: item.batchId },
        data: { quantity: { increment: item.quantity } },
      });
    }
    await tx.saleItem.deleteMany({ where: { saleId: id } });

    for (const product of body.products) {
      const existingProduct = await tx.product.findFirst({
        where: { id: product.id, inventoryId },
        select: { id: true },
      });
      if (!existingProduct) {
        throw new Error('Product not found in selected inventory');
      }

      // Re-queried inside the transaction, so it sees the restored quantities.
      const batches = await tx.productBatch.findMany({
        where: { productId: product.id, quantity: { gt: 0 } },
        orderBy: [
          { expirationDate: { sort: 'asc', nulls: 'last' } },
          { productionDate: { sort: 'asc', nulls: 'last' } },
          { createdAt: 'asc' },
        ],
      });

      const totalAvailable = batches.reduce(
        (sum: number, b: ProductBatch) => sum + b.quantity,
        0,
      );
      if (totalAvailable < product.quantity) {
        throw insufficientStockError(product.id, totalAvailable);
      }

      let remaining = product.quantity;
      for (const batch of batches as ProductBatch[]) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);

        await tx.productBatch.update({
          where: { id: batch.id },
          data: { quantity: { decrement: deduct } },
        });

        await tx.saleItem.create({
          data: {
            quantity: deduct,
            unitPrice: product.unitPrice,
            sale: { connect: { id } },
            product: { connect: { id: product.id } },
            batch: { connect: { id: batch.id } },
          },
        });

        remaining -= deduct;
      }
    }

    return tx.sale.update({
      where: { id },
      data: {
        paidAmount: body.paidAmount,
        discount: body.discount ?? 0,
        payDueDate: body.payDueDate,
        date: body.date,
        customer: { connect: { id: customerId } },
      },
    });
  });
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test -- tests/unit/prisma-actions/sales.test.ts`
Expected: PASS — all pre-existing cases plus the 7 new ones.

- [ ] **Step 5: Typecheck and commit**

Run: `bunx tsc -b`
Expected: no errors.

```bash
git add src/prisma-actions/sales.action.ts tests/unit/prisma-actions/sales.test.ts
git commit -m "feat: reverse and reapply sale stock on full edit"
```

---

### Task 5: IPC wiring for both new actions

Four files must agree on the new signatures and only the typechecker catches a mismatch — `bun run test` will not. `bunx tsc -b` is mandatory here.

**Files:**
- Modify: `src/prisma-actions.ts`
- Modify: `src/preload.ts`
- Modify: `src/types.d.ts`
- Modify: `src/services/purchases.ts`
- Modify: `src/services/sales.ts`
- Modify: `tests/setup/electron-api.ts`
- Test: `tests/unit/services/purchases.test.ts`
- Test: `tests/unit/services/sales.test.ts`

**Interfaces:**
- Consumes: `updatePurchaseWithItems` / `updateSaleWithItems` from Tasks 3 and 4.
- Produces: services `updatePurchaseWithItems(id: string, purchase: PurchaseFormData)` and `updateSaleWithItems(id: string, sale: SaleFormData)` — note the services take **only** `(id, body)`; the inventory id is supplied internally by `getInventoryId()`, matching `createPurchase`/`createSale`. Tasks 8 and 9 consume these.

- [ ] **Step 1: Write the failing service tests**

Append to `tests/unit/services/purchases.test.ts` inside the existing `describe('purchases service', ...)`:

```ts
  it('updatePurchaseWithItems delegates with inventory id, id and form data', async () => {
    const mock = stubElectronAPI();
    const { updatePurchaseWithItems } = await import(
      '../../../src/services/purchases.ts'
    );
    const formData = {
      userId: 'u1',
      providerId: 'p1',
      paidAmount: 100,
      products: [],
    } as any;
    await updatePurchaseWithItems('pur-id', formData);
    expect(mock.updatePurchaseWithItems).toHaveBeenCalledWith(
      '',
      'pur-id',
      formData,
    );
  });
```

Append to `tests/unit/services/sales.test.ts` inside its existing `describe('sales service', ...)`:

```ts
  it('updateSaleWithItems delegates with inventory id, id and form data', async () => {
    const mock = stubElectronAPI();
    const { updateSaleWithItems } = await import(
      '../../../src/services/sales.ts'
    );
    const formData = {
      userId: 'u1',
      customerId: 'c1',
      paidAmount: 100,
      products: [],
    } as any;
    await updateSaleWithItems('sale-id', formData);
    expect(mock.updateSaleWithItems).toHaveBeenCalledWith(
      '',
      'sale-id',
      formData,
    );
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test -- tests/unit/services/purchases.test.ts tests/unit/services/sales.test.ts`
Expected: FAIL — the service functions do not exist.

- [ ] **Step 3: Add the two methods to the electron API mock**

`createMockElectronAPI` in `tests/setup/electron-api.ts` is an explicit whitelist, so the mocks must be added or the tests fail with "undefined is not a function". Add under the `// purchases` group:

```ts
    updatePurchaseWithItems: vi.fn().mockResolvedValue(ok({})),
```

and under the `// sales` group:

```ts
    updateSaleWithItems: vi.fn().mockResolvedValue(ok({})),
```

- [ ] **Step 4: Register the IPC handlers**

In `src/prisma-actions.ts`, add `updatePurchaseWithItems` to the import block that already brings in `updatePurchase`, and `updateSaleWithItems` to the one with `updateSale`. Then add the handlers next to their existing siblings:

```ts
  ipcMain.handle(
    'updatePurchaseWithItems',
    (_, inventoryId: string, id: string, data: PurchaseFormData) =>
      ok(() => updatePurchaseWithItems(prisma, inventoryId, id, data)),
  );
```

```ts
  ipcMain.handle(
    'updateSaleWithItems',
    (_, inventoryId: string, id: string, data: SaleFormData) =>
      ok(() => updateSaleWithItems(prisma, inventoryId, id, data)),
  );
```

- [ ] **Step 5: Expose the methods in preload**

In `src/preload.ts`, next to `updatePurchase`:

```ts
  updatePurchaseWithItems: (
    inventoryId: string,
    id: string,
    purchase: PurchaseFormData,
  ) => ipcRenderer.invoke('updatePurchaseWithItems', inventoryId, id, purchase),
```

and next to `updateSale`:

```ts
  updateSaleWithItems: (inventoryId: string, id: string, sale: SaleFormData) =>
    ipcRenderer.invoke('updateSaleWithItems', inventoryId, id, sale),
```

- [ ] **Step 6: Declare the methods in the global type**

In `src/types.d.ts`, after `updatePurchase` in the purchase actions block:

```ts
      updatePurchaseWithItems: (
        inventoryId: string,
        id: string,
        purchase: PurchaseFormData,
      ) => Promise<IpcResponse<Purchase>>;
```

and after `updateSale` in the sales actions block:

```ts
      updateSaleWithItems: (
        inventoryId: string,
        id: string,
        sale: SaleFormData,
      ) => Promise<IpcResponse<Sale>>;
```

- [ ] **Step 7: Add the service wrappers**

In `src/services/purchases.ts`, after `updatePurchase`:

```ts
export const updatePurchaseWithItems = (
  id: string,
  purchase: PurchaseFormData,
) =>
  window.electronAPI
    .updatePurchaseWithItems(getInventoryId(), id, purchase)
    .then(unwrap);
```

In `src/services/sales.ts`, after `updateSale`:

```ts
export const updateSaleWithItems = (id: string, sale: SaleFormData) =>
  window.electronAPI
    .updateSaleWithItems(getInventoryId(), id, sale)
    .then(unwrap);
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `bun run test -- tests/unit/services/purchases.test.ts tests/unit/services/sales.test.ts`
Expected: PASS.

- [ ] **Step 9: Typecheck — the real verification for this task**

Run: `bunx tsc -b`
Expected: no errors. A mismatch between `preload.ts`, `types.d.ts` and `prisma-actions.ts` surfaces only here.

- [ ] **Step 10: Commit**

```bash
git add src/prisma-actions.ts src/preload.ts src/types.d.ts src/services/purchases.ts src/services/sales.ts tests/setup/electron-api.ts tests/unit/services/purchases.test.ts tests/unit/services/sales.test.ts
git commit -m "feat: expose updatePurchaseWithItems and updateSaleWithItems over IPC"
```

---

### Task 6: i18n keys

Folded into one task because both dialogs, both pages and the settings screen draw on the same key set, and `tests/unit/lib/i18n-keys.test.ts` verifies en/ar parity for all of them at once.

**Files:**
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/ar.ts`
- Test: `tests/unit/lib/i18n-keys.test.ts` (existing test, no changes needed)

**Interfaces:**
- Consumes: nothing.
- Produces: translation keys `'Edit Purchase'`, `'Edit Sale'`, `'Cannot reduce below already sold quantity'`, `'Minimum'`, `'Failed to update sale'`, `'Failed to update purchase'`, `'Edit Mode'`, `'Payment only'`, `'Full record'`. Tasks 7–10 consume these.

- [ ] **Step 1: Add the English keys**

In `src/i18n/locales/en.ts`, insert each key in its correct alphabetical position:

```ts
  'Cannot reduce below already sold quantity':
    'Cannot reduce below already sold quantity',
  'Edit Mode': 'Edit Mode',
  'Edit Purchase': 'Edit Purchase',
  'Edit Sale': 'Edit Sale',
  'Failed to update purchase': 'Failed to update purchase',
  'Failed to update sale': 'Failed to update sale',
  'Full record': 'Full record',
  Minimum: 'Minimum',
  'Payment only': 'Payment only',
```

- [ ] **Step 2: Add the Arabic keys**

In `src/i18n/locales/ar.ts`, insert at the same alphabetical positions (keys sort by the English key):

```ts
  'Cannot reduce below already sold quantity':
    'لا يمكن التقليل عن الكمية المباعة بالفعل',
  'Edit Mode': 'وضع التعديل',
  'Edit Purchase': 'تعديل المشتريات',
  'Edit Sale': 'تعديل المبيعة',
  'Failed to update purchase': 'فشل تحديث المشتريات',
  'Failed to update sale': 'فشل تحديث المبيعة',
  'Full record': 'السجل الكامل',
  Minimum: 'الحد الأدنى',
  'Payment only': 'الدفع فقط',
```

- [ ] **Step 3: Run the parity test**

Run: `bun run test -- tests/unit/lib/i18n-keys.test.ts`
Expected: PASS — `missingKeys` is `[]`.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/en.ts src/i18n/locales/ar.ts
git commit -m "feat: add translation keys for purchase and sale editing"
```

---

### Task 7: `PurchaseDialog` edit mode

The dialog already has a `useEffect` that calls `form.reset(blankDefaults)` whenever `providerStatus` changes (including on mount). Do **not** add a second prefill effect — the two would race and blank defaults would likely win. Extract one `buildDefaultValues` and make it the only place default values are produced.

**Files:**
- Modify: `src/components/dialogs/purchase-dialog.tsx`

**Interfaces:**
- Consumes: `PurchaseEditData` (Task 1), translation keys (Task 6).
- Produces: `PurchaseDialog` accepting `initialData?: PurchaseEditData` and `stockError?: { productId: string; available: number } | null` in addition to its existing `open` / `onClose`. Task 8 consumes this.

- [ ] **Step 1: Add the props and the shared defaults builder**

Add the import:

```ts
import type { PurchaseEditData, PurchaseFormData } from '@/models/purchase-form.ts';
```

(replacing the existing `PurchaseFormData`-only import). Above the component, add:

```ts
const buildDefaultValues = (
  providerStatus: 'exist' | 'add',
  initialData?: PurchaseEditData,
) => ({
  providerId:
    providerStatus === 'exist' ? (initialData?.providerId ?? '') : undefined,
  providerName: providerStatus === 'add' ? '' : undefined,
  providerPhone: providerStatus === 'add' ? '' : undefined,
  providerAddress: providerStatus === 'add' ? '' : undefined,
  products: initialData
    ? initialData.products.map((product) => ({
        status: 'exist' as const,
        id: product.id,
        name: '',
        isExpirable: product.isExpirable,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        productionDate: product.productionDate,
        expirationDate: product.expirationDate,
      }))
    : [
        {
          status: 'exist' as const,
          name: '',
          isExpirable: true,
          quantity: 0,
          unitPrice: 0,
          productionDate: undefined,
          expirationDate: undefined,
        },
      ],
  paidAmount: initialData?.paidAmount ?? 0,
  discount: initialData?.discount ?? 0,
  payDueDate: initialData?.payDueDate,
  date: initialData?.date ?? new Date(),
});
```

Change the component signature to:

```ts
function PurchaseDialog({
  open,
  onClose,
  initialData,
  stockError,
}: {
  open: boolean;
  onClose?: (purchase?: PurchaseFormData) => void;
  initialData?: PurchaseEditData;
  stockError?: { productId: string; available: number } | null;
}) {
```

- [ ] **Step 2: Route both reset paths through the builder**

Replace the inline `defaultValues` object in the `useForm` call with:

```ts
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaultValues(providerStatus, initialData),
  });
```

Then replace the body of the existing `useEffect` that resets on `providerStatus` so its `form.reset(...)` call uses the builder and its dependency array includes `initialData`:

```ts
  useEffect(() => {
    if (providerStatus === 'add') {
      form.unregister('providerId');
    } else {
      form.unregister(['providerName', 'providerPhone', 'providerAddress']);
    }
    for (let idx = 0; idx < form.getValues().products.length; idx++) {
      if (form.getValues().products[idx].status === 'exist') {
        form.unregister(`products.${idx}.name`);
      } else {
        form.unregister(`products.${idx}.id`);
      }
    }
    form.reset(buildDefaultValues(providerStatus, initialData));
  }, [providerStatus, form, initialData]);
```

`initialData` must come from the parent's `useState` (Task 8), never built inline in JSX — a fresh object identity each render would re-reset the form on every render.

- [ ] **Step 3: Force the existing-provider tab when an edit opens**

The dialog stays mounted for the life of the page, so `providerStatus` survives close/reopen. If someone last used the "New provider" tab, opening an edit would land on that tab with no provider selected. Add this effect immediately *before* the reset effect from Step 2:

```ts
  useEffect(() => {
    if (initialData) {
      setProviderStatus('exist');
    }
  }, [initialData]);
```

This effect only sets state — it never calls `form.reset`, so it cannot race the reset effect. If the status actually changes, the reset effect fires on the status change; if it was already `'exist'`, the reset effect still fires because `initialData` is in its dependency array. Exactly one reset happens either way.

- [ ] **Step 4: Surface server stock errors on the matching line**

Add this effect after the `useFieldArray` call, mirroring `SaleDialog`'s existing `stockError` effect:

```ts
  useEffect(() => {
    if (!stockError) return;
    const index = form
      .getValues('products')
      .findIndex((product) => product.id === stockError.productId);
    if (index === -1) return;
    form.setError(`products.${index}.quantity`, {
      message: `${t('Cannot reduce below already sold quantity')} (${t('Minimum')}: ${stockError.available})`,
    });
    form.setFocus(`products.${index}.quantity`);
  }, [stockError, form, t]);
```

`stockError.available` carries the reduction **floor**, not remaining stock.

- [ ] **Step 5: Switch the title in edit mode**

Replace the `DialogTitle` contents:

```tsx
            <DialogTitle>
              {initialData ? t('Edit Purchase') : t('Add Purchase')}
            </DialogTitle>
```

- [ ] **Step 6: Typecheck, lint and commit**

Run: `bunx tsc -b && bun run lint`
Expected: no errors.

```bash
git add src/components/dialogs/purchase-dialog.tsx
git commit -m "feat: add edit mode to PurchaseDialog"
```

---

### Task 8: Wire purchase editing into the purchases page

**Files:**
- Modify: `src/pages/purchases.tsx`

**Interfaces:**
- Consumes: `toPurchaseEditData` (Task 1), `purchaseSaleEditMode` (Task 2), `updatePurchaseWithItems` service (Task 5), translation keys (Task 6), `PurchaseDialog` props (Task 7).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the imports and edit state**

Add to the imports:

```ts
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PurchaseEditData, PurchaseFormData } from '@/models/purchase-form.ts';
import { toPurchaseEditData } from '@/util/purchase-edit-data.ts';
import { parseInsufficientStockError } from '@/util/stock-error.ts';
import { getAllPurchaseItems, updatePurchaseWithItems } from '@/services/purchases.ts';
```

Merge the service imports into the existing `@/services/purchases.ts` import block rather than adding a duplicate one, and replace the existing `PurchaseFormData`-only model import.

Inside the component, next to the other `useState` calls:

```ts
  const queryClient = useQueryClient();
  const editMode = useCurrentSettings((s) => s.purchaseSaleEditMode);
  const [editPurchase, setEditPurchase] = useState<PurchaseEditData>();
  const [purchaseStockError, setPurchaseStockError] = useState<{
    productId: string;
    available: number;
  } | null>(null);
```

- [ ] **Step 2: Branch the pencil action on the setting**

Replace `openUpdatePaymentDialog` with a handler that dispatches on the setting:

```ts
  const openEditDialog = useCallback(async (purchase: PurchasesListResult) => {
    const items = await getAllPurchaseItems(purchase.id);
    setEditPurchase(toPurchaseEditData(purchase, items));
    setPurchaseStockError(null);
    setPurchaseDialogOpen(true);
  }, []);

  const openUpdatePaymentDialog = useCallback((purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setUpdatePaymentOpen(true);
  }, []);

  const handleEditAction = useCallback(
    (purchase: PurchasesListResult) => {
      if (editMode === 'paymentOnly') {
        openUpdatePaymentDialog(purchase as Purchase);
        return;
      }
      openEditDialog(purchase);
    },
    [editMode, openEditDialog, openUpdatePaymentDialog],
  );
```

In the `columns` definition, change the pencil button's handler to `handleEditAction(info.row.original)` and swap `openUpdatePaymentDialog` for `handleEditAction` in the `useMemo` dependency array.

- [ ] **Step 3: Ensure the "add" paths clear edit state**

In the `Add Purchase` button's `onClick`:

```tsx
            onClick={() => {
              setEditPurchase(undefined);
              setPurchaseStockError(null);
              setPurchaseDialogOpen(true);
            }}
```

And in the `location.state?.openDialog` effect, add `setEditPurchase(undefined);` and `setPurchaseStockError(null);` before `setPurchaseDialogOpen(true)`. Without this, navigating in to add a purchase would reopen the last edited one.

- [ ] **Step 4: Branch the save handler and invalidate caches**

Replace `handleDialogClose`:

```ts
  const handleDialogClose = async (purchase?: PurchaseFormData) => {
    if (!purchase) {
      setPurchaseStockError(null);
      setEditPurchase(undefined);
      setPurchaseDialogOpen(false);
      return;
    }
    try {
      if (editPurchase) {
        await updatePurchaseWithItems(editPurchase.id, purchase);
      } else {
        await createPurchase(purchase);
      }
      setPurchaseStockError(null);
      setEditPurchase(undefined);
      setPurchaseDialogOpen(false);
      refetchPurchases();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productBatches'] });
    } catch (error) {
      const stockError = parseInsufficientStockError(error);
      if (stockError) {
        setPurchaseStockError(stockError);
        return;
      }
      toast.error(
        error instanceof Error ? error.message : t('Failed to update purchase'),
      );
    }
  };
```

The cache invalidation matters beyond cosmetics: the dialogs read `['products']` and `['productBatches']`, and a stale cache would show availability numbers the server then rejects.

- [ ] **Step 5: Pass the new props to the dialog**

```tsx
      <PurchaseDialog
        open={purchaseDialogOpen}
        onClose={handleDialogClose}
        initialData={editPurchase}
        stockError={purchaseStockError}
      />
```

- [ ] **Step 6: Typecheck, lint and commit**

Run: `bunx tsc -b && bun run lint`
Expected: no errors.

```bash
git add src/pages/purchases.tsx
git commit -m "feat: open the purchase dialog in edit mode from the purchases table"
```

---

### Task 9: `SaleDialog` edit mode and page wiring

`SaleDialog` needs one extra thing `PurchaseDialog` did not: its availability filter and its `superRefine` stock check both compare against current batch stock, which already excludes what this sale is holding. Without an adjustment, opening an untouched edit form shows an empty product picker and fails validation immediately.

**Files:**
- Modify: `src/components/dialogs/sale-dialog.tsx`
- Modify: `src/pages/sales.tsx`

**Interfaces:**
- Consumes: `SaleEditData` + `toSaleEditData` (Task 1), `purchaseSaleEditMode` (Task 2), `updateSaleWithItems` service (Task 5), translation keys (Task 6).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the prop and the shared defaults builder to `SaleDialog`**

Change the model import to:

```ts
import type { SaleEditData, SaleFormData } from '@/models/sales-form.ts';
```

Above the component:

```ts
const buildDefaultValues = (
  customerStatus: 'exist' | 'add',
  initialData?: SaleEditData,
) => ({
  customerId:
    customerStatus === 'exist' ? (initialData?.customerId ?? '') : undefined,
  customerFirstname: customerStatus === 'add' ? '' : undefined,
  customerLastname: customerStatus === 'add' ? '' : undefined,
  customerPhone: customerStatus === 'add' ? '' : undefined,
  customerAddress: customerStatus === 'add' ? '' : undefined,
  products: initialData
    ? initialData.products.map((product) => ({
        id: product.id,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
      }))
    : [{ id: '', quantity: 1, unitPrice: 0 }],
  paidAmount: initialData?.paidAmount ?? 0,
  discount: initialData?.discount ?? 0,
  payDueDate: initialData?.payDueDate,
  date: initialData?.date ?? new Date(),
});
```

Change the signature to:

```ts
function SaleDialog({
  open,
  onClose,
  stockError,
  initialData,
}: {
  open: boolean;
  onClose?: (sale?: SaleFormData) => void;
  stockError?: { productId: string; available: number } | null;
  initialData?: SaleEditData;
}) {
```

- [ ] **Step 2: Credit the sale's own quantities back into the stock baseline**

Add after the `productBatches` query, replacing the existing `getProductStock`:

```ts
  const editQuantities = useMemo(() => {
    const quantities = new Map<string, number>();
    for (const product of initialData?.products ?? []) {
      quantities.set(
        product.id,
        (quantities.get(product.id) ?? 0) + product.quantity,
      );
    }
    return quantities;
  }, [initialData]);

  const getProductStock = (productId: string) => {
    const batches =
      productBatches?.filter((b) => b.productId === productId) || [];
    const current = batches.reduce(
      (sum: number, b) => sum + (b.quantity || 0),
      0,
    );
    // In edit mode this sale's committed units are still consumed in the DB,
    // so add them back to get "stock as if this sale had not happened yet".
    return current + (editQuantities.get(productId) ?? 0);
  };
```

Add `editQuantities` to the dependency arrays of both the `formSchema` `useMemo` (currently `[t, customerStatus, productBatches]`) and the `availableProducts` `useMemo` (currently `[products, productBatches]`).

- [ ] **Step 3: Route both reset paths through the builder**

Replace the `useForm` `defaultValues` with `buildDefaultValues(customerStatus, initialData)`, and in the existing customer-status effect replace the `form.reset({...})` call with `form.reset(buildDefaultValues(customerStatus, initialData));`, adding `initialData` to that effect's dependency array. Leave the separate `stockError` effect alone — it is already correct.

Then add this effect immediately *before* the reset effect, for the same reason as `PurchaseDialog`: the dialog stays mounted, so `customerStatus` survives close/reopen and an edit could otherwise land on the "New customer" tab with no customer selected.

```ts
  useEffect(() => {
    if (initialData) {
      setCustomerStatus('exist');
    }
  }, [initialData]);
```

It only sets state and never calls `form.reset`, so it cannot race the reset effect.

- [ ] **Step 4: Switch the title in edit mode**

```tsx
            <DialogTitle>
              {initialData ? t('Edit Sale') : t('Add Sale')}
            </DialogTitle>
```

- [ ] **Step 5: Wire the sales page**

In `src/pages/sales.tsx`, add the imports (`useQueryClient`, `SaleEditData`, `toSaleEditData`, and `getAllSaleItems` + `updateSaleWithItems` merged into the existing `@/services/sales.ts` import block), then add state next to the existing ones:

```ts
  const queryClient = useQueryClient();
  const editMode = useCurrentSettings((s) => s.purchaseSaleEditMode);
  const [editSale, setEditSale] = useState<SaleEditData>();
```

Add the edit opener and the dispatcher, keeping the existing `openUpdatePaymentDialog` as-is:

```ts
  const openEditDialog = useCallback(async (sale: SalesListResult) => {
    const items = await getAllSaleItems(sale.id);
    setEditSale(toSaleEditData(sale, items));
    setSaleStockError(null);
    setSaleDialogOpen(true);
  }, []);

  const handleEditAction = useCallback(
    (sale: SalesListResult) => {
      if (editMode === 'paymentOnly') {
        openUpdatePaymentDialog(sale as Sale);
        return;
      }
      openEditDialog(sale);
    },
    [editMode, openEditDialog, openUpdatePaymentDialog],
  );
```

Point the pencil button at `handleEditAction(info.row.original)` and swap `openUpdatePaymentDialog` for `handleEditAction` in the `columns` dependency array. Add `setEditSale(undefined);` to both the `Add Sale` button's `onClick` and the `location.state?.openDialog` effect.

Replace `handleDialogClose`:

```ts
  const handleDialogClose = async (sale?: SaleFormData) => {
    if (!sale) {
      setSaleStockError(null);
      setEditSale(undefined);
      setSaleDialogOpen(false);
      return;
    }
    try {
      if (editSale) {
        await updateSaleWithItems(editSale.id, sale);
      } else {
        await createSale(sale);
      }
      setSaleStockError(null);
      setEditSale(undefined);
      setSaleDialogOpen(false);
      refetchSales();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productBatches'] });
    } catch (error) {
      const stockError = parseInsufficientStockError(error);
      if (stockError) {
        setSaleStockError(stockError);
        return;
      }
      toast.error(
        error instanceof Error
          ? error.message
          : editSale
            ? t('Failed to update sale')
            : t('Failed to create sale'),
      );
    }
  };
```

And pass the prop:

```tsx
      <SaleDialog
        open={saleDialogOpen}
        onClose={handleDialogClose}
        stockError={saleStockError}
        initialData={editSale}
      />
```

- [ ] **Step 6: Typecheck, lint and commit**

Run: `bunx tsc -b && bun run lint`
Expected: no errors.

```bash
git add src/components/dialogs/sale-dialog.tsx src/pages/sales.tsx
git commit -m "feat: add edit mode to SaleDialog and wire it into the sales table"
```

---

### Task 10: Admin-only setting control

**Files:**
- Modify: `src/pages/settings.tsx`

**Interfaces:**
- Consumes: `purchaseSaleEditMode` + `setPurchaseSaleEditMode` (Task 2), translation keys (Task 6).
- Produces: nothing.

- [ ] **Step 1: Read the setting in the component**

Add alongside the existing selectors:

```ts
  const purchaseSaleEditMode = useCurrentSettings((s) => s.purchaseSaleEditMode);
  const setPurchaseSaleEditMode = useCurrentSettings(
    (s) => s.setPurchaseSaleEditMode,
  );
```

Also add the type to the existing `@/store/settings.store.ts` type import:

```ts
import {
  type CurrencyCode,
  type DateFormatPattern,
  type PurchaseSaleEditMode,
  useCurrentSettings,
} from '@/store/settings.store.ts';
```

- [ ] **Step 2: Add the admin-gated control**

Inside the General Settings `<div className="flex flex-wrap gap-4">`, after the Date Format `<Field>`:

```tsx
          {currentUser?.role === 'admin' && (
            <Field className="w-50">
              <FieldLabel>{t('Edit Mode')}</FieldLabel>
              <Select
                value={purchaseSaleEditMode}
                onValueChange={(value) =>
                  setPurchaseSaleEditMode(value as PurchaseSaleEditMode)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paymentOnly">
                    {t('Payment only')}
                  </SelectItem>
                  <SelectItem value="fullEdit">{t('Full record')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
```

This uses the same `currentUser?.role === 'admin'` gate the file already applies to `<UserManagement />`. Non-admins do not see the control but still get whichever mode is configured.

- [ ] **Step 3: Typecheck, lint and commit**

Run: `bunx tsc -b && bun run lint`
Expected: no errors.

```bash
git add src/pages/settings.tsx
git commit -m "feat: add admin-only control for purchase and sale edit mode"
```

---

### Task 11: Full verification

**Files:** none modified.

**Interfaces:**
- Consumes: everything from Tasks 1–10.
- Produces: nothing.

- [ ] **Step 1: Run the whole test suite**

Run: `bun run test`
Expected: PASS — no regressions in the pre-existing suites.

- [ ] **Step 2: Typecheck and lint the whole project**

Run: `bunx tsc -b && bun run lint`
Expected: no errors.

- [ ] **Step 3: Manual verification in the running app**

Run: `bun run dev`

Check each of these:
1. Settings → General Settings shows **Edit Mode** for an admin user; it is absent for a non-admin.
2. With Edit Mode = **Payment only**, the pencil icon on Purchases and Sales still opens the old Update Payment dialog.
3. With Edit Mode = **Full record**, the pencil icon opens the dialog titled *Edit Purchase* / *Edit Sale*, prefilled with the provider/customer, every line item, quantities, prices, dates, discount and paid amount.
4. Edit a sale that was split across batches (sell more than one batch holds, then edit it) — it shows **one** line per product with the summed quantity, not one line per batch.
5. Open a sale for editing without changing anything and save — it must succeed, not fail with "Insufficient stock".
6. Reduce a purchase quantity below what has already been sold — the quantity field shows the "Cannot reduce below already sold quantity (Minimum: N)" error and the record is unchanged.
7. Switch the app to Arabic and reopen both edit dialogs — labels are translated and the layout is RTL.

- [ ] **Step 4: Commit any fixes surfaced by manual checks**

If the manual pass surfaces problems, fix them and commit with a descriptive message. If it is clean, there is nothing to commit — do not create an empty commit.
