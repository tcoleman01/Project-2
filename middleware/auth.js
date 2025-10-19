// middleware/auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.auth;
    if (!token) return res.status(401).json({ error: "auth required" });
    req.user = jwt.verify(token, JWT_SECRET); // { uid, email }
    next();
  } catch {
    return res.status(401).json({ error: "invalid auth" });
  }
}
