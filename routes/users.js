// routes/users.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  ensureIndexes,
  createUser,
  findByEmail,
  updateDisplayName,
  updatePassword,
} from "../db/usersDB.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const IS_PROD = process.env.NODE_ENV === "production";

// Use secure cookies automatically in prod; HttpOnly so JS can't read the token
const COOKIE = {
  httpOnly: true,
  sameSite: "lax",
  secure: IS_PROD,        // true on HTTPS (production)
  maxAge: 2 * 60 * 60 * 1000, // 2h
  path: "/",              // explicitly set so we can reliably clear it later
};

// Ensure unique index on email once at startup
ensureIndexes().catch((e) => console.error("[users] ensureIndexes", e?.message));

function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
  res.cookie("auth", token, COOKIE);
}

// -------- Handlers --------
async function doRegister(req, res) {
  try {
    let { email, password, displayName } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    if (String(password).length < 6) return res.status(400).json({ error: "password too short" });

    email = String(email).trim().toLowerCase();

    const existing = await findByEmail(email);
    if (existing) return res.status(409).json({ error: "email already registered" });

    const created = await createUser({ email, password, displayName });
    return res.status(201).json(created);
  } catch (e) {
    console.error("[register]", e);
    return res.status(500).json({ error: "server error" });
  }
}

async function doLogin(req, res) {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    email = String(email).trim().toLowerCase();

    const user = await findByEmail(email);
    if (!user) return res.status(401).json({ error: "invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });

    setAuthCookie(res, { uid: String(user._id), email: user.email });
    return res.json({ ok: true, email: user.email, displayName: user.displayName });
  } catch (e) {
    console.error("[login]", e);
    return res.status(500).json({ error: "server error" });
  }
}

function doLogout(_req, res) {
  // Clear with identical attributes to ensure deletion across browsers
  res.clearCookie("auth", {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    path: "/",
  });
  res.json({ ok: true });
}

async function getMe(req, res) {
  try {
    const u = await findByEmail(String(req.user.email).toLowerCase());
    if (!u) return res.json(null);
    const { passwordHash, ...publicFields } = u;
    res.json(publicFields);
  } catch (e) {
    console.error("[me]", e);
    res.status(500).json({ error: "server error" });
  }
}

async function doChangePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "missing fields" });
  if (String(newPassword).length < 6) return res.status(400).json({ error: "password too short" });

  const u = await findByEmail(String(req.user.email).toLowerCase());
  const ok = await bcrypt.compare(currentPassword, u.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  await updatePassword(u.email, newPassword);
  res.json({ ok: true });
}

async function doUpdateProfile(req, res) {
  const { displayName } = req.body || {};
  const updated = await updateDisplayName(String(req.user.email).toLowerCase(), displayName);
  res.json(updated);
}

// -------- Routes --------
// Plain aliases
router.post("/register", doRegister);
router.post("/login", doLogin);
router.post("/logout", doLogout);
router.get("/me", requireAuth, getMe);
router.post("/change-password", requireAuth, doChangePassword);
router.patch("/me", requireAuth, doUpdateProfile);

// Namespaced (same handlers)
router.post("/api/users/register", doRegister);
router.post("/api/users/login", doLogin);
router.post("/api/users/logout", doLogout);
router.get("/api/users/me", requireAuth, getMe);
router.post("/api/users/change-password", requireAuth, doChangePassword);
router.patch("/api/users/me", requireAuth, doUpdateProfile);

export default router;
