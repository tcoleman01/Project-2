// backend.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

import gamesRouter from "./routes/games.js";
import reviewsRouter from "./routes/reviews.js";
import userGamesRouter from "./routes/userGames.js";
import usersRouter from "./routes/users.js";

const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static (no auto index.html)
app.use(
  express.static(path.join(__dirname, "frontend"), {
    index: false,
  })
);

// Root -> login page
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Explicit HTML routes
app.get("/index.html", (_req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "index.html"))
);
app.get("/user-profile.html", (_req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "user-profile.html"))
);
app.get("/signup.html", (_req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "signup.html"))
);
app.get("/account.html", (_req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "account.html"))
);
app.get("/game.html", (_req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "game.html"))
);

// API routes
app.use("/api/", gamesRouter);
app.use("/api/", reviewsRouter);
app.use("/api/", userGamesRouter);

// IMPORTANT: mount usersRouter with NO prefix
// This keeps both plain routes (/login, /register, /me, /logout)
// and namespaced ones inside the router (/api/users/*) working.
app.use(usersRouter);

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Default page: index.html (login page)`);
});
