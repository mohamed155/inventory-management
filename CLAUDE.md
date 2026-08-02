# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/002-multi-inventory/plan.md`.
<!-- SPECKIT END -->

## Commands

```bash
bun run dev          # Start both React (Vite) and Electron concurrently
bun run dev-react    # React only (http://localhost:5173)
bun run build        # Prisma generate → tsc → Vite build → esbuild Electron
bun run package      # Build + package as NSIS installer
bun run lint         # ESLint
bun run db:generate  # Regenerate Prisma client
bun run db:push      # (unsafe here — see below; do not use for schema changes)
```

## Architecture

This is an **Electron desktop app** (Windows) with a React 19 frontend. The app is an inventory management system supporting English and Arabic (RTL).

### Data flow (critical to understand)

All database access goes through Electron IPC:
1. React services call `window.electronAPI.*` methods (defined in `src/preload.ts`)
2. The preload script bridges to IPC handlers in `src/electron.ts`
3. `src/electron.ts` imports `src/prisma-actions.ts` and calls Prisma directly
4. Prisma uses SQLite via LibSQL WASM adapter

Never call Prisma from React-side code — it only runs in the Electron main process.

### Key directories

- `src/services/` — React-side service functions that call `window.electronAPI.*`
- `src/prisma-actions/` — Prisma queries/mutations, called only from `src/electron.ts`
- `src/pages/` — Route-level components (dashboard, inventory, sales, purchases, customers, providers, settings, login, signup)
- `src/components/ui/` — shadcn/ui components (New York style)
- `src/store/` — Zustand stores with localStorage persistence: `user.store.ts` (auth), `lang.store.ts` (language)
- `src/i18n/locales/` — Translation keys: `en.ts` and `ar.ts`

### Routing

Hash-based routing (`createHashRouter`) is required for Electron. Auth loaders in `src/router.tsx` redirect based on user count in the DB and current session.

### RTL / i18n

- Language is stored in `useCurrentLang` Zustand store and persisted to localStorage
- Arabic switches the document to `dir="rtl"`
- Always use Tailwind **logical properties** (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) instead of physical ones (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`) so layout flips correctly in RTL

### State management

- **Server state**: TanStack React Query (fetching, caching, mutations)
- **Client state**: Zustand (user session, language preference)
- **Forms**: React Hook Form + Zod for validation

### Theming & notifications

- Dark/light mode via `next-themes`
- Toast notifications via `sonner`
- Confirmation dialogs via `ConfirmProvider` context (`src/context/confirm-context.tsx`)

### Database schema summary

Core models: `User`, `Product`, `ProductBatch` (with production/expiry dates and quantities), `Customer`, `Provider`, `Purchase` + `PurchaseItem`, `Sale` + `SaleItem`.

After changing `prisma/schema.prisma`, do **not** run `bun run db:push` or `prisma migrate dev` — both refuse to run safely against this repo because they want to drop the custom `_applied_migrations` bookkeeping table that `src/electron.ts`'s `ensureDatabase()` depends on. Instead, hand-write a `prisma/migrations/<timestamp>_<name>/migration.sql` file (plain `ALTER TABLE`/etc. statements, matching existing migrations under `prisma/migrations/`), then run `bun run db:generate` to regenerate the Prisma client types. Both `tests/setup/db.ts` and `src/electron.ts` scan `prisma/migrations/*/migration.sql` directly and apply whatever hasn't been recorded yet, so the new file is picked up automatically.

## Tooling notes

- **Package manager**: Bun (use `bun` / `bunx`, not npm/npx)
- **Linter/formatter**: Biome (2-space indent, single quotes, trailing commas) — ESLint also present for React-specific rules
- **Path alias**: `@/` resolves to `src/`
- **shadcn/ui**: New York style; add components via `bunx shadcn add <component>`

## UI rules

- **Never use `<input type="number">` or `<Input type="number">`**. Always use `<ArithmeticInput>` from `@/components/ui/arithmetic-input.tsx` for any numeric field. It accepts `value: number` and `onChange: (value: number) => void`, evaluates arithmetic expressions on blur, and handles display state internally.
