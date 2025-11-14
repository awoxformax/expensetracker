const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res
      .status(401)
      .json({ ok: false, error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res
      .status(401)
      .json({ ok: false, error: "Invalid or expired token" });
  }
}

module.exports = authenticate;
