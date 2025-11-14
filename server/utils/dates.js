function parseMonthQuery(monthStr) {
  if (!monthStr) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  return { start, end };
}

function toBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function sanitizeRepeatRule(rule) {
  if (!rule || typeof rule !== "object") return null;

  if (!["daily", "weekly", "monthly"].includes(rule.freq))
    throw new Error("repeatRule.freq must be daily, weekly or monthly");

  const sanitized = { freq: rule.freq };

  if (rule.dayOfMonth !== undefined) {
    const dom = Number(rule.dayOfMonth);
    if (dom < 1 || dom > 31) throw new Error("Invalid dayOfMonth");
    sanitized.dayOfMonth = dom;
  }

  if (rule.weekday !== undefined) {
    const wd = Number(rule.weekday);
    if (wd < 0 || wd > 6) throw new Error("Invalid weekday");
    sanitized.weekday = wd;
  }

  return sanitized;
}

function computeNextTriggerAt(date, rule) {
  const d = new Date(date);

  switch (rule.freq) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;

    case "weekly":
      d.setDate(d.getDate() + 7);
      break;

    case "monthly":
      const next = new Date(d);
      next.setMonth(next.getMonth() + 1);

      if (rule.dayOfMonth) {
        const max = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(rule.dayOfMonth, max));
      }
      return next;

    default:
      break;
  }

  return d;
}

module.exports = {
  parseMonthQuery,
  toBoolean,
  sanitizeRepeatRule,
  computeNextTriggerAt,
};
