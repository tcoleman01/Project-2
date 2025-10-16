import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import gamesRouter from "./routes/games.js";
import reviewsRouter from "./routes/reviews.js";
import userGamesRouter from "./routes/userGames.js";
// import usersRouter from "./routes/users.js"; // optional

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files but DO NOT auto-load index.html
app.use(
  express.static(path.join(__dirname, "frontend"), {
    index: false,
  })
);

// Root route manually sends login.html first
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "login.html"));
});

// Explicit HTML routes
app.get("/index.html", (_req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "index.html"))
);
app.get("/login.html", (_req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "login.html"))
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
// app.use("/api/", usersRouter); // if needed

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(` Default page: login.html`);
});
