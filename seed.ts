import { randomUUID } from 'node:crypto';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const db = createClient({ url: 'file:./dev.db' });

const id = () => randomUUID();
const now = () => new Date().toISOString();

async function seed() {
  // ── Users ──────────────────────────────────────────────────────────────────
  const assistantId = id();
  const assistantPassword = await bcrypt.hash('password123', 10);
  await db.execute({
    sql: `INSERT
		OR IGNORE INTO User (id, firstname, lastname, username, password, role, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      assistantId,
      'سارة',
      'أحمد',
      'sara',
      assistantPassword,
      'assistant',
      now(),
      now(),
    ],
  });

  // Grab the existing admin user id
  const adminRow = await db.execute(`SELECT id
	                                   FROM User
	                                   WHERE role = 'admin' LIMIT 1`);
  const adminId = adminRow.rows[0].id as string;

  // ── Providers ──────────────────────────────────────────────────────────────
  const p1 = id(),
    p2 = id(),
    p3 = id();
  await db.batch([
    {
      sql: `INSERT
			OR IGNORE INTO Provider (id, name, phone, address, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        p1,
        'شركة الدواء العربية',
        '01001234567',
        'القاهرة، شارع التحرير 12',
        now(),
        now(),
      ],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Provider (id, name, phone, address, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        p2,
        'مستلزمات الكامل الطبية',
        '01112345678',
        'الإسكندرية، شارع النصر 45',
        now(),
        now(),
      ],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Provider (id, name, phone, address, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        p3,
        'مجموعة الرعاية الصحية',
        '01223456789',
        'الجيزة، شارع الهرم 78',
        now(),
        now(),
      ],
    },
  ]);

  // ── Customers ──────────────────────────────────────────────────────────────
  const c1 = id(),
    c2 = id(),
    c3 = id(),
    c4 = id();
  await db.batch([
    {
      sql: `INSERT
			OR IGNORE INTO Customer (id, firstname, lastname, phone, address, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        c1,
        'أحمد',
        'محمود',
        '01011112233',
        'القاهرة، مدينة نصر',
        now(),
        now(),
      ],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Customer (id, firstname, lastname, phone, address, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [c2, 'فاطمة', 'علي', '01122223344', 'الجيزة، الدقي', now(), now()],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Customer (id, firstname, lastname, phone, address, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        c3,
        'خالد',
        'إبراهيم',
        '01233334455',
        'الإسكندرية، المنتزه',
        now(),
        now(),
      ],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Customer (id, firstname, lastname, phone, address, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [c4, 'منى', 'حسن', '01344445566', 'القاهرة، المعادي', now(), now()],
    },
  ]);

  // ── Products ───────────────────────────────────────────────────────────────
  const pr1 = id(),
    pr2 = id(),
    pr3 = id(),
    pr4 = id(),
    pr5 = id();
  await db.batch([
    {
      sql: `INSERT
			OR IGNORE INTO Product (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      args: [
        pr1,
        'باراسيتامول 500 مجم',
        'مسكن للألم وخافض للحرارة',
        now(),
        now(),
      ],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Product (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      args: [pr2, 'أموكسيسيلين 250 مجم', 'مضاد حيوي واسع الطيف', now(), now()],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Product (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      args: [
        pr3,
        'أوميبرازول 20 مجم',
        'مثبط مضخة البروتون لعلاج الحموضة',
        now(),
        now(),
      ],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Product (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      args: [
        pr4,
        'فيتامين سي 1000 مجم',
        'مكمل غذائي لتقوية المناعة',
        now(),
        now(),
      ],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Product (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      args: [
        pr5,
        'فيتامينات متعددة',
        'مكمل غذائي شامل للفيتامينات والمعادن',
        now(),
        now(),
      ],
    },
  ]);

  // ── Product Batches ────────────────────────────────────────────────────────
  // Two batches per product; one batch expires soon (within 10 days) to trigger dashboard alerts
  const b1a = id(),
    b1b = id();
  const b2a = id(),
    b2b = id();
  const b3a = id(),
    b3b = id();
  const b4a = id(),
    b4b = id();
  const b5a = id(),
    b5b = id();

  const soon = new Date(Date.now() + 7 * 86400000).toISOString(); // expires in 7 days
  const far1 = new Date(Date.now() + 180 * 86400000).toISOString();
  const far2 = new Date(Date.now() + 365 * 86400000).toISOString();
  const prod1 = new Date('2024-01-15').toISOString();
  const prod2 = new Date('2024-06-01').toISOString();
  const prod3 = new Date('2025-01-01').toISOString();

  await db.batch([
    // باراسيتامول — one expiring soon (low stock alert too: qty 5)
    {
      sql: `INSERT
			OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [b1a, pr1, prod1, soon, 5, now()],
    },
    {
      sql: `INSERT
			OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [b1b, pr1, prod2, far1, 200, now()],
    },
    // أموكسيسيلين
    {
      sql: `INSERT
			OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [b2a, pr2, prod1, far1, 150, now()],
    },
    {
      sql: `INSERT
			OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [b2b, pr2, prod2, far2, 300, now()],
    },
    // أوميبرازول — one expiring soon
    {
      sql: `INSERT
			OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [b3a, pr3, prod2, soon, 8, now()],
    },
    {
      sql: `INSERT
			OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [b3b, pr3, prod3, far2, 120, now()],
    },
    // فيتامين سي
    {
      sql: `INSERT
			OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [b4a, pr4, prod2, far1, 400, now()],
    },
    {
      sql: `INSERT
			OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [b4b, pr4, prod3, far2, 250, now()],
    },
    // فيتامينات متعددة — low stock alert (qty 6)
    {
      sql: `INSERT
			OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [b5a, pr5, prod2, far1, 6, now()],
    },
    {
      sql: `INSERT
			OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [b5b, pr5, prod3, far2, 180, now()],
    },
  ]);

  // ── Purchases ──────────────────────────────────────────────────────────────
  const pu1 = id(),
    pu2 = id(),
    pu3 = id();
  const past1 = new Date('2025-03-10').toISOString();
  const past2 = new Date('2025-04-05').toISOString();
  const past3 = new Date('2025-05-01').toISOString();
  const due1 = new Date('2025-06-10').toISOString();
  const due2 = new Date('2025-07-05').toISOString();
  const due3 = new Date('2026-08-01').toISOString(); // not overdue

  await db.batch([
    {
      sql: `INSERT
			OR IGNORE INTO Purchase (id, userId, providerId, paidAmount, date, payDueDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [pu1, adminId, p1, 1500, past1, due1, now(), now()],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Purchase (id, userId, providerId, paidAmount, date, payDueDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [pu2, adminId, p2, 3000, past2, due2, now(), now()],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Purchase (id, userId, providerId, paidAmount, date, payDueDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [pu3, adminId, p3, 2000, past3, due3, now(), now()],
    },
  ]);

  // Purchase items
  await db.batch([
    // Purchase 1: 100 باراسيتامول @ 5 EGP, 50 أوميبرازول @ 10 EGP
    {
      sql: `INSERT
			OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), pu1, pr1, b1b, 100, 5],
    },
    {
      sql: `INSERT
			OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), pu1, pr3, b3b, 50, 10],
    },
    // Purchase 2: 150 أموكسيسيلين @ 15 EGP, 100 فيتامين سي @ 7.5 EGP
    {
      sql: `INSERT
			OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), pu2, pr2, b2a, 150, 15],
    },
    {
      sql: `INSERT
			OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), pu2, pr4, b4a, 100, 7.5],
    },
    // Purchase 3: 80 فيتامينات متعددة @ 12 EGP, 60 باراسيتامول @ 5 EGP
    {
      sql: `INSERT
			OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), pu3, pr5, b5b, 80, 12],
    },
    {
      sql: `INSERT
			OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), pu3, pr1, b1b, 60, 5],
    },
  ]);

  // ── Sales ──────────────────────────────────────────────────────────────────
  const s1 = id(),
    s2 = id(),
    s3 = id();
  const saleDate1 = new Date('2025-04-01').toISOString();
  const saleDate2 = new Date('2025-04-20').toISOString();
  const saleDate3 = new Date('2025-05-15').toISOString();
  const saleDue1 = new Date('2025-05-01').toISOString(); // overdue
  const saleDue2 = new Date('2025-06-01').toISOString(); // overdue
  const saleDue3 = new Date('2026-07-15').toISOString(); // upcoming

  await db.batch([
    {
      sql: `INSERT
			OR IGNORE INTO Sale (id, userId, customerId, paidAmount, date, payDueDate, discount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [s1, adminId, c1, 600, saleDate1, saleDue1, 0, now(), now()],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Sale (id, userId, customerId, paidAmount, date, payDueDate, discount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [s2, adminId, c2, 1200, saleDate2, saleDue2, 50, now(), now()],
    },
    {
      sql: `INSERT
			OR IGNORE INTO Sale (id, userId, customerId, paidAmount, date, payDueDate, discount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [s3, adminId, c3, 900, saleDate3, saleDue3, 0, now(), now()],
    },
  ]);

  // Sale items
  await db.batch([
    // Sale 1: 30 باراسيتامول @ 10 EGP, 20 فيتامين سي @ 15 EGP
    {
      sql: `INSERT
			OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), s1, pr1, b1b, 30, 10],
    },
    {
      sql: `INSERT
			OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), s1, pr4, b4a, 20, 15],
    },
    // Sale 2: 40 أموكسيسيلين @ 25 EGP, 10 أوميبرازول @ 20 EGP
    {
      sql: `INSERT
			OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), s2, pr2, b2a, 40, 25],
    },
    {
      sql: `INSERT
			OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), s2, pr3, b3b, 10, 20],
    },
    // Sale 3: 25 فيتامينات متعددة @ 20 EGP, 35 باراسيتامول @ 10 EGP
    {
      sql: `INSERT
			OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), s3, pr5, b5b, 25, 20],
    },
    {
      sql: `INSERT
			OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id(), s3, pr1, b1b, 35, 10],
    },
  ]);

  console.log('✅ Seed complete');
  console.log('   Users:    1 assistant (sara / password123)');
  console.log('   Products: 5 (with 2 batches each)');
  console.log('   Providers: 3');
  console.log('   Customers: 4');
  console.log('   Purchases: 3 (with 2 items each)');
  console.log('   Sales:     3 (with 2 items each)');
  db.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
