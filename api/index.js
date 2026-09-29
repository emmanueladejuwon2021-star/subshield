const express = require("express");
const cors = require("cors");
const { getClient, initDb } = require("./db");

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed =
      origin.includes("github.io") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("vercel.app");
    callback(null, allowed);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

let ready;
function ensureDb(req, res, next) {
  if (!ready) ready = initDb();
  ready.then(() => next()).catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Unable to load data—please try again" });
  });
}

app.use("/api", ensureDb);
app.use(ensureDb);

function monthlyCost(sub) {
  const cost = Number(sub.cost);
  return sub.billing_cycle === "Annual" ? cost / 12 : cost;
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, product: "SubShield" });
});

app.get("/api/overview", async (req, res) => {
  try {
    const db = getClient();
    const settings = await db.execute("SELECT * FROM company_settings WHERE id = 1");
    const subs = await db.execute("SELECT * FROM subscriptions");
    const seats = await db.execute("SELECT * FROM seat_assignments");
    const employees = await db.execute("SELECT * FROM employees");
    const monthlyBurn = subs.rows.reduce((sum, s) => sum + monthlyCost(s), 0);
    const wastedSeatCost = seats.rows
      .filter((s) => Number(s.is_active) === 0)
      .reduce((sum, s) => sum + Number(s.cost_per_seat), 0);
    const upcoming = subs.rows
      .map((s) => ({ ...s, days: daysUntil(s.renewal_date) }))
      .filter((s) => s.days >= 0 && s.days <= 7)
      .sort((a, b) => a.days - b.days);
    res.json({
      companyName: settings.rows[0]?.company_name || "My Company",
      currency: settings.rows[0]?.currency_symbol || "$",
      monthlyBurnRate: Number(monthlyBurn.toFixed(2)),
      annualSpending: Number((monthlyBurn * 12).toFixed(2)),
      wastedSeatCost: Number(wastedSeatCost.toFixed(2)),
      softwareCount: subs.rows.length,
      employeeCount: employees.rows.length,
      upcomingRenewals: upcoming,
      upcomingCount: upcoming.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load data—please try again" });
  }
});

app.get("/api/subscriptions", async (req, res) => {
  try {
    const db = getClient();
    const subs = await db.execute("SELECT * FROM subscriptions ORDER BY name");
    const seats = await db.execute(
      "SELECT subscription_id, COUNT(*) AS assigned, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_seats FROM seat_assignments GROUP BY subscription_id"
    );
    const seatMap = Object.fromEntries(seats.rows.map((r) => [r.subscription_id, r]));
    const rows = subs.rows.map((s) => {
      const stats = seatMap[s.id] || { assigned: 0, active_seats: 0 };
      return {
        ...s,
        monthlyCost: Number(monthlyCost(s).toFixed(2)),
        assignedSeats: Number(stats.assigned || 0),
        activeSeats: Number(stats.active_seats || 0),
        daysUntilRenewal: daysUntil(s.renewal_date),
      };
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load data—please try again" });
  }
});

app.post("/api/subscriptions", async (req, res) => {
  try {
    const { name, category, cost, billing_cycle, renewal_date, total_seats } = req.body || {};
    if (!name || !category || cost == null || !billing_cycle || !renewal_date) {
      return res.status(400).json({ message: "Please fill in every required field" });
    }
    if (!["Monthly", "Annual"].includes(billing_cycle)) {
      return res.status(400).json({ message: "Billing must be Monthly or Annual" });
    }
    const db = getClient();
    const result = await db.execute({
      sql: `INSERT INTO subscriptions (name, category, cost, billing_cycle, renewal_date, total_seats) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [name.trim(), category.trim(), Number(cost), billing_cycle, renewal_date, Number(total_seats || 1)],
    });
    res.status(201).json({ id: Number(result.lastInsertRowid), message: "Subscription added!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Changes were not saved." });
  }
});

app.put("/api/subscriptions/:id", async (req, res) => {
  try {
    const { name, category, cost, billing_cycle, renewal_date, total_seats, canceling } = req.body || {};
    const db = getClient();
    await db.execute({
      sql: `UPDATE subscriptions SET name = COALESCE(?, name), category = COALESCE(?, category), cost = COALESCE(?, cost), billing_cycle = COALESCE(?, billing_cycle), renewal_date = COALESCE(?, renewal_date), total_seats = COALESCE(?, total_seats), canceling = COALESCE(?, canceling) WHERE id = ?`,
      args: [name ?? null, category ?? null, cost == null ? null : Number(cost), billing_cycle ?? null, renewal_date ?? null, total_seats == null ? null : Number(total_seats), canceling == null ? null : Number(canceling), Number(req.params.id)],
    });
    res.json({ message: "Changes saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Changes were not saved." });
  }
});

app.delete("/api/subscriptions/:id", async (req, res) => {
  try {
    const db = getClient();
    await db.execute({ sql: "DELETE FROM seat_assignments WHERE subscription_id = ?", args: [Number(req.params.id)] });
    await db.execute({ sql: "DELETE FROM subscriptions WHERE id = ?", args: [Number(req.params.id)] });
    res.json({ message: "Software removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Changes were not saved." });
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const db = getClient();
    const emps = await db.execute("SELECT * FROM employees ORDER BY full_name");
    const seats = await db.execute(`SELECT sa.*, s.name AS software_name FROM seat_assignments sa JOIN subscriptions s ON s.id = sa.subscription_id`);
    const byEmp = {};
    for (const row of seats.rows) {
      if (!byEmp[row.employee_id]) byEmp[row.employee_id] = [];
      byEmp[row.employee_id].push(row);
    }
    res.json(emps.rows.map((e) => ({ ...e, seats: byEmp[e.id] || [] })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load data—please try again" });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const { full_name, department } = req.body || {};
    if (!full_name || !department) {
      return res.status(400).json({ message: "Please add a name and department" });
    }
    const db = getClient();
    const result = await db.execute({
      sql: "INSERT INTO employees (full_name, department, status) VALUES (?, ?, 'Active')",
      args: [full_name.trim(), department.trim()],
    });
    res.status(201).json({ id: Number(result.lastInsertRowid), message: "Team member added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Changes were not saved." });
  }
});

app.patch("/api/employees/:id/status", async (req, res) => {
  try {
    const status = req.body?.status === "Departed" ? "Departed" : "Active";
    const db = getClient();
    await db.execute({ sql: "UPDATE employees SET status = ? WHERE id = ?", args: [status, Number(req.params.id)] });
    if (status === "Departed") {
      await db.execute({ sql: "UPDATE seat_assignments SET is_active = 0 WHERE employee_id = ?", args: [Number(req.params.id)] });
    }
    res.json({ message: status === "Departed" ? "Team member marked as departed" : "Team member marked as active" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Changes were not saved." });
  }
});

app.get("/api/seats", async (req, res) => {
  try {
    const db = getClient();
    const rows = await db.execute(`
      SELECT sa.id, sa.subscription_id, sa.employee_id, sa.cost_per_seat, sa.is_active,
        s.name AS software_name, s.category, s.billing_cycle,
        e.full_name, e.department, e.status AS employee_status
      FROM seat_assignments sa
      JOIN subscriptions s ON s.id = sa.subscription_id
      JOIN employees e ON e.id = sa.employee_id
      ORDER BY s.name, e.full_name
    `);
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load data—please try again" });
  }
});

app.post("/api/seats/assign", async (req, res) => {
  try {
    const { subscription_id, employee_id } = req.body || {};
    if (!subscription_id || !employee_id) {
      return res.status(400).json({ message: "Choose both a tool and a team member" });
    }
    const db = getClient();
    const existing = await db.execute({
      sql: "SELECT id FROM seat_assignments WHERE subscription_id = ? AND employee_id = ?",
      args: [Number(subscription_id), Number(employee_id)],
    });
    if (existing.rows.length) {
      return res.status(400).json({ message: "This person already has a seat on that tool" });
    }
    const sub = await db.execute({
      sql: "SELECT cost, billing_cycle, total_seats FROM subscriptions WHERE id = ?",
      args: [Number(subscription_id)],
    });
    if (!sub.rows[0]) return res.status(404).json({ message: "Software not found" });
    const s = sub.rows[0];
    const monthly = s.billing_cycle === "Annual" ? Number(s.cost) / 12 : Number(s.cost);
    const costPerSeat = Number((monthly / Math.max(1, Number(s.total_seats))).toFixed(2));
    const result = await db.execute({
      sql: "INSERT INTO seat_assignments (subscription_id, employee_id, cost_per_seat, is_active) VALUES (?, ?, ?, 1)",
      args: [Number(subscription_id), Number(employee_id), costPerSeat],
    });
    res.status(201).json({ id: Number(result.lastInsertRowid), message: "Seat assigned" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Changes were not saved." });
  }
});

app.patch("/api/seats/:id/toggle", async (req, res) => {
  try {
    const db = getClient();
    const current = await db.execute({ sql: "SELECT is_active FROM seat_assignments WHERE id = ?", args: [Number(req.params.id)] });
    if (!current.rows[0]) return res.status(404).json({ message: "Seat not found" });
    const next = Number(current.rows[0].is_active) === 1 ? 0 : 1;
    await db.execute({ sql: "UPDATE seat_assignments SET is_active = ? WHERE id = ?", args: [next, Number(req.params.id)] });
    res.json({ is_active: next, message: next ? "Seat marked as active" : "Seat marked as inactive" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Changes were not saved." });
  }
});

app.get("/api/renewals", async (req, res) => {
  try {
    const db = getClient();
    const subs = await db.execute("SELECT * FROM subscriptions");
    const rows = subs.rows
      .map((s) => ({
        ...s,
        monthlyCost: Number(monthlyCost(s).toFixed(2)),
        daysUntilRenewal: daysUntil(s.renewal_date),
      }))
      .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load data—please try again" });
  }
});

app.get("/api/settings", async (req, res) => {
  try {
    const db = getClient();
    const result = await db.execute("SELECT * FROM company_settings WHERE id = 1");
    if (!result.rows[0]) {
      await db.execute("INSERT INTO company_settings (id, company_name, currency_symbol) VALUES (1, 'My Company', '$')");
      return res.json({ company_name: "My Company", currency_symbol: "$" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load data—please try again" });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const { company_name, currency_symbol } = req.body || {};
    const db = getClient();
    await db.execute("INSERT INTO company_settings (id, company_name, currency_symbol) VALUES (1, 'My Company', '$') ON CONFLICT(id) DO NOTHING");
    await db.execute({
      sql: "UPDATE company_settings SET company_name = COALESCE(?, company_name), currency_symbol = COALESCE(?, currency_symbol) WHERE id = 1",
      args: [company_name || null, currency_symbol || null],
    });
    res.json({ message: "Monthly budget updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Changes were not saved." });
  }
});

app.get("/api/insights", async (req, res) => {
  try {
    const db = getClient();
    const subs = await db.execute("SELECT * FROM subscriptions");
    const byCategory = {};
    let total = 0;
    for (const s of subs.rows) {
      const m = monthlyCost(s);
      total += m;
      byCategory[s.category] = (byCategory[s.category] || 0) + m;
    }
    const breakdown = Object.entries(byCategory)
      .map(([category, monthly]) => ({
        category,
        monthly: Number(monthly.toFixed(2)),
        share: total ? Number(((monthly / total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.monthly - a.monthly);
    res.json({ total: Number(total.toFixed(2)), breakdown });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load data—please try again" });
  }
});

app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "That page could not be found" });
  }
  res.status(404).json({ message: "That page could not be found" });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  initDb()
    .then(() => {
      app.listen(PORT, () => console.log(`SubShield API running on ${PORT}`));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = app;
