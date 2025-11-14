const personaValues = ["student", "worker", "family"];
const incomeValues = ["salary", "scholarship", "freelancer", "additional"];

const defaultProfileResponse = {
  firstName: "",
  lastName: "",
  phone: "",
  persona: null,
  incomeType: null,
  budget: null,
  categories: [],
  onboardingCompleted: false,
};

function mapProfileDoc(doc) {
  if (!doc) return { ...defaultProfileResponse };

  return {
    firstName: doc.firstName || "",
    lastName: doc.lastName || "",
    phone: doc.phone || "",
    persona: doc.persona || null,
    incomeType: doc.incomeType || null,
    budget: doc.budget != null ? doc.budget : null,
    categories: Array.isArray(doc.categories) ? doc.categories : [],
    onboardingCompleted: !!doc.onboardingCompleted,
  };
}

function sanitizeProfilePayload(body = {}) {
  const payload = {};

  if (body.firstName !== undefined)
    payload.firstName = String(body.firstName || "").trim();

  if (body.lastName !== undefined)
    payload.lastName = String(body.lastName || "").trim();

  if (body.phone !== undefined)
    payload.phone = String(body.phone || "").trim();

  if (body.persona !== undefined) {
    if (body.persona === null || personaValues.includes(body.persona)) {
      payload.persona = body.persona;
    } else throw new Error("Invalid persona value");
  }

  if (body.incomeType !== undefined) {
    if (body.incomeType === null || incomeValues.includes(body.incomeType)) {
      payload.incomeType = body.incomeType;
    } else throw new Error("Invalid incomeType value");
  }

  if (body.budget !== undefined) {
    const budget = Number(body.budget);
    if (Number.isNaN(budget) || budget < 0)
      throw new Error("Budget must be a positive number");
    payload.budget = budget;
  }

  if (body.onboardingCompleted !== undefined)
    payload.onboardingCompleted =
      body.onboardingCompleted === true || body.onboardingCompleted === "true";

  if (Array.isArray(body.categories)) {
    payload.categories = body.categories
      .map((cat) => ({
        id: String(cat.id).trim(),
        name: String(cat.name).trim(),
        description: cat.description,
        icon: cat.icon,
        period: ["daily", "monthly"].includes(cat.period)
          ? cat.period
          : "monthly",
        type: ["income", "expense"].includes(cat.type)
          ? cat.type
          : "expense",
      }))
      .filter((x) => x.id && x.name);
  }

  return payload;
}

module.exports = { mapProfileDoc, sanitizeProfilePayload };
