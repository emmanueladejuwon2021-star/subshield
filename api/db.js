const { createClient } = require("@libsql/client");

let client;

function getClient() {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL || "file:api/local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  client = createClient(authToken ? { url, authToken } : { url });
  return client;
}

async function migrate() {
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      cost REAL NOT NULL,
      billing_cycle TEXT CHECK(billing_cycle IN ('Monthly', 'Annual')) NOT NULL,
      renewal_date TEXT NOT NULL,
      total_seats INTEGER DEFAULT 1,
      canceling INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      department TEXT NOT NULL,
      status TEXT CHECK(status IN ('Active', 'Departed')) DEFAULT 'Active'
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS seat_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      cost_per_seat REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT NOT NULL DEFAULT 'My Company',
      currency_symbol TEXT DEFAULT '$'
    )
  `);
}

async function seedIfEmpty() {
  const db = getClient();
  const count = await db.execute("SELECT COUNT(*) AS n FROM subscriptions");
  if (Number(count.rows[0].n) > 0) return;

  await db.execute(
    "INSERT INTO company_settings (id, company_name, currency_symbol) VALUES (1, 'Northstar Studio', '$')"
  );

  await db.execute(`
    INSERT INTO subscriptions (name, category, cost, billing_cycle, renewal_date, total_seats, canceling)
    VALUES
      ('Slack', 'Operations', 64.00, 'Monthly', date('now', '+4 days'), 8, 0),
      ('Figma', 'Design', 180.00, 'Annual', date('now', '+18 days'), 5, 0),
      ('Google Workspace', 'Operations', 72.00, 'Monthly', date('now', '+2 days'), 6, 0)
  `);

  await db.execute(`
    INSERT INTO employees (full_name, department, status)
    VALUES
      ('Ada Okonkwo', 'Engineering', 'Active'),
      ('James Mensah', 'Design', 'Active'),
      ('Priya Shah', 'Marketing', 'Active'),
      ('Chinedu Bello', 'Operations', 'Departed')
  `);

  const subs = await db.execute("SELECT id, name, cost, billing_cycle, total_seats FROM subscriptions");
  const emps = await db.execute("SELECT id, full_name, status FROM employees");
  const subByName = Object.fromEntries(subs.rows.map((s) => [s.name, s]));
  const empByName = Object.fromEntries(emps.rows.map((e) => [e.full_name, e]));

  const monthlySeat = (sub) => {
    const monthly = sub.billing_cycle === "Annual" ? Number(sub.cost) / 12 : Number(sub.cost);
    return Number((monthly / Math.max(1, Number(sub.total_seats))).toFixed(2));
  };

  const assignments = [
    ["Slack", "Ada Okonkwo", 1],
    ["Slack", "James Mensah", 1],
    ["Slack", "Priya Shah", 1],
    ["Slack", "Chinedu Bello", 0],
    ["Figma", "James Mensah", 1],
    ["Figma", "Ada Okonkwo", 1],
    ["Figma", "Chinedu Bello", 0],
    ["Google Workspace", "Ada Okonkwo", 1],
    ["Google Workspace", "James Mensah", 1],
    ["Google Workspace", "Priya Shah", 1],
    ["Google Workspace", "Chinedu Bello", 0],
  ];

  for (const [tool, person, active] of assignments) {
    const sub = subByName[tool];
    const emp = empByName[person];
    await db.execute({
      sql: "INSERT INTO seat_assignments (subscription_id, employee_id, cost_per_seat, is_active) VALUES (?, ?, ?, ?)",
      args: [sub.id, emp.id, monthlySeat(sub), active],
    });
  }
}

async function initDb() {
  await migrate();
  await seedIfEmpty();
  return getClient();
}

module.exports = { getClient, initDb };
