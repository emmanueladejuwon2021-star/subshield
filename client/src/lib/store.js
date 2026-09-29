const KEY = "subshield-data-v1";

function isoPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seed() {
  return {
    nextId: 20,
    settings: { id: 1, company_name: "Northstar Studio", currency_symbol: "$" },
    subscriptions: [
      { id: 1, name: "Slack", category: "Operations", cost: 64, billing_cycle: "Monthly", renewal_date: isoPlus(4), total_seats: 8, canceling: 0 },
      { id: 2, name: "Figma", category: "Design", cost: 180, billing_cycle: "Annual", renewal_date: isoPlus(18), total_seats: 5, canceling: 0 },
      { id: 3, name: "Google Workspace", category: "Operations", cost: 72, billing_cycle: "Monthly", renewal_date: isoPlus(2), total_seats: 6, canceling: 0 },
    ],
    employees: [
      { id: 1, full_name: "Ada Okonkwo", department: "Engineering", status: "Active" },
      { id: 2, full_name: "James Mensah", department: "Design", status: "Active" },
      { id: 3, full_name: "Priya Shah", department: "Marketing", status: "Active" },
      { id: 4, full_name: "Chinedu Bello", department: "Operations", status: "Departed" },
    ],
    seats: [
      { id: 1, subscription_id: 1, employee_id: 1, cost_per_seat: 8, is_active: 1 },
      { id: 2, subscription_id: 1, employee_id: 2, cost_per_seat: 8, is_active: 1 },
      { id: 3, subscription_id: 1, employee_id: 3, cost_per_seat: 8, is_active: 1 },
      { id: 4, subscription_id: 1, employee_id: 4, cost_per_seat: 8, is_active: 0 },
      { id: 5, subscription_id: 2, employee_id: 2, cost_per_seat: 3, is_active: 1 },
      { id: 6, subscription_id: 2, employee_id: 1, cost_per_seat: 3, is_active: 1 },
      { id: 7, subscription_id: 2, employee_id: 4, cost_per_seat: 3, is_active: 0 },
      { id: 8, subscription_id: 3, employee_id: 1, cost_per_seat: 12, is_active: 1 },
      { id: 9, subscription_id: 3, employee_id: 2, cost_per_seat: 12, is_active: 1 },
      { id: 10, subscription_id: 3, employee_id: 3, cost_per_seat: 12, is_active: 1 },
      { id: 11, subscription_id: 3, employee_id: 4, cost_per_seat: 12, is_active: 0 },
    ],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const data = seed();
  save(data);
  return data;
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function monthlyCost(sub) {
  return sub.billing_cycle === "Annual" ? Number(sub.cost) / 12 : Number(sub.cost);
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

function seatCost(sub) {
  return Number((monthlyCost(sub) / Math.max(1, Number(sub.total_seats))).toFixed(2));
}

export const localApi = {
  overview() {
    const db = load();
    const monthlyBurn = db.subscriptions.reduce((s, x) => s + monthlyCost(x), 0);
    const wastedSeatCost = db.seats.filter((s) => Number(s.is_active) === 0).reduce((s, x) => s + Number(x.cost_per_seat), 0);
    const upcoming = db.subscriptions
      .map((s) => ({ ...s, days: daysUntil(s.renewal_date) }))
      .filter((s) => s.days >= 0 && s.days <= 7)
      .sort((a, b) => a.days - b.days);
    return {
      companyName: db.settings.company_name,
      currency: db.settings.currency_symbol,
      monthlyBurnRate: Number(monthlyBurn.toFixed(2)),
      annualSpending: Number((monthlyBurn * 12).toFixed(2)),
      wastedSeatCost: Number(wastedSeatCost.toFixed(2)),
      softwareCount: db.subscriptions.length,
      employeeCount: db.employees.length,
      upcomingRenewals: upcoming,
      upcomingCount: upcoming.length,
    };
  },
  subscriptions() {
    const db = load();
    return db.subscriptions.map((s) => {
      const assigned = db.seats.filter((x) => x.subscription_id === s.id);
      return {
        ...s,
        monthlyCost: Number(monthlyCost(s).toFixed(2)),
        assignedSeats: assigned.length,
        activeSeats: assigned.filter((x) => Number(x.is_active) === 1).length,
        daysUntilRenewal: daysUntil(s.renewal_date),
      };
    });
  },
  addSubscription(body) {
    const db = load();
    const id = db.nextId++;
    db.subscriptions.push({
      id,
      name: body.name,
      category: body.category,
      cost: Number(body.cost),
      billing_cycle: body.billing_cycle,
      renewal_date: body.renewal_date,
      total_seats: Number(body.total_seats || 1),
      canceling: 0,
    });
    save(db);
    return { id, message: "Subscription added!" };
  },
  updateSubscription(id, body) {
    const db = load();
    const s = db.subscriptions.find((x) => x.id === Number(id));
    if (!s) throw new Error("Software not found");
    Object.assign(s, {
      name: body.name ?? s.name,
      category: body.category ?? s.category,
      cost: body.cost == null ? s.cost : Number(body.cost),
      billing_cycle: body.billing_cycle ?? s.billing_cycle,
      renewal_date: body.renewal_date ?? s.renewal_date,
      total_seats: body.total_seats == null ? s.total_seats : Number(body.total_seats),
      canceling: body.canceling == null ? s.canceling : Number(body.canceling),
    });
    save(db);
    return { message: "Changes saved" };
  },
  deleteSubscription(id) {
    const db = load();
    db.subscriptions = db.subscriptions.filter((x) => x.id !== Number(id));
    db.seats = db.seats.filter((x) => x.subscription_id !== Number(id));
    save(db);
    return { message: "Software removed" };
  },
  employees() {
    const db = load();
    return db.employees.map((e) => ({
      ...e,
      seats: db.seats.filter((s) => s.employee_id === e.id).map((s) => ({
        ...s,
        software_name: db.subscriptions.find((x) => x.id === s.subscription_id)?.name,
      })),
    }));
  },
  addEmployee(body) {
    const db = load();
    const id = db.nextId++;
    db.employees.push({ id, full_name: body.full_name, department: body.department, status: "Active" });
    save(db);
    return { id, message: "Team member added" };
  },
  setEmployeeStatus(id, status) {
    const db = load();
    const e = db.employees.find((x) => x.id === Number(id));
    if (!e) throw new Error("Team member not found");
    e.status = status === "Departed" ? "Departed" : "Active";
    if (e.status === "Departed") {
      db.seats.forEach((s) => {
        if (s.employee_id === e.id) s.is_active = 0;
      });
    }
    save(db);
    return { message: e.status === "Departed" ? "Team member marked as departed" : "Team member marked as active" };
  },
  seats() {
    const db = load();
    return db.seats.map((s) => {
      const sub = db.subscriptions.find((x) => x.id === s.subscription_id) || {};
      const emp = db.employees.find((x) => x.id === s.employee_id) || {};
      return {
        ...s,
        software_name: sub.name,
        category: sub.category,
        billing_cycle: sub.billing_cycle,
        full_name: emp.full_name,
        department: emp.department,
        employee_status: emp.status,
      };
    });
  },
  assignSeat(body) {
    const db = load();
    const exists = db.seats.find((s) => s.subscription_id === Number(body.subscription_id) && s.employee_id === Number(body.employee_id));
    if (exists) throw new Error("This person already has a seat on that tool");
    const sub = db.subscriptions.find((x) => x.id === Number(body.subscription_id));
    if (!sub) throw new Error("Software not found");
    const id = db.nextId++;
    db.seats.push({
      id,
      subscription_id: Number(body.subscription_id),
      employee_id: Number(body.employee_id),
      cost_per_seat: seatCost(sub),
      is_active: 1,
    });
    save(db);
    return { id, message: "Seat assigned" };
  },
  toggleSeat(id) {
    const db = load();
    const s = db.seats.find((x) => x.id === Number(id));
    if (!s) throw new Error("Seat not found");
    s.is_active = Number(s.is_active) === 1 ? 0 : 1;
    save(db);
    return { is_active: s.is_active, message: s.is_active ? "Seat marked as active" : "Seat marked as inactive" };
  },
  renewals() {
    const db = load();
    return db.subscriptions
      .map((s) => ({ ...s, monthlyCost: Number(monthlyCost(s).toFixed(2)), daysUntilRenewal: daysUntil(s.renewal_date) }))
      .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
  },
  insights() {
    const db = load();
    const byCategory = {};
    let total = 0;
    for (const s of db.subscriptions) {
      const m = monthlyCost(s);
      total += m;
      byCategory[s.category] = (byCategory[s.category] || 0) + m;
    }
    return {
      total: Number(total.toFixed(2)),
      breakdown: Object.entries(byCategory)
        .map(([category, monthly]) => ({ category, monthly: Number(monthly.toFixed(2)), share: total ? Number(((monthly / total) * 100).toFixed(1)) : 0 }))
        .sort((a, b) => b.monthly - a.monthly),
    };
  },
  settings() {
    return load().settings;
  },
  saveSettings(body) {
    const db = load();
    db.settings.company_name = body.company_name || db.settings.company_name;
    db.settings.currency_symbol = body.currency_symbol || db.settings.currency_symbol;
    save(db);
    return { message: "Changes saved" };
  },
};
