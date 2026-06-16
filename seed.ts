import { randomUUID } from 'node:crypto';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const db = createClient({ url: 'file:./dev.db' });

const id = () => randomUUID();
const now = () => new Date().toISOString();

async function seed() {
  // ── Users ──────────────────────────────────────────────────────────────────
  const adminId = id();
  const adminPassword = await bcrypt.hash('admin123', 10);
  const assistantId = id();
  const assistantPassword = await bcrypt.hash('password123', 10);
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO User (id, firstname, lastname, username, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [adminId, 'محمد', 'أحمد', 'admin', adminPassword, 'admin', now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO User (id, firstname, lastname, username, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [assistantId, 'سارة', 'أحمد', 'sara', assistantPassword, 'assistant', now(), now()],
    },
  ]);

  const adminRow = await db.execute(`SELECT id FROM User WHERE role = 'admin' LIMIT 1`);
  const resolvedAdminId = adminRow.rows[0].id as string;
  const assistantRow = await db.execute(`SELECT id FROM User WHERE role = 'assistant' LIMIT 1`);
  const resolvedAssistantId = assistantRow.rows[0].id as string;

  // ── Inventories ────────────────────────────────────────────────────────────
  const inv1Id = id();
  const inv2Id = id();
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO Inventory (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
      args: [inv1Id, 'صيدلية النور المركزية', now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Inventory (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
      args: [inv2Id, 'مستودع الرعاية الطبية', now(), now()],
    },
  ]);

  const invRows = await db.execute(`SELECT id FROM Inventory ORDER BY createdAt LIMIT 2`);
  const [inventory1Id, inventory2Id] = invRows.rows.map(r => r.id as string);

  // ══════════════════════════════════════════════════════════════════════════
  // INVENTORY 1 — صيدلية النور المركزية  (pharmacy, admin manages)
  // ══════════════════════════════════════════════════════════════════════════

  // Providers — Inv1
  const i1p1 = id(), i1p2 = id(), i1p3 = id();
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO Provider (id, name, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i1p1, 'شركة الدواء العربية', '01001234567', 'القاهرة، شارع التحرير 12', inventory1Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Provider (id, name, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i1p2, 'مستلزمات الكامل الطبية', '01112345678', 'الإسكندرية، شارع النصر 45', inventory1Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Provider (id, name, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i1p3, 'مجموعة الرعاية الصحية', '01223456789', 'الجيزة، شارع الهرم 78', inventory1Id, now(), now()],
    },
  ]);

  // Customers — Inv1
  const i1c1 = id(), i1c2 = id(), i1c3 = id(), i1c4 = id();
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO Customer (id, firstname, lastname, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i1c1, 'أحمد', 'محمود', '01011112233', 'القاهرة، مدينة نصر', inventory1Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Customer (id, firstname, lastname, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i1c2, 'فاطمة', 'علي', '01122223344', 'الجيزة، الدقي', inventory1Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Customer (id, firstname, lastname, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i1c3, 'خالد', 'إبراهيم', '01233334455', 'الإسكندرية، المنتزه', inventory1Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Customer (id, firstname, lastname, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i1c4, 'منى', 'حسن', '01344445566', 'القاهرة، المعادي', inventory1Id, now(), now()],
    },
  ]);

  // Products — Inv1 (pharmaceuticals)
  const i1pr1 = id(), i1pr2 = id(), i1pr3 = id(), i1pr4 = id(), i1pr5 = id();
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO Product (id, name, description, unitPrice, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i1pr1, 'باراسيتامول 500 مجم', 'مسكن للألم وخافض للحرارة', 10, inventory1Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Product (id, name, description, unitPrice, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i1pr2, 'أموكسيسيلين 250 مجم', 'مضاد حيوي واسع الطيف', 25, inventory1Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Product (id, name, description, unitPrice, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i1pr3, 'أوميبرازول 20 مجم', 'مثبط مضخة البروتون لعلاج الحموضة', 20, inventory1Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Product (id, name, description, unitPrice, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i1pr4, 'فيتامين سي 1000 مجم', 'مكمل غذائي لتقوية المناعة', 15, inventory1Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Product (id, name, description, unitPrice, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i1pr5, 'فيتامينات متعددة', 'مكمل غذائي شامل للفيتامينات والمعادن', 20, inventory1Id, now(), now()],
    },
  ]);

  // Resolve Inv1 entity IDs after OR IGNORE
  const [fp1_1, fp1_2, fp1_3] = (await db.execute(`SELECT id FROM Provider WHERE inventoryId = ? ORDER BY createdAt LIMIT 3`, [inventory1Id])).rows.map(r => r.id as string);
  const [fc1_1, fc1_2, fc1_3] = (await db.execute(`SELECT id FROM Customer WHERE inventoryId = ? ORDER BY createdAt LIMIT 3`, [inventory1Id])).rows.map(r => r.id as string);
  const [fpr1_1, fpr1_2, fpr1_3, fpr1_4, fpr1_5] = (await db.execute(`SELECT id FROM Product WHERE inventoryId = ? ORDER BY createdAt LIMIT 5`, [inventory1Id])).rows.map(r => r.id as string);

  // Product Batches — Inv1
  const soon  = new Date(Date.now() +   7 * 86400000).toISOString();
  const far1  = new Date(Date.now() + 180 * 86400000).toISOString();
  const far2  = new Date(Date.now() + 365 * 86400000).toISOString();
  const prod1 = new Date('2024-01-15').toISOString();
  const prod2 = new Date('2024-06-01').toISOString();
  const prod3 = new Date('2025-01-01').toISOString();

  const i1b1a = id(), i1b1b = id(), i1b2a = id(), i1b2b = id(), i1b3a = id();
  const i1b3b = id(), i1b4a = id(), i1b4b = id(), i1b5a = id(), i1b5b = id();
  await db.batch([
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i1b1a, fpr1_1, prod1, soon,  5,   now()] }, // expiring soon, low stock
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i1b1b, fpr1_1, prod2, far1,  200, now()] },
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i1b2a, fpr1_2, prod1, far1,  150, now()] },
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i1b2b, fpr1_2, prod2, far2,  300, now()] },
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i1b3a, fpr1_3, prod2, soon,  8,   now()] }, // expiring soon
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i1b3b, fpr1_3, prod3, far2,  120, now()] },
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i1b4a, fpr1_4, prod2, far1,  400, now()] },
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i1b4b, fpr1_4, prod3, far2,  250, now()] },
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i1b5a, fpr1_5, prod2, far1,  6,   now()] }, // low stock
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i1b5b, fpr1_5, prod3, far2,  180, now()] },
  ]);

  // Resolve batch IDs per product for Inv1
  const getBatches = async (productId: string) =>
    (await db.execute(`SELECT id FROM ProductBatch WHERE productId = ? ORDER BY createdAt LIMIT 2`, [productId])).rows.map(r => r.id as string);
  const [_rb1_1a, rb1_1b] = await getBatches(fpr1_1);
  const [rb1_2a]          = await getBatches(fpr1_2);
  const [_rb1_3a, rb1_3b] = await getBatches(fpr1_3);
  const [rb1_4a]          = await getBatches(fpr1_4);
  const [_rb1_5a, rb1_5b] = await getBatches(fpr1_5);

  // Purchases — Inv1
  const i1pu1 = id(), i1pu2 = id(), i1pu3 = id();
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO Purchase (id, userId, providerId, inventoryId, paidAmount, date, payDueDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i1pu1, resolvedAdminId, fp1_1, inventory1Id, 1500, new Date('2025-03-10').toISOString(), new Date('2025-06-10').toISOString(), now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Purchase (id, userId, providerId, inventoryId, paidAmount, date, payDueDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i1pu2, resolvedAdminId, fp1_2, inventory1Id, 3000, new Date('2025-04-05').toISOString(), new Date('2025-07-05').toISOString(), now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Purchase (id, userId, providerId, inventoryId, paidAmount, date, payDueDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i1pu3, resolvedAdminId, fp1_3, inventory1Id, 2000, new Date('2025-05-01').toISOString(), new Date('2026-08-01').toISOString(), now(), now()],
    },
  ]);

  const [rpu1_1, rpu1_2, rpu1_3] = (await db.execute(`SELECT id FROM Purchase WHERE inventoryId = ? ORDER BY createdAt LIMIT 3`, [inventory1Id])).rows.map(r => r.id as string);

  await db.batch([
    { sql: `INSERT OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rpu1_1, fpr1_1, rb1_1b, 100, 5]   },
    { sql: `INSERT OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rpu1_1, fpr1_3, rb1_3b, 50,  10]  },
    { sql: `INSERT OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rpu1_2, fpr1_2, rb1_2a, 150, 15]  },
    { sql: `INSERT OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rpu1_2, fpr1_4, rb1_4a, 100, 7.5] },
    { sql: `INSERT OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rpu1_3, fpr1_5, rb1_5b, 80,  12]  },
    { sql: `INSERT OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rpu1_3, fpr1_1, rb1_1b, 60,  5]   },
  ]);

  // Sales — Inv1
  const i1s1 = id(), i1s2 = id(), i1s3 = id();
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO Sale (id, userId, customerId, inventoryId, paidAmount, date, payDueDate, discount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i1s1, resolvedAdminId, fc1_1, inventory1Id, 600,  new Date('2025-04-01').toISOString(), new Date('2025-05-01').toISOString(), 0,  now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Sale (id, userId, customerId, inventoryId, paidAmount, date, payDueDate, discount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i1s2, resolvedAdminId, fc1_2, inventory1Id, 1200, new Date('2025-04-20').toISOString(), new Date('2025-06-01').toISOString(), 50, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Sale (id, userId, customerId, inventoryId, paidAmount, date, payDueDate, discount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i1s3, resolvedAdminId, fc1_3, inventory1Id, 900,  new Date('2025-05-15').toISOString(), new Date('2026-07-15').toISOString(), 0,  now(), now()],
    },
  ]);

  const [rs1_1, rs1_2, rs1_3] = (await db.execute(`SELECT id FROM Sale WHERE inventoryId = ? ORDER BY createdAt LIMIT 3`, [inventory1Id])).rows.map(r => r.id as string);

  await db.batch([
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs1_1, fpr1_1, rb1_1b, 30, 10] },
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs1_1, fpr1_4, rb1_4a, 20, 15] },
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs1_2, fpr1_2, rb1_2a, 40, 25] },
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs1_2, fpr1_3, rb1_3b, 10, 20] },
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs1_3, fpr1_5, rb1_5b, 25, 20] },
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs1_3, fpr1_1, rb1_1b, 35, 10] },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // INVENTORY 2 — مستودع الرعاية الطبية  (medical supplies, assistant manages)
  // ══════════════════════════════════════════════════════════════════════════

  // Providers — Inv2
  const i2p1 = id(), i2p2 = id();
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO Provider (id, name, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i2p1, 'شركة النيل للمستلزمات', '01556781234', 'القاهرة، المهندسين 22', inventory2Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Provider (id, name, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i2p2, 'موردو الخليج الطبية', '01667892345', 'الجيزة، فيصل 10', inventory2Id, now(), now()],
    },
  ]);

  // Customers — Inv2
  const i2c1 = id(), i2c2 = id(), i2c3 = id();
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO Customer (id, firstname, lastname, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i2c1, 'يوسف', 'الشريف', '01511223344', 'القاهرة، عين شمس', inventory2Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Customer (id, firstname, lastname, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i2c2, 'نور', 'السيد', '01622334455', 'الجيزة، إمبابة', inventory2Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Customer (id, firstname, lastname, phone, address, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i2c3, 'حسام', 'عمر', '01733445566', 'الإسكندرية، العجمي', inventory2Id, now(), now()],
    },
  ]);

  // Products — Inv2 (medical supplies / equipment)
  const i2pr1 = id(), i2pr2 = id(), i2pr3 = id(), i2pr4 = id();
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO Product (id, name, description, unitPrice, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i2pr1, 'قفازات طبية (علبة 100)', 'قفازات لاتكس للفحص الطبي', 45, inventory2Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Product (id, name, description, unitPrice, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i2pr2, 'ضمادات شاش معقمة', 'ضمادات شاش معقمة 10×10 سم', 8, inventory2Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Product (id, name, description, unitPrice, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i2pr3, 'محاقن 5 مل', 'محاقن بلاستيكية معقمة للاستخدام مرة واحدة', 3, inventory2Id, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Product (id, name, description, unitPrice, inventoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [i2pr4, 'كحول طبي 70%', 'محلول كحولي للتعقيم', 30, inventory2Id, now(), now()],
    },
  ]);

  // Resolve Inv2 entity IDs
  const [fp2_1, fp2_2] = (await db.execute(`SELECT id FROM Provider WHERE inventoryId = ? ORDER BY createdAt LIMIT 2`, [inventory2Id])).rows.map(r => r.id as string);
  const [fc2_1, fc2_2, fc2_3] = (await db.execute(`SELECT id FROM Customer WHERE inventoryId = ? ORDER BY createdAt LIMIT 3`, [inventory2Id])).rows.map(r => r.id as string);
  const [fpr2_1, fpr2_2, fpr2_3, fpr2_4] = (await db.execute(`SELECT id FROM Product WHERE inventoryId = ? ORDER BY createdAt LIMIT 4`, [inventory2Id])).rows.map(r => r.id as string);

  // Product Batches — Inv2
  const far3 = new Date(Date.now() + 270 * 86400000).toISOString();
  const i2b1a = id(), i2b1b = id(), i2b2a = id(), i2b2b = id();
  const i2b3a = id(), i2b3b = id(), i2b4a = id(), i2b4b = id();
  await db.batch([
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i2b1a, fpr2_1, prod2, far1,  7,   now()] }, // low stock
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i2b1b, fpr2_1, prod3, far3,  500, now()] },
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i2b2a, fpr2_2, prod2, soon,  4,   now()] }, // expiring soon, low stock
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i2b2b, fpr2_2, prod3, far2,  800, now()] },
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i2b3a, fpr2_3, prod3, far1,  1000,now()] },
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i2b3b, fpr2_3, prod3, far2,  2000,now()] },
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i2b4a, fpr2_4, prod2, soon,  6,   now()] }, // expiring soon
    { sql: `INSERT OR IGNORE INTO ProductBatch (id, productId, productionDate, expirationDate, quantity, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, args: [i2b4b, fpr2_4, prod3, far3,  350, now()] },
  ]);

  const [_rb2_1a, rb2_1b] = await getBatches(fpr2_1);
  const [_rb2_2a, rb2_2b] = await getBatches(fpr2_2);
  const [rb2_3a, _rb2_3b] = await getBatches(fpr2_3);
  const [_rb2_4a, rb2_4b] = await getBatches(fpr2_4);

  // Purchases — Inv2
  const i2pu1 = id(), i2pu2 = id();
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO Purchase (id, userId, providerId, inventoryId, paidAmount, date, payDueDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i2pu1, resolvedAssistantId, fp2_1, inventory2Id, 4500, new Date('2025-02-20').toISOString(), new Date('2025-05-20').toISOString(), now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Purchase (id, userId, providerId, inventoryId, paidAmount, date, payDueDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i2pu2, resolvedAssistantId, fp2_2, inventory2Id, 6000, new Date('2025-04-10').toISOString(), new Date('2026-09-10').toISOString(), now(), now()],
    },
  ]);

  const [rpu2_1, rpu2_2] = (await db.execute(`SELECT id FROM Purchase WHERE inventoryId = ? ORDER BY createdAt LIMIT 2`, [inventory2Id])).rows.map(r => r.id as string);

  await db.batch([
    { sql: `INSERT OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rpu2_1, fpr2_1, rb2_1b, 200, 40]  },
    { sql: `INSERT OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rpu2_1, fpr2_3, rb2_3a, 500, 2.5] },
    { sql: `INSERT OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rpu2_2, fpr2_2, rb2_2b, 600, 6]   },
    { sql: `INSERT OR IGNORE INTO PurchaseItem (id, purchaseId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rpu2_2, fpr2_4, rb2_4b, 200, 25]  },
  ]);

  // Sales — Inv2
  const i2s1 = id(), i2s2 = id(), i2s3 = id();
  await db.batch([
    {
      sql: `INSERT OR IGNORE INTO Sale (id, userId, customerId, inventoryId, paidAmount, date, payDueDate, discount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i2s1, resolvedAssistantId, fc2_1, inventory2Id, 850,  new Date('2025-03-05').toISOString(), new Date('2025-04-05').toISOString(), 0,   now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Sale (id, userId, customerId, inventoryId, paidAmount, date, payDueDate, discount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i2s2, resolvedAssistantId, fc2_2, inventory2Id, 2100, new Date('2025-04-15').toISOString(), new Date('2026-05-15').toISOString(), 100, now(), now()],
    },
    {
      sql: `INSERT OR IGNORE INTO Sale (id, userId, customerId, inventoryId, paidAmount, date, payDueDate, discount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [i2s3, resolvedAssistantId, fc2_3, inventory2Id, 540,  new Date('2025-05-20').toISOString(), new Date('2025-07-20').toISOString(), 0,   now(), now()],
    },
  ]);

  const [rs2_1, rs2_2, rs2_3] = (await db.execute(`SELECT id FROM Sale WHERE inventoryId = ? ORDER BY createdAt LIMIT 3`, [inventory2Id])).rows.map(r => r.id as string);

  await db.batch([
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs2_1, fpr2_1, rb2_1b, 10, 45] },
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs2_1, fpr2_3, rb2_3a, 50, 3]  },
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs2_2, fpr2_2, rb2_2b, 80, 8]  },
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs2_2, fpr2_4, rb2_4b, 60, 30] },
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs2_3, fpr2_3, rb2_3a, 80, 3]  },
    { sql: `INSERT OR IGNORE INTO SaleItem (id, saleId, productId, batchId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?, ?)`, args: [id(), rs2_3, fpr2_1, rb2_1b, 5,  45] },
  ]);

  console.log('✅ Seed complete');
  console.log('');
  console.log('  Inventory 1 — صيدلية النور المركزية (managed by admin)');
  console.log('    Products:  5 pharmaceuticals (with 2 batches each)');
  console.log('    Providers: 3 | Customers: 4 | Purchases: 3 | Sales: 3');
  console.log('');
  console.log('  Inventory 2 — مستودع الرعاية الطبية (managed by sara/assistant)');
  console.log('    Products:  4 medical supplies (with 2 batches each)');
  console.log('    Providers: 2 | Customers: 3 | Purchases: 2 | Sales: 3');
  console.log('');
  console.log('  Users: admin (admin / admin123) · sara (sara / password123)');
  db.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
