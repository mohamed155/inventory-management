# Expirable Product Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Expirable" checkbox (checked by default, never disabled) to the Inventory dialog and Purchase dialog that shows/hides Production Date and Expiration Date inputs, and persists the flag on the `Product` record.

**Architecture:** Add `Product.isExpirable Boolean @default(true)`. Backend `prisma-actions` functions pass the flag through on create/update. Both dialogs get a zod-validated `isExpirable` field with conditional-required date refinements (schema shape stays static — only refinements change behavior — so no circular resolver/watch dependency). Selecting an existing product initializes the checkbox from that product's stored flag via the Combobox's `onChange`, but the user can still freely retoggle it before submit.

**Tech Stack:** Prisma (SQLite via LibSQL adapter), React Hook Form + Zod, shadcn/ui (New York style), vitest.

## Global Constraints

- Never use `<input type="number">` — not applicable here (no new numeric inputs).
- Path alias `@/` resolves to `src/`.
- Package manager is Bun — use `bun`/`bunx`, not npm/npx.
- After changing `prisma/schema.prisma`, add a hand-written migration file under `prisma/migrations/` and run `bun run db:generate`. **Do not run `bun run db:push` or `bunx prisma migrate dev`** — verified that `db push` refuses to proceed because it wants to drop the custom `_applied_migrations` table that `src/electron.ts`'s `ensureDatabase()` maintains; both `tests/setup/db.ts` and `src/electron.ts` apply `prisma/migrations/*/migration.sql` files directly, independent of Prisma's own migration state.
- Add shadcn components via `bunx shadcn add <component>`.
- Every new i18n key added to `src/i18n/locales/en.ts` must have a matching key in `src/i18n/locales/ar.ts` — enforced by `tests/unit/lib/i18n-keys.test.ts`.
- Use Tailwind logical properties, not physical ones, for any new layout (RTL support).

---

### Task 1: Add `isExpirable` field to the Product model

**Files:**
- Modify: `prisma/schema.prisma:38-52` (Product model)
- Create: `prisma/migrations/20260731000000_add_product_is_expirable/migration.sql` (hand-written, matching the existing `purchase_discount` migration's style)

**Interfaces:**
- Produces: `Product.isExpirable: boolean` (default `true`), available on the generated Prisma client (`generated/prisma/client.ts`, `generated/prisma/browser.ts`) after regeneration — every later task relies on this field existing on `Product`.

- [ ] **Step 1: Add the field to the schema**

In `prisma/schema.prisma`, update the `Product` model:

```prisma
model Product {
  id            String         @id @default(uuid())
  name          String
  description   String?
  unitPrice     Float          @default(0)
  isExpirable   Boolean        @default(true)
  inventoryId   String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  batches       ProductBatch[]
  purchaseItems PurchaseItem[]
  saleItems     SaleItem[]
  inventory     Inventory      @relation(fields: [inventoryId], references: [id], onDelete: Cascade)

  @@index([inventoryId])
}
```

- [ ] **Step 2: Hand-write the migration file**

Create `prisma/migrations/20260731000000_add_product_is_expirable/migration.sql`:

```sql
ALTER TABLE "Product" ADD COLUMN "isExpirable" BOOLEAN NOT NULL DEFAULT true;
```

This matches the existing hand-written style used by
`prisma/migrations/20260629000001_purchase_discount/migration.sql`. Do **not**
run `bunx prisma migrate dev` or `bun run db:push` — verified earlier that
`db push` errors out wanting to drop the `_applied_migrations` bookkeeping
table that `src/electron.ts`'s `ensureDatabase()` relies on; that function and
`tests/setup/db.ts` both apply `prisma/migrations/*/migration.sql` files
directly by scanning the directory, so this file alone is sufficient for both
the test suite and the running app (on next `bun run dev` launch,
`ensureDatabase()` applies it to `dev.db` automatically).

- [ ] **Step 3: Regenerate the Prisma client**

Run: `bun run db:generate`
Expected: succeeds, regenerating `generated/prisma/*` so `Product` types include `isExpirable`. This does not touch `dev.db`.

- [ ] **Step 4: Verify the existing test suite still passes**

Run: `bun run test`
Expected: PASS — `tests/setup/db.ts` applies every file under `prisma/migrations/` (sorted by name) to a fresh temp SQLite db per test run, so the new migration is picked up automatically. No test should reference `isExpirable` yet, so nothing should fail.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add isExpirable field to Product model"
```

---

### Task 2: Product actions — pass `isExpirable` through create/update/list

**Files:**
- Modify: `src/prisma-actions/product.action.ts:31-40` (`getAllProducts`), `:161-202` (`createProductBatch`), `:204-229` (`updateProductBatch`)
- Modify: `src/types.d.ts:142-144` (`getAllProducts` IPC return type)
- Test: `tests/unit/prisma-actions/products.test.ts`

**Interfaces:**
- Consumes: `Product.isExpirable` from Task 1.
- Produces: `getAllProducts(prisma, inventoryId)` now resolves `{ id, name, isExpirable }[]`; `createProductBatch`/`updateProductBatch` persist `isExpirable` onto the linked `Product` when the caller provides it. Task 4 (Inventory dialog) reads both.

- [ ] **Step 1: Write the failing tests**

Add to `tests/unit/prisma-actions/products.test.ts` (inside the existing `describe('createProductBatch', ...)` block, after the existing tests, before the closing `});`):

```ts
  it('sets isExpirable on a newly created product', async () => {
    const batch = await createProductBatch(prisma, inventoryId, {
      name: 'Non Expirable Product',
      isExpirable: false,
      quantity: 10,
    } as any);

    const product = await prisma.product.findUnique({
      where: { id: batch.productId },
    });
    expect(product?.isExpirable).toBe(false);
  });

  it('defaults isExpirable to true when not provided for a new product', async () => {
    const batch = await createProductBatch(prisma, inventoryId, {
      name: 'Default Expirable Product',
      quantity: 10,
    } as any);

    const product = await prisma.product.findUnique({
      where: { id: batch.productId },
    });
    expect(product?.isExpirable).toBe(true);
  });

  it('updates isExpirable on an existing product when provided', async () => {
    const product = await prisma.product.create({
      data: { name: 'Existing Expirable', inventoryId, isExpirable: true },
    });

    await createProductBatch(prisma, inventoryId, {
      productId: product.id,
      isExpirable: false,
      quantity: 5,
    } as any);

    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.isExpirable).toBe(false);
  });

  it('leaves isExpirable unchanged on an existing product when not provided', async () => {
    const product = await prisma.product.create({
      data: { name: 'Untouched Flag', inventoryId, isExpirable: false },
    });

    await createProductBatch(prisma, inventoryId, {
      productId: product.id,
      quantity: 5,
    } as any);

    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.isExpirable).toBe(false);
  });
```

Add to the existing `describe('updateProductBatch', ...)` block, after its current test:

```ts
  it('updates isExpirable alongside other product fields', async () => {
    const product = await prisma.product.create({
      data: { name: 'Original', inventoryId, isExpirable: true },
    });
    const batch = await prisma.productBatch.create({
      data: {
        productId: product.id,
        productionDate: new Date('2025-01-01'),
        expirationDate: new Date('2026-12-31'),
        quantity: 100,
      },
    });

    await updateProductBatch(prisma, batch.id, {
      productId: product.id,
      name: 'Original',
      isExpirable: false,
      quantity: 100,
      productionDate: null,
      expirationDate: null,
    } as any);

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.isExpirable).toBe(false);
  });

  it('leaves isExpirable unchanged when not provided', async () => {
    const product = await prisma.product.create({
      data: { name: 'Keep Flag', inventoryId, isExpirable: false },
    });
    const batch = await prisma.productBatch.create({
      data: {
        productId: product.id,
        productionDate: new Date('2025-01-01'),
        expirationDate: new Date('2026-12-31'),
        quantity: 100,
      },
    });

    await updateProductBatch(prisma, batch.id, {
      productId: product.id,
      name: 'Keep Flag',
      quantity: 90,
      productionDate: new Date('2025-01-01'),
      expirationDate: new Date('2026-12-31'),
    } as any);

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.isExpirable).toBe(false);
  });
```

Add a new `describe` block for `getAllProducts` at the end of the file:

```ts
describe('getAllProducts', () => {
  it('includes isExpirable in the returned fields', async () => {
    await prisma.product.create({
      data: { name: 'Flagged Product', inventoryId, isExpirable: false },
    });

    const { getAllProducts } = await import('@/prisma-actions/product.action.ts');
    const products = await getAllProducts(prisma, inventoryId);

    const found = products.find((p: { name: string }) => p.name === 'Flagged Product');
    expect(found).toBeDefined();
    expect(found.isExpirable).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test tests/unit/prisma-actions/products.test.ts`
Expected: FAIL — `isExpirable` is `undefined`/missing on returned/updated products because the implementation doesn't pass it through yet.

- [ ] **Step 3: Implement the changes**

In `src/prisma-actions/product.action.ts`, update `getAllProducts`:

```ts
export const getAllProducts = async (
  prisma: PrismaClient,
  inventoryId: string,
) => {
  const products = await prisma.product.findMany({ where: { inventoryId } });
  return products.map((product: Product) => ({
    id: product.id,
    name: product.name,
    isExpirable: product.isExpirable,
  }));
};
```

Update `createProductBatch`:

```ts
export const createProductBatch = async (
  prisma: PrismaClient,
  inventoryId: string,
  productBatch: Product & ProductBatch,
) => {
  if (productBatch.productId) {
    const product = await prisma.product.findFirst({
      where: { id: productBatch.productId, inventoryId },
    });

    if (!product) {
      throw new Error('Product not found in selected inventory');
    }

    if (productBatch.isExpirable !== undefined) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isExpirable: productBatch.isExpirable },
      });
    }

    return prisma.productBatch.create({
      data: {
        id: productBatch.id,
        productId: product.id,
        productionDate: productBatch.productionDate,
        expirationDate: productBatch.expirationDate,
        quantity: productBatch.quantity,
      },
    });
  } else {
    const product = await prisma.product.create({
      data: {
        name: productBatch.name,
        description: productBatch.description,
        unitPrice: productBatch.unitPrice ?? 0,
        isExpirable: productBatch.isExpirable ?? true,
        inventory: { connect: { id: inventoryId } },
      },
    });
    return prisma.productBatch.create({
      data: {
        productId: product.id,
        productionDate: productBatch.productionDate,
        expirationDate: productBatch.expirationDate,
        quantity: productBatch.quantity,
      },
    });
  }
};
```

Update `updateProductBatch`:

```ts
export const updateProductBatch = async (
  prisma: PrismaClient,
  id: string,
  productBatch: Product & ProductBatch,
) => {
  const [, updatedBatch] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productBatch.productId },
      data: {
        name: productBatch.name,
        description: productBatch.description,
        unitPrice: productBatch.unitPrice ?? 0,
        ...(productBatch.isExpirable !== undefined
          ? { isExpirable: productBatch.isExpirable }
          : {}),
      },
    }),
    prisma.productBatch.update({
      where: { id },
      data: {
        quantity: productBatch.quantity,
        productionDate: productBatch.productionDate,
        expirationDate: productBatch.expirationDate,
      },
    }),
  ]);

  return updatedBatch;
};
```

In `src/types.d.ts`, update the `getAllProducts` IPC signature:

```ts
      getAllProducts: (
        inventoryId: string,
      ) => Promise<IpcResponse<Pick<Product, 'id' | 'name' | 'isExpirable'>[]>>;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test tests/unit/prisma-actions/products.test.ts`
Expected: PASS

- [ ] **Step 5: Run the full suite and typecheck**

Run: `bun run test && tsc -b`
Expected: PASS (no regressions elsewhere)

- [ ] **Step 6: Commit**

```bash
git add src/prisma-actions/product.action.ts src/types.d.ts tests/unit/prisma-actions/products.test.ts
git commit -m "feat: persist isExpirable through product batch actions"
```

---

### Task 3: Purchase actions — pass `isExpirable` through purchase creation

**Files:**
- Modify: `src/models/purchase-form.ts:11-18` (products array type)
- Modify: `src/prisma-actions/purchases.action.ts:287-348` (`createPurchase` product loop)
- Test: `tests/unit/prisma-actions/purchases.test.ts`

**Interfaces:**
- Consumes: `Product.isExpirable` from Task 1.
- Produces: `PurchaseFormData.products[i].isExpirable?: boolean`. `createPurchase` sets `isExpirable` on newly created products and updates it on existing ones only when provided. Task 5 (Purchase dialog) sends this field.

- [ ] **Step 1: Write the failing tests**

Add to `tests/unit/prisma-actions/purchases.test.ts`, inside `describe('createPurchase - batch management', ...)`, after the existing tests:

```ts
  it('sets isExpirable on a newly created product from a purchase', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: undefined,
          name: 'Non Expirable Purchase Product',
          isExpirable: false,
          quantity: 5,
          unitPrice: 20,
        },
      ],
    } as any);

    const newProduct = await prisma.product.findFirst({
      where: { name: 'Non Expirable Purchase Product' },
    });
    expect(newProduct?.isExpirable).toBe(false);
  });

  it('updates isExpirable on an existing product when provided in a purchase', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, { isExpirable: true }, inventoryId);

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          isExpirable: false,
          quantity: 5,
          unitPrice: 20,
        },
      ],
    } as any);

    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.isExpirable).toBe(false);
  });

  it('leaves isExpirable unchanged on an existing product when not provided in a purchase', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, { isExpirable: false }, inventoryId);

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 5,
          unitPrice: 20,
        },
      ],
    } as any);

    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.isExpirable).toBe(false);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test tests/unit/prisma-actions/purchases.test.ts`
Expected: FAIL — `isExpirable` is never written by `createPurchase` yet.

- [ ] **Step 3: Implement the changes**

In `src/models/purchase-form.ts`:

```ts
export type PurchaseFormData = {
  userId: string;
  paidAmount: number;
  discount?: number;
  payDueDate: Date;
  date: Date;
  providerId?: string;
  providerName?: string;
  providerPhone?: string;
  providerAddress?: string;
  products: {
    id?: string;
    name?: string;
    isExpirable?: boolean;
    quantity: number;
    unitPrice: number;
    productionDate?: Date;
    expirationDate?: Date;
  }[];
};
```

In `src/prisma-actions/purchases.action.ts`, update the product loop inside `createPurchase`:

```ts
    for (const product of body.products) {
      if (!product.id) {
        const newProduct = await tx.product.create({
          data: {
            name: product.name || 'Unnamed Product',
            isExpirable: product.isExpirable ?? true,
            inventory: { connect: { id: inventoryId } },
          },
        });
        product.id = newProduct.id;
      } else {
        const existingProduct = await tx.product.findFirst({
          where: { id: product.id, inventoryId },
          select: { id: true },
        });
        if (!existingProduct) {
          throw new Error('Product not found in selected inventory');
        }
      }

      let productBatch = await tx.productBatch.findFirst({
        where: {
          productId: product.id,
          productionDate: product.productionDate ?? null,
          expirationDate: product.expirationDate ?? null,
        },
      });

      if (!productBatch) {
        productBatch = await tx.productBatch.create({
          data: {
            productId: product.id,
            productionDate: product.productionDate ?? null,
            expirationDate: product.expirationDate ?? null,
            quantity: product.quantity,
          },
        });
      } else {
        productBatch = await tx.productBatch.update({
          where: { id: productBatch.id },
          data: {
            quantity: {
              increment: product.quantity,
            },
          },
        });
      }

      await tx.purchaseItem.create({
        data: {
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          purchase: { connect: { id: purchase.id } },
          product: { connect: { id: product.id } },
          batch: { connect: { id: productBatch.id } },
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          unitPrice: product.unitPrice,
          ...(product.isExpirable !== undefined
            ? { isExpirable: product.isExpirable }
            : {}),
        },
      });
    }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test tests/unit/prisma-actions/purchases.test.ts`
Expected: PASS

- [ ] **Step 5: Run the full suite and typecheck**

Run: `bun run test && tsc -b`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/models/purchase-form.ts src/prisma-actions/purchases.action.ts tests/unit/prisma-actions/purchases.test.ts
git commit -m "feat: persist isExpirable through purchase creation"
```

---

### Task 4: Inventory dialog — Expirable checkbox

**Files:**
- Modify: `src/components/dialogs/inventory-dialog.tsx`
- Modify: `src/i18n/locales/en.ts`, `src/i18n/locales/ar.ts`
- Create: `src/components/ui/checkbox.tsx` (via shadcn CLI)

**Interfaces:**
- Consumes: `getAllProducts()` now resolving `{ id, name, isExpirable }[]` (Task 2); `Product.isExpirable` (Task 1).
- Produces: `InventoryDialog`'s `onClose` payload includes `isExpirable: boolean`, with `productionDate`/`expirationDate` cleared to `undefined` whenever `isExpirable` is `false`. `Checkbox` (`@/components/ui/checkbox.tsx`) becomes available for Task 5 to reuse.

- [ ] **Step 1: Install the Checkbox component**

Run: `bunx shadcn@latest add checkbox`

This creates `src/components/ui/checkbox.tsx` and adds `@radix-ui/react-checkbox` to `package.json`.

- [ ] **Step 2: Add translation keys**

In `src/i18n/locales/en.ts`, insert alphabetically (after `'Exist provider'`, before `'Expiration Date'`):

```ts
  Expirable: 'Expirable',
```

And after `'Product name is required'` (before `'Production Date'`):

```ts
  'Production Date is required': 'Production Date is required',
```

And after `'Expiration date can not be before production date'` (before `'Expire Date'`):

```ts
  'Expiration Date is required': 'Expiration Date is required',
```

In `src/i18n/locales/ar.ts`, insert the matching keys in the same relative positions:

```ts
  Expirable: 'قابل للتلف',
```

```ts
  'Production Date is required': 'تاريخ الإنتاج مطلوب',
```

```ts
  'Expiration Date is required': 'تاريخ انتهاء الصلاحية مطلوب',
```

- [ ] **Step 3: Run the i18n coverage test**

Run: `bun run test tests/unit/lib/i18n-keys.test.ts`
Expected: PASS

- [ ] **Step 4: Update the zod schema and defaults**

In `src/components/dialogs/inventory-dialog.tsx`, add the import:

```ts
import { Checkbox } from '@/components/ui/checkbox.tsx';
```

Replace the `formSchema` definition:

```ts
  const formSchema = useMemo(
    () =>
      z
        .object({
          ...(status === 'new' || product
            ? {
                name: z.string().min(1, t('Product name is required')),
                description: z.string(),
              }
            : {
                productId: z.string().min(1, t('Product is required')),
              }),
          unitPrice: z.number().min(0, t('Unit Price must be positive')),
          quantity: z.number().min(1, t('Quantity can not be zero or less')),
          isExpirable: z.boolean(),
          productionDate: z.date().optional(),
          expirationDate: z.date().optional(),
        })
        .refine((data) => !data.isExpirable || !!data.productionDate, {
          message: t('Production Date is required'),
          path: ['productionDate'],
        })
        .refine((data) => !data.isExpirable || !!data.expirationDate, {
          message: t('Expiration Date is required'),
          path: ['expirationDate'],
        })
        .refine(
          (data) =>
            !data.expirationDate ||
            !data.productionDate ||
            data.expirationDate > data.productionDate,
          {
            message: t('Expiration date can not be before production date'),
            path: ['expirationDate'],
          },
        ),
    [t, status, product],
  );
```

Update the `useForm` `defaultValues` to add `isExpirable: true,` (right after `quantity: 0,`):

```ts
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: !product && status === 'add' ? '' : undefined,
      name: status === 'new' ? '' : undefined,
      description: status === 'new' ? '' : undefined,
      unitPrice: 0,
      quantity: 0,
      isExpirable: true,
      productionDate: undefined,
      expirationDate: undefined,
    },
  });
```

Update the `form.reset(...)` call inside the `useEffect` to add `isExpirable: product ? (product.isExpirable ?? true) : true,` (right after `quantity: ...`):

```ts
    form.reset({
      productId: product
        ? product.productId
        : status === 'add'
          ? ''
          : undefined,
      name: product ? product.name : status === 'new' ? '' : undefined,
      description: product
        ? product.description || undefined
        : status === 'new'
          ? ''
          : undefined,
      unitPrice: product ? (product.unitPrice ?? 0) : 0,
      quantity: product ? product.quantity : 0,
      isExpirable: product ? (product.isExpirable ?? true) : true,
      productionDate: product ? product.productionDate ?? undefined : undefined,
      expirationDate: product ? product.expirationDate ?? undefined : undefined,
    });
```

Add a watched value right after the `form.reset` `useEffect` block (before `const onSubmit = ...`):

```ts
  const isExpirable = form.watch('isExpirable');
```

- [ ] **Step 5: Strip dates on submit when not expirable**

Replace `onSubmit`:

```ts
  const onSubmit = async () => {
    if (onClose) {
      const values = form.getValues();
      const payload = {
        ...values,
        ...(values.isExpirable
          ? {}
          : { productionDate: undefined, expirationDate: undefined }),
      };
      if (product) {
        const editConfirm = await confirm(
          t('Are you sure to edit this record?'),
        );
        if (editConfirm) {
          onClose({
            ...payload,
            productId: product?.productId,
            id: product.id,
          } as Partial<Product & ProductBatch>);
        }
      } else {
        onClose(payload as Partial<Product & ProductBatch>);
      }
    }
  };
```

- [ ] **Step 6: Add the checkbox and wire visibility**

Insert a new `Controller` for `isExpirable` right before the `productionDate` `Controller` (after the `quantity` `Controller`'s closing `/>`):

```tsx
            <Controller
              name="isExpirable"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="isExpirable"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FieldLabel htmlFor="isExpirable">{t('Expirable')}</FieldLabel>
                </Field>
              )}
            />
```

Wrap the existing `productionDate` and `expirationDate` `Controller`s each in an `Activity`:

```tsx
            <Activity mode={isExpirable ? 'visible' : 'hidden'}>
              <Controller
                name="productionDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t('Production Date')}</FieldLabel>
                    <DatePicker
                      {...field}
                      dismissable
                      onChange={(date) =>
                        field.onChange({ target: { value: date } })
                      }
                    ></DatePicker>
                    <Activity mode={fieldState.invalid ? 'visible' : 'hidden'}>
                      <FieldError errors={[fieldState.error]} />
                    </Activity>
                  </Field>
                )}
              />
              <Controller
                name="expirationDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t('Expiration Date')}</FieldLabel>
                    <DatePicker
                      {...field}
                      dismissable
                      onChange={(date) =>
                        field.onChange({ target: { value: date } })
                      }
                      aria-invalid={fieldState.invalid}
                      maxDate={nextTenYears}
                    ></DatePicker>
                    <Activity mode={fieldState.invalid ? 'visible' : 'hidden'}>
                      <FieldError errors={[fieldState.error]} />
                    </Activity>
                  </Field>
                )}
              />
            </Activity>
```

- [ ] **Step 7: Auto-init the checkbox from the selected product in "Add Quantity"**

In the "Add Quantity" tab's `productId` `Controller`, override the `Combobox`'s `onChange` to also set `isExpirable`:

```tsx
                <Controller
                  name="productId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t('Choose Product')}</FieldLabel>
                      <Combobox
                        {...field}
                        list={data || []}
                        valueProp="id"
                        labelProp="name"
                        onChange={(value) => {
                          field.onChange(value);
                          const selected = data?.find(
                            (p) => p.id === (value as string),
                          );
                          if (selected) {
                            form.setValue('isExpirable', selected.isExpirable);
                          }
                        }}
                      />
                      <Activity mode={fieldState.invalid ? 'visible' : 'hidden'}>
                        <FieldError errors={[fieldState.error]} />
                      </Activity>
                    </Field>
                  )}
                />
```

- [ ] **Step 8: Typecheck**

Run: `tsc -b`
Expected: PASS

- [ ] **Step 9: Manual verification**

Run: `bun run dev`

In the Inventory page:
- Click "Add Product" → "New Product" tab: confirm "Expirable" is checked by default and Production/Expiration Date fields are visible; uncheck it and confirm both date fields disappear; save and confirm the product is created without error.
- Uncheck "Expirable", leave dates empty, save a new product — confirm no validation error blocks submission.
- Check "Expirable" with dates left empty — confirm validation now blocks submission with "Production Date is required" / "Expiration Date is required".
- Switch to "Add Quantity" tab, pick the just-created non-expirable product — confirm the checkbox auto-unchecks and date fields hide; still verify it's toggleable.
- Edit an existing expirable product (pencil icon on a batch row) — confirm the checkbox reflects its current dates being present, toggle it off, save, and confirm no console/runtime errors.

- [ ] **Step 10: Commit**

```bash
git add src/components/dialogs/inventory-dialog.tsx src/components/ui/checkbox.tsx src/i18n/locales/en.ts src/i18n/locales/ar.ts package.json bun.lock
git commit -m "feat: add expirable checkbox to inventory dialog"
```

---

### Task 5: Purchase dialog — Expirable checkbox per product line

**Files:**
- Modify: `src/components/dialogs/purchase-dialog.tsx`

**Interfaces:**
- Consumes: `getAllProducts()` resolving `{ id, name, isExpirable }[]` (Task 2); `Checkbox` from `@/components/ui/checkbox.tsx` (Task 4); `PurchaseFormData.products[i].isExpirable` (Task 3); `'Expirable'` / `'Production Date is required'` / `'Expiration Date is required'` i18n keys (Task 4).
- Produces: each submitted product entry includes `isExpirable: boolean`, with `productionDate`/`expirationDate` cleared to `undefined` per-item whenever that item's `isExpirable` is `false`.

- [ ] **Step 1: Add the import**

```ts
import { Checkbox } from '@/components/ui/checkbox.tsx';
```

- [ ] **Step 2: Update the per-product zod schema**

Replace the `products: z.array(...)` entry inside `formSchema`:

```ts
          products: z.array(
            z
              .object({
                status: z.enum(['exist', 'add']),
                id: z.string().optional(),
                name: z.string().optional(),
                isExpirable: z.boolean(),
                productionDate: z.date().optional(),
                expirationDate: z.date().optional(),
                quantity: z.number().min(1, t('Quantity must be at least 1')),
                unitPrice: z.number().min(0, t('Unit Price must be positive')),
              })
              .refine((data) => !data.isExpirable || !!data.productionDate, {
                message: t('Production Date is required'),
                path: ['productionDate'],
              })
              .refine((data) => !data.isExpirable || !!data.expirationDate, {
                message: t('Expiration Date is required'),
                path: ['expirationDate'],
              })
              .refine(
                (data) =>
                  !data.expirationDate ||
                  !data.productionDate ||
                  data.expirationDate > data.productionDate,
                {
                  message: t(
                    'Expiration date can not be before production date',
                  ),
                  path: ['expirationDate'],
                },
              ),
          ),
```

- [ ] **Step 3: Add `isExpirable: true` to every products-array default**

In the `useForm` `defaultValues.products` initial array item:

```ts
      products: [
        {
          status: 'exist',
          name: '',
          isExpirable: true,
          quantity: 0,
          unitPrice: 0,
          productionDate: undefined,
          expirationDate: undefined,
        },
      ],
```

In the `form.reset(...)` call inside the `useEffect` (same shape, same field added):

```ts
      products: [
        {
          status: 'exist',
          name: '',
          isExpirable: true,
          quantity: 0,
          unitPrice: 0,
          productionDate: undefined,
          expirationDate: undefined,
        },
      ],
```

In `addProduct`:

```ts
  const addProduct = () => {
    appendProduct({
      status: 'exist',
      name: '',
      isExpirable: true,
      quantity: 0,
      unitPrice: 0,
      productionDate: undefined,
      expirationDate: undefined,
    });
  };
```

- [ ] **Step 4: Strip dates per line on submit when not expirable**

Replace `onSubmit`:

```ts
  const onSubmit = async () => {
    if (onClose) {
      if (!currentUser) return;
      const values = form.getValues();
      const result: PurchaseFormData = {
        ...values,
        userId: currentUser.id,
        discount: values.discount ?? 0,
        payDueDate: values.payDueDate ?? values.date,
        products: values.products.map((p) => ({
          ...p,
          ...(p.isExpirable
            ? {}
            : { productionDate: undefined, expirationDate: undefined }),
        })),
      };
      onClose(result);
    }
  };
```

- [ ] **Step 5: Read the per-line expirable flag in the render loop**

Inside the `productFields.map((product, index) => { ... })` callback, right after the existing `productStatus` line:

```ts
                  const productStatus =
                    form.watch(`products.${index}.status`) || 'exist';
                  const productExpirable =
                    form.watch(`products.${index}.isExpirable`) ?? true;
```

- [ ] **Step 6: Add the checkbox and wire visibility per line**

Insert a new `Controller` right after the quantity/unitPrice `grid` `div` (between it and the productionDate/expirationDate `grid` `div`):

```tsx
                        <Controller
                          name={`products.${index}.isExpirable` as const}
                          control={form.control}
                          render={({ field }) => (
                            <Field orientation="horizontal">
                              <Checkbox
                                id={`isExpirable-${index}`}
                                checked={field.value}
                                onCheckedChange={(checked) =>
                                  field.onChange(checked === true)
                                }
                              />
                              <FieldLabel htmlFor={`isExpirable-${index}`}>
                                {t('Expirable')}
                              </FieldLabel>
                            </Field>
                          )}
                        />
```

Wrap the existing productionDate/expirationDate `grid` `div` in an `Activity`:

```tsx
                        <Activity
                          mode={productExpirable ? 'visible' : 'hidden'}
                        >
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Controller
                              name={`products.${index}.productionDate` as const}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>{t('Production Date')}</FieldLabel>
                                  <DatePicker
                                    {...field}
                                    dismissable
                                    onChange={(date) =>
                                      field.onChange({ target: { value: date } })
                                    }
                                  ></DatePicker>
                                  <Activity
                                    mode={
                                      fieldState.invalid ? 'visible' : 'hidden'
                                    }
                                  >
                                    <FieldError errors={[fieldState.error]} />
                                  </Activity>
                                </Field>
                              )}
                            />
                            <Controller
                              name={`products.${index}.expirationDate` as const}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>{t('Expiration Date')}</FieldLabel>
                                  <DatePicker
                                    {...field}
                                    dismissable
                                    onChange={(date) =>
                                      field.onChange({ target: { value: date } })
                                    }
                                    aria-invalid={fieldState.invalid}
                                    maxDate={nextTenYears}
                                  ></DatePicker>
                                  <Activity
                                    mode={
                                      fieldState.invalid ? 'visible' : 'hidden'
                                    }
                                  >
                                    <FieldError errors={[fieldState.error]} />
                                  </Activity>
                                </Field>
                              )}
                            />
                          </div>
                        </Activity>
```

- [ ] **Step 7: Auto-init the checkbox from the selected product in "Exist product"**

In the "Exist product" sub-tab's `products.${index}.id` `Controller`, override the `Combobox`'s `onChange`:

```tsx
                          <Controller
                            name={`products.${index}.id` as const}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>{t('Choose Product')}</FieldLabel>
                                <Combobox
                                  {...field}
                                  list={products || []}
                                  valueProp="id"
                                  labelProp="name"
                                  onChange={(value) => {
                                    field.onChange(value);
                                    const selected = products?.find(
                                      (p) => p.id === (value as string),
                                    );
                                    if (selected) {
                                      form.setValue(
                                        `products.${index}.isExpirable`,
                                        selected.isExpirable,
                                      );
                                    }
                                  }}
                                />
                                <Activity
                                  mode={
                                    fieldState.invalid ? 'visible' : 'hidden'
                                  }
                                >
                                  <FieldError errors={[fieldState.error]} />
                                </Activity>
                              </Field>
                            )}
                          />
```

- [ ] **Step 8: Typecheck**

Run: `tsc -b`
Expected: PASS

- [ ] **Step 9: Manual verification**

Run: `bun run dev`

In the Purchases page, click "Add Purchase":
- Confirm the default product line has "Expirable" checked and shows Production/Expiration Date.
- Uncheck it, leave dates empty, fill in the rest, and confirm the purchase can be saved.
- Add a second product line, select "Exist product," pick the non-expirable product created earlier — confirm its line's checkbox auto-unchecks and its dates hide.
- Re-check that line's "Expirable" box, leave dates empty, and confirm validation now blocks submission until dates are filled.
- Submit a purchase mixing one expirable and one non-expirable line, and confirm it saves without error and the Inventory page shows correct batch quantities for both.

- [ ] **Step 10: Commit**

```bash
git add src/components/dialogs/purchase-dialog.tsx
git commit -m "feat: add expirable checkbox to purchase dialog"
```

---

## Plan Self-Review Notes

- **Spec coverage:** data model (Task 1), validation rule (Tasks 4/5 zod refinements), Inventory dialog New Product + Add Quantity tabs (Task 4), Purchase dialog new + existing product lines (Task 5), backend product actions (Task 2), backend purchase actions (Task 3). All spec sections have a corresponding task.
- **Placeholder scan:** no TBD/TODO; every step has literal code or an exact shell command.
- **Type consistency:** `isExpirable` is spelled identically across `Product` (schema), `PurchaseFormData`, both dialogs' zod schemas, and both `product.action.ts`/`purchases.action.ts` — verified against each task's Interfaces block.
